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
        this.currentTurn = 0;     // Şu anki tur sayısı
        this.isGameStarted = false;
        this.isSelectionPhase = true;
        this.selectedCardsCount = 0;
        this.battleLog = [];

        this.gameMode = ''; // 'pvp' veya 'pvc'
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
        console.log("initGame çağrıldı: Oyun başlatılıyor...");
        this.resetGame();

        const container = document.querySelector('.game-container');
        if (container) container.style.display = 'none';
        
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
        }
    }

    setGameMode(mode) {
        console.log(`Oyun modu seçildi: ${mode}`);
        this.gameMode = mode;
        const gameModeScreen = document.getElementById('game-mode-selection');
        if (gameModeScreen) gameModeScreen.style.display = 'none';
        
        this.initCards();
        
        if (mode === 'pvc') {
            if (typeof UI !== 'undefined' && UI.showAiConfigScreen) {
                UI.showAiConfigScreen();
            }
        } else {
            setTimeout(() => {
                this.showCardSelection();
                this.updatePlayerIndicator();
            }, 100);
        }
    }

    confirmAiConfig(aiConfig) {
        this.aiConfig = {
            deckId: aiConfig.deckId,
            levelMode: aiConfig.levelMode,
            flatLevel: aiConfig.flatLevel,
            focusTarget: null
        };
        
        const configScreen = document.getElementById('pvc-config-screen');
        if (configScreen) configScreen.style.display = 'none';
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
        console.log("Bilgisayarın destesi hazırlandı:", this.player2Cards.map(c => `${c.name} (Lv ${c.level})`));
    }

    initCards() {
        console.log("Kartlar hazırlanıyor...");
        this.availableCards = cardsData.map(card => new Card(card, this.cardEffects));
    }

    showCardSelection() {
        const cardSelection = document.getElementById('card-selection');
        if (!cardSelection) return;
        
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
        
        const player1CardsReady = this.player1SelectedCards.length === 4;
        const player2CardsReady = this.gameMode === 'pvc' || this.player2SelectedCards.length === 4;
        
        if (this.gameMode === 'pvp') {
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
        if (playerIndicator) playerIndicator.textContent = `Oyuncu ${this.currentSelectingPlayer}`;
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
        console.log("Oyun başlatılıyor...");
        
        if (this.gameMode === 'pvp') {
            if (this.player1SelectedCards.length !== 4 || this.player2SelectedCards.length !== 4) {
                alert("Her iki oyuncu için de 4 kart seçilmelidir!");
                return;
            }
            this.player1Cards = this.player1SelectedCards.map(card => card.clone());
            this.player2Cards = this.player2SelectedCards.map(card => card.clone());
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
            
            if (this.gameMode === 'pvc' && this.currentPlayerTurn === 2) {
                this.waitingForTarget = false;
                const turnStatus = document.getElementById('turn-status');
                if (turnStatus) {
                    turnStatus.textContent = 'Bilgisayar Düşünüyor... 🤖';
                }
                setTimeout(() => {
                    this.executeAiTurn();
                }, 1200);
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

    // Gelişmiş Çoklu Saldırı Simülasyonlu Karar Motoru
    executeAiTurn() {
        let attacker = this.currentAttackingCard;
        if (!attacker || attacker.health <= 0) return;

        let enemies = this.player1Cards.filter(c => c.health > 0);
        if (enemies.length === 0) return;

        let validTargets = enemies;
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

            let currentTargetArmor = trg.armor;
            let armorCopyBonus = 0;
            if (trg.baseId === 13) {
                armorCopyBonus = trg.levelAbilities && trg.levelAbilities.armorCopyBonus
                    ? trg.levelAbilities.armorCopyBonus[trg.level - 1]
                    : 2;
            }

            for (let i = 0; i < attackCount; i++) {
                let hitDmg = baseDmg;
                if (damageReduction > 0) {
                    hitDmg = Math.floor(hitDmg * (1 - damageReduction / 100));
                }

                // Kalkan Kopyalayıcı ise ilk vuruştan sonra zırh kopyalayacak
                let effectiveArmor = currentTargetArmor;
                if (trg.baseId === 13 && i > 0) {
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
        
        // Modal panelde maç sonu istatistiklerini göster
        if (typeof UI !== 'undefined' && UI.showMatchStats) {
            UI.showMatchStats(this, winner);
        } else {
            setTimeout(() => {
                this.askForNewGame();
            }, 1000);
        }
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
        this.aiFocusTarget = null;
        
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
