const { cardsData } = require('./cards');

// Pairing Matrix - Kartların yan yana geldiğinde kazanma oranlarını takip eder
class PairingMatrix {
    constructor() {
        this.pairWins = {}; // { "cardId1_cardId2": { wins: 0, games: 0 } }
        this.cardSoloStats = {}; // { cardId: { wins: 0, games: 0 } }
    }

    recordDeck(deck, won) {
        const cardIds = deck.map(c => c.baseId).sort((a, b) => a - b);
        
        // Her kartın solo istatistiğini kaydet
        cardIds.forEach(cardId => {
            if (!this.cardSoloStats[cardId]) {
                this.cardSoloStats[cardId] = { wins: 0, games: 0 };
            }
            this.cardSoloStats[cardId].games++;
            if (won) this.cardSoloStats[cardId].wins++;
        });

        // Her kart çiftinin istatistiğini kaydet (farklı kartlar için)
        for (let i = 0; i < cardIds.length; i++) {
            for (let j = i + 1; j < cardIds.length; j++) {
                // Aynı kartın kendisiyle sinerji hesaplamayı engelle
                if (cardIds[i] === cardIds[j]) continue;
                
                const pairKey = `${Math.min(cardIds[i], cardIds[j])}_${Math.max(cardIds[i], cardIds[j])}`;
                if (!this.pairWins[pairKey]) {
                    this.pairWins[pairKey] = { wins: 0, games: 0 };
                }
                this.pairWins[pairKey].games++;
                if (won) this.pairWins[pairKey].wins++;
            }
        }
    }

    getSynergyScore(cardId1, cardId2) {
        const pairKey = `${Math.min(cardId1, cardId2)}_${Math.max(cardId1, cardId2)}`;
        const pairData = this.pairWins[pairKey];
        const solo1 = this.cardSoloStats[cardId1];
        const solo2 = this.cardSoloStats[cardId2];

        if (!pairData || !solo1 || !solo2 || pairData.games < 10) return null;

        const pairWR = pairData.wins / pairData.games;
        const solo1WR = solo1.wins / solo1.games;
        const solo2WR = solo2.wins / solo2.games;
        const avgSoloWR = (solo1WR + solo2WR) / 2;

        // Sinerji skoru: (Pair WR) - (Average Solo WR)
        return (pairWR - avgSoloWR) * 100;
    }

    getTopSynergies(topN = 10) {
        const synergies = [];
        Object.keys(this.pairWins).forEach(pairKey => {
            const [id1, id2] = pairKey.split('_').map(Number);
            const score = this.getSynergyScore(id1, id2);
            if (score !== null) {
                synergies.push({ card1: id1, card2: id2, score, games: this.pairWins[pairKey].games });
            }
        });
        return synergies.sort((a, b) => b.score - a.score).slice(0, topN);
    }
}

// Headless Game State - UI olmadan çalışan simülasyon motoru
class HeadlessGameState {
    constructor(player1Deck, player2Deck, pairingMatrix = null) {
        this.player1Cards = this.createCardsFromDeck(player1Deck);
        this.player2Cards = this.createCardsFromDeck(player2Deck);
        this.player1Cards.forEach(card => { card.owner = 1; });
        this.player2Cards.forEach(card => { card.owner = 2; });
        this.currentPlayerTurn = 1;
        this.gameOver = false;
        this.winner = null;
        this.turnCount = 0;
        this.cardPickCounts = {};
        this.cardStats = {};
        this.levelStats = {}; // { cardId_level: { gamesPlayed: 0, wins: 0, ... } }
        this.pairingMatrix = pairingMatrix;
        this.player1Deck = player1Deck;
        this.player2Deck = player2Deck;
        
        // Efficiency metrics
        this.buffEfficiency = {}; // { cardId: totalBuffValue }
        this.survivalOverlap = {}; // { cardId: extraTurnsProvided }
        this.counterPicks = {}; // { "attacker_defender": { wins: 0, games: 0 } }
    }

    createCardsFromDeck(deck) {
        return deck.map(cardConfig => {
            const cardData = cardsData.find(c => c.id === cardConfig.baseId);
            if (!cardData) return null;
            
            const card = new Card(cardData);
            card.baseId = cardData.id;
            card.level = cardConfig.level;
            card.updateLevelStats(card.level);
            
            // İstatistikleri başlat
            card.battleStats = {
                damageDealt: 0,
                damageBlocked: 0,
                attacksCount: 0,
                damageTaken: 0,
                extraDamageTaken: 0,
                turnsAlive: 0,
                kills: 0
            };
            
            return card;
        }).filter(Boolean);
    }

    // Pick rate için kart seçimlerini kaydet
    recordCardPick(baseId) {
        if (!this.cardPickCounts[baseId]) {
            this.cardPickCounts[baseId] = 0;
        }
        this.cardPickCounts[baseId]++;
    }

    // Basit AI mantığı
    getAITarget(attacker, enemyCards) {
        // En düşük canlı hedefi seç
        const livingEnemies = enemyCards.filter(c => c.health > 0);
        if (livingEnemies.length === 0) return null;
        
        // Hızlı kartlar en hızlıya vurur
        if (attacker.speed >= 10) {
            const fastest = livingEnemies.reduce((prev, curr) => 
                curr.speed > prev.speed ? curr : prev
            );
            return fastest;
        }
        
        // Diğer kartlar en düşük canlı hedefe vurur
        const lowestHealth = livingEnemies.reduce((prev, curr) => 
            curr.health < prev.health ? curr : prev
        );
        return lowestHealth;
    }

    // Tur sırasını belirle
    determineTurnOrder() {
        const allCards = [...this.player1Cards, ...this.player2Cards].filter(c => c.health > 0);
        
        // Hıza göre sırala
        allCards.sort((a, b) => b.speed - a.speed);
        
        this.turnOrder = allCards;
        this.currentTurnIndex = 0;
    }

    // Bir tur işle
    processTurn() {
        if (this.gameOver) return;
        
        this.turnCount++;
        
        // Her kartın yaşadığı tur sayısını artır
        [...this.player1Cards, ...this.player2Cards].forEach(card => {
            if (card.health > 0) {
                card.battleStats.turnsAlive++;
            }
        });

        this.determineTurnOrder();

        for (let i = 0; i < this.turnOrder.length; i++) {
            const attacker = this.turnOrder[i];
            if (attacker.health <= 0) continue;

            const enemyCards = attacker.owner === 1 ? this.player2Cards : this.player1Cards;
            const target = this.getAITarget(attacker, enemyCards);
            
            if (target && target.health > 0) {
                this.executeAttack(attacker, target);
                
                if (this.checkForWinner()) {
                    this.gameOver = true;
                    return;
                }
            }
        }
    }

    executeAttack(attacker, target) {
        attacker.battleStats.attacksCount++;
        
        // Basit hasar hesaplama
        let damage = attacker.attack;
        
        // Zırh hesaplama
        if (target.armor !== 0) {
            const beforeArmor = damage;
            damage -= target.armor;
            if (damage < 0) damage = 0;
            
            const blocked = beforeArmor - damage;
            if (blocked > 0) {
                target.battleStats.damageBlocked += blocked;
            }
            
            // Negatif zırh
            if (target.armor < 0) {
                const extraDamage = Math.abs(target.armor);
                target.battleStats.extraDamageTaken += extraDamage;
            }
        }
        
        target.health = Math.max(0, target.health - damage);
        target.battleStats.damageTaken += damage;
        attacker.battleStats.damageDealt += damage;
        
        if (target.health === 0) {
            attacker.battleStats.kills++;
        }
    }

    checkForWinner() {
        const player1Alive = this.player1Cards.some(card => card.health > 0);
        const player2Alive = this.player2Cards.some(card => card.health > 0);
        
        if (!player1Alive) {
            this.winner = 2;
            return true;
        }
        if (!player2Alive) {
            this.winner = 1;
            return true;
        }
        return false;
    }

    // Oyunu çalıştır
    run() {
        while (!this.gameOver && this.turnCount < 100) {
            this.processTurn();
        }
        
        return this.getResults();
    }

    getResults() {
        const allCards = [...this.player1Cards, ...this.player2Cards];
        
        // İstatistikleri topla
        allCards.forEach(card => {
            if (!this.cardStats[card.baseId]) {
                this.cardStats[card.baseId] = {
                    name: card.name,
                    gamesPlayed: 0,
                    wins: 0,
                    totalDamageDealt: 0,
                    totalDamageTaken: 0,
                    totalDamageBlocked: 0,
                    totalExtraDamageTaken: 0,
                    totalTurnsAlive: 0,
                    totalKills: 0
                };
            }
            
            const stats = this.cardStats[card.baseId];
            stats.gamesPlayed++;
            stats.totalDamageDealt += card.battleStats.damageDealt;
            stats.totalDamageTaken += card.battleStats.damageTaken;
            stats.totalDamageBlocked += card.battleStats.damageBlocked;
            stats.totalExtraDamageTaken += card.battleStats.extraDamageTaken;
            stats.totalTurnsAlive += card.battleStats.turnsAlive;
            stats.totalKills += card.battleStats.kills;
            
            if (this.winner === card.owner) {
                stats.wins++;
            }
            
            // Seviye bazlı istatistikler
            const levelKey = `${card.baseId}_${card.level}`;
            if (!this.levelStats[levelKey]) {
                this.levelStats[levelKey] = {
                    name: card.name,
                    level: card.level,
                    gamesPlayed: 0,
                    wins: 0,
                    totalDamageDealt: 0,
                    totalDamageTaken: 0,
                    totalDamageBlocked: 0,
                    totalExtraDamageTaken: 0,
                    totalTurnsAlive: 0,
                    totalKills: 0
                };
            }
            
            const levelStat = this.levelStats[levelKey];
            levelStat.gamesPlayed++;
            levelStat.totalDamageDealt += card.battleStats.damageDealt;
            levelStat.totalDamageTaken += card.battleStats.damageTaken;
            levelStat.totalDamageBlocked += card.battleStats.damageBlocked;
            levelStat.totalExtraDamageTaken += card.battleStats.extraDamageTaken;
            levelStat.totalTurnsAlive += card.battleStats.turnsAlive;
            levelStat.totalKills += card.battleStats.kills;
            
            if (this.winner === card.owner) {
                levelStat.wins++;
            }
        });
        
        // Pairing matrix'e kaydet
        if (this.pairingMatrix) {
            this.pairingMatrix.recordDeck(this.player1Deck, this.winner === 1);
            this.pairingMatrix.recordDeck(this.player2Deck, this.winner === 2);
        }
        
        return {
            winner: this.winner,
            turnCount: this.turnCount,
            cardStats: this.cardStats,
            levelStats: this.levelStats,
            cardPickCounts: this.cardPickCounts
        };
    }
}

// Card sınıfı (basitleştirilmiş)
class Card {
    constructor(data) {
        this.id = data.id;
        this.baseId = data.id;
        this.name = data.name;
        this.health = data.health;
        this.attack = data.attack;
        this.speed = data.speed;
        this.armor = data.armor;
        this.level = 1;
        this.owner = null;
        this.levelStats = data.levelStats;
        this.levelAbilities = data.levelAbilities;
    }

    updateLevelStats(level) {
        if (this.levelStats && this.levelStats.health) {
            this.health = this.levelStats.health[level - 1];
        }
        if (this.levelStats && this.levelStats.attack) {
            this.attack = this.levelStats.attack[level - 1];
        }
        if (this.levelStats && this.levelStats.speed) {
            this.speed = this.levelStats.speed[level - 1];
        }
        if (this.levelStats && this.levelStats.armor) {
            this.armor = this.levelStats.armor[level - 1];
        }
    }
}

// Random Deck Builder
function generateRandomDeck() {
    const deck = [];
    let totalPoints = 0;
    const maxPoints = 18;
    const maxCards = 4;
    
    const availableCards = cardsData.filter(c => c.id !== 0); // Gardiyan hariç
    
    while (deck.length < maxCards) {
        const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        
        // Aynı kartı tekrar seçme
        if (deck.some(c => c.baseId === randomCard.id)) continue;
        
        const randomLevel = Math.floor(Math.random() * 5) + 1;
        
        const upgradeCost = Math.floor(((randomLevel - 1) * randomLevel) / 2);
        
        if (totalPoints + upgradeCost <= maxPoints) {
            deck.push({
                baseId: randomCard.id,
                level: randomLevel
            });
            totalPoints += upgradeCost;
        }
        
        // Sonsuz döngüden kaçın
        if (totalPoints > maxPoints || deck.length > 100) break;
    }
    
    return deck;
}

// Genetic Algorithm - Evolutionary Meta-Discovery
function runEvolutionarySimulation(generations = 50, populationSize = 100, gamesPerDeck = 10) {
    console.log(`Starting Evolutionary Meta-Discovery: ${generations} generations, ${populationSize} decks per generation...`);
    
    let population = [];
    
    // Başlangıç popülasyonu oluştur
    for (let i = 0; i < populationSize; i++) {
        population.push({
            deck: generateRandomDeck(),
            fitness: 0,
            wins: 0,
            games: 0
        });
    }
    
    const pairingMatrix = new PairingMatrix();
    const globalCardStats = {};
    const globalPickCounts = {};
    let totalGames = 0;
    
    for (let gen = 0; gen < generations; gen++) {
        console.log(`Generation ${gen + 1}/${generations}...`);
        
        // Her desteyi diğer destelerle karşılaştır
        for (let i = 0; i < population.length; i++) {
            for (let j = i + 1; j < population.length; j++) {
                for (let game = 0; game < gamesPerDeck; game++) {
                    const deck1 = population[i].deck;
                    const deck2 = population[j].deck;
                    
                    // Pick counts kaydet
                    deck1.forEach(card => {
                        if (!globalPickCounts[card.baseId]) {
                            globalPickCounts[card.baseId] = 0;
                        }
                        globalPickCounts[card.baseId]++;
                    });
                    deck2.forEach(card => {
                        if (!globalPickCounts[card.baseId]) {
                            globalPickCounts[card.baseId] = 0;
                        }
                        globalPickCounts[card.baseId]++;
                    });
                    
                    const gameState = new HeadlessGameState(deck1, deck2, pairingMatrix);
                    const results = gameState.run();
                    
                    // Fitness güncelle
                    population[i].games++;
                    population[j].games++;
                    
                    if (results.winner === 1) {
                        population[i].wins++;
                    } else {
                        population[j].wins++;
                    }
                    
                    // İstatistikleri birleştir
                    Object.keys(results.cardStats).forEach(baseId => {
                        if (!globalCardStats[baseId]) {
                            globalCardStats[baseId] = {
                                name: results.cardStats[baseId].name,
                                gamesPlayed: 0,
                                wins: 0,
                                totalDamageDealt: 0,
                                totalDamageTaken: 0,
                                totalDamageBlocked: 0,
                                totalExtraDamageTaken: 0,
                                totalTurnsAlive: 0,
                                totalKills: 0
                            };
                        }
                        
                        const stats = globalCardStats[baseId];
                        stats.gamesPlayed += results.cardStats[baseId].gamesPlayed;
                        stats.wins += results.cardStats[baseId].wins;
                        stats.totalDamageDealt += results.cardStats[baseId].totalDamageDealt;
                        stats.totalDamageTaken += results.cardStats[baseId].totalDamageTaken;
                        stats.totalDamageBlocked += results.cardStats[baseId].totalDamageBlocked;
                        stats.totalExtraDamageTaken += results.cardStats[baseId].totalExtraDamageTaken;
                        stats.totalTurnsAlive += results.cardStats[baseId].totalTurnsAlive;
                        stats.totalKills += results.cardStats[baseId].totalKills;
                    });
                    
                    totalGames++;
                }
            }
        }
        
        // Fitness hesapla
        population.forEach(ind => {
            ind.fitness = ind.games > 0 ? ind.wins / ind.games : 0;
        });
        
        // En iyi %10'u seç (Şampiyonlar)
        population.sort((a, b) => b.fitness - a.fitness);
        const champions = population.slice(0, Math.max(10, Math.floor(populationSize * 0.1)));
        
        if (champions.length > 0) {
            console.log(`  Best fitness this generation: ${(champions[0].fitness * 100).toFixed(2)}%`);
        }
        
        // Yeni popülasyon oluştur (Crossover + Mutation)
        const newPopulation = [];
        
        // Şampiyonları koru (son nesilde değerleri koru)
        if (gen === generations - 1) {
            newPopulation.push(...champions.map(c => ({
                deck: [...c.deck],
                fitness: c.fitness,
                wins: c.wins,
                games: c.games
            })));
        } else {
            newPopulation.push(...champions.map(c => ({
                deck: [...c.deck],
                fitness: 0,
                wins: 0,
                games: 0
            })));
        }
        
        // Yeni bireyler oluştur (Crossover)
        while (newPopulation.length < populationSize) {
            const parent1 = champions[Math.floor(Math.random() * champions.length)];
            const parent2 = champions[Math.floor(Math.random() * champions.length)];
            
            const childDeck = crossoverDecks(parent1.deck, parent2.deck);
            
            // Mutation
            if (Math.random() < 0.3) {
                mutateDeck(childDeck);
            }
            
            newPopulation.push({
                deck: childDeck,
                fitness: 0,
                wins: 0,
                games: 0
            });
        }
        
        population = newPopulation;
    }
    
    console.log(`Evolutionary simulation complete! ${totalGames} games played.`);
    
    // En iyi desteleri göster
    population.sort((a, b) => b.fitness - a.fitness);
    console.log('\n=== TOP DECKS ===\n');
    population.slice(0, 5).forEach((deck, i) => {
        console.log(`#${i + 1} Win Rate: ${(deck.fitness * 100).toFixed(2)}% (${deck.wins}/${deck.games} games)`);
        deck.deck.forEach(card => {
            const cardName = cardsData.find(c => c.id === card.baseId)?.name || 'Unknown';
            console.log(`  - ${cardName} (Level ${card.level})`);
        });
        console.log();
    });
    
    // Rapor oluştur
    generateReport(globalCardStats, globalPickCounts, totalGames, pairingMatrix);
    
    return { population, pairingMatrix, globalCardStats };
}

// Crossover - İki desteyi birleştir
function crossoverDecks(deck1, deck2) {
    const child = [];
    const allCards = [...deck1, ...deck2];
    
    // Rastgele kartları seç
    while (child.length < 4 && allCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * allCards.length);
        const card = allCards.splice(randomIndex, 1)[0];
        
        // Aynı kartı tekrar ekleme
        if (!child.some(c => c.baseId === card.baseId)) {
            child.push(card);
        }
    }
    
    // Eğer 4 kart yoksa rastgele ekle
    while (child.length < 4) {
        const newCard = generateRandomDeck()[0];
        if (!child.some(c => c.baseId === newCard.baseId)) {
            child.push(newCard);
        }
    }
    
    return child;
}

// Mutation - Deste değiştir
function mutateDeck(deck) {
    const mutationType = Math.floor(Math.random() * 3);
    
    if (mutationType === 0) {
        // Bir kartı değiştir
        const index = Math.floor(Math.random() * deck.length);
        const newCard = generateRandomDeck()[0];
        deck[index] = newCard;
    } else if (mutationType === 1) {
        // Bir kartın seviyesini değiştir
        const index = Math.floor(Math.random() * deck.length);
        const newLevel = Math.floor(Math.random() * 5) + 1;
        deck[index].level = newLevel;
    } else {
        // İki kartın yerini değiştir
        const i = Math.floor(Math.random() * deck.length);
        const j = Math.floor(Math.random() * deck.length);
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Mass Simulation
function runMassSimulation(gameCount = 1000, usePairingMatrix = true) {
    console.log(`Starting ${gameCount} game simulation...`);
    
    const pairingMatrix = usePairingMatrix ? new PairingMatrix() : null;
    const globalCardStats = {};
    const globalLevelStats = {};
    const globalPickCounts = {};
    let totalGames = 0;
    
    for (let i = 0; i < gameCount; i++) {
        const deck1 = generateRandomDeck();
        const deck2 = generateRandomDeck();
        
        // Pick counts kaydet
        deck1.forEach(card => {
            if (!globalPickCounts[card.baseId]) {
                globalPickCounts[card.baseId] = 0;
            }
            globalPickCounts[card.baseId]++;
        });
        deck2.forEach(card => {
            if (!globalPickCounts[card.baseId]) {
                globalPickCounts[card.baseId] = 0;
            }
            globalPickCounts[card.baseId]++;
        });
        
        const gameState = new HeadlessGameState(deck1, deck2, pairingMatrix);
        const results = gameState.run();
        
        // İstatistikleri birleştir
        Object.keys(results.cardStats).forEach(baseId => {
            if (!globalCardStats[baseId]) {
                globalCardStats[baseId] = {
                    name: results.cardStats[baseId].name,
                    gamesPlayed: 0,
                    wins: 0,
                    totalDamageDealt: 0,
                    totalDamageTaken: 0,
                    totalDamageBlocked: 0,
                    totalExtraDamageTaken: 0,
                    totalTurnsAlive: 0,
                    totalKills: 0
                };
            }
            
            const stats = globalCardStats[baseId];
            stats.gamesPlayed += results.cardStats[baseId].gamesPlayed;
            stats.wins += results.cardStats[baseId].wins;
            stats.totalDamageDealt += results.cardStats[baseId].totalDamageDealt;
            stats.totalDamageTaken += results.cardStats[baseId].totalDamageTaken;
            stats.totalDamageBlocked += results.cardStats[baseId].totalDamageBlocked;
            stats.totalExtraDamageTaken += results.cardStats[baseId].totalExtraDamageTaken;
            stats.totalTurnsAlive += results.cardStats[baseId].totalTurnsAlive;
            stats.totalKills += results.cardStats[baseId].totalKills;
        });
        
        // Seviye istatistiklerini birleştir
        Object.keys(results.levelStats).forEach(levelKey => {
            if (!globalLevelStats[levelKey]) {
                globalLevelStats[levelKey] = {
                    name: results.levelStats[levelKey].name,
                    level: results.levelStats[levelKey].level,
                    gamesPlayed: 0,
                    wins: 0,
                    totalDamageDealt: 0,
                    totalDamageTaken: 0,
                    totalDamageBlocked: 0,
                    totalExtraDamageTaken: 0,
                    totalTurnsAlive: 0,
                    totalKills: 0
                };
            }
            
            const levelStat = globalLevelStats[levelKey];
            levelStat.gamesPlayed += results.levelStats[levelKey].gamesPlayed;
            levelStat.wins += results.levelStats[levelKey].wins;
            levelStat.totalDamageDealt += results.levelStats[levelKey].totalDamageDealt;
            levelStat.totalDamageTaken += results.levelStats[levelKey].totalDamageTaken;
            levelStat.totalDamageBlocked += results.levelStats[levelKey].totalDamageBlocked;
            levelStat.totalExtraDamageTaken += results.levelStats[levelKey].totalExtraDamageTaken;
            levelStat.totalTurnsAlive += results.levelStats[levelKey].totalTurnsAlive;
            levelStat.totalKills += results.levelStats[levelKey].totalKills;
        });
        
        totalGames++;
        
        if ((i + 1) % 100 === 0) {
            console.log(`Completed ${i + 1}/${gameCount} games...`);
        }
    }
    
    console.log(`Simulation complete! ${totalGames} games played.`);
    
    // Rapor oluştur
    generateReport(globalCardStats, globalLevelStats, globalPickCounts, totalGames, pairingMatrix);
}

function generateReport(cardStats, levelStats, pickCounts, totalGames, pairingMatrix = null) {
    const fs = require('fs');
    const path = require('path');
    
    console.log('\n=== BALANCE SIMULATION REPORT ===\n');
    
    const reportData = [];
    
    Object.keys(cardStats).forEach(baseId => {
        const stats = cardStats[baseId];
        const pickCount = pickCounts[baseId] || 0;
        
        reportData.push({
            baseId: parseInt(baseId),
            name: stats.name,
            pickRate: ((pickCount / (totalGames * 8)) * 100).toFixed(2), // 8 kart per game (4+4)
            winRate: ((stats.wins / stats.gamesPlayed) * 100).toFixed(2),
            totalDamageDealt: stats.totalDamageDealt,
            avgDamageDealt: (stats.totalDamageDealt / stats.gamesPlayed).toFixed(2),
            damagePerTurn: stats.totalTurnsAlive > 0 ? (stats.totalDamageDealt / stats.totalTurnsAlive).toFixed(2) : 0,
            totalDamageBlocked: stats.totalDamageBlocked,
            totalExtraDamageTaken: stats.totalExtraDamageTaken,
            avgTurnsAlive: (stats.totalTurnsAlive / stats.gamesPlayed).toFixed(2),
            avgKills: (stats.totalKills / stats.gamesPlayed).toFixed(2)
        });
    });
    
    // Tabloyu yazdır
    console.log('Kart\t\tPick Rate (%)\tWin Rate (%)\tToplam Hasar\tOrt. Hasar\tHasar/Tur\tEngellenen\tFazladan\tOrt. Tur\tOrt. Öldürme');
    console.log('------------------------------------------------------------------------------------------------------------------------');
    
    reportData.sort((a, b) => b.winRate - a.winRate).forEach(data => {
        console.log(`${data.name}\t${data.pickRate}\t\t${data.winRate}\t\t${data.totalDamageDealt}\t\t${data.avgDamageDealt}\t${data.damagePerTurn}\t${data.totalDamageBlocked}\t${data.totalExtraDamageTaken}\t${data.avgTurnsAlive}\t${data.avgKills}`);
    });
    
    // Sinerji raporu
    if (pairingMatrix) {
        console.log('\n=== TOP SYNERGIES ===\n');
        const topSynergies = pairingMatrix.getTopSynergies(10);
        console.log('Kart 1\t\tKart 2\t\tSinerji Skoru\tOyun Sayısı');
        console.log('--------------------------------------------------------');
        topSynergies.forEach(synergy => {
            const card1Name = cardsData.find(c => c.id === synergy.card1)?.name || 'Unknown';
            const card2Name = cardsData.find(c => c.id === synergy.card2)?.name || 'Unknown';
            console.log(`${card1Name}\t${card2Name}\t${synergy.score.toFixed(2)}\t\t${synergy.games}`);
        });
    }
    
    // Level ROI raporu
    if (levelStats) {
        console.log('\n=== LEVEL ROI (EN İYİ SEVİYELER) ===\n');
        console.log('Kart\t\tEn İyi Seviye\tWin Rate (%)\tOyun Sayısı');
        console.log('--------------------------------------------------------');
        
        const cardLevelMap = {};
        Object.keys(levelStats).forEach(levelKey => {
            const [cardId, level] = levelKey.split('_').map(Number);
            const stat = levelStats[levelKey];
            const winRate = (stat.wins / stat.gamesPlayed) * 100;
            
            if (!cardLevelMap[cardId]) {
                cardLevelMap[cardId] = { level: 1, winRate: 0, games: 0, name: stat.name };
            }
            
            if (winRate > cardLevelMap[cardId].winRate) {
                cardLevelMap[cardId] = { level, winRate, games: stat.gamesPlayed, name: stat.name };
            }
        });
        
        Object.keys(cardLevelMap).forEach(cardId => {
            const data = cardLevelMap[cardId];
            console.log(`${data.name}\t\tSeviye ${data.level}\t\t${data.winRate.toFixed(2)}\t\t${data.games}`);
        });
    }
    
    console.log('\n=== END OF REPORT ===\n');
    
    // Dosyaya kaydet
    const reportPath = path.join(__dirname, 'simulation-report.txt');
    let reportContent = '=== BALANCE SIMULATION REPORT ===\n';
    reportContent += `Total Games: ${totalGames}\n\n`;
    reportContent += 'Kart\t\tPick Rate (%)\tWin Rate (%)\tToplam Hasar\tOrt. Hasar\tHasar/Tur\tEngellenen\tFazladan\tOrt. Tur\tOrt. Öldürme\n';
    reportContent += '------------------------------------------------------------------------------------------------------------------------\n';
    
    reportData.sort((a, b) => b.winRate - a.winRate).forEach(data => {
        reportContent += `${data.name}\t${data.pickRate}\t\t${data.winRate}\t\t${data.totalDamageDealt}\t\t${data.avgDamageDealt}\t${data.damagePerTurn}\t${data.totalDamageBlocked}\t${data.totalExtraDamageTaken}\t${data.avgTurnsAlive}\t${data.avgKills}\n`;
    });
    
    // Sinerji raporu dosyaya
    if (pairingMatrix) {
        reportContent += '\n=== TOP SYNERGIES ===\n';
        const topSynergies = pairingMatrix.getTopSynergies(10);
        reportContent += 'Kart 1\t\tKart 2\t\tSinerji Skoru\tOyun Sayısı\n';
        reportContent += '--------------------------------------------------------\n';
        topSynergies.forEach(synergy => {
            const card1Name = cardsData.find(c => c.id === synergy.card1)?.name || 'Unknown';
            const card2Name = cardsData.find(c => c.id === synergy.card2)?.name || 'Unknown';
            reportContent += `${card1Name}\t${card2Name}\t${synergy.score.toFixed(2)}\t\t${synergy.games}\n`;
        });
    }
    
    // Level ROI raporu dosyaya
    if (levelStats) {
        reportContent += '\n=== LEVEL ROI (EN İYİ SEVİYELER) ===\n';
        reportContent += 'Kart\t\tEn İyi Seviye\tWin Rate (%)\tOyun Sayısı\n';
        reportContent += '--------------------------------------------------------\n';
        
        const cardLevelMap = {};
        Object.keys(levelStats).forEach(levelKey => {
            const [cardId, level] = levelKey.split('_').map(Number);
            const stat = levelStats[levelKey];
            const winRate = (stat.wins / stat.gamesPlayed) * 100;
            
            if (!cardLevelMap[cardId]) {
                cardLevelMap[cardId] = { level: 1, winRate: 0, games: 0, name: stat.name };
            }
            
            if (winRate > cardLevelMap[cardId].winRate) {
                cardLevelMap[cardId] = { level, winRate, games: stat.gamesPlayed, name: stat.name };
            }
        });
        
        Object.keys(cardLevelMap).forEach(cardId => {
            const data = cardLevelMap[cardId];
            reportContent += `${data.name}\t\tSeviye ${data.level}\t\t${data.winRate.toFixed(2)}\t\t${data.games}\n`;
        });
    }
    
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log(`Rapor kaydedildi: ${reportPath}`);
}

// Çalıştır
if (require.main === module) {
    const args = process.argv.slice(2);
    const mode = args[0] || 'mass'; // 'mass' veya 'evolutionary'
    
    if (mode === 'evolutionary') {
        const generations = args[1] ? parseInt(args[1]) : 20;
        const populationSize = args[2] ? parseInt(args[2]) : 50;
        const gamesPerDeck = args[3] ? parseInt(args[3]) : 5;
        runEvolutionarySimulation(generations, populationSize, gamesPerDeck);
    } else {
        const gameCount = args[1] ? parseInt(args[1]) : 1000;
        runMassSimulation(gameCount);
    }
}

module.exports = {
    HeadlessGameState,
    generateRandomDeck,
    runMassSimulation
};
