const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
    addToQueue,
    removeFromQueue,
    createRoom,
    addPlayerToRoom,
    removePlayerFromRoom,
    checkMatchmaking,
    findRoomByCode,
    generateRoomCode,
    rooms
} = require('./rooms');
const { validateDeck } = require('./validators');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Kart Savaşı Online Server Çalışıyor' });
});

function isPlayer1Card(id) {
    return id >= 101 && id <= 104;
}

function isPlayer2Card(id) {
    return id >= 201 && id <= 204;
}

function validatePlayerAction(player, attackerId, targetId) {
    if (player.role === 'player1') {
        return isPlayer1Card(attackerId) && isPlayer2Card(targetId);
    }
    return isPlayer2Card(attackerId) && isPlayer1Card(targetId);
}

io.on('connection', (socket) => {
    console.log(`Oyuncu bağlandı: ${socket.id}`);

    socket.on('join_queue', (data) => {
        const playerName = data.playerName || `Oyuncu_${socket.id.substr(0, 4)}`;
        addToQueue(socket.id, playerName);
        checkMatchmaking(io);
    });

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

        addPlayerToRoom(room.roomId, socket.id, playerName, 'player2');
        socket.join(room.roomId);
        room.status = 'ready';

        const player1 = room.players.find(p => p.role === 'player1');
        if (player1) {
            io.to(player1.socketId).emit('opponent_joined', {
                opponent: playerName,
                roomId: room.roomId
            });
        }

        socket.emit('room_joined', {
            roomId: room.roomId,
            roomCode: roomCode,
            role: 'player2',
            opponent: player1 ? player1.playerName : 'Bilinmeyen'
        });

        console.log(`${playerName} odaya katıldı: ${roomCode}`);
    });

    socket.on('disconnect', (reason) => {
        console.log(`Oyuncu koptu: ${socket.id} (neden: ${reason})`);

        removeFromQueue(socket.id);

        const result = removePlayerFromRoom(socket.id);
        if (result) {
            const { player, room } = result;

            if (room.status === 'ready' || room.status === 'playing') {
                room.status = 'finished';
            }

            room.players.forEach(remainingPlayer => {
                io.to(remainingPlayer.socketId).emit('opponent_disconnected', {
                    opponent: player.playerName,
                    reason: reason
                });
            });
        }
    });

    socket.on('player_ready', (data) => {
        console.log('player_ready event alındı:', data);
        const { roomId, deck } = data;

        const room = rooms[roomId];
        if (!room) {
            socket.emit('deck_error', { error: 'Oda bulunamadı' });
            return;
        }

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            socket.emit('deck_error', { error: 'Oyuncu odada bulunamadı' });
            console.log(`player_ready reddedildi: socket ${socket.id} odada yok (${roomId})`);
            return;
        }

        const validation = validateDeck(deck);
        if (!validation.valid) {
            socket.emit('deck_error', { error: validation.error });
            console.log(`Deste doğrulama hatası (${player.playerName}): ${validation.error}`);
            return;
        }

        player.deck = deck;
        player.isReady = true;
        console.log(`${player.playerName} hazır (${validation.totalPoints} puan)`);

        console.log('Oda durumu:', room.players.map(p => ({
            name: p.playerName,
            role: p.role,
            isReady: p.isReady,
            hasDeck: !!p.deck
        })));

        room.players.forEach(p => {
            if (p.socketId !== socket.id) {
                io.to(p.socketId).emit('opponent_ready', {
                    opponent: player.playerName
                });
            }
        });

        const allPlayersReady = room.players.length === 2 && room.players.every(p => p.isReady);
        console.log(`Tüm oyuncular hazır mı? ${allPlayersReady}`);

        if (allPlayersReady) {
            console.log('Oyun başlatılıyor...');
            startOnlineGame(room, io);
        }
    });

    socket.on('selection_timeout', (data) => {
        const { roomId } = data;

        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        console.log(`${player.playerName} kart seçim süresi doldu, atılıyor`);

        room.players.forEach(p => {
            if (p.socketId !== socket.id) {
                io.to(p.socketId).emit('opponent_timeout', {
                    opponent: player.playerName
                });
            }
        });

        removePlayerFromRoom(socket.id);
    });

    socket.on('player_action', (data) => {
        const { roomId, attackerId, targetId } = data;
        const room = rooms[roomId];

        if (!room || room.status !== 'playing') {
            socket.emit('action_error', { error: 'Oyun aktif değil' });
            return;
        }

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            socket.emit('action_error', { error: 'Oyuncu odada bulunamadı' });
            return;
        }

        if (!validatePlayerAction(player, attackerId, targetId)) {
            socket.emit('action_error', { error: 'Geçersiz hamle' });
            console.log(`Geçersiz hamle: ${player.playerName} -> ${attackerId} -> ${targetId}`);
            return;
        }

        console.log(`Hamle relay: ${player.playerName} (${attackerId} -> ${targetId})`);

        room.players.forEach(p => {
            if (p.socketId !== socket.id) {
                io.to(p.socketId).emit('opponent_action', { attackerId, targetId });
            }
        });
    });

    socket.on('game_over', (data) => {
        const { roomId, winnerRole } = data;
        const room = rooms[roomId];

        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        room.status = 'finished';
        console.log(`Oyun bitti: ${room.roomId}, kazanan: ${winnerRole}`);

        room.players.forEach(p => {
            if (p.socketId !== socket.id) {
                io.to(p.socketId).emit('game_over', { winnerRole });
            }
        });
    });

    socket.on('test-message', (data) => {
        console.log('Test mesajı alındı:', data);
        socket.emit('test-response', { message: 'Sunucu mesajı aldı' });
    });
});

function startOnlineGame(room, io) {
    console.log(`Oyun başlatılıyor: ${room.roomId}`);

    room.status = 'playing';

    const player1 = room.players.find(p => p.role === 'player1');
    const player2 = room.players.find(p => p.role === 'player2');

    if (player1 && player2) {
        const firstTurn = Math.random() < 0.5 ? 'player1' : 'player2';
        room.firstTurn = firstTurn;

        io.to(player1.socketId).emit('game_started', {
            roomId: room.roomId,
            role: 'player1',
            opponentDeck: player2.deck,
            opponentName: player2.playerName,
            firstTurn: firstTurn
        });

        io.to(player2.socketId).emit('game_started', {
            roomId: room.roomId,
            role: 'player2',
            opponentDeck: player1.deck,
            opponentName: player1.playerName,
            firstTurn: firstTurn
        });

        console.log(`Oyun başlatıldı: ${player1.playerName} vs ${player2.playerName}. İlk hamle: ${firstTurn}`);
    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
    console.log(`Oyun: http://localhost:${PORT}`);
});
