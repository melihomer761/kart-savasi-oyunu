// ==========================================================================
// KART SAVAŞI - KULLANICI ARAYÜZÜ MOTORU (UI.JS NİHAİ TAM SÜRÜM)
// ==========================================================================

const UI = {
    showScreen: (screenId) => {
        // Tüm ekranları gizle
        const screens = document.querySelectorAll('.game-mode-screen, .card-selection-screen, .game-container');
        screens.forEach(screen => {
            if (screen.id !== 'game-container') {
                screen.style.display = 'none';
            }
        });
        
        // İstenen ekranı göster
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.style.display = screenId === 'card-selection' ? 'flex' : 'flex';
        }
    },
    
    showWaitingScreen: (message, showRoomCode = false, roomCode = null) => {
        UI.showScreen('waiting-screen');
        
        const waitingMessage = document.getElementById('waiting-message');
        if (waitingMessage) {
            waitingMessage.innerHTML = `<p>${message}</p>`;
        }
        
        const roomCodeDisplay = document.getElementById('room-code-display');
        const roomCodeValue = document.getElementById('room-code-value');
        
        if (showRoomCode && roomCode) {
            if (roomCodeDisplay) roomCodeDisplay.style.display = 'block';
            if (roomCodeValue) roomCodeValue.textContent = roomCode;
        } else {
            if (roomCodeDisplay) roomCodeDisplay.style.display = 'none';
        }
    },
    
    updateCardSelection: (selectedCards) => {
        const selectedCount = document.getElementById('selected-count');
        if (selectedCount) selectedCount.textContent = selectedCards.length;
        
        const startButton = document.getElementById('start-game-btn');
        if (startButton) startButton.disabled = selectedCards.length !== 4;
    },
    
    animateCard: (cardElement, animationType) => {
        cardElement.classList.add(animationType);
        setTimeout(() => {
            cardElement.classList.remove(animationType);
        }, 500);
    },
    
    toggleCardSelection: (show) => {
        const cardSelection = document.getElementById('card-selection');
        if (cardSelection) {
            cardSelection.style.display = show ? 'flex' : 'none';
        }
    },
    
    updateTurnIndicator: (turnNumber) => {
        const turnIndicator = document.getElementById('turn-number');
        if (turnIndicator) turnIndicator.textContent = turnNumber;
    },
    
    updateBattleLog: (message) => {
        const battleLog = document.getElementById('battle-log-content');
        if (battleLog) {
            const logEntry = document.createElement('div');
            logEntry.textContent = message;
            battleLog.appendChild(logEntry);
            battleLog.scrollTop = battleLog.scrollHeight;
        }
    },
    
    updateGameBoard: (player1Cards, player2Cards) => {
        const player1Container = document.getElementById('player1-cards');
        const player2Container = document.getElementById('player2-cards');
        
        UI.updatePlayerCards(player1Container, player1Cards);
        UI.updatePlayerCards(player2Container, player2Cards);
    },
    
    updatePlayerCards: (container, cards) => {
        cards.forEach(card => {
            UI.updateCard(card);
            if (card.health <= 0 && card.element) {
                card.element.classList.add('dead');
            }
        });
    },

    updateCard: (card) => {
        if (!card.element) return;

        const stats = card.element.querySelectorAll('.card-stat');
        const healthStat = stats[0];
        const attackStat = stats[1];
        const speedStat = stats[2];
        const armorStat = stats[3];
        
        const levelBadge = card.element.querySelector('.card-level');
        if (levelBadge) {
            levelBadge.textContent = `Lv ${card.level}`;
        }

        const descElement = card.element.querySelector('.card-description');
        if (descElement) {
            descElement.textContent = card.description;
        }

        const idx = card.level - 1;
        let baseAttack = card.startingValues.attack;
        let baseSpeed = card.startingValues.speed;
        let baseArmor = card.startingValues.armor;

        if (card.levelStats) {
            if (card.levelStats.attack && card.levelStats.attack[idx] !== undefined) baseAttack = card.levelStats.attack[idx];
            if (card.levelStats.speed && card.levelStats.speed[idx] !== undefined) baseSpeed = card.levelStats.speed[idx];
            if (card.levelStats.armor && card.levelStats.armor[idx] !== undefined) baseArmor = card.levelStats.armor[idx];
        }

        if (attackStat) {
            attackStat.innerHTML = `⚔️<br>${card.attack}`;
            if (card.attack > baseAttack) {
                attackStat.className = 'card-stat buffed';
            } else {
                attackStat.className = 'card-stat';
            }
        }
        
        if (speedStat) {
            speedStat.innerHTML = `⚡<br>${card.speed}`;
            if (card.speed > baseSpeed) {
                speedStat.className = 'card-stat buffed';
            } else if (card.speed < baseSpeed) {
                speedStat.className = 'card-stat slowed';
            } else {
                speedStat.className = 'card-stat';
            }
        }
        
        if (healthStat) {
            healthStat.innerHTML = `❤️<br>${card.health}`;
            if (card.health > card.maxHealth) {
                healthStat.className = 'card-stat over-healed';
            } else {
                healthStat.className = 'card-stat';
            }
        }
        
        if (armorStat) {
            armorStat.innerHTML = `🛡️<br>${card.armor}`;
            if (card.armor > baseArmor) {
                armorStat.className = 'card-stat buffed';
            } else if (card.armor < baseArmor) {
                armorStat.className = 'card-stat debuffed';
            } else {
                armorStat.className = 'card-stat';
            }
        }
        
        if (card.health < card.maxHealth) {
            const healthPercent = (card.health / card.maxHealth) * 100;
            if (healthPercent < 30) {
                card.element.classList.add('critical');
            } else {
                card.element.classList.remove('critical');
            }
        } else {
            card.element.classList.remove('critical');
        }
        
        if (card.health <= 0) {
            card.element.classList.add('dead');
        }
    },

    addAnimationClass: (card, className, duration = 500) => {
        if (!card.element) return;
        card.element.classList.add(className);
        setTimeout(() => {
            if (card.element) {
                card.element.classList.remove(className);
            }
        }, duration);
    },

    setDead: (card) => {
        if (!card.element) return;
        card.element.classList.add('dead');
    },

    setPoisoned: (card, isPoisoned) => {
        if (!card.element) return;
        if (isPoisoned) {
            card.element.classList.add('poisoned-effect');
        } else {
            card.element.classList.remove('poisoned-effect');
        }
    },

    setTakingPoisonDamage: (card) => {
        if (!card.element) return;
        card.element.classList.add('taking-poison-damage');
        setTimeout(() => {
            if (card.element) {
                card.element.classList.remove('taking-poison-damage');
            }
        }, 800);
    },

    setHealed: (card) => {
        if (!card.element) return;
        card.element.classList.add('healed');
        setTimeout(() => {
            if (card.element) {
                card.element.classList.remove('healed');
            }
        }, 1000);
    },

    setReflectDamage: (card) => {
        if (!card.element) return;
        card.element.classList.add('reflect-damage');
        setTimeout(() => {
            if (card.element) {
                card.element.classList.remove('reflect-damage');
            }
        }, 600);
    },

    setDamageReduced: (card) => {
        if (!card.element) return;
        card.element.classList.add('damage-reduced');
        setTimeout(() => {
            if (card.element) {
                card.element.classList.remove('damage-reduced');
            }
        }, 500);
    },

    showDamageText: (cardElement, amount, type = 'physical') => {
        if (!cardElement) return;

        const computedStyle = window.getComputedStyle(cardElement);
        if (computedStyle.position === 'static') {
            cardElement.style.position = 'relative';
        }

        const damageText = document.createElement('span');
        damageText.className = `floating-damage-text floating-damage-text--${type}`;
        damageText.textContent = amount;

        cardElement.appendChild(damageText);

        requestAnimationFrame(() => {
            damageText.classList.add('floating-damage-text--animate');
        });

        setTimeout(() => {
            if (damageText.parentNode) {
                damageText.parentNode.removeChild(damageText);
            }
        }, 1200);
    },

    setTargetable: (card, isTargetable) => {
        if (!card.element) return;
        if (isTargetable) {
            card.element.classList.add('targetable');
        } else {
            card.element.classList.remove('targetable');
        }
    },

    setActiveCard: (card, isActive) => {
        if (!card.element) return;
        if (isActive) {
            card.element.classList.add('active-card');
        } else {
            card.element.classList.remove('active-card');
        }
    },

    setAttackBuff: (card, attackValue, isBuffed) => {
        if (!card.element) return;
        const attackStat = card.element.querySelector('.card-stat:nth-child(2)');
        if (attackStat) {
            attackStat.innerHTML = `⚔️<br>${attackValue}`;
            if (isBuffed) {
                attackStat.classList.add('buffed');
            } else {
                attackStat.classList.remove('buffed');
            }
        }
    },

    setSelected: (card, isSelected) => {
        if (!card.element) return;
        if (isSelected) {
            card.element.classList.add('selected');
        } else {
            card.element.classList.remove('selected');
        }
    },

    isSelected: (card) => {
        if (!card.element) return false;
        return card.element.classList.contains('selected');
    },

    // Yeni Özellik: Detaylı Maç Sonu İstatistik Modalı
    showMatchStats: (gameState, winner) => {
        const modalId = 'match-stats-modal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.4s ease;
            overflow-y: auto;
            padding: 20px;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background-color: #fff;
            padding: 25px;
            border-radius: 12px;
            max-width: 750px;
            width: 100%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            text-align: center;
            transform: scale(0.9);
            transition: transform 0.4s ease;
        `;

        const header = document.createElement('h2');
        header.textContent = `🏆 Savaş Bitti: ${winner} Kazandı!`;
        header.style.cssText = "margin-bottom: 20px; color: #4CAF50;";
        content.appendChild(header);

        const subheader = document.createElement('h3');
        subheader.textContent = "Maç Sonu İstatistikleri";
        subheader.style.cssText = "margin-bottom: 15px; color: #333; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px;";
        content.appendChild(subheader);

        const table = document.createElement('table');
        table.style.cssText = "width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; text-align: left;";
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
                <th style="padding: 10px;">Kart</th>
                <th style="padding: 10px; text-align: center;">Sahibi</th>
                <th style="padding: 10px; text-align: center;">Saldırdığı Tur</th>
                <th style="padding: 10px; text-align: center;">Verilen Hasar</th>
                <th style="padding: 10px; text-align: center; color: #d32f2f;">Giden Can</th>
                <th style="padding: 10px; text-align: center;">Engellenen Hasar</th>
                <th style="padding: 10px; text-align: center; color: #388e3c;">Kalan Can</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const allCards = [...gameState.player1Cards, ...gameState.player2Cards];
        
        allCards.forEach(card => {
            const row = document.createElement('tr');
            row.style.cssText = "border-bottom: 1px solid #eee;";
            const isP1 = gameState.player1Cards.includes(card);
            const ownerText = isP1 ? "Oyuncu 1" : (gameState.gameMode === 'pvc' ? "Bilgisayar" : "Oyuncu 2");
            const rowColor = isP1 ? "rgba(33, 150, 243, 0.05)" : "rgba(255, 87, 34, 0.05)";
            row.style.backgroundColor = rowColor;

            const kalanCan = card.health;

            row.innerHTML = `
                <td style="padding: 10px; font-weight: bold;">${card.name} <span style="font-size: 11px; color: #888;">Lv ${card.level}</span></td>
                <td style="padding: 10px; text-align: center;">${ownerText}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold;">${card.battleStats.attacksCount}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1565c0;">${card.battleStats.damageDealt}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #d32f2f;">${card.battleStats.damageTaken}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #757575;">${card.battleStats.damageBlocked}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #388e3c;">${kalanCan}</td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        content.appendChild(table);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = "Yeni Oyun";
        closeBtn.style.cssText = `
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background-color 0.2s;
            width: 100%;
        `;
        closeBtn.addEventListener('click', () => {
            modal.style.opacity = '0';
            content.style.transform = 'scale(0.9)';
            setTimeout(() => {
                modal.remove();
                gameState.askForNewGame();
            }, 400);
        });
        content.appendChild(closeBtn);

        modal.appendChild(content);
        document.body.appendChild(modal);

        setTimeout(() => {
            modal.style.opacity = '1';
            content.style.transform = 'scale(1)';
        }, 50);
    },

    showAiConfigScreen: function() {
        const configScreen = document.getElementById('pvc-config-screen');
        if (!configScreen) return;
        
        configScreen.style.display = 'flex';
        
        const container = document.getElementById('ai-deck-select-container');
        if (container) {
            container.innerHTML = '';
            aiPreMadeDecks.forEach((deck, idx) => {
                const label = document.createElement('label');
                label.className = 'ai-deck-label';
                label.style.cssText = "display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; padding: 6px; border-radius: 4px; transition: background-color 0.2s;";
                
                const checked = idx === 0 ? 'checked' : '';
                label.innerHTML = `
                    <input type="radio" name="ai-deck-select" value="${deck.id}" ${checked}>
                    <span>${deck.name}</span>
                `;
                container.appendChild(label);
            });
        }
    },
    
    displaySelectedCards: function(selectedCards, gameState) {
        const container = document.getElementById('selected-cards-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        selectedCards.forEach(card => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'selected-card-wrapper';
            
            const upgradeCost = gameState.getUpgradeCost(card.level);
            const canUpgrade = gameState.canUpgradeCard(card);
            const canDowngrade = gameState.canDowngradeCard(card);
            
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'card-upgrade-controls';
            
            controlsDiv.innerHTML = `
                <button class="downgrade-btn" data-instance-id="${card.instanceId}" ${!canDowngrade ? 'disabled' : ''}>
                    -
                </button>
                <span class="upgrade-level-label">Level ${card.level}</span>
                <button class="upgrade-btn" data-instance-id="${card.instanceId}" ${!canUpgrade ? 'disabled' : ''}>
                    + (${upgradeCost})
                </button>
            `;
            
            const cardElement = card.createCardElement();
            cardElement.classList.add('card-selected-display');
            
            cardWrapper.appendChild(controlsDiv);
            cardWrapper.appendChild(cardElement);
            container.appendChild(cardWrapper);
        });
        
        container.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const instanceId = parseInt(btn.dataset.instanceId);
                gameState.upgradeCard(instanceId);
            });
        });
        
        container.querySelectorAll('.downgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const instanceId = parseInt(btn.dataset.instanceId);
                gameState.downgradeCard(instanceId);
            });
        });
    },
    
    updateSelectedCardsDisplay: function(selectedCards, gameState) {
        const pointsSpan = document.getElementById('available-points');
        if (pointsSpan) {
            pointsSpan.textContent = gameState.getCurrentPlayerUsedPoints();
        }
        UI.displaySelectedCards(selectedCards, gameState);
    },
    
    showInfoMessage: function(message, duration) {
        const existingMessage = document.querySelector('.info-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = 'info-message';
        messageElement.textContent = message;
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 100);
        
        if (duration) {
            setTimeout(() => {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateY(-20px)';
                setTimeout(() => {
                    messageElement.remove();
                }, 500);
            }, duration);
        }
    }
};

function prepareCardElements() {
    const style = document.createElement('style');
    style.textContent = `
        .card {
            pointer-events: auto !important;
            cursor: pointer !important;
        }
        .card:hover {
            transform: translateY(-5px) !important;
        }
        .card * {
            pointer-events: none;
        }
        .info-message {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            background-color: rgba(33, 150, 243, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s ease;
            font-weight: bold;
            text-align: center;
            max-width: 80%;
        }
        .card.dead {
            opacity: 0.5;
            filter: grayscale(1);
            pointer-events: none;
        }
        .card.critical {
            background-color: #ffcdd2;
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
    `;
    document.head.appendChild(style);
}

function initCollapsibleBattleLog() {
    const logContainer = document.getElementById('battle-log-content');
    const battleLogTitle = document.querySelector('.battle-log h3');
    
    if (!logContainer || !battleLogTitle) return;
    
    const logHeader = document.createElement('div');
    logHeader.className = 'battle-log-header';
    logHeader.style.width = '100%';
    
    const titleText = document.createElement('h3');
    titleText.textContent = 'Savaş Kayıtları ';
    logHeader.appendChild(titleText);
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-log-btn';
    toggleBtn.innerHTML = 'Kapat ▲';
    logHeader.appendChild(toggleBtn);
    
    const parent = battleLogTitle.parentNode;
    parent.insertBefore(logHeader, battleLogTitle);
    battleLogTitle.remove();
    
    const battleLogBox = document.querySelector('.battle-log');
    
    const toggleAction = (e) => {
        if (e) e.stopPropagation();
        const isCollapsed = battleLogBox.classList.toggle('collapsed');
        if (isCollapsed) {
            toggleBtn.innerHTML = 'Aç ▼';
        } else {
            toggleBtn.innerHTML = 'Kapat ▲';
            setTimeout(() => {
                logContainer.scrollTop = logContainer.scrollHeight;
            }, 80);
        }
    };
    
    logHeader.addEventListener('click', toggleAction);
    
    if (window.innerWidth <= 768) {
        battleLogBox.classList.add('collapsed');
        toggleBtn.innerHTML = 'Aç ▼';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    prepareCardElements();
    initCollapsibleBattleLog();
    
    const levelModeRadios = document.querySelectorAll('input[name="ai-level-mode"]');
    const flatLevelSelector = document.getElementById('ai-flat-level-selector');
    
    levelModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'flat') {
                if (flatLevelSelector) {
                    flatLevelSelector.style.opacity = '1';
                    flatLevelSelector.style.pointerEvents = 'auto';
                }
            } else {
                if (flatLevelSelector) {
                    flatLevelSelector.style.opacity = '0.5';
                    flatLevelSelector.style.pointerEvents = 'none';
                }
            }
        });
    });

    const aiLvlButtons = document.querySelectorAll('.ai-lvl-btn');
    aiLvlButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            aiLvlButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    const pvcConfirmBtn = document.getElementById('pvc-confirm-btn');
    if (pvcConfirmBtn) {
        pvcConfirmBtn.addEventListener('click', () => {
            const selectedDeck = document.querySelector('input[name="ai-deck-select"]:checked').value;
            const selectedLevelMode = document.querySelector('input[name="ai-level-mode"]:checked').value;
            const activeLvlBtn = document.querySelector('.ai-lvl-btn.active');
            const flatLevel = activeLvlBtn ? parseInt(activeLvlBtn.dataset.level) : 1;

            const aiConfig = {
                deckId: selectedDeck,
                levelMode: selectedLevelMode,
                flatLevel: flatLevel
            };

            if (window.gameState) {
                window.gameState.confirmAiConfig(aiConfig);
            }
        });
    }

    const gameModeScreen = document.getElementById('game-mode-selection');
    if (gameModeScreen) {
        setTimeout(() => {
            gameModeScreen.style.display = 'flex';
        }, 500);
    }

    setTimeout(() => {
        if (window.gameState) {
            window.gameState.initGame();
            UI.showInfoMessage('Kart Savaşı oyununa hoş geldiniz! Lütfen bir oyun modu seçin.', 3000);
        }
    }, 1000);
    
// Online Lobi Event Handler'ları - DÜZELTİLMİŞ SÜRÜM
    const onlinePvpBtn = document.getElementById('online-pvp-btn');
    if (onlinePvpBtn) {
        onlinePvpBtn.addEventListener('click', () => {
            if (window.gameState) {
                window.gameState.setGameMode('online_pvp');
            }
        });
    }
    
    const backToModeBtn = document.getElementById('back-to-mode-btn');
    if (backToModeBtn) {
        backToModeBtn.addEventListener('click', () => {
            if (window.Network) {
                window.Network.disconnect();
            }
            UI.showScreen('game-mode-selection');
        });
    }
    
    const authProfile = document.getElementById('auth-profile');
    const authForm = document.getElementById('auth-form');
    const profileUsername = document.getElementById('profile-username');
    const profileRating = document.getElementById('profile-rating');
    const profileGames = document.getElementById('profile-games');
    const authErrorMessage = document.getElementById('auth-error-message');
    const authUsernameInput = document.getElementById('auth-username-input');
    const authPasswordInput = document.getElementById('auth-password-input');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');

    function showAuthError(message) {
        if (!authErrorMessage) return;
        authErrorMessage.textContent = message;
        authErrorMessage.style.display = 'block';
    }

    function clearAuthError() {
        if (!authErrorMessage) return;
        authErrorMessage.textContent = '';
        authErrorMessage.style.display = 'none';
    }

    function updateAuthUI() {
        const authenticated = window.Network && window.Network.isAuthenticated();
        if (authenticated && window.Network.profile) {
            if (authProfile) authProfile.style.display = 'block';
            if (authForm) authForm.style.display = 'none';
            if (profileUsername) profileUsername.textContent = window.Network.profile.username || '';
            if (profileRating) profileRating.textContent = window.Network.profile.rating || '0';
            if (profileGames) profileGames.textContent = window.Network.profile.gamesPlayed || '0';
        } else {
            if (authProfile) authProfile.style.display = 'none';
            if (authForm) authForm.style.display = 'block';
        }
    }

    if (window.Network) {
        window.Network.loadAuthFromStorage();
        updateAuthUI();
        if (window.Network.isAuthenticated()) {
            window.Network.connect();
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            clearAuthError();
            const username = authUsernameInput?.value.trim();
            const password = authPasswordInput?.value;
            if (!username || !password) {
                showAuthError('Kullanıcı adı ve şifre girin.');
                return;
            }
            try {
                await window.Network.login(username, password);
                updateAuthUI();
                window.Network.connect();
                UI.showInfoMessage('Giriş başarılı. Çevrimiçi modu kullanabilirsiniz.', 2500);
            } catch (error) {
                showAuthError(error.message);
            }
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            clearAuthError();
            const username = authUsernameInput?.value.trim();
            const password = authPasswordInput?.value;
            if (!username || !password) {
                showAuthError('Kullanıcı adı ve şifre girin.');
                return;
            }
            try {
                await window.Network.register(username, password);
                updateAuthUI();
                window.Network.connect();
                UI.showInfoMessage('Kayıt başarılı. Çevrimiçi modu kullanabilirsiniz.', 2500);
            } catch (error) {
                showAuthError(error.message);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.Network) {
                window.Network.clearAuth();
            }
            updateAuthUI();
            UI.showInfoMessage('Çıkış yapıldı.', 2000);
        });
    }

    const joinQueueBtn = document.getElementById('join-queue-btn');
    if (joinQueueBtn) {
        joinQueueBtn.addEventListener('click', () => {
            if (!window.Network || !window.Network.isAuthenticated()) {
                UI.showInfoMessage('Önce giriş yapmanız gerekiyor.', 2500);
                return;
            }
            if (!window.Network.isConnected()) {
                UI.showInfoMessage('Sunucuya bağlanılıyor, lütfen bekleyin...', 2500);
                window.Network.connect();
                return;
            }
            window.Network.joinQueue();
            UI.showWaitingScreen('Rastgele eşleşmeye katıldınız. Rakip bekleniyor...', false);
        });
    }

    const createRoomBtn = document.getElementById('create-room-btn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', () => {
            if (!window.Network || !window.Network.isAuthenticated()) {
                UI.showInfoMessage('Önce giriş yapmanız gerekiyor.', 2500);
                return;
            }
            if (!window.Network.isConnected()) {
                UI.showInfoMessage('Sunucuya bağlanılıyor, lütfen bekleyin...', 2500);
                window.Network.connect();
                return;
            }
            window.Network.createPrivateRoom();
        });
    }

    const joinRoomBtn = document.getElementById('join-room-btn');
    if (joinRoomBtn) {
        joinRoomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();
            if (!window.Network || !window.Network.isAuthenticated()) {
                UI.showInfoMessage('Önce giriş yapmanız gerekiyor.', 2500);
                return;
            }
            if (!roomCode || roomCode.length !== 4) {
                UI.showInfoMessage('Lütfen geçerli bir 4 haneli oda kodu girin.', 2000);
                return;
            }
            if (!window.Network.isConnected()) {
                UI.showInfoMessage('Sunucuya bağlanılıyor, lütfen bekleyin...', 2500);
                window.Network.connect();
                return;
            }
            window.Network.joinPrivateRoom(roomCode);
        });
    }
    
    const cancelWaitingBtn = document.getElementById('cancel-waiting-btn');
    if (cancelWaitingBtn) {
        cancelWaitingBtn.addEventListener('click', () => {
            if (window.Network) {
                window.Network.disconnect();
            }
            UI.showScreen('online-lobby-screen');
        });
    }
    
    const copyRoomCodeBtn = document.getElementById('copy-room-code-btn');
    if (copyRoomCodeBtn) {
        copyRoomCodeBtn.addEventListener('click', () => {
            const roomCode = document.getElementById('room-code-value').textContent;
            navigator.clipboard.writeText(roomCode).then(() => {
                UI.showInfoMessage('Oda kodu kopyalandı!', 1500);
            }).catch(() => {
                UI.showInfoMessage('Kopyalama başarısız.', 1500);
            });
        });
    }
});