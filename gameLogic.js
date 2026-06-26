const cardEffects = {
    // Ateş Savaşçısı - Yanık hasarı
    1: {
        onAttack: (attacker, target, gameState) => {
            try {
                // Hedefin yanındaki kartları bul
                const isPlayer1 = gameState.player1Cards.some(card => card.instanceId === target.instanceId);
                const allCards = isPlayer1 ? gameState.player1Cards : gameState.player2Cards;

                // Hedefin dizideki indeksini bul
                const targetIndex = allCards.findIndex(card => card.instanceId === target.instanceId);

                // Yan kartları bul (sağdaki ve soldaki)
                const adjacentCards = [];

                // Soldaki kart
                if (targetIndex > 0) {
                    adjacentCards.push(allCards[targetIndex - 1]);
                }

                // Sağdaki kart
                if (targetIndex < allCards.length - 1) {
                    adjacentCards.push(allCards[targetIndex + 1]);
                }

                // Yan kartlara splash hasarı ver
                if (adjacentCards.length > 0) {
                    // Level bazlı splash damage
                    const splashDamage = attacker.levelAbilities && attacker.levelAbilities.splashDamage 
                        ? attacker.levelAbilities.splashDamage[attacker.level - 1] 
                        : 11;

                    // Alev patlaması asenkron süresince sırayı beklet
                    gameState.waitingForAnimation = true;

                    // Gecikmeden sonra yan hasarı uygula
                    setTimeout(() => {
                        // Alev animasyonu ekle
                        adjacentCards.forEach(card => {
                            if (card.health > 0 && typeof UI !== 'undefined' && UI.addAnimationClass) {
                                UI.addAnimationClass(card, 'fire-effect', 1000);
                            }
                        });

                        let splashMessage = `${attacker.name} alev patlaması ile `;
                        let hitAny = false;

                        // Her yan karta hasarı uygula
                        adjacentCards.forEach((card, index) => {
                            if (card.health > 0) {
                                hitAny = true;
                                const { isDead: cardIsDead } = card.takeDamage(splashDamage, attacker);

                                // Mesaja kart adını ekle
                                splashMessage += `${card.name}${cardIsDead ? ' (öldü)' : ''}`;

                                // Son kart değilse virgül ekle
                                if (index < adjacentCards.length - 1) {
                                    splashMessage += ' ve ';
                                }

                                // Kart öldüyse bildirim göster
                                if (cardIsDead) {
                                    gameState.addToBattleLog(`${card.name} öldü! ☠️`);
                                    if (typeof UI !== 'undefined' && UI.setDead) {
                                        UI.setDead(card);
                                    }
                                }
                            }
                        });

                        // Splash hasar mesajını ekle
                        if (hitAny) {
                            splashMessage += ` kartlarına ${splashDamage} yan hasar verdi! 🔥`;
                            gameState.addToBattleLog(splashMessage);
                        }

                        // Animasyon kilidini kaldır ve kazananı kontrol et
                        gameState.waitingForAnimation = false;
                        gameState.checkForWinner();

                    }, 600);
                }
            } catch (error) {
                console.error(`Ateş Savaşçısı onAttack hatası:`, error);
                gameState.waitingForAnimation = false;
            }
        },
        onGameStart: (card, gameState) => {
            try {
                if (gameState) {
                    gameState.addToBattleLog(`${card.name} hazır! Yan kartlara splash damage verecek. 🔥`);
                }
            } catch (error) {
                console.error(`Ateş Savaşçısı onGameStart hatası:`, error);
            }
        }
    },
    
    // Buz Büyücüsü - Hız azaltma
    2: {
        onAttack: (attacker, target, gameState) => {
            try {
                setTimeout(() => {
                    // Hedef Büyü Tazısı (baseId 12) ise hız azaltma uygulanmasın
                    if (target.baseId === 12) {
                        if (gameState) gameState.addToBattleLog("Büyü Tazısı buz büyüsünden etkilenmedi! ❄️");
                        return;
                    }
                    // Hedefe hızını yavaşlatma efekti uygula
                    const speedReduction = attacker.levelAbilities && attacker.levelAbilities.speedReduction
                        ? attacker.levelAbilities.speedReduction[attacker.level - 1]
                        : 2;
                    const oldSpeed = target.speed;
                    target.speed = Math.max(1, target.speed - speedReduction); // En az 1 hız bırak
                    target.updateCardElement();
                    
                    if (typeof UI !== 'undefined' && UI.addAnimationClass) {
                        UI.addAnimationClass(target, 'frozen-effect', 1500);
                    }
                    gameState.addToBattleLog(`${attacker.name} ❄️ ${target.name}'i dondurdu! Hızı ${oldSpeed}'den ${target.speed}'e düştü.`);
                    gameState.determineTurnOrder();
                }, 500);
            } catch (error) {
                console.error(`Buz Büyücüsü onAttack hatası:`, error);
            }
        },
        onGameStart: (card, gameState) => {
            try {
                if (gameState) {
                    gameState.addToBattleLog(`${card.name} hazır! Rakipleri dondurarak hızlarını azaltacak. ❄️`);
                }
            } catch (error) {
                console.error(`Buz Büyücüsü onGameStart hatası:`, error);
            }
        }
    },
    
    // Taş Kalkan - Gelen hasarı azaltma
    3: {
        onTakeDamage: (card, damage, attacker, gameState) => {
            try {
                // Level bazlı hasar engelleme
                const reductionPercent = card.levelAbilities && card.levelAbilities.damageReduction
                    ? card.levelAbilities.damageReduction[card.level - 1]
                    : 30;
                const reduction = Math.floor(damage * (reductionPercent / 100));
                const newDamage = damage - reduction;

                // Engellenen hasarı istatistiklere yaz
                if (reduction > 0) {
                    card.battleStats.damageBlocked += reduction;
                }

                if (reduction > 0 && gameState) {
                    gameState.addToBattleLog(`${card.name} kalkanı sayesinde %${reductionPercent} (${reduction}) hasarı engelledi! 🛡️`);
                    if (typeof UI !== 'undefined' && UI.setDamageReduced) {
                        UI.setDamageReduced(card);
                    }
                }

                return newDamage;
            } catch (error) {
                console.error(`Taş Kalkan onTakeDamage hatası:`, error);
                return damage;
            }
        }
    },
    
    // Çevik Hançer - Çoklu vuruş sistemi (Saldırı sayısı sayacı temizlendi)
    4: {
        onAttack: (attacker, target, gameState) => {
            try {
                const attackCount = attacker.levelAbilities && attacker.levelAbilities.attackCount
                    ? attacker.levelAbilities.attackCount[attacker.level - 1]
                    : 3;

                const attackDamage = attacker.attack;
                gameState.waitingForAnimation = true;

                let currentHit = 2; // 1. vuruş performAttack'ta zaten yapıldı

                function nextStrike() {
                    if (target.health <= 0 || attacker.health <= 0 || currentHit > attackCount) {
                        gameState.waitingForAnimation = false;
                        if (target.health <= 0 && typeof UI !== 'undefined' && UI.setDead) {
                            UI.setDead(target);
                        }
                        gameState.checkForWinner();
                        return;
                    }

                    gameState.addToBattleLog(`${attacker.name} ${currentHit}. kez saldırıyor! ⚡`);
                    attacker.attackAnimation();

                    setTimeout(() => {
                        if (attacker.health > 0 && target.health > 0) {
                            const { actualDamage, isDead } = target.takeDamage(attackDamage, attacker);
                            gameState.addToBattleLog(`${attacker.name} ⚔️ ${target.name}'e ${actualDamage} hasar verdi!`);

                            if (isDead) {
                                gameState.addToBattleLog(`${target.name} öldü! ☠️`);
                                if (typeof UI !== 'undefined' && UI.setDead) {
                                    UI.setDead(target);
                                }
                                gameState.waitingForAnimation = false;
                                gameState.checkForWinner();
                                return;
                            }
                        }
                        currentHit++;
                        setTimeout(nextStrike, 350);
                    }, 500);
                }

                setTimeout(nextStrike, 500);

            } catch (error) {
                console.error(`Çevik Hançer onAttack hatası:`, error);
                gameState.waitingForAnimation = false;
            }
        }
    },
    
    // Hayalet - Kaçınma yeteneği
    5: {
        onTakeDamage: (card, damage, attacker, gameState) => {
            try {
                if (!card.effects) card.effects = {};
                if (card.effects.attackCount === undefined) {
                    card.effects.attackCount = 0;
                }

                const dodgeCount = card.levelAbilities && card.levelAbilities.dodgeCount
                    ? card.levelAbilities.dodgeCount[card.level - 1]
                    : 3;
                const dodgeChance = card.levelAbilities && card.levelAbilities.dodgeChance
                    ? card.levelAbilities.dodgeChance[card.level - 1]
                    : 55;

                if (card.effects.attackCount < dodgeCount) {
                    card.effects.attackCount++;

                    const randomChance = Math.random() * 100;
                    if (randomChance < dodgeChance) {
                        gameState.addToBattleLog(`${card.name} saldırıdan kaçındı! 👻 (${card.effects.attackCount}/${dodgeCount} saldırı)`);
                        return 0; // Hasar tamamen sıfırlandı
                    } else {
                        gameState.addToBattleLog(`${card.name} kaçınmaya çalıştı ama başaramadı! (${card.effects.attackCount}/${dodgeCount} saldırı)`);
                    }
                } else if (card.effects.attackCount === dodgeCount) {
                    card.effects.attackCount++;
                    gameState.addToBattleLog(`${card.name} artık kaçınma yeteneğini kaybetti!`);
                }

                return damage;
            } catch (error) {
                console.error(`Hayalet onTakeDamage hatası:`, error);
                return damage;
            }
        },
        onGameStart: (card, gameState) => {
            try {
                if (!card.effects) card.effects = {};
                card.effects.attackCount = 0;
            } catch (error) {
                console.error(`Hayalet onGameStart hatası:`, error);
            }
        }
    },
    
    // Kara Şövalye - Güçlenme
    6: {
        onTurnStart: (card, gameState) => {
            try {
                const attackGrowth = card.levelAbilities && card.levelAbilities.attackGrowth
                    ? card.levelAbilities.attackGrowth[card.level - 1]
                    : 5;

                if (gameState && gameState.currentTurn >= 2 && !card.hasAttackIncreasedThisTurn) {
                    card.attack += attackGrowth;
                    card.hasAttackIncreasedThisTurn = true;
                    gameState.addToBattleLog(`${card.name} güçlendi! +${attackGrowth} saldırı gücü ⚔️`);
                    if (typeof UI !== 'undefined' && UI.setAttackBuff) {
                        UI.setAttackBuff(card, card.attack, true);
                    }
                }
            } catch (error) {
                console.error(`Kara Şövalye onTurnStart hatası:`, error);
            }
        },
        onGameStart: (card, gameState) => {
            try {
                const attackGrowth = card.levelAbilities && card.levelAbilities.attackGrowth
                    ? card.levelAbilities.attackGrowth[card.level - 1]
                    : 5;
                if (gameState) {
                    gameState.addToBattleLog(`${card.name} 2. turdan itibaren her tur güçleniyor! +${attackGrowth} saldırı gücü ⚔️`);
                }
            } catch (error) {
                console.error(`Kara Şövalye onGameStart hatası:`, error);
            }
        }
    },
    
    // Şifacı - Can yenileme
    7: {
        onTurnStart: (card, gameState) => {
            try {
                if (!gameState) return;

                const healAmount = card.levelAbilities && card.levelAbilities.healAmount
                    ? card.levelAbilities.healAmount[card.level - 1]
                    : 7;

                const isPlayer1Card = gameState.player1Cards.includes(card);
                const allies = isPlayer1Card ? gameState.player1Cards : gameState.player2Cards;

                allies.forEach(ally => {
                    if (ally.health > 0) {
                        ally.health += healAmount;
                        ally.updateCardElement();
                        if (typeof UI !== 'undefined' && UI.setHealed) {
                            UI.setHealed(ally);
                        }
                        if (typeof UI !== 'undefined' && UI.showDamageText) {
                            UI.showDamageText(ally.element, healAmount, 'heal');
                        }
                        gameState.addToBattleLog(`${card.name} ${ally.name}'e ${healAmount} can verdi! 💚`);
                    }
                });
            } catch (error) {
                console.error(`Şifacı onTurnStart hatası:`, error);
            }
        },
        onGameStart: (card, gameState) => {
            try {
                const healAmount = card.levelAbilities && card.levelAbilities.healAmount
                    ? card.levelAbilities.healAmount[card.level - 1]
                    : 7;
                if (gameState) {
                    gameState.addToBattleLog(`${card.name} her turda dost kartlara ${healAmount} can verecek! 💚`);
                }
            } catch (error) {
                console.error(`Şifacı onGameStart hatası:`, error);
            }
        }
    },
    
    // Zehirli Ok
    8: {
        onAttack: (attacker, target, gameState) => {
            try {
                const poisonDamage = attacker.levelAbilities && attacker.levelAbilities.poisonDamage
                    ? attacker.levelAbilities.poisonDamage[attacker.level - 1]
                    : 10;
                const poisonArmorReduction = attacker.levelAbilities && attacker.levelAbilities.poisonArmorReduction
                    ? attacker.levelAbilities.poisonArmorReduction[attacker.level - 1]
                    : 2;
                const poisonDuration = attacker.levelAbilities && attacker.levelAbilities.poisonDuration
                    ? attacker.levelAbilities.poisonDuration[attacker.level - 1]
                    : 3;

                if (target.baseId === 12) {
                    gameState.addToBattleLog("Büyü Tazısı zehirli okun zehrinden ve zırh azaltmasından etkilenmedi! 💀");
                    return;
                }

                if (!target.effects) target.effects = {};
                target.effects.poison = {
                    duration: poisonDuration,
                    damage: poisonDamage,
                    armorReduction: poisonArmorReduction,
                    source: attacker.name,
                    sourceId: attacker.instanceId
                };

                if (typeof UI !== 'undefined' && UI.setPoisoned) {
                    UI.setPoisoned(target, true);
                    UI.addAnimationClass(target, 'poisoned', 1000);
                }

                gameState.addToBattleLog(`${target.name} zehirlendi! 💀 (${poisonDuration} tur boyunca her tur ${poisonDamage} hasar, zırh -${poisonArmorReduction})`);
            } catch (error) {
                console.error(`Zehirli Ok onAttack hatası:`, error);
            }
        },
        onGameStart: (card, gameState) => {
            try {
                const poisonDamage = card.levelAbilities && card.levelAbilities.poisonDamage
                    ? card.levelAbilities.poisonDamage[card.level - 1]
                    : 10;
                const poisonArmorReduction = card.levelAbilities && card.levelAbilities.poisonArmorReduction
                    ? card.levelAbilities.poisonArmorReduction[card.level - 1]
                    : 2;
                const poisonDuration = card.levelAbilities && card.levelAbilities.poisonDuration
                    ? card.levelAbilities.poisonDuration[card.level - 1]
                    : 3;
                if (gameState) {
                    gameState.addToBattleLog(`${card.name} hazır! Hedefleri zehirleyecek. 💀 (${poisonDuration} tur, ${poisonDamage} hasar/tur, zırh -${poisonArmorReduction})`);
                }
            } catch (error) {
                console.error(`Zehirli Ok onGameStart hatası:`, error);
            }
        }
    },
    
    // Savaş Borazanı - Saldırı ve Hız Artırma (Mükemmel kümülatif mühür sistemi)
    9: {
        hasLoggedThisTurn: false,
        onGameStart: (card, gameState) => {
            try {
                cardEffects[9].hasLoggedThisTurn = false;
                applyBattleHornEffect(card, gameState, true);
            } catch (error) {
                console.error(`Savaş Borazanı onGameStart hatası:`, error);
            }
        },
        onTurnStart: (card, gameState) => {
            try {
                if (card.health > 0) {
                    cardEffects[9].hasLoggedThisTurn = false;
                    applyBattleHornEffect(card, gameState, false);
                }
            } catch (error) {
                console.error(`Savaş Borazanı onTurnStart hatası:`, error);
            }
        },
        onDeath: (card, gameState) => {
            try {
                if (gameState) {
                    removeBattleHornEffect(card, gameState);
                    gameState.addToBattleLog(`${card.name} öldü! Dost kartların bonusları kaldırıldı. 🎺`);
                }
            } catch (error) {
                console.error(`Savaş Borazanı onDeath hatası:`, error);
            }
        }
    },
    
    // Büyü Tazısı - Sürünün Lideri (Agro/Tank)
    12: {
        onGameStart: (card, gameState) => {
            try {
                if (gameState) {
                    if (!Array.isArray(gameState.activeLeaderIDs)) gameState.activeLeaderIDs = [];
                    if (!gameState.activeLeaderIDs.includes(card.instanceId)) {
                        gameState.activeLeaderIDs.push(card.instanceId);
                    }
                    gameState.addToBattleLog(`${card.name} sürünün lideri oldu! Rakip sadece ona saldırabilir. 🐕`);
                }
            } catch (error) {
                console.error(`Büyü Tazısı onGameStart hatası:`, error);
            }
        },
        onDeath: (card, gameState) => {
            try {
                if (gameState && Array.isArray(gameState.activeLeaderIDs)) {
                    gameState.activeLeaderIDs = gameState.activeLeaderIDs.filter(id => id !== card.instanceId);
                }
                gameState.addToBattleLog(`${card.name} öldü! Liderlik kuralı kalktı. 🐕`);
            } catch (error) {
                console.error(`Büyü Tazısı onDeath hatası:`, error);
            }
        }
    },

    // Kalkan Kopyalayıcı
    13: {
        onTakeDamage: (card, damage, attacker, gameState) => {
            try {
                if (!attacker) return damage;
                const armorCopyBonus = card.levelAbilities && card.levelAbilities.armorCopyBonus
                    ? card.levelAbilities.armorCopyBonus[card.level - 1]
                    : 2;
                if (!card.effects) card.effects = {};
                card.effects.copiedArmor = (attacker.armor || 0) + armorCopyBonus;
                card.armor = card.effects.copiedArmor;
                if (gameState) {
                    gameState.addToBattleLog(`${card.name}, ${attacker.name}'in zırhını (+${armorCopyBonus} ile) kopyaladı! 🛡️`);
                }
                return damage;
            } catch (error) {
                console.error(`Kalkan Kopyalayıcı onTakeDamage hatası:`, error);
                return damage;
            }
        },
        onTurnStart: (card, gameState) => {
            try {
                if (card.effects && card.effects.copiedArmor !== undefined) {
                    card.armor = card.startingValues.armor;
                    delete card.effects.copiedArmor;
                    if (gameState) {
                        gameState.addToBattleLog(`${card.name}'in kopyalanan zırhı sıfırlandı.`);
                    }
                }
            } catch (error) {
                console.error(`Kalkan Kopyalayıcı onTurnStart hatası:`, error);
            }
        },
        onGameStart: (card, gameState) => {
            try {
                if (gameState) {
                    gameState.addToBattleLog(`${card.name} saldırıya uğradığında rakibin zırhını kopyalar! 🛡️`);
                }
            } catch (error) {
                console.error(`Kalkan Kopyalayıcı onGameStart hatası:`, error);
            }
        }
    },

    // Öfke Ayini - Güç Fedaisi
    14: {
        onGameStart: (card, gameState) => {
            try {
                const isPlayer1Card = gameState.player1Cards.includes(card);
                const allies = isPlayer1Card ? gameState.player1Cards : gameState.player2Cards;
                
                const speedDebuff = card.levelAbilities && card.levelAbilities.speedDebuff
                    ? card.levelAbilities.speedDebuff[card.level - 1]
                    : 3;
                const armorDebuff = card.levelAbilities && card.levelAbilities.armorDebuff
                    ? card.levelAbilities.armorDebuff[card.level - 1]
                    : 2;
                const attackBuff = card.levelAbilities && card.levelAbilities.attackBuff
                    ? card.levelAbilities.attackBuff[card.level - 1]
                    : 6;

                allies.forEach(ally => {
                    if (ally !== card && ally.health > 0) {
                        // Stat değişimlerini uygula ve mühürle
                        ally.speed = Math.max(1, ally.speed - speedDebuff);
                        ally.armor = ally.armor - armorDebuff;
                        ally.attack = ally.attack + attackBuff;
                        ally.updateCardElement();
                        if (typeof UI !== 'undefined' && UI.setAttackBuff) {
                            UI.setAttackBuff(ally, ally.attack, true);
                        }
                    }
                });
                gameState.addToBattleLog(`${card.name} Öfke Ayini başlattı! Tüm dostlar hız -${speedDebuff}, zırh -${armorDebuff} kaybetti; ancak saldırı güçleri +${attackBuff} arttı! 🩸`);
            } catch (error) {
                console.error("Öfke Ayini onGameStart hatası:", error);
            }
        }
    },

    // Dikenli Deri - Hasar yansıtma (Zırh Bypasslı)
    15: {
        onTakeDamage: (card, damage, attacker, gameState) => {
            try {
                if (!attacker || attacker.health <= 0) return damage;
                
                const reflectPercentage = card.levelAbilities && card.levelAbilities.reflectPercentage
                    ? card.levelAbilities.reflectPercentage[card.level - 1]
                    : 30;
                
                let actualDamageReceived = damage;
                if (damage <= 0) {
                    actualDamageReceived = 0;
                } else if (typeof card.armor === 'number') {
                    actualDamageReceived = damage - card.armor;
                    if (actualDamageReceived < 0) actualDamageReceived = 0;
                }

                const reflectAmount = Math.floor(actualDamageReceived * (reflectPercentage / 100));
                
                if (reflectAmount > 0) {
                    setTimeout(() => {
                        try {
                            // Yansıtma hasarı attacker zırhını tamamen bypass eder (type: 'reflect')
                            const { actualDamage } = attacker.takeDamage(reflectAmount, card, 'reflect');
                            if (typeof UI !== 'undefined' && UI.setReflectDamage) {
                                UI.setReflectDamage(card);
                            }
                            if (gameState) {
                                gameState.addToBattleLog(`${card.name} yansıyan hasar ile ${attacker.name}'e (zırhı yok sayarak) ${actualDamage} hasar yansıttı! 🦔`);
                                if (attacker.health <= 0) {
                                    gameState.addToBattleLog(`${attacker.name} yansıyan hasardan dolayı öldü! ☠️`);
                                    if (typeof UI !== 'undefined' && UI.setDead) {
                                        UI.setDead(attacker);
                                    }
                                    gameState.checkForWinner();
                                }
                            }
                        } catch (innerError) {
                            console.error(`Dikenli Deri yansıtma hatası:`, innerError);
                        }
                    }, 500);
                }
                return damage;
            } catch (error) {
                console.error(`Dikenli Deri onTakeDamage hatası:`, error);
                return damage;
            }
        }
    },

    // İkili Siper
    16: {
        onTakeDamage: (card, damage, attacker, gameState) => {
            try {
                const armorBonus = card.levelAbilities && card.levelAbilities.armorBonus
                    ? card.levelAbilities.armorBonus[card.level - 1]
                    : 5;

                const isPlayer1 = gameState.player1Cards.includes(card);
                const team = isPlayer1 ? gameState.player1Cards : gameState.player2Cards;
                team.forEach(ally => {
                    if (ally !== card && ally.health > 0) {
                        if (!ally.effects) ally.effects = {};
                        if (typeof ally.effects.dualCoverArmorBonus !== 'number') ally.effects.dualCoverArmorBonus = 0;
                        ally.effects.dualCoverArmorBonus += armorBonus;
                        ally.armor += armorBonus;
                        ally.updateCardElement();
                        gameState.addToBattleLog(`${ally.name} zırhı İkili Siper sayesinde +${armorBonus} arttı! (Toplam: ${ally.effects.dualCoverArmorBonus}) 🛡️`);
                    }
                });
                if (!card.effects) card.effects = {};
                card.effects.dualCoverTriggered = true;
                return damage;
            } catch (error) {
                console.error("İkili Siper onTakeDamage hatası:", error);
                return damage;
            }
        },
        onTurnStart: (card, gameState) => {
            try {
                const isPlayer1 = gameState.player1Cards.includes(card);
                const team = isPlayer1 ? gameState.player1Cards : gameState.player2Cards;
                team.forEach(ally => {
                    if (ally !== card && ally.effects && typeof ally.effects.dualCoverArmorBonus === 'number') {
                        ally.armor = ally.startingValues.armor;
                        if (ally.effects && typeof ally.effects.poisonArmorReduction === 'number') {
                            ally.armor -= ally.effects.poisonArmorReduction;
                        }
                        delete ally.effects.dualCoverArmorBonus;
                        ally.updateCardElement();
                        gameState.addToBattleLog(`${ally.name} üzerindeki İkili Siper zırh bonusu sona erdi.`);
                    }
                });
                if (card.effects && card.effects.dualCoverTriggered) {
                    delete card.effects.dualCoverTriggered;
                }
            } catch (error) {
                console.error("İkili Siper onTurnStart hatası:", error);
            }
        },
        onGameStart: (card, gameState) => {
            try {
                const armorBonus = card.levelAbilities && card.levelAbilities.armorBonus
                    ? card.levelAbilities.armorBonus[card.level - 1]
                    : 5;
                gameState.addToBattleLog(`${card.name} saldırı aldığında yanındaki dostlara +${armorBonus} zırh bonusu verir! 🛡️`);
            } catch (error) {
                console.error("İkili Siper onGameStart hatası:", error);
            }
        }
    },

    // Kan Emici - Çift vuruş ve can emme (Saldırı sayısı sayacı temizlendi)
    10: {
        onAttack: (attacker, target, gameState, attackContext) => {
            try {
                const healPercentage = attacker.levelAbilities && attacker.levelAbilities.healPercentage
                    ? attacker.levelAbilities.healPercentage[attacker.level - 1]
                    : 60;

                const firstHitDamage = attackContext?.firstHitDamage || 0;
                const healAmount1 = Math.floor(firstHitDamage * (healPercentage / 100));
                
                if (healAmount1 > 0) {
                    attacker.health += healAmount1;
                    attacker.updateCardElement();
                    if (typeof UI !== 'undefined' && UI.setHealed) {
                        UI.setHealed(attacker);
                    }
                    if (typeof UI !== 'undefined' && UI.showDamageText) {
                        UI.showDamageText(attacker.element, healAmount1, 'heal');
                    }
                    gameState.addToBattleLog(`${attacker.name} ${healAmount1} can emdi! 💉`);
                }

                if (target.health > 0 && attacker.health > 0) {
                    gameState.waitingForAnimation = true;
                    
                    setTimeout(() => {
                        try {
                            if (attacker.health > 0 && target.health > 0) {
                                attacker.attackAnimation();
                                gameState.addToBattleLog(`${attacker.name} ikinci kez saldırıyor! ⚡`);

                                setTimeout(() => {
                                    try {
                                        if (attacker.health > 0 && target.health > 0) {
                                            const { actualDamage, isDead } = target.takeDamage(attacker.attack, attacker);
                                            gameState.addToBattleLog(`${attacker.name} ⚔️ ${target.name}'e ${actualDamage} hasar verdi!`);
                                            
                                            const healAmount2 = Math.floor(actualDamage * (healPercentage / 100));
                                            if (healAmount2 > 0) {
                                                attacker.health += healAmount2;
                                                attacker.updateCardElement();
                                                if (typeof UI !== 'undefined' && UI.setHealed) {
                                                    UI.setHealed(attacker);
                                                }
                                                if (typeof UI !== 'undefined' && UI.showDamageText) {
                                                    UI.showDamageText(attacker.element, healAmount2, 'heal');
                                                }
                                                gameState.addToBattleLog(`${attacker.name} ${healAmount2} can emdi! 💉`);
                                            }

                                            if (isDead) {
                                                gameState.addToBattleLog(`${target.name} öldü! ☠️`);
                                                if (typeof UI !== 'undefined' && UI.setDead) {
                                                    UI.setDead(target);
                                                }
                                                gameState.checkForWinner();
                                            }
                                        }
                                        gameState.waitingForAnimation = false;
                                    } catch (innerError) {
                                        console.error(`Kan Emici ikinci vuruş hasar hatası:`, innerError);
                                        gameState.waitingForAnimation = false;
                                    }
                                }, 500);
                            } else {
                                gameState.waitingForAnimation = false;
                            }
                        } catch (midError) {
                            console.error(`Kan Emici ara saldırı hatası:`, midError);
                            gameState.waitingForAnimation = false;
                        }
                    }, 500);
                }
            } catch (error) {
                console.error(`Kan Emici hatası:`, error);
                gameState.waitingForAnimation = false;
            }
        },
        onGameStart: (card, gameState) => {
            try {
                const healPercentage = card.levelAbilities && card.levelAbilities.healPercentage
                    ? card.levelAbilities.healPercentage[card.level - 1]
                    : 60;
                if (gameState) {
                    gameState.addToBattleLog(`${card.name} hazır! İki kez vurup can emecek. 💉`);
                }
            } catch (error) {
                console.error(`Kan Emici onGameStart hatası:`, error);
            }
        }
    },

    // İkiz Okçu (Saldırı sayısı sayacı temizlendi)
    11: {
        onAttack: (attacker, target, gameState) => {
            try {
                const doubleTargetChance = attacker.levelAbilities && attacker.levelAbilities.doubleTargetChance
                    ? attacker.levelAbilities.doubleTargetChance[attacker.level - 1]
                    : 60;

                if (Math.random() * 100 < doubleTargetChance) {
                    const isPlayer1Card = gameState.player1Cards.includes(attacker);
                    const enemyCards = isPlayer1Card ? gameState.player2Cards : gameState.player1Cards;
                    const aliveEnemies = enemyCards.filter(c => c.health > 0 && c.instanceId !== target.instanceId);

                    if (aliveEnemies.length > 0) {
                        const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                        gameState.waitingForAnimation = true;

                        setTimeout(() => {
                            try {
                                if (attacker.health > 0 && randomEnemy.health > 0) {
                                    attacker.attackAnimation();
                                    const { actualDamage, isDead: isSecondTargetDead } = randomEnemy.takeDamage(attacker.attack, attacker);
                                    gameState.addToBattleLog(`${attacker.name} 🏹 ikinci bir ok atıyor! ${randomEnemy.name}'e ${actualDamage} hasar verdi!`);
                                    
                                    if (isSecondTargetDead) {
                                        gameState.addToBattleLog(`${randomEnemy.name} öldü! ☠️`);
                                        if (typeof UI !== 'undefined' && UI.setDead) {
                                            UI.setDead(randomEnemy);
                                        }
                                        gameState.checkForWinner();
                                    }
                                }
                                gameState.waitingForAnimation = false;
                            } catch (innerError) {
                                console.error(`İkiz Okçu ikinci hedef hatası:`, innerError);
                                gameState.waitingForAnimation = false;
                            }
                        }, 500);
                    }
                }
            } catch (error) {
                console.error(`İkiz Okçu onAttack hatası:`, error);
                gameState.waitingForAnimation = false;
            }
        },
        onGameStart: (card, gameState) => {
            try {
                const doubleTargetChance = card.levelAbilities && card.levelAbilities.doubleTargetChance
                    ? card.levelAbilities.doubleTargetChance[card.level - 1]
                    : 60;
                if (gameState) {
                    gameState.addToBattleLog(`${card.name} hazır! %${doubleTargetChance} şansla iki hedefi vurabilir. 🏹`);
                }
            } catch (error) {
                console.error(`İkiz Okçu onGameStart hatası:`, error);
            }
        }
    }
};

// Savaş Borazanı efektini kümülatif mühürle uygulayan yardımcı fonksiyon (Orijinal stat bozmayan temiz sistem)
function applyBattleHornEffect(card, gameState, isGameStart = false) {
    try {
        const isPlayer1Card = gameState.player1Cards.includes(card);
        const targetCards = isPlayer1Card ? gameState.player1Cards : gameState.player2Cards;

        const attackBonus = card.levelAbilities && card.levelAbilities.attackBonus
            ? card.levelAbilities.attackBonus[card.level - 1]
            : 3;
        const speedBonus = card.levelAbilities && card.levelAbilities.speedBonus
            ? card.levelAbilities.speedBonus[card.level - 1]
            : 1;

        targetCards.forEach(targetCard => {
            if (targetCard.health > 0 && targetCard.baseId !== 9) {
                if (!targetCard.effects) targetCard.effects = {};
                
                // Önce varsa eski borazan bonuslarını güvenle geri çıkarıyoruz
                if (targetCard.effects.battleHornAttackBonus) {
                    targetCard.attack -= targetCard.effects.battleHornAttackBonus;
                }
                if (targetCard.effects.battleHornSpeedBonus) {
                    targetCard.speed -= targetCard.effects.battleHornSpeedBonus;
                }

                // Şimdi taze bonusları ekliyoruz
                targetCard.attack += attackBonus;
                targetCard.speed += speedBonus;

                // Eklediğimiz miktarları kart efekt kayıtlarına kaydediyoruz
                targetCard.effects.battleHornAttackBonus = attackBonus;
                targetCard.effects.battleHornSpeedBonus = speedBonus;

                if (typeof UI !== 'undefined' && UI.setAttackBuff) {
                    UI.setAttackBuff(targetCard, targetCard.attack, true);
                }
                targetCard.updateCardElement();
            }
        });

        if (!cardEffects[9].hasLoggedThisTurn || isGameStart) {
            cardEffects[9].hasLoggedThisTurn = true;
            gameState.addToBattleLog(`${card.name} dost kartların saldırısını +${attackBonus}, hızını +${speedBonus} arttırıyor! 🎺`);
        }
    } catch (error) {
        console.error(`applyBattleHornEffect hatası:`, error);
    }
}

// Savaş Borazanı efektini güvenli şekilde geri çıkaran yardımcı fonksiyon
function removeBattleHornEffect(card, gameState) {
    const isPlayer1Card = gameState.player1Cards.includes(card);
    const targetCards = isPlayer1Card ? gameState.player1Cards : gameState.player2Cards;
    
    targetCards.forEach(targetCard => {
        if (targetCard.effects) {
            if (targetCard.effects.battleHornAttackBonus) {
                targetCard.attack -= targetCard.effects.battleHornAttackBonus;
                delete targetCard.effects.battleHornAttackBonus;
            }
            if (targetCard.effects.battleHornSpeedBonus) {
                targetCard.speed -= targetCard.effects.battleHornSpeedBonus;
                delete targetCard.effects.battleHornSpeedBonus;
            }
            if (typeof UI !== 'undefined' && UI.setAttackBuff) {
                UI.setAttackBuff(targetCard, targetCard.attack, false);
            }
            targetCard.updateCardElement();
        }
    });
}

// Merkezi zehir işleme fonksiyonu
function processPoisonOnTurnStart(card, gameState) {
    try {
        if (card.baseId === 12) return;

        if (card.effects && card.effects.poison) {
            const poisonEffect = card.effects.poison;

            card.health -= poisonEffect.damage;
            if (card.health < 0) card.health = 0;
            card.updateCardElement();
            gameState.addToBattleLog(`${card.name} zehirden ${poisonEffect.damage} hasar aldı! 💀 (${poisonEffect.source} tarafından)`);

            if (typeof UI !== 'undefined' && UI.showDamageText) {
                UI.showDamageText(card.element, poisonEffect.damage, 'poison');
            }

            if (typeof UI !== 'undefined' && UI.setTakingPoisonDamage) {
                UI.setTakingPoisonDamage(card);
            }

            // Dikenli Deri zehir yansıtma
            if (poisonEffect.sourceId) {
                const isPlayer1Card = gameState.player1Cards.includes(card);
                const enemyCards = isPlayer1Card ? gameState.player2Cards : gameState.player1Cards;
                const attacker = enemyCards.find(c => c.instanceId === poisonEffect.sourceId);
                if (card.baseId === 15 && attacker && attacker.health > 0) {
                    const reflectAmount = Math.floor(poisonEffect.damage * 0.30); // %30 taban yansıtma
                    if (reflectAmount > 0) {
                        setTimeout(() => {
                            try {
                                const result = attacker.takeDamage(reflectAmount, card, 'reflect');
                                if (typeof UI !== 'undefined' && UI.showDamageText) {
                                    UI.showDamageText(attacker.element, reflectAmount, 'reflect');
                                }
                                if (typeof UI !== 'undefined' && UI.setReflectDamage) {
                                    UI.setReflectDamage(attacker);
                                }
                                gameState.addToBattleLog(`${card.name} zehir hasarının bir kısmını ${attacker.name}'e yansıttı! 🦔`);
                                if (result.isDead) {
                                    gameState.addToBattleLog(`${attacker.name} yansıyan zehir hasarından dolayı öldü! ☠️`);
                                    if (typeof UI !== 'undefined' && UI.setDead) {
                                        UI.setDead(attacker);
                                    }
                                    gameState.checkForWinner();
                                }
                            } catch (innerError) {
                                console.error(`Dikenli Deri zehir yansıtma hatası:`, innerError);
                            }
                        }, 200);
                    }
                }
            }

            const armorReductionAmount = typeof poisonEffect.armorReduction === 'number' ? poisonEffect.armorReduction : 2;
            card.armor -= armorReductionAmount;
            
            if (!card.effects) card.effects = {};
            if (typeof card.effects.poisonArmorReduction !== 'number') card.effects.poisonArmorReduction = 0;
            card.effects.poisonArmorReduction += armorReductionAmount;
            card.updateCardElement();
            gameState.addToBattleLog(`${card.name} zehir nedeniyle zırhı ${armorReductionAmount} azaldı! 🛡️`);

            poisonEffect.duration--;
            if (poisonEffect.duration <= 0) {
                delete card.effects.poison;
                gameState.addToBattleLog(`${card.name} artık zehirli değil.`);

                if (typeof UI !== 'undefined' && UI.setPoisoned) {
                    UI.setPoisoned(card, false);
                }
            }
        }
    } catch (error) {
        console.error(`processPoisonOnTurnStart hatası:`, error);
    }
}

// Büyü Tazısı etkisini her aktif lider için uygular
function applyLeaderEffect(card, gameState) {
    try {
        if (!gameState) return;
        if (!Array.isArray(gameState.activeLeaderIDs)) gameState.activeLeaderIDs = [];
        if (!gameState.activeLeaderIDs.includes(card.instanceId)) {
            gameState.activeLeaderIDs.push(card.instanceId);
        }
    } catch (error) {
        console.error(`applyLeaderEffect hatası:`, error);
    }
}

function checkLeaderEffects(gameState) {
    try {
        if (!gameState) return;
        const allCards = [...gameState.player1Cards, ...gameState.player2Cards];
        const leaderCards = allCards.filter(card => card.baseId === 12 && card.health > 0);
        gameState.activeLeaderIDs = leaderCards.map(card => card.instanceId);
        leaderCards.forEach(card => applyLeaderEffect(card, gameState));
    } catch (error) {
        console.error(`checkLeaderEffects hatası:`, error);
    }
}

// Kart yeteneklerini karttaki veriye bağlamak için işlev
function applyCardEffects(gameState) {
    const allCards = [...gameState.player1Cards, ...gameState.player2Cards];

    allCards.forEach(card => {
        const effect = cardEffects[card.baseId];

        if (effect) {
            if (!card._originalTakeDamage) {
                card._originalTakeDamage = card.takeDamage;
            }
            
            if (effect.onTakeDamage) {
                card.takeDamage = function(amount, attacker, type = 'physical') {
                    const modifiedDamage = effect.onTakeDamage(this, amount, attacker, gameState);
                    const result = this._originalTakeDamage(modifiedDamage, attacker, type);
                    if (result.isDead && effect.onDeath) {
                        effect.onDeath(this, gameState);
                    }
                    return result;
                };
            }
            else if (effect.onDeath) {
                card.takeDamage = function(amount, attacker, type = 'physical') {
                    const result = this._originalTakeDamage(amount, attacker, type);
                    if (result.isDead && effect.onDeath) {
                        effect.onDeath(this, gameState);
                    }
                    return result;
                };
            }
            
            if (effect.onGameStart) {
                effect.onGameStart(card, gameState);
            }
        }
    });

    if (typeof checkLeaderEffects === 'function') {
        checkLeaderEffects(gameState);
    }
}

// Saldırı efektlerini uygulama
function applyAttackEffects(attacker, target, gameState) {
    if (typeof attacker.performAttack === 'function') {
        attacker.performAttack(target, gameState);
    } else {
        const effect = cardEffects[attacker.baseId];
        if (effect && effect.onAttack) {
            effect.onAttack(attacker, target, gameState);
        }
    }
}

function startTwoPlayerGame() {
    // Geriye dönük uyumluluk boş
}

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-game-btn');
    if (startButton) {
        startButton.addEventListener('click', () => {
            window.gameState.startGame();
        });
    }

    const gameState = new GameState(cardEffects);
    window.gameState = gameState;
});
