// NetworkManager - Online multiplayer için ağ yönetimi
// Bu sınıf, sunucu ile iletişimi yönetir ve olayları UI/GameState'e iletir

class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.serverUrl = 'http://localhost:3000';
        if (typeof window !== 'undefined' && window.location && window.location.origin && !window.location.origin.startsWith('file://')) {
            this.serverUrl = window.location.origin;
        }
        this.listenersRegistered = false;
        this.authToken = null;
        this.profile = null;

        this.loadAuthFromStorage();

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
            return true;
        }

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.listenersRegistered = false;
        }

        if (!this.authToken) {
            console.error('Oturum açılmadan çevrimiçi modda bağlanılamaz.');
            return false;
        }

        try {
            this.socket = io(this.serverUrl, {
                auth: {
                    token: this.authToken
                },
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
            if (this.callbacks.onConnect) {
                this.callbacks.onConnect();
            }
        });

        this.socket.on('disconnect', (reason) => {
            this.connected = false;
            if (this.callbacks.onDisconnect) {
                this.callbacks.onDisconnect(reason);
            }
        });

        this.socket.on('match_found', (data) => {
            if (this.callbacks.onMatchFound) {
                this.callbacks.onMatchFound(data);
            }
        });

        this.socket.on('room_created', (data) => {
            if (this.callbacks.onRoomCreated) {
                this.callbacks.onRoomCreated(data);
            }
        });

        this.socket.on('room_joined', (data) => {
            if (this.callbacks.onRoomJoined) {
                this.callbacks.onRoomJoined(data);
            }
        });

        this.socket.on('opponent_joined', (data) => {
            if (this.callbacks.onOpponentJoined) {
                this.callbacks.onOpponentJoined(data);
            }
        });

        this.socket.on('opponent_disconnected', (data) => {
            if (this.callbacks.onOpponentDisconnected) {
                this.callbacks.onOpponentDisconnected(data);
            }
        });

        this.socket.on('room_not_found', (data) => {
            if (this.callbacks.onRoomNotFound) {
                this.callbacks.onRoomNotFound(data);
            }
        });

        this.socket.on('room_not_available', (data) => {
            if (this.callbacks.onRoomNotAvailable) {
                this.callbacks.onRoomNotAvailable(data);
            }
        });

        this.socket.on('game_started', (data) => {
            if (this.callbacks.onGameStarted) {
                this.callbacks.onGameStarted(data);
            }
        });

        this.socket.on('deck_error', (data) => {
            if (this.callbacks.onDeckError) {
                this.callbacks.onDeckError(data);
            }
        });

        this.socket.on('opponent_ready', (data) => {
            if (this.callbacks.onOpponentReady) {
                this.callbacks.onOpponentReady(data);
            }
        });

        this.socket.on('opponent_timeout', (data) => {
            if (this.callbacks.onOpponentTimeout) {
                this.callbacks.onOpponentTimeout(data);
            }
        });

        this.socket.on('opponent_action', (data) => {
            if (this.callbacks.onOpponentAction) {
                this.callbacks.onOpponentAction(data);
            }
        });

        this.socket.on('game_over', (data) => {
            if (this.callbacks.onGameOver) {
                this.callbacks.onGameOver(data);
            }
        });

        this.listenersRegistered = true;
    }

    setAuthToken(token) {
        this.authToken = token;
        try {
            window.localStorage.setItem('kartSavasAuthToken', token);
        } catch (error) {
            console.warn('Auth token yerel depolamaya kaydedilemedi:', error);
        }
    }

    setProfile(profile) {
        this.profile = profile;
        try {
            window.localStorage.setItem('kartSavasProfile', JSON.stringify(profile));
        } catch (error) {
            console.warn('Profil yerel depolamaya kaydedilemedi:', error);
        }
    }

    loadAuthFromStorage() {
        try {
            const token = window.localStorage.getItem('kartSavasAuthToken');
            const profileJson = window.localStorage.getItem('kartSavasProfile');
            if (token) this.authToken = token;
            if (profileJson) this.profile = JSON.parse(profileJson);
        } catch (error) {
            console.warn('Yerel depolama yüklenemedi:', error);
        }
    }

    clearAuth() {
        this.authToken = null;
        this.profile = null;
        this.disconnect();
        try {
            window.localStorage.removeItem('kartSavasAuthToken');
            window.localStorage.removeItem('kartSavasProfile');
        } catch (error) {
            console.warn('Yerel depolama temizlenemedi:', error);
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.serverUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Giriş başarısız');
            }

            this.setAuthToken(data.token);
            this.setProfile(data.profile);
            return data;
        } catch (error) {
            throw error;
        }
    }

    async register(username, password) {
        try {
            const response = await fetch(`${this.serverUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Kayıt başarısız');
            }

            this.setAuthToken(data.token);
            this.setProfile(data.profile);
            return data;
        } catch (error) {
            throw error;
        }
    }

    async fetchProfile() {
        if (!this.authToken) return null;
        try {
            const response = await fetch(`${this.serverUrl}/api/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Profil alınamadı');
            }
            this.setProfile(data.profile);
            return data.profile;
        } catch (error) {
            console.warn('Profil alınırken hata:', error);
            return null;
        }
    }

    isAuthenticated() {
        return !!this.authToken;
    }

    getProfile() {
        return this.profile;
    }

    joinQueue(playerName) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('join_queue', { playerName: playerName || this.profile?.username });
        return true;
    }

    createPrivateRoom(playerName) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('create_private_room', { playerName: playerName || this.profile?.username });
        return true;
    }

    joinPrivateRoom(roomCode, playerName) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('join_private_room', { roomCode, playerName: playerName || this.profile?.username });
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
        }
    }

    sendPlayerReady(roomId, deck) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('player_ready', { roomId, deck });
        return true;
    }

    sendSelectionTimeout(roomId) {
        if (!this.isConnected()) {
            console.error('Sunucuya bağlı değil');
            return false;
        }

        this.socket.emit('selection_timeout', { roomId });
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
