// Kullanıcı arayüzü işlevleri
const UI = {
    // Kart seçimi sırasında arayüzü güncelle
    updateCardSelection: (selectedCards) => {
        const selectedCount = document.getElementById('selected-count');
        selectedCount.textContent = selectedCards.length;
        
        const startButton = document.getElementById('start-game-btn');
        startButton.disabled = selectedCards.length !== 4;
    },
    
    // Kart animasyonları
    animateCard: (cardElement, animationType) => {
        cardElement.classList.add(animationType);
        setTimeout(() => {
            cardElement.classList.remove(animationType);
        }, 500);
    },
    
    // Kart seçim ekranını göster/gizle
    toggleCardSelection: (show) => {
        const cardSelection = document.getElementById('card-selection');
        if (cardSelection) {
            cardSelection.style.display = show ? 'flex' : 'none';
            console.log(`Kart seçim ekranı ${show ? 'gösterildi' : 'gizlendi'}`);
        } else {
            console.error("Kart seçim ekranı bulunamadı!");
        }
    },
    
    // Tur göstergesini güncelle
    updateTurnIndicator: (turnNumber) => {
        const turnIndicator = document.getElementById('turn-number');
        turnIndicator.textContent = turnNumber;
    },
    
    // Savaş günlüğünü güncelle
    updateBattleLog: (message) => {
        const battleLog = document.getElementById('battle-log-content');
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        battleLog.appendChild(logEntry);
        
        // Otomatik kaydırma
        battleLog.scrollTop = battleLog.scrollHeight;
    },
    
    // Oyun tahtasını güncelle
    updateGameBoard: (player1Cards, player2Cards) => {
        const player1Container = document.getElementById('player1-cards');
        const player2Container = document.getElementById('player2-cards');
        
        UI.updatePlayerCards(player1Container, player1Cards);
        UI.updatePlayerCards(player2Container, player2Cards);
    },
    
    // Oyuncu kartlarını güncelle
    updatePlayerCards: (container, cards) => {
        cards.forEach(card => {
            UI.updateCard(card);
            if (card.health <= 0 && card.element) {
                card.element.classList.add('dead');
            }
        });
    },

    // Kart elementini günceller (savaş sırasında) - tüm DOM manipülasyonları burada
    updateCard: (card) => {
        if (!card.element) return;

        const stats = card.element.querySelectorAll('.card-stat');
        const healthStat = stats[0]; // İlk stat sağlık
        const attackStat = stats[1]; // İkinci stat saldırı
        const speedStat = stats[2]; // Üçüncü stat hız
        const armorStat = stats[3]; // Dördüncü stat zırh
        
        // Seviye yazısını güncelle
        const levelBadge = card.element.querySelector('.card-level');
        if (levelBadge) {
            levelBadge.textContent = `Lv ${card.level}`;
        }

        // Açıklama metnini güncelle
        const descElement = card.element.querySelector('.card-description');
        if (descElement) {
            descElement.textContent = card.description;
        }

        // Saldırı değerini güncelle
        if (attackStat) {
            attackStat.innerHTML = `⚔️<br>${card.attack}`;
            if (card.attack > card.startingValues?.attack) {
                attackStat.classList.add('buffed');
            } else if (card.attack < card.startingValues?.attack) {
                attackStat.classList.add('debuffed');
            } else {
                attackStat.classList.remove('buffed', 'debuffed');
            }
        }
        
        // Hız değerini güncelle
        if (speedStat) {
            speedStat.innerHTML = `⚡<br>${card.speed}`;
            if (card.speed > card.startingValues?.speed) {
                speedStat.classList.add('buffed');
                speedStat.classList.remove('slowed', 'debuffed');
            } else if (card.speed < card.startingValues?.speed) {
                speedStat.classList.add('slowed');
                speedStat.classList.remove('buffed');
            } else {
                speedStat.classList.remove('buffed', 'slowed', 'debuffed');
            }
        }
        
        // Can değerini güncelle
        if (healthStat) {
            healthStat.innerHTML = `❤️<br>${card.health}`;
            if (card.health > card.maxHealth) {
                healthStat.classList.add('over-healed');
            } else {
                healthStat.classList.remove('over-healed');
            }
        }
        
        // Zırh değerini güncelle
        if (armorStat) {
            armorStat.innerHTML = `🛡️<br>${card.armor}`;
            if (card.armor < card.startingValues?.armor) {
                armorStat.classList.add('debuffed');
            } else if (card.armor > card.startingValues?.armor) {
                armorStat.classList.add('buffed');
                armorStat.classList.remove('debuffed');
            } else {
                armorStat.classList.remove('buffed', 'debuffed');
            }
        }
        
        // Hasar aldığında görsel geri bildirim
        if (card.health < card.maxHealth) {
            const healthPercent = (card.health / card.maxHealth) * 100;
            card.element.style.setProperty('--health-percent', `${healthPercent}%`);
            
            if (healthPercent < 30) {
                card.element.classList.add('critical');
            } else if (healthPercent < 60) {
                card.element.classList.add('damaged');
                card.element.classList.remove('critical');
            } else {
                card.element.classList.remove('damaged', 'critical');
            }
        } else {
            card.element.classList.remove('damaged', 'critical');
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

    removeAnimationClass: (card, className) => {
        if (!card.element) return;
        card.element.classList.remove(className);
    },

    addPermanentClass: (card, className) => {
        if (!card.element) return;
        card.element.classList.add(className);
    },

    removePermanentClass: (card, className) => {
        if (!card.element) return;
        card.element.classList.remove(className);
    },

    setDead: (card) => {
        if (!card.element) return;
        card.element.classList.add('dead');
    },

    setAlive: (card) => {
        if (!card.element) return;
        card.element.classList.remove('dead');
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

    toggleSelected: (card) => {
        if (!card.element) return false;
        return card.element.classList.toggle('selected');
    },

    showGameResult: (winner) => {
        setTimeout(() => {
            alert(`Oyun bitti! ${winner} kazandı!`);
        }, 1000);
    },
    
    showCardInfo: (card) => {
        // İleride tooltip geliştirme alanı
    },
    
    // Seçilen kartları göster ve upgrade kontrolleri ekle
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
            
            // Kontroller kartın hemen yukarısına eklenecek
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
            
            // Birebir orijinal kart nesnesi render ediliyor (desc ve statlar dinamik günceldir)
            const cardElement = card.createCardElement();
            cardElement.classList.add('card-selected-display');
            
            cardWrapper.appendChild(controlsDiv);
            cardWrapper.appendChild(cardElement);
            container.appendChild(cardWrapper);
        });
        
        // Upgrade butonlarına olay dinleyicileri
        container.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const instanceId = parseInt(btn.dataset.instanceId);
                gameState.upgradeCard(instanceId);
            });
        });
        
        // Downgrade butonlarına olay dinleyicileri
        container.querySelectorAll('.downgrade-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const instanceId = parseInt(btn.dataset.instanceId);
                gameState.downgradeCard(instanceId);
            });
        });
    },
    
    // Seçilen kartlar ve puan göstergesini güncelle
    updateSelectedCardsDisplay: function(selectedCards, gameState) {
        // Puan göstergesini güncelle
        const pointsSpan = document.getElementById('available-points');
        if (pointsSpan) {
            pointsSpan.textContent = gameState.getCurrentPlayerUsedPoints();
        }
        
        // Kartları yeniden render et
        UI.displaySelectedCards(selectedCards, gameState);
    },
    
    clearCardSelection: function() {
        const container = document.getElementById('selected-cards-container');
        if (container) {
            container.innerHTML = '';
        }
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

// Ek UI stilleri ve hazırlık adımları
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('mouseover', (event) => {
        if (event.target.closest('.card')) {
            const card = event.target.closest('.card');
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    console.log("Sayfa yüklendi, oyun başlatılıyor...");
    prepareCardElements();
    
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
});

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