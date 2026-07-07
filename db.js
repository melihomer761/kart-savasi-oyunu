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
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`).run();

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
      completedMissions: JSON.parse(existing.completedMissions || '[]')
    };
  }
  return null;
}

function ensureCampaignProgress(userId, starterDeck = [1, 3, 5, 7]) {
  if (!userId) return null;
  const existing = getCampaignProgress(userId);
  if (existing) return existing;

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
    updatedAt: new Date().toISOString()
  };

  db.prepare(`
    UPDATE campaign_progress
    SET cardBag = ?, completedMissions = ?, updatedAt = ?
    WHERE userId = ?
  `).run(JSON.stringify(next.cardBag), JSON.stringify(next.completedMissions), next.updatedAt, userId);

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
