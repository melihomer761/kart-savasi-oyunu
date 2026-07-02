// NetworkManager - Online multiplayer için ağ yönetimi
// Bu sınıf, sunucu ile iletişimi yönetir ve olayları UI/GameState'e iletir

class NetworkManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.serverUrl = 'http://localhost:3000'; // Varsayılan sunucu URL
        
        // Callback fonksiyonları (UI ve GameState tarafından atanacak)
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
    onConnect: null,
    onDisconnect: null,
    onOpponentAction: null // Yeni eklendi
};
        
        console.log('NetworkManager başlatıldı');
    }
    
    // Sunucuya bağlan
    connect(serverUrl = null) {
        if (serverUrl) {
            this.serverUrl = serverUrl;
        }
        
        // Socket.io CDN'den io nesnesini al
        if (typeof io === 'undefined') {
            console.error('Socket.io yüklenmedi! CDN script\'i kontrol edin.');
            return false;
        }
        
        try {
            this.socket = io(this.serverUrl);
            
            // Bağlantı başarılı
            this.socket.on('connect', () => {
                this.connected = true;
                console.log(`Sunucuya bağlandı: ${this.serverUrl}`);
                if (this.callbacks.onConnect) {
                    this.callbacks.onConnect();
                }
            });
            
            // Bağlantı koptu
            this.socket.on('disconnect', () => {
                this.connected = false;
                console.log('Sunucu bağlantısı koptu');
                if (this.callbacks.onDisconnect) {
                    this.callbacks.onDisconnect();
                }
            });
            
            // Eşleşme bulundu (rastgele eşleşme)
            this.socket.on('match_found', (data) => {
                console.log('Eşleşme bulundu:', data);
                if (this.callbacks.onMatchFound) {
                    this.callbacks.onMatchFound(data);
                }
            });
            
            // Özel oda oluşturuldu
            this.socket.on('room_created', (data) => {
                console.log('Oda oluşturuldu:', data);
                if (this.callbacks.onRoomCreated) {
                    this.callbacks.onRoomCreated(data);
                }
            });
            
            // Odaya katılma başarılı
            this.socket.on('room_joined', (data) => {
                console.log('Odaya katıldı:', data);
                if (this.callbacks.onRoomJoined) {
                    this.callbacks.onRoomJoined(data);
                }
            });
            
            // Rakip odaya katıldı
            this.socket.on('opponent_joined', (data) => {
                console.log('Rakip katıldı:', data);
                if (this.callbacks.onOpponentJoined) {
                    this.callbacks.onOpponentJoined(data);
                }
            });
            
            // Rakip ayrıldı
            this.socket.on('opponent_disconnected', (data) => {
                console.log('Rakip ayrıldı:', data);
                if (this.callbacks.onOpponentDisconnected) {
                    this.callbacks.onOpponentDisconnected(data);
                }
            });
            
            // Oda bulunamadı
            this.socket.on('room_not_found', (data) => {
                console.log('Oda bulunamadı:', data);
                if (this.callbacks.onRoomNotFound) {
                    this.callbacks.onRoomNotFound(data);
                }
            });
            
            // Oda mevcut değil
            this.socket.on('room_not_available', (data) => {
                console.log('Oda mevcut değil:', data);
                if (this.callbacks.onRoomNotAvailable) {
                    this.callbacks.onRoomNotAvailable(data);
                }
            });
            
            // Oyun başladı
            this.socket.on('game_started', (data) => {
                console.log('Oyun başladı:', data);
                if (this.callbacks.onGameStarted) {
                    this.callbacks.onGameStarted(data);
                }
            });
            
            // Deste hatası
            this.socket.on('deck_error', (data) => {
                console.log('Deste hatası:', data);
                if (this.callbacks.onDeckError) {
                    this.callbacks.onDeckError(data);
                }
            });
            
            return true;
        } catch (error) {
            console.error('Bağlantı hatası:', error);
            return false;
        }
    }
    
    // Rastgele eşleşmeye katıl
    joinQueue(playerName) {
        if (!this.socket || !this.connected) {
            console.error('Sunucuya bağlı değil');
            return false;
        }
        
        this.socket.emit('join_queue', { playerName });
        console.log(`${playerName} eşleşme kuyruğuna katıldı`);
        return true;
    }
    
    // Özel oda oluştur
    createPrivateRoom(playerName) {
        if (!this.socket || !this.connected) {
            console.error('Sunucuya bağlı değil');
            return false;
        }
        
        this.socket.emit('create_private_room', { playerName });
        console.log(`${playerName} özel oda oluşturuyor`);
        return true;
    }
    
    // Özel odaya katıl
    joinPrivateRoom(roomCode, playerName) {
        if (!this.socket || !this.connected) {
            console.error('Sunucuya bağlı değil');
            return false;
        }
        
        this.socket.emit('join_private_room', { roomCode, playerName });
        console.log(`${playerName} odaya katılıyor: ${roomCode}`);
        return true;
    }
    
    // Callback fonksiyonu ata
    setCallback(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        } else {
            console.error(`Bilinmeyen olay: ${event}`);
        }
    }
    
    // Bağlantı durumunu kontrol et
    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }
    
    // Bağlantıyı kes
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            console.log('Bağlantı kesildi');
        }
    }
}

// Global NetworkManager örneği oluştur (tüm dosyalardan erişilebilir)
const Network = new NetworkManager();
