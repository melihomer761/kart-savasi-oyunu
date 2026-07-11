const db = require('./db');

async function setRating() {
  try {
    const result = await db.setPlayerRating('MustafaMT61', 1380);
    console.log('Rating güncellendi:', result);
    process.exit(0);
  } catch (err) {
    console.error('Hata:', err);
    process.exit(1);
  }
}

setRating();
