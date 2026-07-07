# Kart Savaşı

Tarayıcıda çalışan kart savaş oyunu. Yerel PvP, PvC (AI) ve çevrimiçi PvP modları desteklenir.

## Kurulum

```bash
npm install
npm start
```

Sunucu `http://localhost:3000` adresinde hem oyun arayüzünü hem de Socket.io bağlantısını sunar.

## Oyun Modları

| Mod | Sunucu Gerekir mi? |
|---|---|
| Oyuncu vs Oyuncu (Yerel) | Hayır — `index.html` doğrudan açılabilir |
| Oyuncu vs Bilgisayar | Hayır |
| Çevrimiçi PvP | Evet — `npm start` |

## Online Test Adımları

1. Terminalde `npm start` çalıştırın.
2. İki tarayıcı sekmesi açın: `http://localhost:3000`
3. Her iki sekmede **Çevrimiçi PvP** → kullanıcı adı girin → **Rastgele Eşleş**
4. Eşleşme sonrası her iki tarafta kart seçim ekranı gelmeli.
5. 4 kart seçip **Hazır** butonuna basın (her iki oyuncu).
6. Sunucu terminalinde şu logları görmelisiniz:
   - `player_ready event alındı:` (2 kez)
   - `Oyun başlatılıyor...`
7. Savaşta sıra sizdeyken hedef kartına tıklayın; hamle karşı tarafa yansımalı.

### Özel Oda Testi

1. Oyuncu 1: **Özel Oda Oluştur** → oda kodunu kopyala
2. Oyuncu 2: kodu gir → **Odaya Katıl**
3. Kart seçimi ve hazır akışı rastgele eşleşme ile aynıdır.

## Geliştirme Notları

- Online test sırasında dosya kaydederken Go Live otomatik yenileme yapıyorsa bağlantı kopabilir. Online test için `http://localhost:3000` kullanın.
- Sunucu loglarında `Oyuncu koptu` mesajının yanında kopma nedeni (`reason`) görünür.
- Socket.IO istemci (CDN 4.8.3) ve sunucu sürümü eşleştirilmiştir.

## Proje Yapısı

```
index.html      — Ana sayfa ve ekranlar
gameState.js    — Oyun motoru
gameLogic.js    — Kart yetenekleri
cards.js        — Kart verileri
ui.js           — Arayüz
network.js      — Socket.io istemci
server.js       — Express + Socket.io sunucu
rooms.js        — Oda/kuyruk yönetimi
validators.js   — Deste doğrulama
```

## Online Olay Akışı

```
join_queue → match_found → player_ready (x2) → game_started → player_action ↔ opponent_action → game_over
```
