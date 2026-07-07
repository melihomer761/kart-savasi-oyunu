// Bellek içi durum (In-Memory State)
const rooms = {}; // Aktif odalar: { roomId: { players: [], status: 'waiting'|'ready'|'playing'|'finished' } }
const queue = []; // Rastgele eşleşme kuyruğu: [{ socketId, playerName, userId }]
const playerRoomMap = {}; // Socket ID -> Room ID mapping

// Yardımcı fonksiyonlar

// Benzersiz oda ID'si oluştur
function generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 4 haneli rastgele oda kodu oluştur
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Oyuncuyu kuyruğa ekle
function addToQueue(socketId, playerName, userId = null) {
    queue.push({ socketId, playerName, userId });
}

// Oyuncuyu kuyruktan çıkar
function removeFromQueue(socketId) {
    const index = queue.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
        const player = queue.splice(index, 1)[0];
        return player;
    }
    return null;
}

// Oda oluştur
function createRoom(roomId, roomCode = null) {
    rooms[roomId] = {
        roomId: roomId,
        roomCode: roomCode,
        players: [],
        status: 'waiting',
        createdAt: Date.now()
    };
    return rooms[roomId];
}

// Odaya oyuncu ekle
function addPlayerToRoom(roomId, socketId, playerName, role, userId = null) {
    if (!rooms[roomId]) {
        console.error(`Oda bulunamadı: ${roomId}`);
        return false;
    }
    
    rooms[roomId].players.push({ socketId, playerName, role, userId, isReady: false, deck: null });
    playerRoomMap[socketId] = roomId;
    return true;
}

// Odayı temizle
function cleanupRoom(roomId) {
    if (rooms[roomId]) {
        // Oyuncuların mapping'ini temizle
        rooms[roomId].players.forEach(player => {
            delete playerRoomMap[player.socketId];
        });
        delete rooms[roomId];
    }
}

// Oyuncunun olduğu odayı bul
function getPlayerRoom(socketId) {
    const roomId = playerRoomMap[socketId];
    return roomId ? rooms[roomId] : null;
}

// Oyuncuyu odadan çıkar
function removePlayerFromRoom(socketId) {
    const roomId = playerRoomMap[socketId];
    if (!roomId || !rooms[roomId]) {
        return null;
    }
    
    const room = rooms[roomId];
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    
    if (playerIndex !== -1) {
        const player = room.players.splice(playerIndex, 1)[0];
        delete playerRoomMap[socketId];
        console.log(`${player.playerName} odadan çıkarıldı: ${roomId}`);
        
        // Oda boşsa temizle
        if (room.players.length === 0) {
            cleanupRoom(roomId);
        }
        
        return { player, room };
    }
    
    return null;
}

// Rastgele eşleşme kontrolü
function checkMatchmaking(io) {
    if (queue.length >= 2) {
        // İlk iki oyuncuyu al
        const player1 = queue.shift();
        const player2 = queue.shift();
        
        // Oda oluştur
        const roomId = generateRoomId();
        createRoom(roomId);
        
        // Oyuncuları odaya ekle
        addPlayerToRoom(roomId, player1.socketId, player1.playerName, 'player1', player1.userId);
        addPlayerToRoom(roomId, player2.socketId, player2.playerName, 'player2', player2.userId);
        
        // Odaya sok
        const socket1 = io.sockets.sockets.get(player1.socketId);
const socket2 = io.sockets.sockets.get(player2.socketId);

if (socket1) socket1.join(roomId);
if (socket2) socket2.join(roomId);
        
        // Oda durumunu güncelle
        rooms[roomId].status = 'ready';
        
        
        // Her iki oyuncuya da eşleşme bulundu mesajı gönder
        io.to(player1.socketId).emit('match_found', {
            roomId: roomId,
            role: 'player1',
            opponent: player2.playerName
        });
        
        io.to(player2.socketId).emit('match_found', {
            roomId: roomId,
            role: 'player2',
            opponent: player1.playerName
        });
        
        return true;
    }
    return false;
}

// Özel oda kodu kontrolü
function findRoomByCode(roomCode) {
    return Object.values(rooms).find(room => room.roomCode === roomCode);
}

// Eski odaları temizle (10 dakikadan eski)
function cleanupOldRooms() {
    const now = Date.now();
    const OLD_ROOM_THRESHOLD = 10 * 60 * 1000; // 10 dakika
    
    Object.keys(rooms).forEach(roomId => {
        if (now - rooms[roomId].createdAt > OLD_ROOM_THRESHOLD) {
            console.log(`Eski oda temizleniyor: ${roomId}`);
            cleanupRoom(roomId);
        }
    });
}

// Her 5 dakikada bir eski odaları temizle
setInterval(cleanupOldRooms, 5 * 60 * 1000);

module.exports = {
    rooms,
    queue,
    playerRoomMap,
    addToQueue,
    removeFromQueue,
    createRoom,
    addPlayerToRoom,
    cleanupRoom,
    getPlayerRoom,
    removePlayerFromRoom,
    checkMatchmaking,
    findRoomByCode,
    generateRoomCode
};
