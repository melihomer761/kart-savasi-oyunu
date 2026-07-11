const db = require('./db');

// Tüm kullanıcıları listele
const allPlayers = db.getAllPlayers();
console.log('Tüm kullanıcılar:', allPlayers);

// testuserları sil
allPlayers.forEach(player => {
  if (player.username.startsWith('testuser')) {
    console.log(`Siliniyor: ${player.username} (ID: ${player.id})`);
    db.deletePlayerById(player.id);
  }
});

// Silindikten sonra tekrar listele
console.log('Silindikten sonra:');
const remainingPlayers = db.getAllPlayers();
console.log('Kalan kullanıcılar:', remainingPlayers);
