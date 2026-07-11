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

    const existing = await db.findPlayerByUsername(username);
    if (existing) {
        return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createPlayer(username, passwordHash);
    const token = createToken({ id: user.id, username: user.username });

    return res.json({ token, profile: await db.getPlayerProfile(user.id) });
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
        }

        const user = await db.findPlayerByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        // passwordhash (küçük harf) kontrolü
        const hash = user.passwordhash || user.passwordHash;

        if (!hash) {
            console.error(`Kritik Hata: ${username} kullanıcısının şifre verisi bozuk.`);
            return res.status(422).json({
                error: 'Hesap verisi migration sırasında bozulmuş. Lütfen bu kullanıcı adıyla tekrar Kayıt Olun.'
            });
        }

        const passwordMatches = await bcrypt.compare(password, hash);
        if (!passwordMatches) {
            return res.status(401).json({ error: 'Geçersiz şifre' });
        }

        const token = createToken({ id: user.id, username: user.username });
        const profile = await db.getPlayerProfile(user.id);

        return res.json({ token, profile });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Sunucu hatası oluştu' });
    }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
    console.log('/api/profile çağrıldı, req.user:', req.user);
    const profile = await db.getPlayerProfile(req.user.id);
    if (!profile) {
        console.log('Profil bulunamadı, 404 döndürülüyor');
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ profile });
});

app.get('/api/campaign', authenticateToken, async (req, res) => {
    const progress = await db.ensureCampaignProgress(req.user.id);
    res.json({ progress });
});

app.post('/api/campaign/complete', authenticateToken, async (req, res) => {
    const { missionId, rewardCardId } = req.body;
    const progress = await db.getCampaignProgress(req.user.id);
    const completedMissions = Array.from(new Set([...(progress?.completedMissions || []), missionId]));
    const cardBag = [...(progress?.cardBag || [])];
    if (rewardCardId) {
        cardBag.push({ baseId: rewardCardId, defaultLevel: 1 });
    }

    const updated = await db.updateCampaignProgress(req.user.id, {
        completedMissions,
        cardBag
    });
    res.json({ progress: updated });
});

app.put('/api/campaign/loadout', authenticateToken, async (req, res) => {
    const { cardBag, currentNode, gold, currentHealth, completedNodes } = req.body;
    const updates = {};
    
    if (cardBag !== undefined) updates.cardBag = cardBag;
    if (currentNode !== undefined) updates.currentNode = currentNode;
    if (gold !== undefined) updates.gold = gold;
    if (currentHealth !== undefined) updates.currentHealth = currentHealth;
    if (completedNodes !== undefined) updates.completedNodes = completedNodes;
    
    const updated = await db.updateCampaignProgress(req.user.id, updates);
    res.json({ progress: updated });
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

    socket.on('disconnect', async (reason) => {

        removeFromQueue(socket.id);

        const result = removePlayerFromRoom(socket.id);
        if (result) {
            const { player, room } = result;

            if (room.status === 'ready' || room.status === 'playing') {
                room.status = 'finished';
            }

            const remainingPlayer = room.players.find(p => p.socketId !== socket.id);
            if (remainingPlayer && remainingPlayer.userId) {
                const updatedProfile = await db.updatePlayerStats(remainingPlayer.userId, 'win');
                room.players.forEach(remaining => {
                    if (remaining.socketId === socket.id) return;
                    io.to(remaining.socketId).emit('opponent_disconnected', {
                        opponent: player.playerName,
                        reason: reason,
                        profile: updatedProfile,
                        ratingDelta: 25
                    });
                });
            } else {
                room.players.forEach(remainingPlayer => {
                    if (remainingPlayer.socketId === socket.id) return;
                    io.to(remainingPlayer.socketId).emit('opponent_disconnected', {
                        opponent: player.playerName,
                        reason: reason
                    });
                });
            }
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

    socket.on('game_over', async (data) => {
        const { roomId, winnerRole } = data;
        const room = rooms[roomId];

        if (!room) return;

        const player = room.players.find(p => p.socketId === socket.id);
        if (!player) return;

        room.status = 'finished';

        let winnerProfile = null;
        let loserProfile = null;

        if (room.players && room.players.length === 2) {
            const winner = room.players.find(p => p.role === winnerRole);
            const loser = room.players.find(p => p.role !== winnerRole);

            if (winner && winner.userId) {
                winnerProfile = await db.updatePlayerStats(winner.userId, 'win');
            }
            if (loser && loser.userId) {
                loserProfile = await db.updatePlayerStats(loser.userId, 'loss');
            }
        }

        room.players.forEach(p => {
            const profile = p.role === winnerRole ? winnerProfile : loserProfile;
            const ratingDelta = p.role === winnerRole ? 25 : -15;
            io.to(p.socketId).emit('game_over', {
                winnerRole,
                profile,
                ratingDelta
            });
        });
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
