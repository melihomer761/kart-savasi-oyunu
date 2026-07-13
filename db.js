require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tabloları oluştur
async function initTables() {
  try {
    const client = await pool.connect();
    try {
      // Players tablosu
      await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          passwordHash TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          gamesPlayed INTEGER NOT NULL DEFAULT 0,
          wins INTEGER NOT NULL DEFAULT 0,
          losses INTEGER NOT NULL DEFAULT 0,
          rating INTEGER NOT NULL DEFAULT 1000
        )
      `);

      // Campaign progress tablosu
      await client.query(`
        CREATE TABLE IF NOT EXISTS campaign_progress (
          userId INTEGER PRIMARY KEY REFERENCES players(id),
          cardBag TEXT NOT NULL DEFAULT '[]',
          completedMissions TEXT NOT NULL DEFAULT '[]',
          gold INTEGER NOT NULL DEFAULT 0,
          currentHealth INTEGER NOT NULL DEFAULT 300,
          currentNode INTEGER NOT NULL DEFAULT 0,
          completedNodes TEXT NOT NULL DEFAULT '[]',
          updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Sütunları ekle (geriye dönük uyumluluk için)
      try {
        await client.query(`ALTER TABLE campaign_progress ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 0`);
      } catch (e) {
        // Sütun zaten varsa hata yoksay
      }

      try {
        await client.query(`ALTER TABLE campaign_progress ADD COLUMN IF NOT EXISTS currentHealth INTEGER DEFAULT 300`);
      } catch (e) {
        // Sütun zaten varsa hata yoksay
      }

      try {
        await client.query(`ALTER TABLE campaign_progress ADD COLUMN IF NOT EXISTS currentNode INTEGER DEFAULT 0`);
      } catch (e) {
        // Sütun zaten varsa hata yoksay
      }

      try {
        await client.query(`ALTER TABLE campaign_progress ADD COLUMN IF NOT EXISTS completedNodes TEXT DEFAULT '[]'`);
      } catch (e) {
        // Sütun zaten varsa hata yoksay
      }

      console.log('BULUT VERİTABANINA BAĞLANDI! 🚀');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error.message);
    throw error;
  }
}

initTables();

async function createPlayer(username, passwordHash) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO players (username, passwordHash) VALUES ($1, $2) RETURNING id',
      [username, passwordHash]
    );
    return findPlayerById(result.rows[0].id);
  } finally {
    client.release();
  }
}

async function findPlayerById(id) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM players WHERE id = $1', [id]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function findPlayerByUsername(username) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM players WHERE username = $1', [username]);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function getPlayerProfile(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, username, gamesPlayed, wins, losses, rating, createdAt FROM players WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function updatePlayerStats(userId, outcome) {
  if (!userId) return null;

  const player = await findPlayerById(userId);
  if (!player) return null;

  // PostgreSQL'den gelen değerleri kesinlikle sayıya çeviriyoruz
  const gamesPlayed = Number(player.gamesplayed || 0) + 1;
  const wins = outcome === 'win' ? Number(player.wins || 0) + 1 : Number(player.wins || 0);
  const losses = outcome === 'loss' ? Number(player.losses || 0) + 1 : Number(player.losses || 0);
  const ratingChange = outcome === 'win' ? 25 : -15;
  const rating = Math.max(1, Number(player.rating || 1000) + ratingChange);

  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE players SET gamesPlayed = $1, wins = $2, losses = $3, rating = $4 WHERE id = $5',
      [gamesPlayed, wins, losses, rating, userId]
    );
    return getPlayerProfile(userId);
  } finally {
    client.release();
  }
}

async function setPlayerRating(username, newRating) {
  if (!username) return null;
  
  const player = await findPlayerByUsername(username);
  if (!player) return null;
  
  const client = await pool.connect();
  try {
    await client.query('UPDATE players SET rating = $1 WHERE username = $2', [newRating, username]);
    return getPlayerProfile(player.id);
  } finally {
    client.release();
  }
}

async function getAllPlayers() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, username, rating FROM players');
    return result.rows;
  } finally {
    client.release();
  }
}

async function deletePlayerById(userId) {
  if (!userId) return false;
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM campaign_progress WHERE userId = $1', [userId]);
    await client.query('DELETE FROM players WHERE id = $1', [userId]);
    return true;
  } finally {
    client.release();
  }
}

async function getCampaignProgress(userId) {
  if (!userId) return null;
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM campaign_progress WHERE userId = $1', [userId]);
    if (result.rows[0]) {
      const row = result.rows[0];
      return {
        userId: parseInt(row.userid),
        cardBag: JSON.parse(row.cardbag || '[]'),
        completedMissions: JSON.parse(row.completedmissions || '[]'),
        gold: parseInt(row.gold || 0),
        currentHealth: parseInt(row.currenthealth || 300),
        currentNode: parseInt(row.currentnode || 0),
        completedNodes: JSON.parse(row.completednodes || '[]')
      };
    }
    return null;
  } finally {
    client.release();
  }
}

async function ensureCampaignProgress(userId, starterDeck = [2, 11, 6, 4]) {
  if (!userId) return null;
  const existing = await getCampaignProgress(userId);
  console.log('ensureCampaignProgress - userId:', userId, 'existing:', existing);
  if (existing) {
    // Mevcut progress varsa olduğu gibi döndür (cardBag boşsa oyuncu ölmüştür)
    console.log('Mevcut progress dönülüyor');
    return existing;
  }

  console.log('Yeni progress oluşturuluyor');
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO campaign_progress (userId, cardbag, completedmissions) VALUES ($1, $2, $3)',
      [userId, JSON.stringify(starterDeck.map(baseId => ({ baseId, defaultLevel: 1 }))), JSON.stringify([])]
    );
    return getCampaignProgress(userId);
  } finally {
    client.release();
  }
}

async function updateCampaignProgress(userId, updates) {
  if (!userId) return null;
  const current = await ensureCampaignProgress(userId);
  const next = {
    ...current,
    ...updates,
    cardBag: updates.cardBag ?? current.cardBag,
    completedMissions: updates.completedMissions ?? current.completedMissions,
    gold: updates.gold ?? current.gold,
    currentHealth: updates.currentHealth ?? current.currentHealth,
    currentNode: updates.currentNode ?? current.currentNode,
    completedNodes: updates.completedNodes ?? current.completedNodes,
    updatedAt: new Date().toISOString()
  };

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE campaign_progress 
       SET cardbag = $1, completedmissions = $2, gold = $3, currenthealth = $4, currentnode = $5, completednodes = $6, updatedat = $8
       WHERE userId = $7`,
      [
        JSON.stringify(next.cardBag),
        JSON.stringify(next.completedMissions),
        next.gold,
        next.currentHealth,
        next.currentNode,
        JSON.stringify(next.completedNodes),
        userId,
        next.updatedAt
      ]
    );
    return getCampaignProgress(userId);
  } finally {
    client.release();
  }
}

module.exports = {
  createPlayer,
  findPlayerById,
  findPlayerByUsername,
  getPlayerProfile,
  updatePlayerStats,
  setPlayerRating,
  getAllPlayers,
  deletePlayerById,
  getCampaignProgress,
  ensureCampaignProgress,
  updateCampaignProgress
};
