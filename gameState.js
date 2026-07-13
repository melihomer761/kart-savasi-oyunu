// ==========================================================================
// KART SAVAŞI - OYUN DURUMU MOTORU (GAMESTATE.JS YAPAY ZEKA SÜRÜMÜ)
// ==========================================================================

class GameState {
    constructor(cardEffects = null) {
        this.cardEffects = cardEffects; // Kart yetenekleri
        this.availableCards = []; // Seçilebilir kartlar
        this.player1Cards = [];   // 1. oyuncunun kartları
        this.player2Cards = [];   // 2. oyuncunun kartları
        this.turnOrder = [];      // Tur sırası
        this.currentTurn = 0;     // Şu anki tur sayısı
        this.isGameStarted = false;
        this.isSelectionPhase = true;
        this.selectedCardsCount = 0;
        this.battleLog = [];

        this.gameMode = ''; // 'pvp', 'pvc', 'online_pvp' veya 'campaign'
        this.campaignMode = false;
        this.campaignProgress = null;
        this.currentCampaignMission = null;
        this.campaignRewardChoices = [];
        this.onlineRoomId = null; // Online oda ID'si
        this.onlineRole = null; // 'player1' veya 'player2'
        this.currentSelectingPlayer = 1;
        this.player1SelectedCards = [];
        this.player2SelectedCards = [];

        this.currentAttackingCard = null;
        this.waitingForTarget = false;
        this.currentPlayerTurn = 1;
        this.turnOrderChanged = false;
        this.waitingForAnimation = false;
        this.activeLeaderIDs = [];
        
        this.startingPoints = 18;
        this.player1AvailablePoints = 18;
        this.player2AvailablePoints = 18;
        this.maxCardLevel = 5;

        this.aiConfig = {
            deckId: "random",
            levelMode: "balanced",
            flatLevel: 1,
            focusTarget: null
        };
    }

    initGame() {
        this.resetGame();

        const container = document.querySelector('.game-container');
        if (container) container.style.display = 'none';
        
        const cardSelection = document.getElementById('card-selection');
        if (cardSelection) {
            cardSelection.style.display = 'none';
        }
        
        const gameModeScreen = document.getElementById('game-mode-selection');
        if (gameModeScreen) {
            gameModeScreen.style.display = 'flex';
            
            const pvpButton = document.getElementById('pvp-mode-btn');
            const pvcButton = document.getElementById('pvc-mode-btn');

            if (pvpButton) {
                pvpButton.addEventListener('click', () => this.setGameMode('pvp'));
            }
            if (pvcButton) {
                pvcButton.addEventListener('click', () => this.setGameMode('pvc'));
            }
        }
        
        // Online mod için Network callback'leri ayarla
        if (window.Network) {
            // 1. Rastgele Eşleşme Bulunduğunda
            Network.setCallback('onMatchFound', (data) => {
                this.onlineRoomId = data.roomId;
                this.onlineRole = data.role;
                this.onlineOpponentName = data.opponent;
                if (typeof UI !== 'undefined' && UI.showScreen) {
                    UI.showScreen('card-selection');
                }
                this.showCardSelection();
                this.updatePlayerIndicator();
            });
            
            // 2. Özel Oda Başarıyla Oluşturulduğunda (Kurucu için)
            Network.setCallback('onRoomCreated', (data) => {
                this.onlineRoomId = data.roomId;
                this.onlineRole = data.role;
                if (typeof UI !== 'undefined' && UI.showWaitingScreen) {
                    UI.showWaitingScreen('Oda oluşturuldu. Rakip bekleniyor...', true, data.roomCode);
                }
            });

            // 3. Özel Odaya Rakip Katıldığında (Kurucuyu kart seçimine yönlendirir)
            Network.setCallback('onOpponentJoined', (data) => {
                this.onlineOpponentName = data.opponent;
                this.showCardSelection();
                this.updatePlayerIndicator();
            });

            // 4. Özel Odaya Katılma Başarılı Olduğunda (Katılan oyuncuyu kart seçimine yönlendirir)
            Network.setCallback('onRoomJoined', (data) => {
                this.onlineRoomId = data.roomId;
                this.onlineRole = data.role; // 'player2'
                this.onlineOpponentName = data.opponent;
                this.showCardSelection();
                this.updatePlayerIndicator();
            });
            
            // 5. Her İki Oyuncu da Destesini Onaylayıp Oyun Başladığında
            Network.setCallback('onGameStarted', (data) => {
                this.handleOnlineGameStarted(data);
            });
            
            // 6. Deste Doğrulama Hatası Alındığında
            Network.setCallback('onDeckError', (data) => {
                alert(`Deste hatası: ${data.error}`);
            });
            
            // 7. Rakip Hazır Olduğunda
            Network.setCallback('onOpponentReady', (data) => {
                const readyButton = document.getElementById('ready-btn');
                if (readyButton) {
                    readyButton.textContent = 'Rakip Hazır, Bekleniyor...';
                }
            });
            
            // 8. Rakip Süresi Dolduğunda
            Network.setCallback('onOpponentTimeout', (data) => {
                alert(`Rakibiniz (${data.opponent}) kart seçim süresini aştı. Hükmen kazandınız!`);
                location.reload();
            });

            // 9. Rakip Hamlesi Geldiğinde
            Network.setCallback('onOpponentAction', (data) => {
                const { attackerId, targetId } = data;

                const allCards = [...this.player1Cards, ...this.player2Cards];
                const attackerCard = allCards.find(c => c.instanceId === attackerId);
                const targetCard = allCards.find(c => c.instanceId === targetId);

                if (attackerCard && targetCard) {
                    this.currentAttackingCard = attackerCard;
                    this.executingOpponentAction = true;

                    this.executeAttack(targetCard).then(() => {
                        this.executingOpponentAction = false;
                    }).catch(() => {
                        this.executingOpponentAction = false;
                    });
                }
            });

            // 10. Rakip Oyunu Bitirdiğinde
            Network.setCallback('onGameOver', (data) => {
                if (data.profile && window.Network) {
                    window.Network.setProfile(data.profile);
                    if (typeof UI !== 'undefined' && UI.updateProfileStats) {
                        UI.updateProfileStats(data.profile);
                    }
                }

                if (this.gameEnded) {
                    return;
                }

                const iWon = data.winnerRole === this.onlineRole;
                const winnerName = iWon ? 'Sen' : 'Rakip';
                this.gameEnded = true;
                this.isGameStarted = false;
                this.addToBattleLog(`${winnerName} KAZANDI! 🏆`);

                if (typeof UI !== 'undefined' && UI.showMatchStats) {
                    UI.showMatchStats(this, winnerName, data.ratingDelta);
                }
            });

            // 11. Rakip Oyundan Çıktığında
            Network.setCallback('onOpponentDisconnected', (data) => {
                if (data.profile && window.Network) {
                    window.Network.setProfile(data.profile);
                    if (typeof UI !== 'undefined' && UI.updateProfileStats) {
                        UI.updateProfileStats(data.profile);
                    }
                }
                alert(`Rakibiniz (${data.opponent || 'Oyuncu'}) oyundan ayrıldı. Hükmen kazandınız!`);
                this.endGame('Sen', this.onlineRole);
            });
        }
    }

    setGameMode(mode) {
        this.gameMode = mode;
        const gameModeScreen = document.getElementById('game-mode-selection');
        if (gameModeScreen) gameModeScreen.style.display = 'none';
        
        this.initCards();
        
        if (mode === 'pvc') {
            if (typeof UI !== 'undefined' && UI.showScreen) {
                UI.showScreen('pvc-submode-screen');
            }
        } else if (mode === 'campaign') {
            this.campaignMode = true;
            this.showCampaignHub();
        } else if (mode === 'online_pvp') {
            if (window.Network) {
                Network.loadAuthFromStorage();
                if (Network.isAuthenticated()) {
                    Network.connect();
                }
            }
            if (typeof UI !== 'undefined' && UI.showScreen) {
                UI.showScreen('online-lobby-screen');
            }
        } else {
            // PvP modu (yerel): Kart seçim ekranını aç
            setTimeout(() => {
                this.showCardSelection();
                this.updatePlayerIndicator();
            }, 100);
        }
    }

    showCampaignHub() {
        console.log('showCampaignHub çağrıldı');
        if (!window.Network || !window.Network.isAuthenticated()) {
            console.log('Giriş yapılmamış');
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage('Sefer modu için giriş yapmalısınız.', 2500);
            }
            return;
        }
        console.log('Giriş yapılmış, sefer merkezi açılıyor');
        if (typeof UI !== 'undefined' && UI.showScreen) {
            UI.showScreen('campaign-hub-screen');
        }
        this.renderCampaignMissionList();
        this.updateCampaignHUD();
    }

    updateCampaignHUD() {
        const hudHealth = document.getElementById('hud-health');
        const hudGold = document.getElementById('hud-gold');
        
        if (hudHealth && this.campaignProgress) {
            hudHealth.textContent = this.campaignProgress.currentHealth || 300;
        }
        
        if (hudGold && this.campaignProgress) {
            hudGold.textContent = this.campaignProgress.gold || 0;
        }
    }

    async renderCampaignMissionList() {
        const missionList = document.getElementById('campaign-mission-list');
        const bagCount = document.getElementById('campaign-bag-count');
        if (!missionList) return;

        const campaignMap = window.campaignData?.campaignMap || [];
        
        // Sunucudan progress çek (eğer bağlıysa)
        if (window.Network && window.Network.isAuthenticated()) {
            try {
                const progress = await window.Network.fetchCampaign();
                if (progress) {
                    this.campaignProgress = progress;
                    // LocalStorage'ı güncelle
                    localStorage.setItem('campaignProgress', JSON.stringify(progress));
                    console.log('Sunucudan progress yüklendi, currentNode:', progress.currentNode);
                }
            } catch (err) {
                console.log('Sunucudan veri alınamadı, LocalStorage kullanılıyor:', err);
            }
        }
        
        // LocalStorage'dan yedeklemeyi dene
        const localProgress = localStorage.getItem('campaignProgress');
        if (localProgress) {
            try {
                this.campaignProgress = JSON.parse(localProgress);
                console.log('LocalStorage\'dan progress yüklendi, currentNode:', this.campaignProgress.currentNode);
            } catch (e) {
                console.log('LocalStorage parse hatası:', e);
            }
        }
        
        const progress = this.campaignProgress;
        if (!progress) {
            console.log('Progress null, starter deck yükleniyor');
            const starterDeck = window.campaignData?.starterDeck || [2, 11, 6, 4];
            this.campaignProgress = {
                cardBag: starterDeck.map(cardId => ({
                    baseId: cardId,
                    defaultLevel: 1
                })),
                currentHealth: 300,
                gold: 0,
                currentNode: 0,
                completedNodes: []
            };
            localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));
        }
        
        // İlk kez sefere başlıyorsa, başlangıç kartlarını çantaya ekle
        if (!progress.cardBag || progress.cardBag.length === 0) {
            const starterDeck = window.campaignData?.starterDeck || [2, 11, 6, 4];
            progress.cardBag = starterDeck.map(cardId => ({
                baseId: cardId,
                defaultLevel: 1
            }));
            progress.currentHealth = 300;
            progress.gold = 0;
            progress.currentNode = 0;
            progress.completedNodes = [];
            // LocalStorage'a kaydet
            localStorage.setItem('campaignProgress', JSON.stringify(progress));
            // Sunucuya güncelle
            try {
                await window.Network.updateCampaign(progress);
            } catch (err) {
                console.log('Sunucuya güncelleme hatası (görmezden gelindi):', err);
            }
        }
        
        const currentNode = progress?.currentNode || 0;
        const completedNodes = new Set(progress?.completedNodes || []);
        
        console.log('renderCampaignMissionList - currentNode:', currentNode, 'completedNodes:', Array.from(completedNodes));

        // Yuvarlak harita render et
        missionList.innerHTML = `
            <div class="mission-circles-container">
                ${campaignMap.map((node, index) => {
                    const isCurrent = index === currentNode;
                    const isCompleted = completedNodes.has(node.id);
                    const isLocked = index > currentNode;
                    
                    let circleClass = 'mission-circle';
                    if (isCurrent) circleClass += ' active';
                    if (isCompleted) circleClass += ' completed';
                    if (isLocked) circleClass += ' locked';
                    
                    return `
                        <div class="${circleClass}" data-node-id="${node.id}" title="${node.title}: ${node.description}">
                            <span class="node-number">${node.id}</span>
                            <span class="node-type">${this.getNodeTypeIcon(node.type)}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <button id="start-node-btn" class="campaign-action-btn">Bölüm Başlat</button>
        `;

        // Yuvarlaklara tıklama event'i
        missionList.querySelectorAll('.mission-circle').forEach(circle => {
            circle.addEventListener('click', () => {
                const nodeId = parseInt(circle.dataset.nodeId);
                const progressCurrentNode = this.campaignProgress?.currentNode || 0;
                
                // Sadece mevcut node veya tamamlanmış node'lara tıklanabilir
                if (nodeId <= progressCurrentNode) {
                    this.startCampaignNode(nodeId);
                }
            });
        });

        // Bölüm başlat butonu - event listener'ı ekle
        const startBtn = document.getElementById('start-node-btn');
        if (startBtn) {
            // Eski event listener'ları temizle
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);
            
            newStartBtn.addEventListener('click', () => {
                console.log('Bölüm başlat butonu tıklandı, currentNode:', currentNode);
                this.startCampaignNode(currentNode);
            });
        } else {
            console.error('start-node-btn bulunamadı!');
        }

        if (bagCount) {
            bagCount.textContent = (this.campaignProgress?.cardBag || window.campaignData?.starterDeck || []).length;
        }
    }

    getNodeTypeIcon(type) {
        switch(type) {
            case 'battle': return '⚔️';
            case 'campfire': return '🔥';
            case 'market': return '🏪';
            case 'workshop': return '🔨';
            case 'boss': return '👑';
            default: return '❓';
        }
    }

    async startCampaignNode(nodeId) {
        console.log('startCampaignNode çağrıldı, nodeId:', nodeId);
        const node = window.campaignData?.getNodeById(nodeId);
        console.log('Node:', node);
        if (!node) {
            console.error('Node bulunamadı, nodeId:', nodeId);
            return;
        }

        this.currentCampaignNode = node;
        console.log('Node type:', node.type);

        switch(node.type) {
            case 'battle':
            case 'boss':
                console.log('Battle/Boss node, loadout açılıyor');
                this.currentCampaignMission = {
                    id: `node_${node.id}`,
                    title: node.title,
                    description: node.description,
                    aiDeck: node.aiDeck
                };
                this.showCampaignLoadout();
                break;
            case 'campfire':
                console.log('Campfire node, campfire açılıyor');
                this.showCampfireScreen();
                break;
            case 'market':
                console.log('Market node, market açılıyor');
                this.showMarketScreen();
                break;
            case 'workshop':
                console.log('Workshop node, workshop açılıyor');
                this.showWorkshopScreen();
                break;
            default:
                console.error('Bilinmeyen node type:', node.type);
        }
    }

    showCampaignLoadout() {
        console.log('showCampaignLoadout çağrıldı');
        const loadoutScreen = document.getElementById('campaign-loadout-screen');
        const list = document.getElementById('campaign-loadout-list');
        if (!loadoutScreen || !list) return;
        if (typeof UI !== 'undefined' && UI.showScreen) {
            UI.showScreen('campaign-loadout-screen');
        }

        // campaignProgress null kontrolü
        if (!this.campaignProgress) {
            console.log('campaignProgress null, LocalStorage\'dan yükleniyor');
            const localProgress = localStorage.getItem('campaignProgress');
            if (localProgress) {
                try {
                    this.campaignProgress = JSON.parse(localProgress);
                } catch (e) {
                    console.log('LocalStorage parse hatası:', e);
                    this.campaignProgress = {};
                }
            } else {
                this.campaignProgress = {};
            }
        }

        const cardBag = this.campaignProgress?.cardBag || [];
        console.log('cardBag:', cardBag, 'length:', cardBag.length);
        this.campaignSelectedCards = []; // Seçili kartları sıfırla

        if (cardBag.length === 0) {
            console.log('CardBag boş, starter deck yükleniyor');
            const starterDeck = window.campaignData?.starterDeck || [2, 11, 6, 4];
            this.campaignProgress.cardBag = starterDeck.map(id => ({ baseId: id, defaultLevel: 1 }));
            localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));
            console.log('Starter deck yüklendi:', this.campaignProgress.cardBag);
            
            // Sunucuya güncelle (eğer bağlıysa) - hata görmezden gel
            if (window.Network && window.Network.updateCampaign) {
                window.Network.updateCampaign(this.campaignProgress).catch(err => {
                    console.log('Sunucu güncelleme hatası (görmezden gelindi):', err);
                });
            }
        }

        console.log('CardBag dolu, kartlar render ediliyor');
        console.log('CardBag detayları:', cardBag.map(c => ({ baseId: c.baseId, defaultLevel: c.defaultLevel })));
        // Kartları gerçek kart olarak göster
        list.innerHTML = `
            <div class="loadout-cards-container">
                ${cardBag.map((card, index) => {
                    console.log(`Kart ${index}:`, card);
                    if (!card.baseId) {
                        console.log('Kart baseId null, atlanıyor, index:', index);
                        return '';
                    }
                    const cardData = window.cardsData?.find(c => c.id === card.baseId);
                    if (!cardData) {
                        console.log('CardData bulunamadı, baseId:', card.baseId);
                        return '';
                    }
                    
                    const level = card.defaultLevel || 1;
                    const cardObj = new Card(cardData);
                    cardObj.baseId = cardData.id;
                    cardObj.level = level;
                    cardObj.updateLevelStats(level);
                    const cardElement = cardObj.createCardElement();
                    
                    return `
                        <div class="loadout-card" data-card-index="${index}" data-card-id="${card.baseId}">
                            ${cardElement.outerHTML}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="loadout-summary">
                <p>Seçili: <span id="selected-count">0</span>/4 kart</p>
            </div>
        `;

        // Kart seçim event'leri
        list.querySelectorAll('.loadout-card').forEach(cardEl => {
            cardEl.addEventListener('click', () => {
                const cardIndex = parseInt(cardEl.dataset.cardIndex);
                this.toggleLoadoutCard(cardIndex, cardEl);
            });
        });

        // "Göreve Başla" butonu event'ini güncelle
        const startBtn = document.getElementById('campaign-start-btn');
        if (startBtn) {
            // Eski event listener'ı kaldır
            const newStartBtn = startBtn.cloneNode(true);
            startBtn.parentNode.replaceChild(newStartBtn, startBtn);
            
            newStartBtn.addEventListener('click', () => {
                if (this.campaignSelectedCards.length !== 4) {
                    if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                        UI.showInfoMessage('4 kart seçmelisin!', 2000);
                    }
                    return;
                }
                this.startCampaignBattle();
            });
        }

        // "Geri Dön" butonu
        const backBtn = document.getElementById('campaign-loadout-back-btn');
        if (backBtn) {
            const newBackBtn = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBackBtn, backBtn);
            
            newBackBtn.addEventListener('click', () => {
                this.showCampaignHub();
            });
        }
    }

    toggleLoadoutCard(cardIndex, cardEl) {
        console.log('toggleLoadoutCard çağrıldı, cardIndex:', cardIndex);
        const cardBag = this.campaignProgress?.cardBag || [];
        console.log('cardBag length:', cardBag.length);
        const card = cardBag[cardIndex];
        console.log('Seçilen kart:', card);
        
        const selectedIndex = this.campaignSelectedCards.findIndex(c => c.baseId === card.baseId);
        console.log('selectedIndex:', selectedIndex, 'campaignSelectedCards length:', this.campaignSelectedCards.length);
        
        if (selectedIndex >= 0) {
            // Zaten seçili, kaldır
            this.campaignSelectedCards.splice(selectedIndex, 1);
            cardEl.classList.remove('selected');
            console.log('Kart seçimden kaldırıldı, yeni length:', this.campaignSelectedCards.length);
        } else {
            // Seçili değil, ekle (max 4)
            if (this.campaignSelectedCards.length >= 4) {
                if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                    UI.showInfoMessage('En fazla 4 kart seçebilirsin!', 2000);
                }
                return;
            }
            this.campaignSelectedCards.push(card);
            cardEl.classList.add('selected');
            console.log('Kart seçime eklendi, yeni length:', this.campaignSelectedCards.length);
        }

        // Seçili sayısını güncelle
        const countEl = document.getElementById('selected-count');
        if (countEl) {
            countEl.textContent = this.campaignSelectedCards.length;
        }

        // Seçilen kartları DB'ye kaydet
        if (window.Network && window.Network.isAuthenticated()) {
            window.Network.saveLoadout(this.campaignProgress?.cardBag || []);
        }
    }

    async startCampaignBattle() {
        console.log('startCampaignBattle çağrıldı');
        console.log('currentCampaignMission:', this.currentCampaignMission);
        console.log('currentCampaignNode:', this.currentCampaignNode);
        console.log('campaignSelectedCards length:', this.campaignSelectedCards?.length);
        
        // currentCampaignMission null ise, currentCampaignNode'den oluştur
        if (!this.currentCampaignMission && this.currentCampaignNode) {
            this.currentCampaignMission = {
                id: `node_${this.currentCampaignNode.id}`,
                title: this.currentCampaignNode.title,
                description: this.currentCampaignNode.description,
                aiDeck: this.currentCampaignNode.aiDeck
            };
            console.log('currentCampaignMission currentCampaignNode\'den oluşturuldu:', this.currentCampaignMission);
        }
        
        if (!this.currentCampaignMission) {
            console.error('currentCampaignMission null!');
            return;
        }
        
        // Seçili kartları kontrol et
        if (!this.campaignSelectedCards || this.campaignSelectedCards.length !== 4) {
            console.log('4 kart seçilmemiş, length:', this.campaignSelectedCards?.length);
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage('4 kart seçmelisin!', 2000);
            }
            return;
        }
        
        // Eğitim overlay'i kontrol et (Node 0)
        if (this.currentCampaignNode && this.currentCampaignNode.isTutorial) {
            const tutorialOverlay = document.getElementById('tutorial-overlay');
            if (tutorialOverlay) {
                tutorialOverlay.style.display = 'flex';
                
                // Kart örneği oluştur (Çevik Hançer - starter deck'ten)
                const cardExampleDiv = document.getElementById('tutorial-card-example');
                if (cardExampleDiv) {
                    const cardData = window.cardsData?.find(c => c.id === 4); // Çevik Hançer
                    if (cardData) {
                        const cardObj = new Card(cardData);
                        cardObj.baseId = cardData.id;
                        cardObj.level = 1;
                        cardObj.updateLevelStats(1);
                        const cardElement = cardObj.createCardElement();
                        cardExampleDiv.innerHTML = cardElement.outerHTML;
                    }
                }
                
                // Anladım butonu event listener'ı
                const understoodBtn = document.getElementById('tutorial-understood-btn');
                if (understoodBtn) {
                    understoodBtn.onclick = () => {
                        tutorialOverlay.style.display = 'none';
                        this.proceedWithCampaignBattle();
                    };
                }
                return; // Savaşı butona basınca başlat
            }
        }
        
        this.proceedWithCampaignBattle();
    }
    
    async proceedWithCampaignBattle() {
        this.gameMode = 'campaign';
        this.campaignMode = true;
        await window.Network.fetchCampaign();
        
        // Seçili kartları player1Cards'a ata
        this.player1SelectedCards = this.campaignSelectedCards.map(card => {
            const template = this.availableCards.find(item => item.baseId === card.baseId);
            if (!template) return null;
            const clone = template.clone();
            clone.level = card.defaultLevel || 1;
            clone.updateLevelStats(clone.level);
            return clone;
        }).filter(Boolean);
        
        this.player1Cards = this.player1SelectedCards.map(card => card.clone());
        this.player1Cards.forEach(card => { card.owner = 1; });
        
        // Loadout ekranını kapat
        const loadoutScreen = document.getElementById('campaign-loadout-screen');
        if (loadoutScreen) loadoutScreen.style.display = 'none';
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) gameContainer.style.display = 'flex';
        
        this.confirmAiConfig(this.currentCampaignMission.aiDeck);
    }

    async completeCampaignMission(rewardCardId) {
        if (!window.Network || !window.Network.isAuthenticated() || !this.currentCampaignMission) return;
        const progress = await window.Network.completeMission(this.currentCampaignMission.id, rewardCardId);
        this.campaignProgress = progress;
        this.campaignRewardChoices = [];
        this.currentCampaignMission = null;
        if (typeof UI !== 'undefined' && UI.showScreen) {
            UI.showScreen('campaign-hub-screen');
        }
        this.renderCampaignMissionList();
        if (typeof UI !== 'undefined' && UI.showInfoMessage) {
            UI.showInfoMessage('Görev tamamlandı. Çantaya kart eklendi.', 2500);
        }
    }

    confirmAiConfig(aiConfig) {
        // Campaign modunda aiConfig kullanılmaz
        if (this.campaignMode) {
            this.aiConfig = {
                deckId: null,
                levelMode: 'flat',
                flatLevel: 1,
                focusTarget: null
            };
        } else {
            this.aiConfig = {
                deckId: aiConfig.deckId,
                levelMode: aiConfig.levelMode,
                flatLevel: aiConfig.flatLevel,
                focusTarget: null
            };
        }
        
        const configScreen = document.getElementById('pvc-config-screen');
        if (configScreen) configScreen.style.display = 'none';
        if (this.campaignMode) {
            // Campaign modunda zaten startCampaignBattle'da player1SelectedCards atandı
            // Bu kartları kullan
            if (this.campaignSelectedCards && this.campaignSelectedCards.length === 4) {
                this.player1SelectedCards = this.campaignSelectedCards.map(card => {
                    const template = this.availableCards.find(item => item.baseId === card.baseId);
                    if (!template) return null;
                    const clone = template.clone();
                    clone.level = card.defaultLevel || 1;
                    clone.updateLevelStats(clone.level);
                    return clone;
                }).filter(Boolean);
            } else {
                // Fallback: cardBag'dan ilk 4 kartı al
                const selectedCards = (this.campaignProgress?.cardBag || []).slice(0, 4);
                this.player1SelectedCards = selectedCards.map(card => {
                    const template = this.availableCards.find(item => item.baseId === card.baseId);
                    if (!template) return null;
                    const clone = template.clone();
                    clone.level = card.defaultLevel || 1;
                    clone.updateLevelStats(clone.level);
                    return clone;
                }).filter(Boolean);
            }
            
            this.player1Cards = this.player1SelectedCards.map(card => card.clone());
            this.player1Cards.forEach(card => { card.owner = 1; });
            
            // Campaign modunda AI desteği oluştur
            this.player2SelectedCards = [];
            
            // Node 0 (Eğitim) için özel senaryo: Baş Gardiyan + 3x Gardiyan
            if (this.currentCampaignNode && this.currentCampaignNode.isTutorial) {
                const headGuardianData = window.enemyCards?.find(c => c.id === 17);
                const guardianData = window.enemyCards?.find(c => c.id === 0);
                
                if (headGuardianData) {
                    const headGuardian = new Card(headGuardianData);
                    headGuardian.baseId = headGuardianData.id;
                    headGuardian.level = 1;
                    headGuardian.updateLevelStats(1);
                    this.player2SelectedCards.push(headGuardian);
                }
                
                if (guardianData) {
                    for (let i = 1; i <= 3; i++) {
                        const guardianCard = new Card(guardianData);
                        guardianCard.baseId = guardianData.id;
                        guardianCard.level = i;
                        guardianCard.updateLevelStats(i);
                        this.player2SelectedCards.push(guardianCard);
                    }
                }
            } else if (this.currentCampaignNode && this.currentCampaignNode.type === 'boss') {
                // Boss savaşında boss kartını oluştur
                const bossData = window.enemyCards?.find(c => c.id === 20);
                if (bossData) {
                    const bossCard = new Card(bossData);
                    bossCard.baseId = bossData.id;
                    bossCard.level = 1;
                    bossCard.updateLevelStats(1);
                    
                    // Kaydedilmiş boss canı varsa kullan
                    const savedBossHealth = this.campaignProgress?.bossHealth?.[this.currentCampaignNode.id];
                    if (savedBossHealth !== undefined) {
                        bossCard.health = savedBossHealth;
                        this.addToBattleLog(`Boss'un kalan canı: ${savedBossHealth}`);
                    }
                    
                    this.player2SelectedCards.push(bossCard);
                }
                
                // Boss savaşında 3 tane Gardiyan ekle
                const guardianData = window.enemyCards?.find(c => c.id === 0);
                if (guardianData) {
                    for (let i = 0; i < 3; i++) {
                        const guardianCard = new Card(guardianData);
                        guardianCard.baseId = guardianData.id;
                        guardianCard.level = 1;
                        guardianCard.updateLevelStats(1);
                        this.player2SelectedCards.push(guardianCard);
                    }
                }
            } else {
                // Normal campaign savaşları için rastgele düşman deste
                const enemyCards = window.enemyCards || [];
                const weakCards = enemyCards.filter(c => c.tier === 'Çelimsiz');
                
                // Eğer weakCards yoksa fallback olarak Gardiyan kullan (enemyCards'tan)
                const availableCards = weakCards.length > 0 ? weakCards : enemyCards;
                
                for (let i = 0; i < 4; i++) {
                    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
                    if (randomCard) {
                        const enemyCard = new Card(randomCard);
                        enemyCard.baseId = randomCard.id;
                        // Level 1-3 arasında rastgele
                        const randomLevel = Math.floor(Math.random() * 3) + 1;
                        enemyCard.level = randomLevel;
                        enemyCard.updateLevelStats(randomLevel);
                        this.player2SelectedCards.push(enemyCard);
                    }
                }
            }
            
            this.player2Cards = this.player2SelectedCards.map(card => card.clone());
            this.player2Cards.forEach(card => { card.owner = 2; });
            console.log('Player2 kartları:', this.player2Cards.map(c => c.name));
            
            this.startGame();
            return;
        }
        this.showCardSelection();
        this.updatePlayerIndicator();
    }

    generateAiDeck() {
        let selectedCards = [];
        let chosenDeck = aiPreMadeDecks.find(d => d.id === this.aiConfig.deckId);
        
        if (!chosenDeck || chosenDeck.id === "random") {
            let availablePool = [...this.availableCards];
            for (let i = 0; i < 4; i++) {
                let rndIdx = Math.floor(Math.random() * availablePool.length);
                selectedCards.push(availablePool[rndIdx].clone());
                availablePool.splice(rndIdx, 1);
            }
        } else {
            chosenDeck.cardIds.forEach(id => {
                let cardTemplate = this.availableCards.find(c => c.baseId === id);
                if (cardTemplate) {
                    selectedCards.push(cardTemplate.clone());
                }
            });
        }

        if (this.aiConfig.levelMode === "flat") {
            selectedCards.forEach(card => {
                card.updateLevelStats(this.aiConfig.flatLevel);
            });
        } else {
            selectedCards.forEach(card => {
                card.updateLevelStats(1);
            });

            let remainingPoints = 18;
            while (remainingPoints > 0) {
                let upgradableCards = selectedCards.filter(card => {
                    return card.level < 5 && card.level <= remainingPoints;
                });

                if (upgradableCards.length === 0) break;

                let rndCard = upgradableCards[Math.floor(Math.random() * upgradableCards.length)];
                let cost = rndCard.level;
                
                rndCard.level += 1;
                rndCard.updateLevelStats(rndCard.level);
                remainingPoints -= cost;
            }
        }

        this.player2Cards = selectedCards;
        this.player2Cards.forEach(card => { card.owner = 2; });
    }

    initCards() {
        // isEnemyOnly kartlarını filtrele (sadece sefer modunda bilgisayar için)
        this.availableCards = cardsData
            .filter(card => !card.isEnemyOnly)
            .map(card => new Card(card, this.cardEffects));
    }

    showCardSelection() {
        const cardSelection = document.getElementById('card-selection');
        if (!cardSelection) return;
        
        // Online modda bekleme ekranını kapat
        if (this.gameMode === 'online_pvp') {
            const waitingScreen = document.getElementById('waiting-screen');
            if (waitingScreen) waitingScreen.style.display = 'none';
            
            // Online mod UI ayarları
            const timerContainer = document.getElementById('online-timer-container');
            if (timerContainer) timerContainer.style.display = 'block';
            
            const startButton = document.getElementById('start-game-btn');
            if (startButton) startButton.style.display = 'none';
            
            const readyButton = document.getElementById('ready-btn');
            if (readyButton) {
                readyButton.style.display = 'block';
                readyButton.disabled = true;
                // Hazır butonu event listener'ı
                readyButton.onclick = () => this.handleOnlineReady();
            }
            
            // Süre sayacını başlat
            this.startSelectionTimer(90);
        }
        
        cardSelection.style.display = 'flex';
        
        const pointsSpan = document.getElementById('available-points');
        if (pointsSpan) {
            pointsSpan.textContent = this.getCurrentPlayerUsedPoints();
        }
        
        const availableCardsContainer = document.getElementById('available-cards');
        if (!availableCardsContainer) return;
        
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

    toggleCardSelection(card) {
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
        
        const selectedCount = document.getElementById('selected-count');
        if (selectedCount) selectedCount.textContent = currentSelectedCards.length;
        this.updateSelectedCardsDisplay();
        this.updateButtons();
    }

    updateSelectedCardsDisplay() {
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
            
            const pointsSpan = document.getElementById('available-points');
            if (pointsSpan) pointsSpan.textContent = "0";
            return;
        }
        
        if (typeof UI !== 'undefined' && UI.updateSelectedCardsDisplay) {
            UI.updateSelectedCardsDisplay(selectedCards, this);
        }
    }

    updateButtons() {
        const startButton = document.getElementById('start-game-btn');
        const nextPlayerButton = document.getElementById('next-player-btn');
        const readyButton = document.getElementById('ready-btn');
        
        const player1CardsReady = this.player1SelectedCards.length === 4;
        const player2CardsReady = this.gameMode === 'pvc' || this.player2SelectedCards.length === 4;
        
        if (this.gameMode === 'online_pvp') {
            // Online mod: Hazır butonunu kontrol et
            if (readyButton) {
                readyButton.disabled = !player1CardsReady;
            }
        } else if (this.gameMode === 'pvp') {
            if (this.currentSelectingPlayer === 1) {
                if (nextPlayerButton) nextPlayerButton.disabled = !player1CardsReady;
                if (startButton) startButton.disabled = true;
            } else {
                if (nextPlayerButton) nextPlayerButton.style.display = 'none';
                if (startButton) startButton.disabled = !player2CardsReady;
            }
        } else {
            if (startButton) startButton.disabled = !player1CardsReady;
        }
    }

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
        return fromLevel;
    }

    getTotalUpgradeCost(level) {
        const nextLevel = Math.max(1, level);
        return Math.floor(((nextLevel - 1) * nextLevel) / 2);
    }

    getCurrentPlayerUsedPoints() {
        return this.startingPoints - this.getCurrentPlayerPoints();
    }
    
    startSelectionTimer(seconds) {
        this.selectionTimer = seconds;
        const timerElement = document.getElementById('selection-timer');
        if (timerElement) {
            timerElement.textContent = this.selectionTimer;
        }
        
        this.selectionTimerInterval = setInterval(() => {
            this.selectionTimer--;
            if (timerElement) {
                timerElement.textContent = this.selectionTimer;
            }
            
            if (this.selectionTimer <= 0) {
                clearInterval(this.selectionTimerInterval);
                this.handleSelectionTimeout();
            }
        }, 1000);
    }
    
    handleSelectionTimeout() {
        alert('Kart seçim süresi doldu! Oyundan atılıyorsunuz.');
        
        // Sunucuya timeout bildirimi gönder
        if (window.Network && Network.isConnected()) {
            Network.sendSelectionTimeout(this.onlineRoomId);
        }
        
        // Ana menüye dön
        location.reload();
    }
    
    handleOnlineReady() {
        if (this.player1SelectedCards.length !== 4) {
            alert('Lütfen 4 kart seçin!');
            return;
        }
        
        
        // Hazır butonunu devre dışı bırak
        const readyButton = document.getElementById('ready-btn');
        if (readyButton) {
            readyButton.disabled = true;
            readyButton.textContent = 'Bekleniyor...';
        }
        
        // Süre sayacını durdur
        if (this.selectionTimerInterval) {
            clearInterval(this.selectionTimerInterval);
        }
        
        // Desteyi sunucuya gönder
        if (window.Network && Network.isConnected()) {
            if (!this.player1SelectedCards || this.player1SelectedCards.length === 0) {
                alert('Kart seçimi yapılmadı! Lütfen 4 kart seçin.');
                if (readyButton) {
                    readyButton.disabled = false;
                    readyButton.textContent = 'Hazır';
                }
                return;
            }

            const deckData = this.player1SelectedCards.map(card => ({
                baseId: card.baseId,
                level: card.level
            }));

            Network.sendPlayerReady(this.onlineRoomId, deckData);
        } else {
            alert('Sunucu bağlantısı yok! Lütfen lobiye dönüp tekrar deneyin.');
            if (readyButton) {
                readyButton.disabled = false;
                readyButton.textContent = 'Hazır';
            }
        }
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
        if (!card) return false;
        if (card.level >= this.maxCardLevel) return false;

        const cost = this.getUpgradeCost(card.level);
        const currentPoints = this.getCurrentPlayerPoints();
        if (currentPoints < cost) return false;

        card.level += 1;
        card.updateLevelStats(card.level);
        this.setCurrentPlayerPoints(currentPoints - cost);
        this.updateSelectedCardsDisplay();
        return true;
    }

    downgradeCard(instanceId) {
        const selectedCards = this.getCurrentPlayerSelectedCards();
        const card = selectedCards.find(c => c.instanceId === instanceId);
        if (!card) return false;
        if (card.level <= 1) return false;

        const refund = this.getUpgradeCost(card.level - 1);
        card.level -= 1;
        card.updateLevelStats(card.level);
        const currentPoints = this.getCurrentPlayerPoints();
        this.setCurrentPlayerPoints(currentPoints + refund);
        this.updateSelectedCardsDisplay();
        return true;
    }

    updatePlayerIndicator() {
        const playerIndicator = document.getElementById('player-turn-indicator');
        if (!playerIndicator) return;

        if (this.gameMode === 'online_pvp') {
            const opponentName = this.onlineOpponentName || 'Rakip';
            playerIndicator.innerHTML = `<div style="font-size:16px;font-weight:bold;">Rakip: ${opponentName}</div><div style="font-size:13px;color:#666;">Kart seçimi - 60 sn</div>`;
            return;
        }

        playerIndicator.textContent = `Oyuncu ${this.currentSelectingPlayer}`;
    }

    switchToNextPlayer() {
        if (this.player1SelectedCards.length !== 4) {
            alert('Lütfen 4 kart seçin!');
            return;
        }
        
        this.currentSelectingPlayer = 2;
        this.selectedCardsCount = 0;
        this.updatePlayerIndicator();
        
        const availableCardsContainer = document.getElementById('available-cards');
        if (availableCardsContainer) {
            availableCardsContainer.innerHTML = '';
            this.availableCards.forEach(card => {
                const cardElement = card.createCardElement();
                cardElement.addEventListener('click', () => {
                    this.toggleCardSelection(card);
                });
                availableCardsContainer.appendChild(cardElement);
            });
        }
        
        const selectedCount = document.getElementById('selected-count');
        if (selectedCount) selectedCount.textContent = 0;
        
        const container = document.getElementById('selected-cards-container');
        if (container) container.innerHTML = '';
        
        const pointsSpan = document.getElementById('available-points');
        if (pointsSpan) pointsSpan.textContent = this.getCurrentPlayerUsedPoints();
        
        this.updateButtons();
    }

    startGame() {
        if (this.gameMode === 'online_pvp') {
            // Online mod: Desteyi sunucuya gönder
            if (this.player1SelectedCards.length !== 4) {
                alert("Lütfen 4 kart seçin!");
                return;
            }
            
            // Desteyi sunucuya gönder
            if (window.Network && Network.isConnected()) {
                const deckData = this.player1SelectedCards.map(card => ({
                    baseId: card.baseId,
                    level: card.level
                }));
                
                Network.socket.emit('submit_deck', {
                    roomId: this.onlineRoomId,
                    deck: deckData
                });
                
            } else {
                alert("Sunucuya bağlı değil!");
                return;
            }
        } else if (this.gameMode === 'pvp') {
            if (this.player1SelectedCards.length !== 4 || this.player2SelectedCards.length !== 4) {
                alert("Her iki oyuncu için de 4 kart seçilmelidir!");
                return;
            }
            this.player1Cards = this.player1SelectedCards.map(card => card.clone());
            this.player2Cards = this.player2SelectedCards.map(card => card.clone());
        } else if (this.campaignMode) {
            // Campaign modunda player2 kartları zaten oluşturuldu, override etme
            if (this.player1SelectedCards.length !== 4) {
                alert("Lütfen 4 kart seçin!");
                return;
            }
            this.player1Cards = this.player1SelectedCards.map(card => card.clone());
            // Player2 kartları zaten Gardiyan olarak ayarlandı
        } else {
            if (this.player1SelectedCards.length !== 4) {
                alert("Lütfen 4 kart seçin!");
                return;
            }
            this.player1Cards = this.player1SelectedCards.map(card => card.clone());
            this.generateAiDeck();
        }

        const cardSelection = document.getElementById('card-selection');
        if (cardSelection) cardSelection.style.display = 'none';
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) gameContainer.style.display = 'flex';

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
    
    handleOnlineGameStarted(data) {
        const seedValue = parseInt(String(data.roomId).replace(/\D/g, ''), 10) || 12345;

        this.seededRandom = this._createSeededRandom(seedValue);
const { roomId, role, opponentDeck, opponentName, firstTurn } = data;

        this.onlineRole = role;
        this.onlineRoomId = roomId;

        const buildDeck = (deckData) => deckData.map(cardData => {
            const cardTemplate = this.availableCards.find(c => c.baseId === cardData.baseId);
            if (cardTemplate) {
                const card = cardTemplate.clone();
                card.updateLevelStats(cardData.level);
                return card;
            }
            return null;
        }).filter(c => c !== null);

        const myDeck = this.player1SelectedCards.map(card => card.clone());
        const opponentCards = buildDeck(opponentDeck);

        // Her iki ekranda da player1 slotu = gerçek player1, player2 slotu = gerçek player2
        if (role === 'player1') {
            this.player1Cards = myDeck;
            this.player2Cards = opponentCards;
        } else {
            this.player1Cards = opponentCards;
            this.player2Cards = myDeck;
        }

        this.player1Cards.forEach((card, index) => {
            card.instanceId = 101 + index;
            card.owner = 1;
            if (card.element) {
                card.element.dataset.instanceId = card.instanceId;
            }
        });

        this.player2Cards.forEach((card, index) => {
            card.instanceId = 201 + index;
            card.owner = 2;
            if (card.element) {
                card.element.dataset.instanceId = card.instanceId;
            }
        });

        const cardSelection = document.getElementById('card-selection');
        if (cardSelection) cardSelection.style.display = 'none';

        const waitingScreen = document.getElementById('waiting-screen');
        if (waitingScreen) waitingScreen.style.display = 'none';

        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) gameContainer.style.display = 'flex';

        const player1Area = document.getElementById('player1-area');
        const player2Area = document.getElementById('player2-area');
        if (player1Area) {
            const title = player1Area.querySelector('h2');
            if (title) title.textContent = role === 'player1' ? 'Sen (Oyuncu 1)' : opponentName;
        }
        if (player2Area) {
            const title = player2Area.querySelector('h2');
            if (title) title.textContent = role === 'player2' ? 'Sen (Oyuncu 2)' : opponentName;
        }

        this.renderGameBoard();

        if (typeof applyCardEffects === 'function') {
            applyCardEffects(this);
        }

        this.setupGlobalClickHandler();
        this.prepareTurnOrder();

        this.currentPlayerTurn = (firstTurn === 'player1') ? 1 : 2;

        this.isGameStarted = true;
        this.isSelectionPhase = false;

        this.addToBattleLog(`Savaş başladı! Rakip: ${opponentName}`);
        this.currentTurn = 1;
        this.startTurn();
    }

    _createSeededRandom(seed) {
        let state = seed;
        return function() {
            let t = state += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    getRandom() {
        if (this.gameMode === 'online_pvp' && this.seededRandom) {
            return this.seededRandom();
        }
        return Math.random();
    }

    setupGlobalClickHandler() {
        if (this._clickHandler) {
            document.removeEventListener('click', this._clickHandler);
        }
        
        this._clickHandler = (event) => {
            // Sadece oyun başladıysa ve hedef bekleniyorsa çalış
            if (!this.isGameStarted || !this.waitingForTarget) return;
            
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
        
        if (player1Container) {
            player1Container.innerHTML = '';
            this.player1Cards.forEach(card => {
                player1Container.appendChild(card.createCardElement());
            });
        }
        
        if (player2Container) {
            player2Container.innerHTML = '';
            this.player2Cards.forEach(card => {
                player2Container.appendChild(card.createCardElement());
            });
        }
        
        const turnIndicator = document.querySelector('.turn-indicator');
        if (turnIndicator && !document.getElementById('turn-status')) {
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
    
    // Online mod dışındaki durumlarda sırayı rastgele belirle
    if (this.gameMode !== 'online_pvp') {
        const random = this.getRandom();
        this.currentPlayerTurn = random < 0.5 ? 1 : 2;
    }
    
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
            
            if ((this.gameMode === 'pvc' || this.campaignMode) && this.currentPlayerTurn === 2) {
                this.waitingForTarget = false;
                const turnStatus = document.getElementById('turn-status');
                if (turnStatus) {
                    turnStatus.textContent = 'Bilgisayar Düşünüyor... 🤖';
                }
                setTimeout(() => {
                    this.executeAiTurn();
                }, 1200);
            } else if (this.gameMode === 'online_pvp') {
                const isMyTurn = (this.onlineRole === 'player1' && this.currentPlayerTurn === 1) ||
                                 (this.onlineRole === 'player2' && this.currentPlayerTurn === 2);
                this.waitingForTarget = isMyTurn;
                const turnStatus = document.getElementById('turn-status');
                if (turnStatus) {
                    turnStatus.textContent = isMyTurn ? 'Saldırı Sırası!' : 'Rakip hamle yapıyor...';
                }
                this.updateActivePlayerIndicator();
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

    executeAiTurn() {
        let attacker = this.currentAttackingCard;
        if (!attacker || attacker.health <= 0) return;

        let enemies = this.player1Cards.filter(c => c.health > 0);
        if (enemies.length === 0) return;

        let validTargets = enemies;
        
        // Node 0 (Eğitim) için özel mantık: Baş Gardiyan ilk saldırıda Çevik Hançer'i hedefle
        if (this.currentCampaignNode && this.currentCampaignNode.isTutorial && attacker.baseId === 17) {
            const agileDagger = enemies.find(c => c.baseId === 4);
            if (agileDagger && !agileDagger.hasAttackedThisTurn) {
                validTargets = [agileDagger];
            }
        }
        
        let leaderCards = enemies.filter(c => c.baseId === 12);
        let hasTauntActive = leaderCards.length > 0;
        if (hasTauntActive) {
            validTargets = leaderCards;
        }

        // Simüle Hasar Hesaplama (Multi-attack ve Kalkan Kopyalayıcı Korumalı)
        const getSimulatedDamage = (att, trg) => {
            let baseDmg = att.attack;
            let totalSimulated = 0;
            
            let attackCount = 1;
            if (att.baseId === 4) {
                attackCount = att.levelAbilities && att.levelAbilities.attackCount
                    ? att.levelAbilities.attackCount[att.level - 1]
                    : 3;
            } else if (att.baseId === 10) {
                attackCount = 2;
            }

            let damageReduction = 0;
            if (trg.baseId === 3) {
                damageReduction = trg.levelAbilities && trg.levelAbilities.damageReduction
                    ? trg.levelAbilities.damageReduction[trg.level - 1]
                    : 30;
            }

            // Kalkan Kopyalayıcı için zırh kopyalama bonusu
            let armorCopyBonus = 0;
            if (trg.baseId === 13) {
                armorCopyBonus = trg.levelAbilities && trg.levelAbilities.armorCopyBonus
                    ? trg.levelAbilities.armorCopyBonus[trg.level - 1]
                    : 2;
            }

            // Hedefin mevcut zırhı (Kalkan Kopyalayıcı ise kopyalanmış zırhı da hesaba kat)
            let currentTargetArmor = trg.armor;
            if (trg.baseId === 13 && trg.effects && trg.effects.copiedArmor !== undefined) {
                currentTargetArmor = trg.effects.copiedArmor;
            }

            for (let i = 0; i < attackCount; i++) {
                let hitDmg = baseDmg;
                if (damageReduction > 0) {
                    hitDmg = Math.floor(hitDmg * (1 - damageReduction / 100));
                }

                // Kalkan Kopyalayıcı ise ilk vuruştan sonra zırh kopyalayacak
                let effectiveArmor = currentTargetArmor;
                if (trg.baseId === 13 && i > 0) {
                    // İlk vuruştan sonra hedef, saldıranın zırhını kopyalar
                    effectiveArmor = (att.armor || 0) + armorCopyBonus;
                }

                let actualHitDmg = hitDmg;
                if (hitDmg > 0 && typeof effectiveArmor === 'number') {
                    actualHitDmg = hitDmg - effectiveArmor;
                    if (actualHitDmg < 0) actualHitDmg = 0;
                }
                totalSimulated += actualHitDmg;
            }
            
            return totalSimulated;
        };

        const getThreatScore = (card) => {
            let atk = card.attack || 0;
            let spd = card.speed || 0;
            let hp = card.health || 0;
            let arm = card.armor || 0;
            return (atk * 3) + (spd * 2) - (hp * 0.5) - (arm * 1.5);
        };

        let target = null;

        // 1. Bitirici Vuruş Kontrolü
        let killableTargets = validTargets.filter(t => getSimulatedDamage(attacker, t) >= t.health);

        if (killableTargets.length > 0) {
            let unactedKillable = killableTargets.filter(t => !t.hasAttackedThisTurn);
            let actedKillable = killableTargets.filter(t => t.hasAttackedThisTurn);

            if (unactedKillable.length > 0) {
                unactedKillable.sort((a, b) => b.attack - a.attack);
                target = unactedKillable[0];
            } else {
                actedKillable.sort((a, b) => b.attack - a.attack);
                target = actedKillable[0];
            }
        } 
        // 2. Özel Stratejiler
        else if (!hasTauntActive) {
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
            else if (attacker.baseId === 4 || attacker.baseId === 10) {
                // Kalkan Kopyalayıcı'dan (ID 13) zırh kopyalamasını önlemek için kaçın
                let lowArmorTargets = validTargets.filter(t => t.armor <= 2 && t.baseId !== 13);
                if (lowArmorTargets.length > 0) {
                    lowArmorTargets.sort((a, b) => getThreatScore(b) - getThreatScore(a));
                    target = lowArmorTargets[0];
                }
            }
            else if (attacker.baseId === 2) {
                let unbuffedTargets = validTargets.filter(t => t.speed === t.startingValues.speed);
                if (unbuffedTargets.length > 0) {
                    unbuffedTargets.sort((a, b) => getThreatScore(b) - getThreatScore(a));
                    target = unbuffedTargets[0];
                }
            }
            else if (attacker.baseId === 8) {
                let unpoisonedTargets = validTargets.filter(t => !t.effects || !t.effects.poison);
                if (unpoisonedTargets.length > 0) {
                    unpoisonedTargets.sort((a, b) => getThreatScore(b) - getThreatScore(a));
                    target = unpoisonedTargets[0];
                }
            }
        }

        // 3. Odaklanma Hedefi
        if (!target) {
            if (this.aiFocusTarget && this.aiFocusTarget.health > 0 && validTargets.includes(this.aiFocusTarget)) {
                target = this.aiFocusTarget;
            } else {
                validTargets.forEach(t => {
                    t._aiThreat = getThreatScore(t);
                });
                validTargets.sort((a, b) => b._aiThreat - a._aiThreat);
                target = validTargets[0];
                this.aiFocusTarget = target;
            }
        }

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
        if (activePlayer) {
            if (this.gameMode === 'pvc' && this.currentPlayerTurn === 2) {
                activePlayer.textContent = 'Bilgisayar';
            } else if (this.gameMode === 'online_pvp') {
                const isMyTurn = (this.onlineRole === 'player1' && this.currentPlayerTurn === 1) ||
                                 (this.onlineRole === 'player2' && this.currentPlayerTurn === 2);
                activePlayer.textContent = isMyTurn ? 'Senin Sıran' : 'Rakip Sırası';
            } else {
                activePlayer.textContent = `Oyuncu ${this.currentPlayerTurn}`;
            }
            activePlayer.className = this.currentPlayerTurn === 1 ? 'player1-turn' : 'player2-turn';
        }
    }

    async executeAttack(targetCard) {
    if (!this.currentAttackingCard || targetCard.health <= 0) return;
    
    const hedefKartlar = this.currentPlayerTurn === 1 ? this.player2Cards : this.player1Cards;
    const hedefUygun = hedefKartlar.some(k => k.instanceId === targetCard.instanceId);
    if (!hedefUygun) return;
    
    // Online Mod Kontrolleri
    if (this.gameMode === 'online_pvp') {
        const isMyTurn = (this.onlineRole === 'player1' && this.currentPlayerTurn === 1) ||
                         (this.onlineRole === 'player2' && this.currentPlayerTurn === 2);
        
        // Kendi sıramız değilse ve gelen hamle dışarıdan (soket üzerinden) uygulanmıyorsa engelle
        if (!isMyTurn && !this.executingOpponentAction) {
            return;
        }

        // Eğer hamleyi bizzat biz yaptıysak ve sıramızsa bunu sunucuya gönderelim
        if (isMyTurn && !this.executingOpponentAction) {
            if (window.Network && Network.isConnected()) {
                Network.sendPlayerAction(
                    this.onlineRoomId,
                    this.currentAttackingCard.instanceId,
                    targetCard.instanceId
                );
            }
        }
    }
    
    this.waitingForTarget = false;
    this.removeHighlights();
    
    // ... (mevcut savaş animasyonları ve hasar verme mantığı aynı kalacak şekilde devam ediyor)
        
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
            }
            
            this.currentAttackingCard.hasAttackedThisTurn = true;
            
            const activePlayerElement = document.getElementById('active-player');
            if (activePlayerElement) {
                activePlayerElement.textContent = 'Bekliyor...';
                activePlayerElement.className = '';
            }
            
            console.log('executeAttack - checkForWinner çağrılıyor');
            if (this.checkForWinner()) {
                console.log('executeAttack - checkForWinner true döndü, oyun bitti');
                return;
            }
            
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

        // Boss savaşında özel mantık: 4 kart ölürse maç bitmez, boss canı kaydet
        if (this.campaignMode && this.currentCampaignNode && this.currentCampaignNode.type === 'boss') {
            const player1DeadCount = this.player1Cards.filter(c => c.health <= 0).length;
            
            // Boss öldüyse normal kazanma mantığı
            if (!player2Alive) {
                const winnerName = 'Oyuncu 1';
                this.endGame(winnerName, 'player1');
                return true;
            }
            
            // Oyuncunun 4 kartı öldü ama boss yaşıyor
            if (player1DeadCount >= 4 && player1Alive) {
                // Boss'un kalan canını kaydet ve loadout ekranına dön
                const bossCard = this.player2Cards.find(c => c.health > 0);
                if (bossCard) {
                    if (!this.campaignProgress.bossHealth) {
                        this.campaignProgress.bossHealth = {};
                    }
                    this.campaignProgress.bossHealth[this.currentCampaignNode.id] = bossCard.health;
                    
                    // LocalStorage'a kaydet
                    localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));
                    
                    // Sunucuya güncelle (eğer bağlıysa)
                    if (window.Network && window.Network.updateCampaign) {
                        window.Network.updateCampaign(this.campaignProgress).catch(err => {
                            console.log('Sunucu güncelle hatası (görmezden gelindi):', err);
                        });
                    }
                    
                    this.addToBattleLog('Tüm kartların öldü! Boss canı kaydedildi. Loadout ekranına dönülüyor...');
                    
                    // Oyun ekranını kapat
                    const gameContainer = document.querySelector('.game-container');
                    if (gameContainer) gameContainer.style.display = 'none';
                    
                    // Loadout ekranına dön
                    setTimeout(() => {
                        this.showCampaignLoadout();
                    }, 2000);
                    
                    return true;
                }
            }
        }

        if (!player1Alive) {
            const winnerName = this.gameMode === 'pvc' ? 'Bilgisayar' : 'Oyuncu 2';
            this.endGame(winnerName, 'player2');
            return true;
        } else if (!player2Alive) {
            const winnerName = 'Oyuncu 1';
            this.endGame(winnerName, 'player1');
            return true;
        }

        return false;
    }

    async endGame(winner, winnerRole = null) {
        if (this.gameEnded) return;
        this.gameEnded = true;
        this.isGameStarted = false;
        this.addToBattleLog(`${winner} KAZANDI! 🏆`);

        if (this.gameMode === 'campaign') {
            if (winner === 'Oyuncu 1') {
                // Kazanma durumu - altın kazan ve reward ekranı göster
                await this.handleCampaignWin();
            } else {
                // Kaybetme durumu - hasar al
                await this.handleCampaignLoss();
            }
            return;
        }

        if (this.gameMode === 'online_pvp' && winnerRole && !this.executingOpponentAction) {
            if (window.Network && Network.isConnected()) {
                Network.sendGameOver(this.onlineRoomId, winnerRole);
                if (typeof Network.fetchProfile === 'function') {
                    setTimeout(() => {
                        Network.fetchProfile().then(profile => {
                            if (profile && typeof UI !== 'undefined' && UI.updateProfileStats) {
                                Network.setProfile(profile);
                                UI.updateProfileStats(profile);
                            }
                        });
                    }, 400);
                }
            }
        }

        if (typeof UI !== 'undefined' && UI.showMatchStats) {
            UI.showMatchStats(this, winner);
        } else {
            setTimeout(() => {
                this.askForNewGame();
            }, 1000);
        }
    }

    async handleCampaignWin() {
        console.log('handleCampaignWin çağrıldı');
        
        // Ölen kartları cardBag'dan sil
        const deadCardBaseIds = this.player1Cards
            .filter(card => card.health <= 0)
            .map(card => card.baseId);
        
        if (deadCardBaseIds.length > 0) {
            console.log('Ölen kartlar:', deadCardBaseIds);
            this.campaignProgress.cardBag = this.campaignProgress.cardBag.filter(
                card => !deadCardBaseIds.includes(card.baseId)
            );
            localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));
            
            // Sunucuya güncelle (eğer bağlıysa)
            if (window.Network && window.Network.updateCampaign) {
                try {
                    console.log('Sunucuya ölen kartlar güncellemesi gönderiliyor');
                    await window.Network.updateCampaign(this.campaignProgress);
                    console.log('Ölen kartlar güncellemesi başarılı');
                } catch (err) {
                    console.log('Ölen kartlar güncelleme hatası:', err);
                }
            }
        }
        
        // Node'u tamamlandı olarak işaretle
        const nodeId = this.currentCampaignNode?.id;
        console.log('Node ID:', nodeId);
        if (nodeId !== undefined) {
            const completedNodes = [...(this.campaignProgress?.completedNodes || []), nodeId];
            const nextNode = window.campaignData?.getNextNode(nodeId);
            const nextNodeId = nextNode ? nextNode.id : nodeId;
            console.log('Sonraki node ID:', nextNodeId);
            
            this.campaignProgress.completedNodes = completedNodes;
            this.campaignProgress.currentNode = nextNodeId;
            
            // LocalStorage'a kaydet
            localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));
            
            // Sunucuya güncelle (eğer bağlıysa)
            if (window.Network && window.Network.updateCampaign) {
                try {
                    console.log('Sunucuya node tamamlama güncellemesi gönderiliyor:', this.campaignProgress);
                    await window.Network.updateCampaign(this.campaignProgress);
                    console.log('Node tamamlama güncellemesi başarılı');
                    
                    // Sunucudan güncel progress çek ve LocalStorage'ı güncelle
                    try {
                        const serverProgress = await window.Network.fetchCampaign();
                        if (serverProgress) {
                            this.campaignProgress = serverProgress;
                            localStorage.setItem('campaignProgress', JSON.stringify(serverProgress));
                            console.log('Sunucudan güncel progress çekildi ve LocalStorage güncellendi');
                        }
                    } catch (err) {
                        console.log('Sunucudan progress çekme hatası (görmezden gelindi):', err);
                    }
                } catch (err) {
                    console.log('Node tamamlama güncelleme hatası:', err);
                }
            }
        }

        // Altın kazan (normal savaş: 100, boss: 200)
        const goldReward = this.currentCampaignNode?.type === 'boss' ? 200 : 100;
        console.log('Altın ödülü:', goldReward);
        
        if (this.campaignProgress) {
            this.campaignProgress.gold = (this.campaignProgress.gold || 0) + goldReward;
            // LocalStorage'a kaydet
            localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));
            
            // Sunucuya güncelle (eğer bağlıysa)
            if (window.Network && window.Network.updateCampaign) {
                try {
                    console.log('Sunucuya altın güncellemesi gönderiliyor:', this.campaignProgress);
                    await window.Network.updateCampaign(this.campaignProgress);
                    console.log('Altın güncellemesi başarılı');
                    
                    // Sunucudan güncel progress çek ve LocalStorage'ı güncelle
                    try {
                        const serverProgress = await window.Network.fetchCampaign();
                        if (serverProgress) {
                            this.campaignProgress = serverProgress;
                            localStorage.setItem('campaignProgress', JSON.stringify(serverProgress));
                            console.log('Sunucudan güncel progress çekildi ve LocalStorage güncellendi');
                        }
                    } catch (err) {
                        console.log('Sunucudan progress çekme hatası (görmezden gelindi):', err);
                    }
                } catch (err) {
                    console.log('Altın güncelleme hatası:', err);
                }
            }
        }

        this.updateCampaignHUD();
        console.log('Reward ekranı gösteriliyor');
        
        // Oyun ekranını kapat
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) gameContainer.style.display = 'none';
        
        this.showRewardScreen();
    }

    async handleCampaignLoss() {
        // Ölen kartları cardBag'dan sil
        const deadCardBaseIds = this.player1Cards
            .filter(card => card.health <= 0)
            .map(card => card.baseId);
        
        if (deadCardBaseIds.length > 0) {
            console.log('Ölen kartlar:', deadCardBaseIds);
            this.campaignProgress.cardBag = this.campaignProgress.cardBag.filter(
                card => !deadCardBaseIds.includes(card.baseId)
            );
            localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));
        }
        
        // Düşmanların kalan canını topla
        const totalEnemyHealth = this.player2Cards
            .filter(card => card.health > 0)
            .reduce((sum, card) => sum + card.health, 0);

        // Oyuncu canından düş
        const currentHealth = this.campaignProgress?.currentHealth || 300;
        const newHealth = Math.max(0, currentHealth - totalEnemyHealth);

        // DB'ye güncelle
        if (window.Network && window.Network.isAuthenticated()) {
            const updated = await window.Network.saveLoadout(this.campaignProgress?.cardBag || [], {
                currentHealth: newHealth
            });
            if (updated) {
                this.campaignProgress = updated;
            }
        }

        this.updateCampaignHUD();

        if (newHealth <= 0) {
            // Sefer bitti
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage('Canın tükendi! Sefer bitti. Sefer sıfırlanıyor.', 4000);
            }
            // Seferi sıfırla
            await this.resetCampaign();
        } else {
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage(`Kaybettin! ${totalEnemyHealth} hasar aldın. Kalan can: ${newHealth}`, 3000);
            }
            // Sefer merkezine dön
            this.showCampaignHub();
        }
    }

    async addGold(amount) {
        if (!window.Network || !window.Network.isAuthenticated()) return;
        
        const currentGold = this.campaignProgress?.gold || 0;
        const newGold = currentGold + amount;
        
        const updated = await window.Network.saveLoadout(this.campaignProgress?.cardBag || [], {
            gold: newGold
        });
        if (updated) {
            this.campaignProgress = updated;
        }
        
        this.updateCampaignHUD();
    }

    async resetCampaign() {
        if (!window.Network || !window.Network.isAuthenticated()) return;
        
        // Seferi sıfırla - currentNode: 0, currentHealth: 300, gold: 0, cardBag: starterDeck
        const starterDeck = window.campaignData?.starterDeck || [2, 11, 6, 4];
        const newCardBag = starterDeck.map(id => ({ baseId: id, defaultLevel: 1 }));
        
        const updated = await window.Network.saveLoadout(newCardBag, {
            currentNode: 0,
            currentHealth: 300,
            gold: 0,
            completedNodes: []
        });
        if (updated) {
            this.campaignProgress = updated;
        }
        
        // LocalStorage'ı da güncelle
        localStorage.removeItem('campaignProgress');
        
        this.updateCampaignHUD();
        this.showCampaignHub();
    }

    showRewardScreen() {
        console.log('showRewardScreen çağrıldı');
        
        // Önce oyun ekranını kapat
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) gameContainer.style.display = 'none';
        
        if (typeof UI !== 'undefined' && UI.showScreen) {
            UI.showScreen('campaign-reward-screen');
        }

        const rewardList = document.getElementById('campaign-reward-list');
        if (!rewardList) {
            console.error('campaign-reward-list elementi bulunamadı!');
            return;
        }

        // 5 rastgele kart seç (ID 1-16 arası oyuncuya özel kartlar)
        const rewardCards = this.getRandomRewardCards(5);
        console.log('Reward kartları:', rewardCards);
        
        if (!rewardCards || rewardCards.length === 0) {
            console.error('Reward kartları boş geldi!');
            rewardList.innerHTML = '<p>Reward kartları yüklenemedi. Sefer merkezine dönülüyor...</p>';
            setTimeout(() => this.showCampaignHub(), 2000);
            return;
        }
        
        this.campaignRewardSelection = []; // Seçilen kartları takip et
        this.currentRewardCards = rewardCards; // Reward kartlarını sakla
        
        rewardList.innerHTML = `
            <div class="reward-cards-container">
                ${rewardCards.map(card => {
                    const cardData = window.cardsData?.find(c => c.id === card.baseId);
                    if (!cardData) {
                        console.error('CardData bulunamadı, baseId:', card.baseId);
                        return '';
                    }
                    const cardObj = new Card(cardData);
                    cardObj.baseId = cardData.id;
                    cardObj.level = card.level || 1;
                    cardObj.updateLevelStats(cardObj.level);
                    const cardElement = cardObj.createCardElement();
                    return `
                        <div class="reward-card" data-card-id="${card.baseId}">
                            ${cardElement.outerHTML}
                            <button class="campaign-action-btn select-reward-btn" data-card-id="${card.baseId}">Seç</button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div id="reward-selection-info" style="margin-top: 15px; font-weight: bold; color: #4CAF50;">
                Seçilen: 0/2
            </div>
            <button id="confirm-reward-btn" class="campaign-action-btn" style="margin-top: 15px; display: none;">Onayla</button>
            <button id="skip-reward-btn" class="campaign-action-btn campaign-action-btn--secondary" style="margin-top: 15px;">Geç (+10 Altın)</button>
        `;

        // Kart seçim event'leri
        rewardList.querySelectorAll('.select-reward-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cardId = parseInt(btn.dataset.cardId);
                this.toggleRewardSelection(cardId, btn);
            });
        });

        // Onayla butonu
        const confirmBtn = document.getElementById('confirm-reward-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmRewardSelection();
            });
        }

        // Skip butonu
        const skipBtn = document.getElementById('skip-reward-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.skipReward();
            });
        }
    }
    
    toggleRewardSelection(cardId, btn) {
        const index = this.campaignRewardSelection.indexOf(cardId);
        
        if (index >= 0) {
            // Zaten seçili, kaldır
            this.campaignRewardSelection.splice(index, 1);
            btn.textContent = 'Seç';
            btn.style.backgroundColor = '';
        } else {
            // Seçili değil, ekle (max 2)
            if (this.campaignRewardSelection.length >= 2) {
                if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                    UI.showInfoMessage('En fazla 2 kart seçebilirsin!', 2000);
                }
                return;
            }
            this.campaignRewardSelection.push(cardId);
            btn.textContent = 'Seçildi ✓';
            btn.style.backgroundColor = '#4CAF50';
        }
        
        // Seçim bilgisini güncelle
        const infoDiv = document.getElementById('reward-selection-info');
        if (infoDiv) {
            infoDiv.textContent = `Seçilen: ${this.campaignRewardSelection.length}/2`;
        }
        
        // Onayla butonunu göster/gizle
        const confirmBtn = document.getElementById('confirm-reward-btn');
        if (confirmBtn) {
            confirmBtn.style.display = this.campaignRewardSelection.length === 2 ? 'block' : 'none';
        }
    }
    
    async confirmRewardSelection() {
        // Seçilen kartları çantaya ekle
        for (const cardId of this.campaignRewardSelection) {
            const rewardCard = this.currentRewardCards?.find(c => c.baseId === cardId);
            const level = rewardCard ? rewardCard.level : 1;
            await this.addToCardBag(cardId, level);
        }
        
        this.campaignRewardSelection = [];
        this.currentRewardCards = [];
        
        // Reward ekranını kapat
        const rewardScreen = document.getElementById('campaign-reward-screen');
        if (rewardScreen) rewardScreen.style.display = 'none';
        
        // Sefer merkezine dön (tek seferlik)
        this.showCampaignHub();
    }

    getRandomRewardCards(count) {
        const allCards = window.cardsData || [];
        
        // ID 1-16 arası oyuncuya özel kartlar
        const playerCards = allCards.filter(card => card.id >= 1 && card.id <= 16);
        
        const ownedCardIds = new Set((this.campaignProgress?.cardBag || []).map(c => c.baseId));
        
        console.log('getRandomRewardCards - playerCards:', playerCards.length, 'ownedCardIds:', ownedCardIds);
        
        const availableCards = playerCards.filter(card => !ownedCardIds.has(card.id));
        console.log('getRandomRewardCards - availableCards:', availableCards.length);
        
        if (availableCards.length === 0) {
            console.error('getRandomRewardCards - availableCards boş! Tüm kartlar zaten sahip olunmuş.');
            return [];
        }
        
        // Karıştır ve rastgele seç
        const shuffled = availableCards.sort(() => Math.random() - 0.5);
        const result = shuffled.slice(0, count);
        
        // Rastgele level atama (düşük olasılıkla yüksek level) ve baseId ekle
        result.forEach(card => {
            card.baseId = card.id; // baseId'yi ekle
            const rand = Math.random();
            if (rand < 0.1) {
                card.level = 3; // %10 şansla level 3
            } else if (rand < 0.3) {
                card.level = 2; // %20 şansla level 2
            } else {
                card.level = 1; // %70 şansla level 1
            }
        });
        
        console.log('getRandomRewardCards - result:', result.map(c => `${c.name} Lv ${c.level} (baseId: ${c.baseId})`));
        return result;
    }

    async addToCardBag(cardId, level = 1) {
        // Çanta sınırı kontrolü (maksimum 15)
        const currentBagSize = (this.campaignProgress?.cardBag || []).length;
        if (currentBagSize >= 15) {
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage('Çanta dolu! Maksimum 15 kart tutabilirsin.', 2000);
            }
            return;
        }

        const newCard = { baseId: cardId, defaultLevel: level };
        const updatedCardBag = [...(this.campaignProgress?.cardBag || []), newCard];
        
        // LocalStorage'a kaydet
        this.campaignProgress.cardBag = updatedCardBag;
        localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));

        // Sunucuya güncelle (eğer bağlıysa)
        if (window.Network && window.Network.isAuthenticated()) {
            const updated = await window.Network.saveLoadout(updatedCardBag);
            if (updated) {
                this.campaignProgress = updated;
            }
        }

        if (typeof UI !== 'undefined' && UI.showInfoMessage) {
            UI.showInfoMessage('Kart çantana eklendi!', 2000);
        }
    }

    async skipReward() {
        // Reward ekranını kapat
        const rewardScreen = document.getElementById('campaign-reward-screen');
        if (rewardScreen) rewardScreen.style.display = 'none';
        
        // Az altın ver (10 gold)
        await this.addGold(10);

        if (typeof UI !== 'undefined' && UI.showInfoMessage) {
            UI.showInfoMessage('Geçtin. +10 Altın kazandın.', 2000);
        }

        // Sefer merkezine dön (tek seferlik)
        this.showCampaignHub();
    }

    showCampfireScreen() {
        if (typeof UI !== 'undefined' && UI.showScreen) {
            UI.showScreen('campaign-campfire-screen');
        }

        // Can ve altın değerlerini göster
        const currentHealthEl = document.getElementById('campfire-current-health');
        const goldEl = document.getElementById('campfire-gold');

        if (currentHealthEl) {
            currentHealthEl.textContent = this.campaignProgress?.currentHealth || 300;
        }

        if (goldEl) {
            goldEl.textContent = this.campaignProgress?.gold || 0;
        }

        // Can yenileme butonları
        const heal50Btn = document.getElementById('heal-50-btn');
        const heal100Btn = document.getElementById('heal-100-btn');
        const healFullBtn = document.getElementById('heal-full-btn');
        const backBtn = document.getElementById('campfire-back-btn');

        if (heal50Btn) {
            heal50Btn.addEventListener('click', () => this.healAtCampfire(50, 10));
        }

        if (heal100Btn) {
            heal100Btn.addEventListener('click', () => this.healAtCampfire(100, 20));
        }

        if (healFullBtn) {
            healFullBtn.addEventListener('click', () => this.healAtCampfire(300, 50));
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Node'u tamamlandı olarak işaretle
                this.completeCampfireNode();
            });
        }
    }

    async healAtCampfire(healAmount, cost) {
        const currentGold = this.campaignProgress?.gold || 0;
        const currentHealth = this.campaignProgress?.currentHealth || 300;

        if (currentGold < cost) {
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage('Yeterli altın yok!', 2000);
            }
            return;
        }

        if (currentHealth >= 300) {
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage('Zaten tam candasın!', 2000);
            }
            return;
        }

        // Altın düş
        const newGold = currentGold - cost;
        // Can artır (max 300)
        const newHealth = Math.min(300, currentHealth + healAmount);

        // DB'ye güncelle
        if (window.Network && window.Network.isAuthenticated()) {
            const updated = await window.Network.saveLoadout(this.campaignProgress?.cardBag || [], {
                gold: newGold,
                currentHealth: newHealth
            });
            if (updated) {
                this.campaignProgress = updated;
            }
        }

        // UI güncelle
        const currentHealthEl = document.getElementById('campfire-current-health');
        const goldEl = document.getElementById('campfire-gold');

        if (currentHealthEl) {
            currentHealthEl.textContent = newHealth;
        }

        if (goldEl) {
            goldEl.textContent = newGold;
        }

        this.updateCampaignHUD();

        if (typeof UI !== 'undefined' && UI.showInfoMessage) {
            UI.showInfoMessage(`${healAmount} can yenilendi! -${cost} Altın`, 2000);
        }
    }

    async completeCampfireNode() {
        const nodeId = this.currentCampaignNode?.id;
        if (nodeId !== undefined) {
            const completedNodes = [...(this.campaignProgress?.completedNodes || []), nodeId];
            const nextNode = window.campaignData?.getNextNode(nodeId);
            const nextNodeId = nextNode ? nextNode.id : nodeId;

            if (window.Network && window.Network.isAuthenticated()) {
                const updated = await window.Network.saveLoadout(this.campaignProgress?.cardBag || [], {
                    completedNodes,
                    currentNode: nextNodeId
                });
                if (updated) {
                    this.campaignProgress = updated;
                }
            }
        }

        this.showCampaignHub();
    }

    showMarketScreen() {
        if (typeof UI !== 'undefined' && UI.showScreen) {
            UI.showScreen('campaign-market-screen');
        }

        const marketList = document.getElementById('market-card-list');
        if (!marketList) return;

        // 4 rastgele kart göster (node'a göre tier ve level)
        const marketCards = this.getMarketCards(4);
        this.currentMarketCards = marketCards; // Mevcut market kartlarını sakla

        marketList.innerHTML = `
            <div class="market-cards-container">
                ${marketCards.map(card => {
                    const cardData = window.cardsData?.find(c => c.id === card.baseId);
                    if (!cardData) return '';
                    const cardObj = new Card(cardData);
                    cardObj.baseId = cardData.id;
                    cardObj.level = card.level || 1;
                    cardObj.updateLevelStats(cardObj.level);
                    const cardElement = cardObj.createCardElement();
                    
                    const price = this.getCardPrice(card.level);
                    
                    return `
                        <div class="market-card" data-card-id="${card.baseId}">
                            ${cardElement.outerHTML}
                            <p style="margin-top: 10px; font-weight: bold; color: #FFC107;">${price} Altın</p>
                            <button class="campaign-action-btn buy-card-btn" data-card-id="${card.baseId}">Satın Al</button>
                        </div>
                    `;
                }).join('')}
            </div>
            <div id="market-gold-display" style="margin-top: 15px; font-weight: bold; color: #FFC107;">
                Altın: ${this.campaignProgress?.gold || 0}
            </div>
        `;

        // Satın alma butonları
        marketList.querySelectorAll('.buy-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cardId = parseInt(btn.dataset.cardId);
                this.buyCard(cardId, btn);
            });
        });

        // Geri butonu
        const backBtn = document.getElementById('market-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.completeMarketNode();
            });
        }
    }

    getMarketCards(count) {
        const nodeId = this.currentCampaignNode?.id || 0;
        const allCards = window.cardsData || [];
        
        // ID 1-16 arası oyuncuya özel kartlar
        const playerCards = allCards.filter(card => card.id >= 1 && card.id <= 16);
        
        // Level çıkma olasılıkları (node'a göre artan)
        const getLevel = () => {
            const rand = Math.random();
            if (nodeId <= 12) {
                // İlk marketler: %70 Lv1, %20 Lv2, %10 Lv3
                if (rand < 0.7) return 1;
                if (rand < 0.9) return 2;
                return 3;
            } else if (nodeId <= 19) {
                // Orta marketler: %50 Lv1, %30 Lv2, %15 Lv3, %5 Lv4
                if (rand < 0.5) return 1;
                if (rand < 0.8) return 2;
                if (rand < 0.95) return 3;
                return 4;
            } else {
                // Son marketler: %30 Lv1, %30 Lv2, %20 Lv3, %15 Lv4, %5 Lv5
                if (rand < 0.3) return 1;
                if (rand < 0.6) return 2;
                if (rand < 0.8) return 3;
                if (rand < 0.95) return 4;
                return 5;
            }
        };
        
        // Karıştır ve seç
        const shuffled = playerCards.sort(() => Math.random() - 0.5);
        const result = shuffled.slice(0, count);
        
        // Level atama
        result.forEach(card => {
            card.level = getLevel();
        });
        
        return result;
    }

    getCardPrice(level) {
        const prices = { 1: 50, 2: 60, 3: 70, 4: 80, 5: 100 };
        return prices[level] || 50;
    }

    async buyCard(cardId, btn) {
        const marketCard = this.currentMarketCards?.find(c => c.baseId === cardId);
        if (!marketCard) return;
        
        const price = this.getCardPrice(marketCard.level);
        const currentGold = this.campaignProgress?.gold || 0;
        
        if (currentGold < price) {
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage('Yeterli altın yok!', 2000);
            }
            return;
        }
        
        // Çanta sınırı kontrolü
        const currentBagSize = (this.campaignProgress?.cardBag || []).length;
        if (currentBagSize >= 15) {
            if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                UI.showInfoMessage('Çanta dolu! Maksimum 15 kart tutabilirsin.', 2000);
            }
            return;
        }
        
        // Altını düş
        this.campaignProgress.gold = currentGold - price;
        
        // Kartı çantaya ekle
        await this.addToCardBag(cardId, marketCard.level);
        
        // Butonu devre dışı bırak
        btn.disabled = true;
        btn.textContent = 'Satın Alındı ✓';
        btn.style.backgroundColor = '#4CAF50';
        
        // Altın göstergesini güncelle
        const goldDisplay = document.getElementById('market-gold-display');
        if (goldDisplay) {
            goldDisplay.textContent = `Altın: ${this.campaignProgress.gold}`;
        }
    }

    async completeMarketNode() {
        const nodeId = this.currentCampaignNode?.id;
        if (nodeId !== undefined) {
            const completedNodes = [...(this.campaignProgress?.completedNodes || []), nodeId];
            const nextNode = window.campaignData?.getNextNode(nodeId);
            const nextNodeId = nextNode ? nextNode.id : nodeId;

            if (window.Network && window.Network.isAuthenticated()) {
                const updated = await window.Network.saveLoadout(this.campaignProgress?.cardBag || [], {
                    completedNodes,
                    currentNode: nextNodeId
                });
                if (updated) {
                    this.campaignProgress = updated;
                }
            }
        }

        this.showCampaignHub();
    }

    showWorkshopScreen() {
        if (typeof UI !== 'undefined' && UI.showScreen) {
            UI.showScreen('campaign-workshop-screen');
        }

        const workshopList = document.getElementById('workshop-card-list');
        if (!workshopList) return;

        // Çantadaki kartları göster
        const cardBag = this.campaignProgress?.cardBag || [];

        workshopList.innerHTML = cardBag.length ? `
            <div class="workshop-cards-container">
                ${cardBag.map(card => {
                    const cardData = window.cardsData?.find(c => c.id === card.baseId);
                    return `
                        <div class="workshop-card">
                            <h3>${cardData?.name || 'Kart ' + card.baseId}</h3>
                            <p>Level: ${card.defaultLevel || 1}</p>
                            <button class="campaign-action-btn upgrade-card-btn" data-card-id="${card.baseId}">Yükselt (30 Altın)</button>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : '<p>Çantanızda kart yok.</p>';

        // Yükseltme butonları (iskelet)
        workshopList.querySelectorAll('.upgrade-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof UI !== 'undefined' && UI.showInfoMessage) {
                    UI.showInfoMessage('Atölye özelliği yakında eklenecek.', 2000);
                }
            });
        });

        // Geri butonu
        const backBtn = document.getElementById('workshop-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.completeWorkshopNode();
            });
        }
    }

    async completeWorkshopNode() {
        const nodeId = this.currentCampaignNode?.id;
        if (nodeId !== undefined) {
            const completedNodes = [...(this.campaignProgress?.completedNodes || []), nodeId];
            const nextNode = window.campaignData?.getNextNode(nodeId);
            const nextNodeId = nextNode ? nextNode.id : nodeId;

            if (window.Network && window.Network.isAuthenticated()) {
                const updated = await window.Network.saveLoadout(this.campaignProgress?.cardBag || [], {
                    completedNodes,
                    currentNode: nextNodeId
                });
                if (updated) {
                    this.campaignProgress = updated;
                }
            }
        }

        this.showCampaignHub();
    }

    askForNewGame() {
        if (this.gameMode === 'online_pvp' && window.Network) {
            Network.disconnect();
        }
        this.seededRandom = null;
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
        this.aiFocusTarget = null;
        this.gameEnded = false;
        this.seededRandom = null;
        this.executingOpponentAction = false;
        this.onlineRoomId = null;
        this.onlineRole = null;
        this.onlineOpponentName = null;
        
        const logContent = document.getElementById('battle-log-content');
        if (logContent) logContent.innerHTML = '';
    }

    onCardDeath(card) {
        if (!this.campaignMode || !this.campaignProgress) return;
        
        // Sadece oyuncunun kartları (player1) kalıcı olarak silinir
        if (card.owner === 1) {
            const cardBag = this.campaignProgress.cardBag || [];
            const index = cardBag.findIndex(c => c.baseId === card.baseId);
            
            if (index >= 0) {
                cardBag.splice(index, 1);
                this.addToBattleLog(`${card.name} kalıcı olarak destenden silindi! 💀`);
                
                // LocalStorage'a kaydet
                localStorage.setItem('campaignProgress', JSON.stringify(this.campaignProgress));
                
                // Sunucuya güncelle (eğer bağlıysa)
                if (window.Network && window.Network.updateCampaign) {
                    window.Network.updateCampaign(this.campaignProgress);
                }
            }
        }
    }

    determineTurnOrder() {
        const canliKartlar = [...this.player1Cards, ...this.player2Cards].filter(card => card.health > 0);
        if (canliKartlar.length === 0) {
            this.turnOrder = [];
            return;
        }
        
        // Node 0 (Eğitim) için özel mantık: Baş Gardiyan'ı en başa koy
        if (this.currentCampaignNode && this.currentCampaignNode.isTutorial) {
            const headGuardian = canliKartlar.find(c => c.baseId === 17);
            if (headGuardian) {
                const otherCards = canliKartlar.filter(c => c.baseId !== 17);
                this.turnOrder = [headGuardian, ...otherCards.sort((a, b) => b.speed - a.speed)];
                return;
            }
        }
        
        this.turnOrder = canliKartlar.sort((a, b) => b.speed - a.speed);
    }
}