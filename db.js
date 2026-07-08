const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'game.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.prepare(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gamesPlayed INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    rating INTEGER NOT NULL DEFAULT 1000
  )
`).run();

db.prepare(`
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
`).run();

// Mevcut tabloya yeni sütunları ekle (geriye dönük uyumluluk için)
try {
  db.prepare(`ALTER TABLE campaign_progress ADD COLUMN gold INTEGER DEFAULT 0`).run();
} catch (e) {
  // Sütun zaten varsa hata yoksay
}

try {
  db.prepare(`ALTER TABLE campaign_progress ADD COLUMN currentHealth INTEGER DEFAULT 300`).run();
} catch (e) {
  // Sütun zaten varsa hata yoksay
}

try {
  db.prepare(`ALTER TABLE campaign_progress ADD COLUMN currentNode INTEGER DEFAULT 0`).run();
} catch (e) {
  // Sütun zaten varsa hata yoksay
}

try {
  db.prepare(`ALTER TABLE campaign_progress ADD COLUMN completedNodes TEXT DEFAULT '[]'`).run();
} catch (e) {
  // Sütun zaten varsa hata yoksay
}

function createPlayer(username, passwordHash) {
  const stmt = db.prepare(`
    INSERT INTO players (username, passwordHash)
    VALUES (?, ?)
  `);
  const result = stmt.run(username, passwordHash);
  return findPlayerById(result.lastInsertRowid);
}

function findPlayerById(id) {
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id);
}

function findPlayerByUsername(username) {
  return db.prepare('SELECT * FROM players WHERE username = ?').get(username);
}

function getPlayerProfile(id) {
  return db.prepare('SELECT id, username, gamesPlayed, wins, losses, rating, createdAt FROM players WHERE id = ?').get(id);
}

function updatePlayerStats(userId, outcome) {
  if (!userId) return null;

  const player = findPlayerById(userId);
  if (!player) return null;

  const gamesPlayed = player.gamesPlayed + 1;
  const wins = outcome === 'win' ? player.wins + 1 : player.wins;
  const losses = outcome === 'loss' ? player.losses + 1 : player.losses;
  const rating = outcome === 'win' ? player.rating + 25 : Math.max(1, player.rating - 15);

  db.prepare(`
    UPDATE players
    SET gamesPlayed = ?, wins = ?, losses = ?, rating = ?
    WHERE id = ?
  `).run(gamesPlayed, wins, losses, rating, userId);

  return getPlayerProfile(userId);
}

function getCampaignProgress(userId) {
  if (!userId) return null;
  const existing = db.prepare('SELECT * FROM campaign_progress WHERE userId = ?').get(userId);
  if (existing) {
    return {
      ...existing,
      cardBag: JSON.parse(existing.cardBag || '[]'),
      completedMissions: JSON.parse(existing.completedMissions || '[]'),
      gold: existing.gold || 0,
      currentHealth: existing.currentHealth || 300,
      currentNode: existing.currentNode || 0,
      completedNodes: JSON.parse(existing.completedNodes || '[]')
    };
  }
  return null;
}

function ensureCampaignProgress(userId, starterDeck = [1, 3, 5, 7]) {
  if (!userId) return null;
  const existing = getCampaignProgress(userId);
  console.log('ensureCampaignProgress - userId:', userId, 'existing:', existing);
  if (existing) {
    // Eğer cardBag boşsa, starterDeck yükle
    if (!existing.cardBag || existing.cardBag.length === 0) {
      console.log('CardBag boş, starterDeck yükleniyor');
      const newCardBag = starterDeck.map(baseId => ({ baseId, defaultLevel: 1 }));
      db.prepare(`
        UPDATE campaign_progress
        SET cardBag = ?
        WHERE userId = ?
      `).run(JSON.stringify(newCardBag), userId);
      const updated = getCampaignProgress(userId);
      console.log('Güncellenmiş progress:', updated);
      return updated;
    }
    console.log('CardBag dolu, mevcut progress dönülüyor');
    return existing;
  }

  console.log('Yeni progress oluşturuluyor');
  db.prepare(`
    INSERT INTO campaign_progress (userId, cardBag, completedMissions)
    VALUES (?, ?, ?)
  `).run(userId, JSON.stringify(starterDeck.map(baseId => ({ baseId, defaultLevel: 1 }))), JSON.stringify([]));

  return getCampaignProgress(userId);
}

function updateCampaignProgress(userId, updates) {
  if (!userId) return null;
  const current = ensureCampaignProgress(userId);
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

  db.prepare(`
    UPDATE campaign_progress
    SET cardBag = ?, completedMissions = ?, gold = ?, currentHealth = ?, currentNode = ?, completedNodes = ?, updatedAt = ?
    WHERE userId = ?
  `).run(
    JSON.stringify(next.cardBag),
    JSON.stringify(next.completedMissions),
    next.gold,
    next.currentHealth,
    next.currentNode,
    JSON.stringify(next.completedNodes),
    next.updatedAt,
    userId
  );

  return getCampaignProgress(userId);
}

module.exports = {
  createPlayer,
  findPlayerById,
  findPlayerByUsername,
  getPlayerProfile,
  updatePlayerStats,
  getCampaignProgress,
  ensureCampaignProgress,
  updateCampaignProgress
};
