// NetworkManager - Online multiplayer için ağ yönetimi
// Bu sınıf, sunucu ile iletişimi yönetir ve olayları UI/GameState'e iletir

class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.serverUrl = 'http://localhost:3000';
        this.listenersRegistered = false;

        this.callbacks = {
            onMatchFound: null,
            onRoomCreated: null,
            onRoomJoined: null,
            onOpponentJoined: null,
            onOpponentDisconnected: null,
            onRoomNotFound: null,
            onRoomNotAvailable: null,
            onGameStarted: null,
            onDeckError: null,
            onOpponentReady: null,
            onOpponentTimeout: null,
            onConnect: null,
            onDisconnect: null,
            onOpponentAction: null,
            onGameOver: null
        };

        console.log('NetworkManager başlatıldı');
    }

    connect(serverUrl = null) {
        if (serverUrl) {
            this.serverUrl = serverUrl;
        }

        if (typeof io === 'undefined') {
            console.error('Socket.io yüklenmedi! CDN script\'i kontrol edin.');
            return false;
        }

        if (this.isConnected()) {
            console.log('Zaten sunucuya bağlı');
            return true;
        }

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.listenersRegistered = false;
        }

        try {
            this.socket = io(this.serverUrl, {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000
            });

            this._registerListeners();
            return true;
        } catch (error) {
            console.error('Bağlantı hatası:', error);
            return false;
        }
    }

    _registerListeners() {
        if (!this.socket || this.listenersRegistered) return;

        this.socket.on('connect', () => {
            this.connected = true;
            console.log(`Sunucuya bağlandı: ${this.serverUrl} (id: ${this.socket.id})`);
            if (this.callbacks.onConnect) {
                this.callbacks.onConnect();
            }
        });

        this.socket.on('disconnect', (reason) => {
            this.connected = false;
            console.log('Sunucu bağlantısı koptu:', reason);
            if (this.callbacks.onDisconnect) {
                this.callbacks.onDisconnect(reason);
            }
        });

        this.socket.on('match_found', (data) => {
            console.log('Eşleşme bulundu:', data);
            if (this.callbacks.onMatchFound) {
                this.callbacks.onMatchFound(data);
            }
        });

        this.socket.on('room_created', (data) => {
            console.log('Oda oluşturuldu:', data);
            if (this.callbacks.onRoomCreated) {
                this.callbacks.onRoomCreated(data);
            }
        });

        this.socket.on('room_joined', (data) => {
            console.log('Odaya katıldı:', data);
            if (this.callbacks.onRoomJoined) {
                this.callbacks.onRoomJoined(data);
            }
        });

        this.socket.on('opponent_joined', (data) => {
            console.log('Rakip katıldı:', data);
            if (this.callbacks.onOpponentJoined) {
                this.callbacks.onOpponentJoined(data);
            }
        });

        this.socket.on('opponent_disconnected', (data) => {
            console.log('Rakip ayrıldı:', data);
            if (this.callbacks.onOpponentDisconnected) {
                this.callbacks.onOpponentDisconnected(data);
            }
        });

        this.socket.on('room_not_found', (data) => {
            console.log('Oda bulunamadı:', data);
            if (this.callbacks.onRoomNotFound) {
                this.callbacks.onRoomNotFound(data);
            }
        });

        this.socket.on('room_not_available', (data) => {
            console.log('Oda mevcut değil:', data);
            if (this.callbacks.onRoomNotAvailable) {
                this.callbacks.onRoomNotAvailable(data);
            }
        });

        this.socket.on('game_started', (data) => {
            console.log('Oyun başladı:', data);
            if (this.callbacks.onGameStarted) {
                this.callbacks.onGameStarted(data);
            }
        });

        this.socket.on('deck_error', (data) => {
            console.log('Deste hatası:', data);
            if (this.callbacks.onDeckError) {
                this.callbacks.onDeckError(data);
            }
        });

        this.socket.on('opponent_ready', (data) => {
            console.log('Rakip hazır:', data);
            if (this.callbacks.onOpponentReady) {
                this.callbacks.onOpponentReady(data);
            }
        });

        this.socket.on('opponent_timeout', (data) => {
            console.log('Rakip süresi doldu:', data);
            if (this.callbacks.onOpponentTimeout) {
                this.callbacks.onOpponentTimeout(data);
            }
        });

        this.socket.on('opponent_action', (data) => {
            console.log('Rakip hamlesi:', data);
            if (this.callbacks.onOpponentAction) {
                this.callbacks.onOpponentAction(data);
            }
        });

        this.socket.on('game_over', (data) => {
            console.log('Oyun bitti:', data);
            if (this.callbacks.onGameOver) {
                this.callbacks.onGameOver(data);
            }
        });

        this.listenersRegistered = true;
    }

    joinQueue(playerName) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('join_queue', { playerName });
        console.log(`${playerName} eşleşme kuyruğuna katıldı`);
        return true;
    }

    createPrivateRoom(playerName) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('create_private_room', { playerName });
        console.log(`${playerName} özel oda oluşturuyor`);
        return true;
    }

    joinPrivateRoom(roomCode, playerName) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('join_private_room', { roomCode, playerName });
        console.log(`${playerName} odaya katılıyor: ${roomCode}`);
        return true;
    }

    setCallback(event, callback) {
        if (Object.prototype.hasOwnProperty.call(this.callbacks, event)) {
            this.callbacks[event] = callback;
        } else {
            console.error(`Bilinmeyen olay: ${event}`);
        }
    }

    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }

    getSocketId() {
        return this.socket ? this.socket.id : null;
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.listenersRegistered = false;
            console.log('Bağlantı kesildi');
        }
    }

    sendPlayerReady(roomId, deck) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        console.log('player_ready gönderiliyor:', { roomId, socketId: this.socket.id, deck });
        this.socket.emit('player_ready', { roomId, deck });
        return true;
    }

    sendSelectionTimeout(roomId) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('selection_timeout', { roomId });
        console.log('Süre doldu bildirimi gönderildi');
        return true;
    }

    sendPlayerAction(roomId, attackerId, targetId) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('player_action', { roomId, attackerId, targetId });
        return true;
    }

    sendGameOver(roomId, winnerRole) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('game_over', { roomId, winnerRole });
        return true;
    }
}

window.Network = new NetworkManager();
