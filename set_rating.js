const db = require('./db');

async function cleanupDatabase() {
  try {
    console.log('--- VERİTABANI BAKIMI BAŞLADI ---');
    const allPlayers = await db.getAllPlayers();
    console.log(`Toplam kullanıcı sayısı: ${allPlayers.length}`);
    console.log('Kayıtlı kullanıcılar:');
    allPlayers.forEach(player => {
      console.log(`- ${player.username} (ID: ${player.id}, Rating: ${player.rating})`);
    });

    for (const player of allPlayers) {
      // passwordHash'i olmayan veya geçersiz olanları bul (db.js'den tam objeyi çekmemiz gerekebilir)
      const fullPlayer = await db.findPlayerById(player.id);

      if (!fullPlayer.passwordhash && !fullPlayer.passwordHash) {
        console.log(`⚠️ Hatalı Kullanıcı Siliniyor: ${fullPlayer.username} (Sebep: Şifre Hash Eksik)`);
        await db.deletePlayerById(fullPlayer.id);
      } else if (fullPlayer.passwordhash && fullPlayer.passwordhash.length < 10) {
        console.log(`⚠️ Hatalı Kullanıcı Siliniyor: ${fullPlayer.username} (Sebep: Şifre Hash Kısa)`);
        await db.deletePlayerById(fullPlayer.id);
      } else if (fullPlayer.passwordHash && fullPlayer.passwordHash.length < 10) {
        console.log(`⚠️ Hatalı Kullanıcı Siliniyor: ${fullPlayer.username} (Sebep: Şifre Hash Kısa)`);
        await db.deletePlayerById(fullPlayer.id);
      }
    }

    console.log('--- BAKIM TAMAMLANDI ---');
    process.exit(0);
  } catch (err) {
    console.error('Bakım hatası:', err);
    process.exit(1);
  }
}

cleanupDatabase();
