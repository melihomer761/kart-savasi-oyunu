const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
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

const JWT_SECRET = process.env.JWT_SECRET || 'kart-savası-gizli-anahtar';
const JWT_EXPIRY = '7d';

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

function createToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token bulunamadı' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Geçersiz token' });
    }
}

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const existing = db.findPlayerByUsername(username);
    if (existing) {
        return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createPlayer(username, passwordHash);
    const token = createToken({ id: user.id, username: user.username });

    return res.json({ token, profile: db.getPlayerProfile(user.id) });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const user = db.findPlayerByUsername(username);
    if (!user) {
        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = createToken({ id: user.id, username: user.username });
    return res.json({ token, profile: db.getPlayerProfile(user.id) });
});

app.get('/api/profile', authenticateToken, (req, res) => {
    const profile = db.getPlayerProfile(req.user.id);
    if (!profile) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ profile });
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

io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        socket.user = payload;
        return next();
    } catch (error) {
        return next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {

    socket.on('join_queue', (data) => {
        const playerName = socket.user.username || `Oyuncu_${socket.id.substr(0, 4)}`;
        addToQueue(socket.id, playerName, socket.user.id);
        checkMatchmaking(io);
    });

    socket.on('create_private_room', (data) => {
        const playerName = socket.user.username || `Oyuncu_${socket.id.substr(0, 4)}`;
        const roomCode = generateRoomCode();
        const roomId = `room_${roomCode}`;

        createRoom(roomId, roomCode);
        addPlayerToRoom(roomId, socket.id, playerName, 'player1', socket.user.id);
        socket.join(roomId);

        socket.emit('room_created', {
            roomId: roomId,
            roomCode: roomCode,
            role: 'player1'
        });

    });

    socket.on('join_private_room', (data) => {
        const roomCode = data.roomCode;
        const playerName = socket.user.username || `Oyuncu_${socket.id.substr(0, 4)}`;

        const room = findRoomByCode(roomCode);

        if (!room) {
            socket.emit('room_not_found', { roomCode: roomCode });
            return;
        }

        if (room.status !== 'waiting') {
            socket.emit('room_not_available', { roomCode: roomCode });
            return;
        }

        addPlayerToRoom(room.roomId, socket.id, playerName, 'player2', socket.user.id);
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

    });

    socket.on('disconnect', (reason) => {

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
        const { roomId, deck } = data;

        const room = rooms[roomId];
        if (!room) {
            socket.emit('deck_error', { error: 'Oda bulunamadı' });
            return;
        }

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) {
            socket.emit('deck_error', { error: 'Oyuncu odada bulunamadı' });
            return;
        }

        const validation = validateDeck(deck);
        if (!validation.valid) {
            socket.emit('deck_error', { error: validation.error });
            return;
        }

        player.deck = deck;
        player.isReady = true;

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

        if (allPlayersReady) {
            startOnlineGame(room, io);
        }
    });

    socket.on('selection_timeout', (data) => {
        const { roomId } = data;

        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;


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
            return;
        }


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

        room.players.forEach(p => {
            if (p.socketId !== socket.id) {
                io.to(p.socketId).emit('game_over', { winnerRole });
            }
        });

        if (room.players && room.players.length === 2) {
            const winner = room.players.find(p => p.role === winnerRole);
            const loser = room.players.find(p => p.role !== winnerRole);

            if (winner && winner.userId) {
                db.updatePlayerStats(winner.userId, 'win');
            }
            if (loser && loser.userId) {
                db.updatePlayerStats(loser.userId, 'loss');
            }
        }
    });

    socket.on('test-message', (data) => {
        socket.emit('test-response', { message: 'Sunucu mesajı aldı' });
    });
});

function startOnlineGame(room, io) {

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

    }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
