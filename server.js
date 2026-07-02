const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
    addToQueue,
    removeFromQueue,
    createRoom,
    addPlayerToRoom,
    getPlayerRoom,
    removePlayerFromRoom,
    checkMatchmaking,
    findRoomByCode,
    generateRoomCode,
    rooms
} = require('./rooms');
const { validateDeck } = require('./validators');

const app = express();
const server = http.createServer(app);

// CORS ayarları - frontend tarayıcıdan güvenle bağlanabilsin
const io = new Server(server, {
    cors: {
        origin: '*', // Tüm origin'lere izin ver (production'da spesifik domain verilmeli)
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Express middleware
app.use(cors());
app.use(express.json());

// Basit route test
app.get('/', (req, res) => {
    res.send('Kart Savaşı Online Server Çalışıyor');
});

// Socket.io bağlantı yönetimi
io.on('connection', (socket) => {
    console.log(`Oyuncu bağlandı: ${socket.id}`);
    
    // Rastgele eşleşmeye katıl
    socket.on('join_queue', (data) => {
        const playerName = data.playerName || `Oyuncu_${socket.id.substr(0, 4)}`;
        addToQueue(socket.id, playerName);
        
        // Eşleşme kontrolü
        checkMatchmaking(io);
    });
    
    // Özel oda oluştur
    socket.on('create_private_room', (data) => {
        const playerName = data.playerName || `Oyuncu_${socket.id.substr(0, 4)}`;
        const roomCode = generateRoomCode();
        const roomId = `room_${roomCode}`;
        
        createRoom(roomId, roomCode);
        addPlayerToRoom(roomId, socket.id, playerName, 'player1');
        socket.join(roomId);
        
        socket.emit('room_created', {
            roomId: roomId,
            roomCode: roomCode,
            role: 'player1'
        });
        
        console.log(`${playerName} özel oda oluşturdu: ${roomCode}`);
    });
    
    // Özel odaya katıl
    socket.on('join_private_room', (data) => {
        const roomCode = data.roomCode;
        const playerName = data.playerName || `Oyuncu_${socket.id.substr(0, 4)}`;
        
        const room = findRoomByCode(roomCode);
        
        if (!room) {
            socket.emit('room_not_found', { roomCode: roomCode });
            console.log(`Oda bulunamadı: ${roomCode}`);
            return;
        }
        
        if (room.status !== 'waiting') {
            socket.emit('room_not_available', { roomCode: roomCode });
            console.log(`Oda dolu veya meşgul: ${roomCode}`);
            return;
        }
        
        // Oyuncuyu odaya ekle
        addPlayerToRoom(room.roomId, socket.id, playerName, 'player2');
        socket.join(room.roomId);
        
        // Oda durumunu güncelle
        room.status = 'ready';
        
        // İlk oyuncuya rakip katıldı mesajı gönder
        const player1 = room.players.find(p => p.role === 'player1');
        if (player1) {
            io.to(player1.socketId).emit('opponent_joined', {
                opponent: playerName,
                roomId: room.roomId
            });
        }
        
        // İkinci oyuncuya katılma başarılı mesajı gönder
        socket.emit('room_joined', {
            roomId: room.roomId,
            roomCode: roomCode,
            role: 'player2',
            opponent: player1 ? player1.playerName : 'Bilinmeyen'
        });
        
        console.log(`${playerName} odaya katıldı: ${roomCode}`);
    });
    
    // Oyuncu disconnect olduğunda
    socket.on('disconnect', () => {
        console.log(`Oyuncu koptu: ${socket.id}`);
        
        // Kuyruktaysa çıkar
        removeFromQueue(socket.id);
        
        // Odadaysa çıkar ve rakiba bildir
        const result = removePlayerFromRoom(socket.id);
        if (result) {
            const { player, room } = result;
            
            // Odadaki diğer oyunculara bildir
            room.players.forEach(remainingPlayer => {
                io.to(remainingPlayer.socketId).emit('opponent_disconnected', {
                    opponent: player.playerName
                });
            });
        }
    });
    
    // Deste gönderme (online mod)
    socket.on('submit_deck', (data) => {
        const { roomId, deck } = data;
        
        // Odayı bul
        const room = rooms[roomId];
        if (!room) {
            socket.emit('deck_error', { error: 'Oda bulunamadı' });
            return;
        }
        
        // Oyuncuyu bul
        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            socket.emit('deck_error', { error: 'Oyuncu odada bulunamadı' });
            return;
        }
        
        // Desteyi doğrula
        const validation = validateDeck(deck);
        if (!validation.valid) {
            socket.emit('deck_error', { error: validation.error });
            console.log(`Deste doğrulama hatası (${player.playerName}): ${validation.error}`);
            return;
        }
        
        // Desteyi kaydet
        player.deck = deck;
        console.log(`${player.playerName} deste gönderdi (${validation.totalPoints} puan)`);
        
        // İki oyuncu da deste gönderdi mi?
        const allDecksSubmitted = room.players.every(p => p.deck && p.deck.length === 4);
        
        if (allDecksSubmitted) {
            // Oyunu başlat
            startOnlineGame(room, io);
        }
    });
    
    // Test mesajı (geriye dönük uyumluluk için)
    socket.on('test-message', (data) => {
        console.log('Test mesajı alındı:', data);
        socket.emit('test-response', { message: 'Sunucu mesajı aldı' });
    });
});

// Online oyun başlatma fonksiyonu
function startOnlineGame(room, io) {
    console.log(`Oyun başlatılıyor: ${room.roomId}`);
    
    room.status = 'playing';
    
    const player1 = room.players.find(p => p.role === 'player1');
    const player2 = room.players.find(p => p.role === 'player2');
    
    if (player1 && player2) {
        // Sunucu ilk hamle sırasını belirler
        const firstTurn = Math.random() < 0.5 ? 'player1' : 'player2';

        io.to(player1.socketId).emit('game_started', {
            roomId: room.roomId,
            role: 'player1',
            opponentDeck: player2.deck,
            opponentName: player2.playerName,
            firstTurn: firstTurn // İlk sıra eklendi
        });
        
        io.to(player2.socketId).emit('game_started', {
            roomId: room.roomId,
            role: 'player2',
            opponentDeck: player1.deck,
            opponentName: player1.playerName,
            firstTurn: firstTurn // İlk sıra eklendi
        });
        
        console.log(`Oyun başlatıldı: ${player1.playerName} vs ${player2.playerName}. İlk hamle: ${firstTurn}`);
    }
}

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
