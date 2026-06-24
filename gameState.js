// ==========================================================================
// KART SAVAŞI - OYUN DURUMU MOTORU (GAMESTATE.JS YAPAY ZEKA TAM SÜRÜM)
// ==========================================================================

class GameState {
    constructor(cardEffects = null) {
        this.cardEffects = cardEffects; // Kart yetenekleri
        this.availableCards = []; // Seçilebilir kartlar
        this.player1Cards = [];   // 1. oyuncunun kartları
        this.player2Cards = [];   // 2. oyuncunun kartları
        this.turnOrder = [];      // Tur sırası
        this.currentTurn = 0;     // Şu anki tur sayısı (0'dan başlatıyoruz, ilk tur 1 olacak)
        this.isGameStarted = false;
        this.isSelectionPhase = true;
        this.selectedCardsCount = 0;
        this.battleLog = [];

        // Yeni özellikler
        this.gameMode = ''; // 'pvp' veya 'pvc'
        this.currentSelectingPlayer = 1; // Hangi oyuncunun kart seçtiği (1 veya 2)
        this.player1SelectedCards = []; // 1. oyuncunun seçtiği kartlar
        this.player2SelectedCards = []; // 2. oyuncunun seçtiği kartlar

        // Manuel saldırı için yeni değişkenler
        this.currentAttackingCard = null; // Şu anda saldıracak kart
        this.waitingForTarget = false; // Hedef seçimi bekliyor mu?
        this.currentPlayerTurn = 1; // Hangi oyuncunun sırası (1 veya 2)
        this.turnOrderChanged = false; // Tur sırası değişti mi?
        this.waitingForAnimation = false; // Animasyon bekleniyor mu
        this.activeLeaderIDs = []; // Büyü Tazısı liderlik kartlarının instanceId listesi
        
        // Her oyuncunun bağımsız seçimi ve puanları
        this.startingPoints = 18;
        this.player1AvailablePoints = 18;
        this.player2AvailablePoints = 18;
        this.maxCardLevel = 5;
        this.pointsPerLevel = 1; // Level maliyeti basitçe mevcut seviye

        // Bilgisayar (AI) başlangıç ayarları
        this.aiConfig = {
            deckId: "random",
            levelMode: "balanced", // 'balanced' veya 'flat'
            flatLevel: 1,
            focusTarget: null     // Yapay zekanın ortak odaklandığı düşman hedefi
        };
    }

    // Oyunu başlat
    initGame() {
        console.log("initGame çağrıldı: Oyun başlatılıyor...");
        this.resetGame();

        document.querySelector('.game-container').style.display = 'none';
        
        const cardSelection = document.getElementById('card-selection');
        if (cardSelection) {
            cardSelection.style.display = 'none';
        }
        
        const gameModeScreen = document.getElementById('game-mode-selection');
        if (gameModeScreen) {
            console.log("Oyun modu seçim ekranı gösteriliyor");
            gameModeScreen.style.display = 'flex';
            
            const pvpButton = document.getElementById('pvp-mode-btn');
            const pvcButton = document.getElementById('pvc-mode-btn');

            if (pvpButton) {
                pvpButton.addEventListener('click', () => this.setGameMode('pvp'));
            }
            if (pvcButton) {
                pvcButton.addEventListener('click', () => this.setGameMode('pvc'));
            }
        } else {
            console.error("Oyun modu seçim ekranı bulunamadı!");
            alert("Oyun modu seçim ekranı yüklenemedi! Lütfen sayfayı yenileyin.");
        }
    }

    // Oyun modu seçim ekranını göster
    showGameModeSelection() {
        const gameModeScreen = document.getElementById('game-mode-selection');
        gameModeScreen.style.display = 'flex';

        const pvpButton = document.getElementById('pvp-mode-btn');
        const pvcButton = document.getElementById('pvc-mode-btn');

        pvpButton.addEventListener('click', () => this.setGameMode('pvp'));
        pvcButton.addEventListener('click', () => this.setGameMode('pvc'));
    }

    // Oyun modunu ayarla
    setGameMode(mode) {
        console.log(`Oyun modu seçildi: ${mode}`);
        this.gameMode = mode;
        document.getElementById('game-mode-selection').style.display = 'none';
        
        this.initCards();
        
        if (mode === 'pvc') {
            // PvC seçildiyse önce Yapay Zeka ayar ekranını aç
            if (typeof UI !== 'undefined' && UI.showAiConfigScreen) {
                UI.showAiConfigScreen();
            }
        } else {
            // PvP seçildiyse doğrudan oyuncu kart seçim ekranına geç
            setTimeout(() => {
                this.showCardSelection();
                this.updatePlayerIndicator();
            }, 100);
        }
    }

    // Bilgisayar ayarlarını onayla
    confirmAiConfig(aiConfig) {
        this.aiConfig = {
            deckId: aiConfig.deckId,
            levelMode: aiConfig.levelMode,
            flatLevel: aiConfig.flatLevel,
            focusTarget: null // Yeni oyunda odak hedefi temizlenir
        };
        
        // Bilgisayar ayar ekranını kapat, oyuncu kart seçim ekranını aç
        document.getElementById('pvc-config-screen').style.display = 'none';
        this.showCardSelection();
        this.updatePlayerIndicator();
    }

    // Bilgisayarın destesini kurallara uygun olarak otomatik üretir
    generateAiDeck() {
        let selectedCards = [];
        let chosenDeck = aiPreMadeDecks.find(d => d.id === this.aiConfig.deckId);
        
        // 1. Bilgisayar Kartlarının Belirlenmesi
        if (!chosenDeck || chosenDeck.id === "random") {
            // Rastgele 4 benzersiz kart seç
            let availablePool = [...this.availableCards];
            for (let i = 0; i < 4; i++) {
                let rndIdx = Math.floor(Math.random() * availablePool.length);
                selectedCards.push(availablePool[rndIdx].clone());
                availablePool.splice(rndIdx, 1);
            }
        } else {
            // Seçilen hazır destedeki kartları şablondan kopyala
            chosenDeck.cardIds.forEach(id => {
                let cardTemplate = this.availableCards.find(c => c.baseId === id);
                if (cardTemplate) {
                    selectedCards.push(cardTemplate.clone());
                }
            });
        }

        // 2. Seviye ve Güç Dağılımının Yapılması
        if (this.aiConfig.levelMode === "flat") {
            // Sabit Seviye Modu: Tüm kartları oyuncunun seçtiği seviyeye kilitle
            selectedCards.forEach(card => {
                card.updateLevelStats(this.aiConfig.flatLevel);
            });
        } else {
            // Dengeli Bütçe Modu: 18 Puanı kurallara uygun rastgele dağıt
            selectedCards.forEach(card => {
                card.updateLevelStats(1); // Önce hepsi Lv 1 yapılır
            });

            let remainingPoints = 18;
            
            while (remainingPoints > 0) {
                // Sadece yükseltilebilir (Lv < 5) ve bir sonraki seviye maliyeti yeten kartları bul
                let upgradableCards = selectedCards.filter(card => {
                    return card.level < 5 && card.level <= remainingPoints;
                });

                if (upgradableCards.length === 0) break; // Harcanacak kart veya yeten puan kalmadıysa çık

                // Yeten kartlardan rastgele birini seç ve seviyesini 1 artır
                let rndCard = upgradableCards[Math.floor(Math.random() * upgradableCards.length)];
                let cost = rndCard.level; // Lv 1->2 maliyeti 1, 2->3 maliyeti 2 vb.
                
                rndCard.level += 1;
                rndCard.updateLevelStats(rndCard.level);
                remainingPoints -= cost;
            }
        }

        // Bilgisayarın kartlarını kaydet ve sahipliğini ata
        this.player2Cards = selectedCards;
        this.player2Cards.forEach(card => { card.owner = 2; });
        
        console.log("Bilgisayarın destesi hazırlandı:", this.player2Cards.map(c => `${c.name} (Lv ${c.level})`));
    }

    // Kartları hazırla
    initCards() {
        console.log("Kartlar hazırlanıyor...");
        this.availableCards = cardsData.map(card => new Card(card, this.cardEffects));
        console.log(`Toplam ${this.availableCards.length} kart yüklendi`);
    }

    // Kart seçim ekranını göster
    showCardSelection() {
        console.log("Kart seçim ekranı gösteriliyor...");
        
        const cardSelection = document.getElementById('card-selection');
        if (!cardSelection) {
            console.error("Kart seçim ekranı bulunamadı!");
            alert("Kart seçim ekranı bulunamadı! Lütfen sayfayı yenileyin.");
            return;
        }
        
        cardSelection.style.display = 'flex';
        
        const pointsSpan = document.getElementById('available-points');
        if (pointsSpan) {
            pointsSpan.textContent = this.getCurrentPlayerUsedPoints();
        }
        
        const availableCardsContainer = document.getElementById('available-cards');
        if (!availableCardsContainer) {
            console.error("Kullanılabilir kartlar container'ı bulunamadı!");
            return;
        }
        
        availableCardsContainer.innerHTML = '';
        
        this.availableCards.forEach(card => {
            const cardElement = card.createCardElement();
            cardElement.addEventListener('click', () => {
                this.toggleCardSelection(card);
            });
            availableCardsContainer.appendChild(cardElement);
        });

        if (this.gameMode === 'pvp') {
            const nextPlayerButton = document.getElementById('next-player-btn');
            if (nextPlayerButton) {
                nextPlayerButton.style.display = 'block';
                nextPlayerButton.addEventListener('click', () => this.switchToNextPlayer());
                nextPlayerButton.disabled = true;
            }
        }
        
        setTimeout(() => {
            const availableCardsSection = document.getElementById('available-cards');
            if (availableCardsSection) {
                availableCardsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300);
    }

    // Kart seçimini değiştir
    toggleCardSelection(card) {
        console.log(`Karta tıklandı: ${card.name} (ID: ${card.id})`);
        
        const currentSelectedCards = this.getCurrentPlayerSelectedCards();
        const isAlreadySelected = typeof UI !== 'undefined' && UI.isSelected ? UI.isSelected(card) : false;
        
        if (isAlreadySelected) {
            const index = currentSelectedCards.findIndex(c => c.sourceInstanceId === card.instanceId);
            if (index > -1) {
                const removedCard = currentSelectedCards[index];
                const refundPoints = this.getTotalUpgradeCost(removedCard.level);
                const currentPoints = this.getCurrentPlayerPoints();
                this.setCurrentPlayerPoints(currentPoints + refundPoints);
                currentSelectedCards.splice(index, 1);
                this.selectedCardsCount--;
                if (typeof UI !== 'undefined' && UI.setSelected) {
                    UI.setSelected(card, false);
                }
            }
        } else {
            if (currentSelectedCards.length >= 4) {
                alert('En fazla 4 kart seçebilirsiniz!');
                return;
            }
            
            const clonedCard = card.clone();
            clonedCard.level = 1;
            clonedCard.updateLevelStats(1);
            clonedCard.sourceInstanceId = card.instanceId;
            
            currentSelectedCards.push(clonedCard);
            this.selectedCardsCount++;
            if (typeof UI !== 'undefined' && UI.setSelected) {
                UI.setSelected(card, true);
            }
        }
        
        document.getElementById('selected-count').textContent = currentSelectedCards.length;
        this.updateSelectedCardsDisplay();
        this.updateButtons();
        
        if (!isAlreadySelected && currentSelectedCards.length === 1) {
            document.getElementById('selected-cards-container').scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Seçili kartları göster
    updateSelectedCardsDisplay() {
        console.log("Seçili kartlar güncelleniyor");
        const selectedCards = this.getCurrentPlayerSelectedCards();
        
        if (selectedCards.length === 0) {
            const selectedCardsContainer = document.getElementById('selected-cards-container');
            if (selectedCardsContainer) {
                selectedCardsContainer.innerHTML = '';
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-selection-message';
                emptyMessage.textContent = '⬇️ Aşağıdan kartlarınızı seçin ⬇️';
                selectedCardsContainer.appendChild(emptyMessage);
            }
            
            // Puan değerini sıfırla
            const pointsSpan = document.getElementById('available-points');
            if (pointsSpan) {
                pointsSpan.textContent = "0";
            }
            return;
        }
        
        // Burayı UI.updateSelectedCardsDisplay olarak düzelterek puan güncellemelerini de entegre ettim
        if (typeof UI !== 'undefined' && UI.updateSelectedCardsDisplay) {
            UI.updateSelectedCardsDisplay(selectedCards, this);
        }
    }

    // Butonları güncelle
    updateButtons() {
        const startButton = document.getElementById('start-game-btn');
        const nextPlayerButton = document.getElementById('next-player-btn');
        
        const player1CardsReady = this.player1SelectedCards.length === 4;
        const player2CardsReady = this.gameMode === 'pvc' || this.player2SelectedCards.length === 4;
        
        if (this.gameMode === 'pvp') {
            if (this.currentSelectingPlayer === 1) {
                nextPlayerButton.disabled = !player1CardsReady;
                startButton.disabled = true;
            } else {
                nextPlayerButton.style.display = 'none';
                startButton.disabled = !player2CardsReady;
            }
        } else {
            startButton.disabled = !player1CardsReady;
        }
    }

    // Mevcut oyuncunun seçtiği kartları döndür
    getCurrentPlayerSelectedCards() {
        return this.currentSelectingPlayer === 1 ? this.player1SelectedCards : this.player2SelectedCards;
    }

    getCurrentPlayerPoints() {
        return this.currentSelectingPlayer === 1 ? this.player1AvailablePoints : this.player2AvailablePoints;
    }

    setCurrentPlayerPoints(points) {
        if (this.currentSelectingPlayer === 1) {
            this.player1AvailablePoints = points;
        } else {
            this.player2AvailablePoints = points;
        }
    }

    getUpgradeCost(fromLevel) {
        return fromLevel; // Her level'dan bir sonrakine geçiş maliyeti mevcut seviyeye eşittir.
    }

    getTotalUpgradeCost(level) {
        const nextLevel = Math.max(1, level);
        return Math.floor(((nextLevel - 1) * nextLevel) / 2);
    }

    getCurrentPlayerUsedPoints() {
        return this.startingPoints - this.getCurrentPlayerPoints();
    }

    canUpgradeCard(card) {
        const availablePoints = this.getCurrentPlayerPoints();
        return card.level < this.maxCardLevel && availablePoints >= this.getUpgradeCost(card.level);
    }

    canDowngradeCard(card) {
        return card.level > 1;
    }

    upgradeCard(instanceId) {
        const selectedCards = this.getCurrentPlayerSelectedCards();
        const card = selectedCards.find(c => c.instanceId === instanceId);
        if (!card) {
            console.error(`upgradeCard: kart bulunamadı: ${instanceId}`);
            return false;
        }
        if (card.level >= this.maxCardLevel) {
            return false;
        }
        const cost = this.getUpgradeCost(card.level);
        const currentPoints = this.getCurrentPlayerPoints();
        if (currentPoints < cost) {
            return false;
        }
        card.level += 1;
        card.updateLevelStats(card.level);
        this.setCurrentPlayerPoints(currentPoints - cost);
        this.updateSelectedCardsDisplay();
        return true;
    }

    downgradeCard(instanceId) {
        const selectedCards = this.getCurrentPlayerSelectedCards();
        const card = selectedCards.find(c => c.instanceId === instanceId);
        if (!card) {
            console.error(`downgradeCard: kart bulunamadı: ${instanceId}`);
            return false;
        }
        if (card.level <= 1) {
            return false;
        }
        const refund = this.getUpgradeCost(card.level - 1);
        card.level -= 1;
        card.updateLevelStats(card.level);
        const currentPoints = this.getCurrentPlayerPoints();
        this.setCurrentPlayerPoints(currentPoints + refund);
        this.updateSelectedCardsDisplay();
        return true;
    }

    // Hangi oyuncunun seçim yaptığını göster
    updatePlayerIndicator() {
        const playerIndicator = document.getElementById('player-turn-indicator');
        playerIndicator.textContent = `Oyuncu ${this.currentSelectingPlayer}`;
    }

    // Sıradaki oyuncuya geç (PVP modunda)
    switchToNextPlayer() {
        if (this.player1SelectedCards.length !== 4) {
            alert('Lütfen 4 kart seçin!');
            return;
        }
        
        this.currentSelectingPlayer = 2;
        this.selectedCardsCount = 0;
        this.updatePlayerIndicator();
        
        const availableCardsContainer = document.getElementById('available-cards');
        availableCardsContainer.innerHTML = '';
        
        this.availableCards.forEach(card => {
            const cardElement = card.createCardElement();
            cardElement.addEventListener('click', () => {
                this.toggleCardSelection(card);
            });
            availableCardsContainer.appendChild(cardElement);
        });
        
        document.getElementById('selected-count').textContent = 0;
        document.getElementById('selected-cards-container').innerHTML = '';
        document.getElementById('available-points').textContent = this.getCurrentPlayerUsedPoints();
        
        this.updateButtons();
    }

    // Oyuna başla
    startGame() {
        console.log("Oyun başlatılıyor...");
        
        if (this.gameMode === 'pvp') {
            if (this.player1SelectedCards.length !== 4 || this.player2SelectedCards.length !== 4) {
                alert("Her iki oyuncu için de 4 kart seçilmelidir!");
                return;
            }
            this.player1Cards = this.player1SelectedCards.map(card => card.clone());
            this.player2Cards = this.player2SelectedCards.map(card => card.clone());
        } else {
            // PvC Modu
            if (this.player1SelectedCards.length !== 4) {
                alert("Lütfen 4 kart seçin!");
                return;
            }
            this.player1Cards = this.player1SelectedCards.map(card => card.clone());
            
            // Bilgisayarın destesini ayarlara uygun dinamik olarak üret!
            this.generateAiDeck();
        }

        // ARAYÜZ GEÇİŞ DÜZELTMELERİ: Seçim ekranını gizle ve savaş alanını aç
        const cardSelection = document.getElementById('card-selection');
        if (cardSelection) {
            cardSelection.style.display = 'none';
        }
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'flex';
        }

        this.renderGameBoard();

        if (typeof applyCardEffects === 'function') {
            applyCardEffects(this);
        }
        
        this.setupGlobalClickHandler();
        this.prepareTurnOrder();
        
        this.isGameStarted = true;
        this.isSelectionPhase = false;
        
        this.addToBattleLog("Savaş başladı!");
        this.currentTurn = 1;
        this.startTurn();
    }

    setupGlobalClickHandler() {
        if (this._clickHandler) {
            document.removeEventListener('click', this._clickHandler);
        }
        
        this._clickHandler = (event) => {
            if (!this.waitingForTarget) return;
            
            const cardElement = event.target.closest('.card');
            if (!cardElement) return;
            
            if (cardElement.classList.contains('targetable')) {
                const targetCardInstanceId = cardElement.dataset.instanceId;
                const hedefKartlar = this.currentPlayerTurn === 1 ? this.player2Cards : this.player1Cards;
                const hedefKart = hedefKartlar.find(card => card.instanceId.toString() === targetCardInstanceId);
                
                if (hedefKart) {
                    this.executeAttack(hedefKart);
                }
            }
        };
        
        document.addEventListener('click', this._clickHandler);
    }

    renderGameBoard() {
        const player1Container = document.getElementById('player1-cards');
        const player2Container = document.getElementById('player2-cards');
        
        player1Container.innerHTML = '';
        player2Container.innerHTML = '';
        
        this.player1Cards.forEach(card => {
            player1Container.appendChild(card.createCardElement());
        });
        
        this.player2Cards.forEach(card => {
            player2Container.appendChild(card.createCardElement());
        });
        
        const turnIndicator = document.querySelector('.turn-indicator');
        if (!document.getElementById('turn-status')) {
            const statusElement = document.createElement('div');
            statusElement.id = 'turn-status';
            statusElement.textContent = 'Bekliyor...';
            statusElement.style.marginTop = '5px';
            statusElement.style.fontStyle = 'italic';
            turnIndicator.appendChild(statusElement);
        }
        
        this.setupCardElements();
    }

    setupCardElements() {
        const allCardElements = document.querySelectorAll('.card');
        this.player1Cards.forEach(card => {
            const matchingElement = Array.from(allCardElements).find(el => 
                el.dataset.instanceId === card.instanceId.toString()
            );
            if (matchingElement) card.element = matchingElement;
        });
        
        this.player2Cards.forEach(card => {
            const matchingElement = Array.from(allCardElements).find(el => 
                el.dataset.instanceId === card.instanceId.toString()
            );
            if (matchingElement) card.element = matchingElement;
        });
    }

    prepareTurnOrder() {
        const allCards = [...this.player1Cards, ...this.player2Cards];
        this.turnOrder = [...allCards].sort((a, b) => b.speed - a.speed);
        
        const random = Math.random();
        this.currentPlayerTurn = random < 0.5 ? 1 : 2;
        
        allCards.forEach(card => {
            card.hasAttackedThisTurn = false;
        });
        
        this.currentTurn = 0;
        this.addToBattleLog(`Oyuncu ${this.currentPlayerTurn} tura başlıyor!`);
    }

    startTurn() {
        const currentPlayerCards = this.currentPlayerTurn === 1 ? this.player1Cards : this.player2Cards;
        currentPlayerCards.filter(card => card.health > 0).forEach(card => {
            card.hasAttackedThisTurn = false;
        });
        
        const turnNumber = document.getElementById('turn-number');
        if (turnNumber) {
            turnNumber.textContent = this.currentTurn;
        }
        
        this.updateActivePlayerIndicator();
        
        if (this.gameMode === 'pvc' && this.currentPlayerTurn === 2) {
            setTimeout(() => {
                this.playTurnSequence();
            }, 1000);
        } else {
            this.playTurnSequence();
        }
    }

    async playTurnSequence() {
        const allCards = [...this.player1Cards, ...this.player2Cards].filter(card => card.health > 0);

        for (const card of allCards) {
            if (typeof processPoisonOnTurnStart === 'function') {
                processPoisonOnTurnStart(card, this);
            }
        }

        for (const card of allCards) {
            if (typeof card.onTurnStart === 'function') {
                card.onTurnStart(this);
            }
        }

        if (typeof applyTurnStartEffects === 'function') {
            applyTurnStartEffects(this);
        }

        if (this.turnOrderChanged) {
            this.determineTurnOrder();
            this.turnOrderChanged = false;
        }

        this.setupCardElements();
        this.findNextAttackingCard();
    }

    findNextAttackingCard() {
        if (this.waitingForAnimation) {
            setTimeout(() => this.findNextAttackingCard(), 500);
            return;
        }
        
        let oyuncu1CanliKartlari = this.player1Cards.filter(card => card.health > 0);
        let oyuncu2CanliKartlari = this.player2Cards.filter(card => card.health > 0);
        
        if (oyuncu1CanliKartlari.length === 0 || oyuncu2CanliKartlari.length === 0) {
            this.checkForWinner();
            return;
        }
        
        this.determineTurnOrder();
        let kartBulundu = false;
        
        for (const kart of this.turnOrder) {
            if (kart.health <= 0 || kart.hasAttackedThisTurn) {
                continue;
            }
            
            kartBulundu = true;
            this.currentAttackingCard = kart;
            
            const oyuncu1Karti = this.player1Cards.some(p1card => p1card.instanceId === kart.instanceId);
            this.currentPlayerTurn = oyuncu1Karti ? 1 : 2;
            
            this.highlightActiveCard(kart);
            
            // BİLGİSAYAR TURU KONTROLÜ VE OTOMATİK TETİKLEME
            if (this.gameMode === 'pvc' && this.currentPlayerTurn === 2) {
                this.waitingForTarget = false; // Bilgisayarın sırasında oyuncu tıklamalarını devre dışı bırak
                const turnStatus = document.getElementById('turn-status');
                if (turnStatus) {
                    turnStatus.textContent = 'Bilgisayar Düşünüyor... 🤖';
                }
                setTimeout(() => {
                    this.executeAiTurn();
                }, 1200); // Oyuncunun hamleyi algılayabilmesi için 1.2 saniye bekletiyoruz
            } else {
                this.waitingForTarget = true;
                const turnStatus = document.getElementById('turn-status');
                if (turnStatus) {
                    turnStatus.textContent = 'Saldırı Sırası!';
                }
            }
            break;
        }
        
        if (!kartBulundu) {
            this.currentTurn++;
            const allLivingCards = [...this.player1Cards, ...this.player2Cards].filter(card => card.health > 0);
            allLivingCards.forEach(card => {
                card.hasAttackedThisTurn = false;
            });
            this.startTurn();
            return;
        }
    }

    // BİLGİSAYAR YAPAY ZEKA KARAR MOTORU (AI BATTLEFIELD DECISION ENGINE)
    // BİLGİSAYAR YAPAY ZEKA KARAR MOTORU (AI BATTLEFIELD DECISION ENGINE - HATASIZ SÜRÜM)
    executeAiTurn() {
        let attacker = this.currentAttackingCard;
        if (!attacker || attacker.health <= 0) return;

        // Oyuncunun hayattaki kartları (Bilgisayarın düşmanları)
        let enemies = this.player1Cards.filter(c => c.health > 0);
        if (enemies.length === 0) return;

        // ADIM 1: Büyü Tazısı (Taunt) Kontrolü
        let validTargets = enemies;
        let leaderCards = enemies.filter(c => c.baseId === 12);
        let hasTauntActive = leaderCards.length > 0;
        if (hasTauntActive) {
            validTargets = leaderCards;
        }

        // Simüle Hasar Hesaplama Yardımcı Fonksiyonu (Zırh ve Taş Kalkanı dahil eder)
        const getSimulatedDamage = (att, trg) => {
            let baseDmg = att.attack;
            
            // Taş Kalkan hasar azaltma yüzdesi okuma
            let damageReduction = 0;
            if (trg.baseId === 3) {
                damageReduction = trg.levelAbilities && trg.levelAbilities.damageReduction
                    ? trg.levelAbilities.damageReduction[trg.level - 1]
                    : 20;
            }
            
            let rawDmg = baseDmg;
            if (damageReduction > 0) {
                rawDmg = Math.floor(rawDmg * (1 - damageReduction / 100));
            }
            
            let actualDmg = rawDmg;
            if (rawDmg <= 0) {
                actualDmg = 0;
            } else if (typeof trg.armor === 'number') {
                actualDmg = rawDmg - trg.armor;
                if (actualDmg < 0) actualDmg = 0;
            }
            
            return actualDmg;
        };

        // Tehdit Skoru Hesaplama Fonksiyonu
        const getThreatScore = (card) => {
            let atk = card.attack || 0;
            let spd = card.speed || 0;
            let hp = card.health || 0;
            let arm = card.armor || 0;
            return (atk * 3) + (spd * 2) - (hp * 0.5) - (arm * 1.5);
        };

        let target = null;

        // 1. ADIM: KURAL 1 - Bitirici Vuruş Kontrolü (Lethal Strike & Turn Tempo)
        let killableTargets = validTargets.filter(t => getSimulatedDamage(attacker, t) >= t.health);

        if (killableTargets.length > 0) {
            // Öldürülebilir düşmanları bu tur saldırma (aksiyon) durumlarına göre ayırıyoruz
            let unactedKillable = killableTargets.filter(t => !t.hasAttackedThisTurn);
            let actedKillable = killableTargets.filter(t => t.hasAttackedThisTurn);

            if (unactedKillable.length > 0) {
                // A. Bu tur henüz saldırmamış (sırası gelmemiş) olanlardan saldırı gücü en yüksek olanı hedef al (Tempo Çalma!)
                unactedKillable.sort((a, b) => b.attack - a.attack);
                target = unactedKillable[0];
            } else {
                // B. Herkes zaten saldırdıysa, sonraki tura yatırım için en tehlikeli olanı öldür
                actedKillable.sort((a, b) => b.attack - a.attack);
                target = actedKillable[0];
            }
        } 
        // 2. ADIM: KURAL 3 - Kart Bazlı Özel Stratejiler (Sadece Taunt aktif değilse devreye girer)
        else if (!hasTauntActive) {
            
            // A. Ateş Savaşçısı (ID 1) - Maksimum Splash Hasarı Almak için Ortadaki Kartları Seçme
            if (attacker.baseId === 1) {
                let bestSplashTarget = null;
                let maxAdjacent = -1;

                validTargets.forEach(t => {
                    let idx = this.player1Cards.indexOf(t);
                    let adjacentCount = 0;
                    if (idx > 0 && this.player1Cards[idx - 1].health > 0) adjacentCount++;
                    if (idx < this.player1Cards.length - 1 && this.player1Cards[idx + 1].health > 0) adjacentCount++;

                    if (adjacentCount > maxAdjacent) {
                        maxAdjacent = adjacentCount;
                        bestSplashTarget = t;
                    }
                });
                
                if (bestSplashTarget) {
                    target = bestSplashTarget;
                }
            }
            
            // B. Çevik Hançer (ID 4) & Kan Emici (ID 10) - Yüksek Zırhlılardan Kaçınma
            else if (attacker.baseId === 4 || attacker.baseId === 10) {
                let lowArmorTargets = validTargets.filter(t => t.armor <= 2);
                if (lowArmorTargets.length > 0) {
                    // Düşük zırhlılar arasından en tehlikeli olanı seç
                    lowArmorTargets.sort((a, b) => getThreatScore(b) - getThreatScore(a));
                    target = lowArmorTargets[0];
                }
            }
            
            // C. Buz Büyücüsü (ID 2) - Yavaşlamamış Düşmana Efekt Yayma
            else if (attacker.baseId === 2) {
                let unbuffedTargets = validTargets.filter(t => t.speed === t.startingValues.speed);
                if (unbuffedTargets.length > 0) {
                    unbuffedTargets.sort((a, b) => getThreatScore(b) - getThreatScore(a));
                    target = unbuffedTargets[0];
                }
            }
            
            // D. Zehirli Ok (ID 8) - Zehirlenmemiş Düşmana Zehir Yayma
            else if (attacker.baseId === 8) {
                let unpoisonedTargets = validTargets.filter(t => !t.effects || !t.effects.poison);
                if (unpoisonedTargets.length > 0) {
                    unpoisonedTargets.sort((a, b) => getThreatScore(b) - getThreatScore(a));
                    target = unpoisonedTargets[0];
                }
            }
        }

        // 3. ADIM: KURAL 2 - Odaklanma ve Tehdit Skoruna Göre Saldırma (Genel Durum)
        if (!target) {
            // Eğer aktif bir "Takım Odak Hedefi" varsa ve hâlâ hayattaysa ona saldırmaya devam et
            if (this.aiFocusTarget && this.aiFocusTarget.health > 0 && validTargets.includes(this.aiFocusTarget)) {
                target = this.aiFocusTarget;
            } else {
                // Yoksa, tüm geçerli hedeflere tehdit skoru hesapla ve en yükseğini "Odak" seç
                validTargets.forEach(t => {
                    t._aiThreat = getThreatScore(t);
                });
                validTargets.sort((a, b) => b._aiThreat - a._aiThreat);
                target = validTargets[0];
                this.aiFocusTarget = target; // Diğer AI kartları için odağı kaydet
            }
        }

        // Hedef belirlendikten sonra saldırıyı gerçekleştir
        if (target) {
            this.executeAttack(target);
        }
    }

    highlightActiveCard(card) {
        const allCardElements = document.querySelectorAll('.card');
        allCardElements.forEach(el => {
            if (typeof UI !== 'undefined' && UI.setActiveCard) {
                UI.setActiveCard({element: el}, false);
            }
            if (typeof UI !== 'undefined' && UI.setTargetable) {
                UI.setTargetable({element: el}, false);
            }
        });
        
        this.setupCardElements();
        
        if (card.element) {
            if (typeof UI !== 'undefined' && UI.setActiveCard) {
                UI.setActiveCard(card, true);
            }
        }
        
        const hedefKartlar = this.currentPlayerTurn === 1 ? this.player2Cards : this.player1Cards;
        let canliHedefler = hedefKartlar.filter(k => k.health > 0);

        if (typeof checkLeaderEffects === 'function') {
            checkLeaderEffects(this);
        }
        
        const leaderCards = hedefKartlar.filter(k => k.baseId === 12 && k.health > 0);
        if (leaderCards.length > 0) {
            canliHedefler = leaderCards;
        }
        
        setTimeout(() => {
            canliHedefler.forEach(hedefKart => {
                if (hedefKart.element) {
                    if (typeof UI !== 'undefined' && UI.setTargetable) {
                        UI.setTargetable(hedefKart, true);
                    }
                }
            });
            
            if (canliHedefler.length === 0) {
                card.hasAttackedThisTurn = true;
                this.waitingForTarget = false;
                setTimeout(() => this.findNextAttackingCard(), 1000);
            }
        }, 100);
    }

    updateActivePlayerIndicator() {
        const activePlayer = document.getElementById('active-player');
        if (this.gameMode === 'pvc' && this.currentPlayerTurn === 2) {
            activePlayer.textContent = 'Bilgisayar';
        } else {
            activePlayer.textContent = `Oyuncu ${this.currentPlayerTurn}`;
        }
        activePlayer.className = this.currentPlayerTurn === 1 ? 'player1-turn' : 'player2-turn';
    }

    async executeAttack(targetCard) {
        if (!this.currentAttackingCard || !this.waitingForTarget || targetCard.health <= 0) {
            // Bilgisayarın sırasıysa waitingForTarget kontrolünü bypass et
            if (this.gameMode === 'pvc' && this.currentPlayerTurn === 2) {
                // Bilgisayar için geçiş izni ver
            } else {
                return;
            }
        }
        
        const hedefKartlar = this.currentPlayerTurn === 1 ? this.player2Cards : this.player1Cards;
        const hedefUygun = hedefKartlar.some(k => k.instanceId === targetCard.instanceId);
        if (!hedefUygun) return;
        
        this.waitingForTarget = false;
        this.removeHighlights();
        
        try {
            if (typeof this.currentAttackingCard.performAttack === 'function') {
                const isDead = this.currentAttackingCard.performAttack(targetCard, this);
                if (isDead) {
                    this.addToBattleLog(`${targetCard.name} öldü! ☠️`);
                    if (typeof UI !== 'undefined' && UI.setDead) {
                        UI.setDead(targetCard);
                    }
                    this.determineTurnOrder();
                }
            } else {
                if (typeof UI !== 'undefined' && UI.addAnimationClass) {
                    UI.addAnimationClass(this.currentAttackingCard, 'attacking', 500);
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
                const { isDead } = targetCard.takeDamage(this.currentAttackingCard.attack, this.currentAttackingCard);
                this.addToBattleLog(`${this.currentAttackingCard.name} ⚔️ ${targetCard.name}'e ${this.currentAttackingCard.attack} hasar verdi!`);
                
                if (isDead) {
                    this.addToBattleLog(`${targetCard.name} öldü! ☠️`);
                    if (typeof UI !== 'undefined' && UI.setDead) {
                        UI.setDead(targetCard);
                    }
                    this.determineTurnOrder();
                }
                
                if (typeof applyAttackEffects === 'function') {
                    applyAttackEffects(this.currentAttackingCard, targetCard, this);
                }
            }
            
            this.currentAttackingCard.hasAttackedThisTurn = true;
            
            const activePlayerElement = document.getElementById('active-player');
            if (activePlayerElement) {
                activePlayerElement.textContent = 'Bekliyor...';
                activePlayerElement.className = '';
            }
            
            if (this.checkForWinner()) return;
            
            await new Promise(resolve => setTimeout(resolve, 800));
            this.determineTurnOrder();
            this.findNextAttackingCard();
        } catch (error) {
            console.error("Saldırı sırasında hata:", error);
        }
    }

    removeHighlights() {
        const allCardElements = document.querySelectorAll('.card');
        allCardElements.forEach(el => {
            if (typeof UI !== 'undefined' && UI.setActiveCard) {
                UI.setActiveCard({element: el}, false);
            }
            if (typeof UI !== 'undefined' && UI.setTargetable) {
                UI.setTargetable({element: el}, false);
            }
        });
    }

    endTurn() {
        this.currentPlayerTurn = this.currentPlayerTurn === 1 ? 2 : 1;
        const allLivingCards = [...this.player1Cards, ...this.player2Cards].filter(card => card.health > 0);
        allLivingCards.forEach(card => {
            card.hasAttackedThisTurn = false;
        });
        this.startTurn();
    }

    checkForWinner() {
        const player1Alive = this.player1Cards.some(card => card.health > 0);
        const player2Alive = this.player2Cards.some(card => card.health > 0);
        
        if (!player1Alive) {
            const winnerName = this.gameMode === 'pvc' ? 'Bilgisayar' : 'Oyuncu 2';
            this.endGame(winnerName);
            return true;
        } else if (!player2Alive) {
            const winnerName = 'Oyuncu 1';
            this.endGame(winnerName);
            return true;
        }
        
        return false;
    }

    endGame(winner) {
        this.isGameStarted = false;
        this.addToBattleLog(`${winner} KAZANDI! 🏆`);
        
        setTimeout(() => {
            this.askForNewGame();
        }, 1000);
    }

    askForNewGame() {
        this.initGame();
    }

    addToBattleLog(message) {
        const logContent = document.getElementById('battle-log-content');
        if (!logContent) return;
        
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logContent.appendChild(logEntry);
        
        logContent.scrollTop = logContent.scrollHeight;
        this.battleLog.push(message);
    }


    resetGame() {
        this.availableCards = [];
        this.player1Cards = [];
        this.player2Cards = [];
        this.player1SelectedCards = [];
        this.player2SelectedCards = [];
        this.turnOrder = [];
        this.currentTurn = 0;
        this.isGameStarted = false;
        this.isSelectionPhase = true;
        this.selectedCardsCount = 0;
        this.currentSelectingPlayer = 1;
        this.battleLog = [];
        this.player1AvailablePoints = 18;
        this.player2AvailablePoints = 18;
        this.aiFocusTarget = null; // Odak hedefi sıfırlanır
        
        const logContent = document.getElementById('battle-log-content');
        if (logContent) logContent.innerHTML = '';
    }

    determineTurnOrder() {
        const canliKartlar = [...this.player1Cards, ...this.player2Cards].filter(card => card.health > 0);
        if (canliKartlar.length === 0) {
            this.turnOrder = [];
            return;
        }
        this.turnOrder = canliKartlar.sort((a, b) => b.speed - a.speed);
    }
}
