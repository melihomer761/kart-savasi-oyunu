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
  const rating = outcome === 'win' ? player.rating + 25 : Math.max(1, player.rating - 20);

  db.prepare(`
    UPDATE players
    SET gamesPlayed = ?, wins = ?, losses = ?, rating = ?
    WHERE id = ?
  `).run(gamesPlayed, wins, losses, rating, userId);

  return getPlayerProfile(userId);
}

module.exports = {
  createPlayer,
  findPlayerById,
  findPlayerByUsername,
  getPlayerProfile,
  updatePlayerStats
};
