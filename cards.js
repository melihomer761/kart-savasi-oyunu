// Kartların veri yapısı
const cardsData = [
    {
        id: 1,
        name: "Ateş Savaşçısı",
        health: 137,
        attack: 17,
        speed: 7,
        armor: 2,
        description: "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 11 hasar alır.",
        levelStats: {
            health: [137, 137, 137, 137, 137],
            attack: [17, 24, 24, 24, 24],
            speed: [7, 7, 7, 7, 7],
            armor: [2, 2, 2, 4, 4]
        },
        levelAbilities: {
            splashDamage: [11, 11, 18, 18, 24]
        },
        levelDescriptions: [
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 11 hasar alır.",
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 11 hasar alır. (+7 Hasar)",
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 18 hasar alır. (+7 Hasar)",
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 18 hasar alır. (+7 Hasar, +2 Zırh)",
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 24 hasar alır. (+7 Hasar, +2 Zırh)"
        ]
    },
    {
        id: 2,
        name: "Buz Büyücüsü",
        health: 80,
        attack: 25,
        speed: 7,
        armor: 4,
        description: "Rakibini dondurarak hızını 2 azaltır.",
        levelStats: {
            health: [80, 80, 80, 100, 100],
            attack: [25, 30, 30, 30, 30],
            speed: [7, 7, 7, 7, 7],
            armor: [4, 4, 4, 4, 4]
        },
        levelAbilities: {
            speedReduction: [2, 2, 3, 3, 5]
        },
        levelDescriptions: [
            "Rakibini dondurarak hızını 2 azaltır.",
            "Rakibini dondurarak hızını 2 azaltır. (+5 Hasar)",
            "Rakibini dondurarak hızını 3 azaltır. (+5 Hasar)",
            "Rakibini dondurarak hızını 3 azaltır. (+5 Hasar, +20 Can)",
            "Rakibini dondurarak hızını 5 azaltır. (+5 Hasar, +20 Can)"
        ]
    },
    {
        id: 3,
        name: "Taş Kalkan",
        health: 150,
        attack: 15,
        speed: 3,
        armor: 0,
        description: "Gelen hasarın %20'sini engeller.",
        levelStats: {
            health: [150, 175, 175, 175, 175],
            attack: [15, 15, 15, 20, 20],
            speed: [3, 3, 3, 3, 7],
            armor: [0, 0, 0, 0, 0]
        },
        levelAbilities: {
            damageReduction: [20, 20, 25, 25, 35]
        },
        levelDescriptions: [
            "Gelen hasarın %20'sini engeller.",
            "Gelen hasarın %20'sini engeller. (+25 Can)",
            "Gelen hasarın %25'ini engeller. (+25 Can)",
            "Gelen hasarın %25'ini engeller. (+25 Can, +5 Hasar)",
            "Gelen hasarın %35'ini engeller. (+25 Can, +5 Hasar, +4 Hız)"
        ]
    },
    {
        id: 4,
        name: "Çevik Hançer",
        health: 70,
        attack: 12,
        speed: 10,
        armor: 0,
        description: "Peş peşe 3 kez hasar verir",
        levelStats: {
            health: [70, 70, 85, 85, 85],
            attack: [12, 14, 14, 14, 14],
            speed: [10, 10, 10, 10, 10],
            armor: [0, 0, 0, 3, 3]
        },
        levelAbilities: {
            attackCount: [3, 3, 3, 3, 4]
        },
        levelDescriptions: [
            "Peş peşe 3 kez hasar verir",
            "Peş peşe 3 kez hasar verir. (+2 Hasar)",
            "Peş peşe 3 kez hasar verir. (+2 Hasar, +15 Can)",
            "Peş peşe 3 kez hasar verir. (+2 Hasar, +15 Can, +3 Zırh)",
            "Peş peşe 4 kez hasar verir. (+2 Hasar, +15 Can, +3 Zırh)"
        ]
    },
    {
        id: 5,
        name: "Hayalet",
        health: 60,
        attack: 35,
        speed: 9,
        armor: -4,
        description: "İlk iki saldırıda %60 kaçınma şansına sahiptir.",
        levelStats: {
            health: [60, 75, 75, 85, 85],
            attack: [35, 35, 35, 35, 35],
            speed: [9, 9, 9, 9, 9],
            armor: [-4, -4, -4, -4, -4]
        },
        levelAbilities: {
            dodgeCount: [2, 2, 3, 3, 5]
        },
        levelDescriptions: [
            "İlk iki saldırıda %60 kaçınma şansına sahiptir.",
            "İlk iki saldırıda %60 kaçınma şansına sahiptir. (+15 Can)",
            "İlk üç saldırıda %60 kaçınma şansına sahiptir. (+15 Can)",
            "İlk üç saldırıda %60 kaçınma şansına sahiptir. (+25 Can)",
            "İlk beş saldırıda %60 kaçınma şansına sahiptir. (+25 Can)"
        ]
    },
    {
        id: 6,
        name: "Kara Şövalye",
        health: 185,
        attack: 20,
        speed: 5,
        armor: -8,
        description: "Her tur başında saldırı gücü 5 artar.",
        levelStats: {
            health: [185, 185, 185, 185, 185],
            attack: [20, 23, 23, 23, 23],
            speed: [5, 5, 5, 5, 5],
            armor: [-8, -8, -4, -4, 1]
        },
        levelAbilities: {
            attackGrowth: [5, 5, 5, 7, 7]
        },
        levelDescriptions: [
            "Her tur başında saldırı gücü 5 artar.",
            "Her tur başında saldırı gücü 5 artar. (+3 Hasar)",
            "Her tur başında saldırı gücü 5 artar. (+3 Hasar, +4 Zırh)",
            "Her tur başında saldırı gücü 7 artar. (+3 Hasar, +4 Zırh)",
            "Her tur başında saldırı gücü 7 artar. (+3 Hasar, +9 Zırh)"
        ]
    },
    {
        id: 7,
        name: "Şifacı",
        health: 90,
        attack: 10,
        speed: 6,
        armor: 2,
        description: "Her turda tüm dost kartlara +7 can verir. Maksimum canı aşabilir.",
        levelStats: {
            health: [90, 90, 90, 100, 100],
            attack: [10, 10, 14, 14, 14],
            speed: [6, 6, 6, 6, 6],
            armor: [2, 2, 2, 2, 2]
        },
        levelAbilities: {
            healAmount: [7, 10, 10, 10, 14]
        },
        levelDescriptions: [
            "Her turda tüm dost kartlara +7 can verir. Maksimum canı aşabilir.",
            "Her turda tüm dost kartlara +10 can verir. Maksimum canı aşabilir.",
            "Her turda tüm dost kartlara +10 can verir. Maksimum canı aşabilir. (+4 Hasar)",
            "Her turda tüm dost kartlara +10 can verir. Maksimum canı aşabilir. (+4 Hasar, +10 Can)",
            "Her turda tüm dost kartlara +14 can verir. Maksimum canı aşabilir. (+4 Hasar, +10 Can)"
        ]
    },
    {
        id: 8,
        name: "Zehirli Ok",
        health: 75,
        attack: 22,
        speed: 7,
        armor: -2,
        description: "Zehirlediği rakip 3 tur boyunca her tur 10 hasar (zırhı yok sayar) alır ve zırhı 2 azalır.",
        levelStats: {
            health: [75, 75, 80, 80, 80],
            attack: [22, 22, 25, 25, 25],
            speed: [7, 7, 8, 8, 8],
            armor: [-2, -2, -2, -2, -2]
        },
        levelAbilities: {
            poisonDamage: [10, 14, 14, 14, 17],
            poisonArmorReduction: [2, 2, 2, 2, 3],
            poisonDuration: [3, 3, 3, 5, 5]
        },
        levelDescriptions: [
            "Zehirlediği rakip 3 tur boyunca her tur 10 hasar alır ve zırhı 2 azalır.",
            "Zehirlediği rakip 3 tur boyunca her tur 14 hasar alır ve zırhı 2 azalır.",
            "Zehirlediği rakip 3 tur boyunca her tur 14 hasar alır ve zırhı 2 azalır. (+5 Can, +3 Hasar, +1 Hız)",
            "Zehirlediği rakip 5 tur boyunca her tur 14 hasar alır ve zırhı 2 azalır. (+5 Can, +3 Hasar, +1 Hız)",
            "Zehirlediği rakip 5 tur boyunca her tur 17 hasar alır ve zırhı 3 azalır. (+5 Can, +3 Hasar, +1 Hız)"
        ]
    },
    {
        id: 9,
        name: "Savaş Borazanı",
        health: 145,
        attack: 12,
        speed: 1,
        armor: 1,
        description: "Yaşadığı sürece dost kartların saldırı gücü +4 artar.",
        levelStats: {
            health: [145, 145, 145, 165, 165],
            attack: [12, 17, 17, 17, 17],
            speed: [1, 1, 1, 1, 1],
            armor: [1, 1, 1, 1, 1]
        },
        levelAbilities: {
            attackBonus: [4, 4, 6, 6, 8]
        },
        levelDescriptions: [
            "Yaşadığı sürece dost kartların saldırı gücü +4 artar.",
            "Yaşadığı sürece dost kartların saldırı gücü +4 artar. (+5 Hasar)",
            "Yaşadığı sürece dost kartların saldırı gücü +6 artar. (+5 Hasar)",
            "Yaşadığı sürece dost kartların saldırı gücü +6 artar. (+5 Hasar, +20 Can)",
            "Yaşadığı sürece dost kartların saldırı gücü +8 artar. (+5 Hasar, +20 Can)"
        ]
    },
    {
        id: 10,
        name: "Kan Emici",
        health: 70,
        attack: 12,
        speed: 3,
        armor: -1,
        description: "İki kez vurur ve verdiği hasarın %60'ı kadar kendi canını iyileştirir.",
        levelStats: {
            health: [70, 70, 70, 70, 70],
            attack: [12, 14, 14, 16, 16],
            speed: [3, 3, 5, 5, 5],
            armor: [-1, -1, -1, -1, -1]
        },
        levelAbilities: {
            healPercentage: [60, 60, 60, 60, 65]
        },
        levelDescriptions: [
            "İki kez vurur ve verdiği hasarın %60'ı kadar kendi canını iyileştirir.",
            "İki kez vurur ve verdiği hasarın %60'ı kadar kendi canını iyileştirir. (+2 Hasar)",
            "İki kez vurur ve verdiği hasarın %60'ı kadar kendi canını iyileştirir. (+2 Hasar, +2 Hız)",
            "İki kez vurur ve verdiği hasarın %60'ı kadar kendi canını iyileştirir. (+4 Hasar, +2 Hız)",
            "İki kez vurur ve verdiği hasarın %65'i kadar kendi canını iyileştirir. (+4 Hasar, +2 Hız)"
        ]
    },
    {
        id: 11,
        name: "İkiz Okçu",
        health: 70,
        attack: 20,
        speed: 5,
        armor: 3,
        description: "Her saldırıda %60 şansla iki hedefi vurur. İkinci hedef rastgele seçilir.",
        levelStats: {
            health: [70, 90, 90, 90, 90],
            attack: [20, 20, 25, 25, 25],
            speed: [5, 5, 6, 6, 6],
            armor: [3, 3, 3, 5, 5]
        },
        levelAbilities: {
            doubleTargetChance: [60, 60, 60, 60, 100]
        },
        levelDescriptions: [
            "Her saldırıda %60 şansla iki hedefi vurur. İkinci hedef rastgele seçilir.",
            "Her saldırıda %60 şansla iki hedefi vurur. İkinci hedef rastgele seçilir. (+20 Can)",
            "Her saldırıda %60 şansla iki hedefi vurur. İkinci hedef rastgele seçilir. (+20 Can, +5 Hasar, +1 Hız)",
            "Her saldırıda %60 şansla iki hedefi vurur. İkinci hedef rastgele seçilir. (+20 Can, +5 Hasar, +1 Hız, +2 Zırh)",
            "Her saldırıda ikinci hedefi kesinlikle vurur. (+20 Can, +5 Hasar, +1 Hız, +2 Zırh)"
        ]
    },
    {
        id: 12,
        name: "Büyü Tazısı",
        health: 112,
        attack: 23,
        speed: 4,
        armor: 7,
        description: "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır.",
        levelStats: {
            health: [112, 123, 123, 135, 135],
            attack: [23, 23, 26, 26, 26],
            speed: [4, 4, 4, 4, 4],
            armor: [7, 7, 7, 7, 9]
        },
        levelDescriptions: [
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır.",
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır. (+11 Can)",
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır. (+11 Can, +3 Hasar)",
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır. (+23 Can, +3 Hasar)",
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır. (+23 Can, +3 Hasar, +2 Zırh)"
        ]
    },
    {
        id: 13,
        name: "Kalkan Kopyalayıcı",
        health: 77,
        attack: 21,
        speed: 9,
        armor: 0,
        description: "Saldırıya uğradığında rakibin zırhını +2 ile kopyalar.",
        levelStats: {
            health: [77, 77, 77, 89, 89],
            attack: [21, 21, 24, 24, 24],
            speed: [9, 9, 9, 9, 9],
            armor: [0, 0, 0, 0, 0]
        },
        levelAbilities: {
            armorCopyBonus: [2, 3, 3, 3, 6]
        },
        levelDescriptions: [
            "Saldırıya uğradığında rakibin zırhını +2 ile kopyalar.",
            "Saldırıya uğradığında rakibin zırhını +3 ile kopyalar.",
            "Saldırıya uğradığında rakibin zırhını +3 ile kopyalar. (+3 Hasar)",
            "Saldırıya uğradığında rakibin zırhını +3 ile kopyalar. (+3 Hasar, +12 Can)",
            "Saldırıya uğradığında rakibin zırhını +6 ile kopyalar. (+3 Hasar, +12 Can)"
        ]
    },
    {
        id: 15,
        name: "Dikenli Deri",
        health: 200,
        attack: 9,
        speed: 6,
        armor: -10,
        description: "Saldırana alınan hasarın %25'ini yansıtır.",
        levelStats: {
            health: [200, 220, 220, 245, 245],
            attack: [9, 9, 9, 9, 9],
            speed: [6, 6, 6, 6, 6],
            armor: [-10, -10, -20, -25, -25]
        },
        levelAbilities: {
            reflectPercentage: [25, 25, 25, 25, 35]
        },
        levelDescriptions: [
            "Saldırana alınan hasarın %25'ini yansıtır.",
            "Saldırana alınan hasarın %25'ini yansıtır. (+20 Can)",
            "Saldırana alınan hasarın %25'ini yansıtır. (+20 Can, -10 Zırh)",
            "Saldırana alınan hasarın %25'ini yansıtır. (+45 Can, -15 Zırh)",
            "Saldırana alınan hasarın %35'ini yansıtır. (+45 Can, -15 Zırh)"
        ]
    },
    {
        id: 16,
        name: "İkili Siper",
        health: 120,
        attack: 14,
        speed: 4,
        armor: 3,
        description: "Saldırı aldığında, o tur boyunca takımındaki tüm dost kartlara +5 zırh verir.",
        levelStats: {
            health: [120, 125, 125, 125, 125],
            attack: [14, 18, 18, 18, 20],
            speed: [4, 4, 6, 6, 8],
            armor: [3, 3, 3, 3, 3]
        },
        levelAbilities: {
            armorBonus: [5, 5, 5, 8, 8]
        },
        levelDescriptions: [
            "Saldırı aldığında, o tur boyunca takımındaki tüm dost kartlara +5 zırh verir.",
            "Saldırı aldığında, o tur boyunca takımındaki tüm dost kartlara +5 zırh verir. (+4 Hasar, +5 Can)",
            "Saldırı aldığında, o tur boyunca takımındaki tüm dost kartlara +5 zırh verir. (+4 Hasar, +5 Can, +2 Hız)",
            "Saldırı aldığında, o tur boyunca takımındaki tüm dost kartlara +8 zırh verir. (+4 Hasar, +5 Can, +2 Hız)",
            "Saldırı aldığında, o tur boyunca takımındaki tüm dost kartlara +8 zırh verir. (+10 Hasar, +5 Can, +4 Hız)"
        ]
    }
];

let cardInstanceCounter = 1;

// Kart sınıfı - kartların davranışlarını ve özelliklerini tanımlar
class Card {
    constructor(data, cardEffects = null) {
        this.baseId = data.baseId || data.id;
        this.level = typeof data.level === 'number' ? data.level : 1;
        this.compoundId = data.compoundId || (this.baseId * 100 + this.level);
        this.id = this.compoundId;
        this.name = data.name;
        this.element = null;
        this.owner = null; // 1 veya 2 (1. veya 2. oyuncuya ait)
        this.instanceId = data.instanceId || cardInstanceCounter++;
        
        // Base değerleri saklayalım
        this.startingValues = {
            health: data.health,
            attack: data.attack,
            speed: data.speed,
            armor: data.armor || 0
        };

        this.levelStats = data.levelStats || null;
        this.levelAbilities = data.levelAbilities || null;
        this.levelDescriptions = data.levelDescriptions || null;

        // Açıklama metnini seviyeye göre eşleştir
        if (this.levelDescriptions && this.levelDescriptions[this.level - 1]) {
            this.description = this.levelDescriptions[this.level - 1];
        } else {
            this.description = data.description;
        }

        this.maxHealth = this.calculateLevelStat(this.startingValues.health, this.level, 10, 'health');
        this.health = this.maxHealth;
        this.attack = this.calculateLevelStat(this.startingValues.attack, this.level, 2, 'attack');
        this.speed = this.calculateLevelStat(this.startingValues.speed, this.level, 0, 'speed');
        this.armor = this.calculateLevelStat(this.startingValues.armor, this.level, 0, 'armor');
        this.cardEffects = cardEffects;
        
        // Özel yetenekler ve efektler için
        this.effects = {};
        this._originalAttack = data.attack;
        this._originalSpeed = data.speed;
        this._originalTakeDamage = null;
    }

    // Kart HTML elementini oluşturur
    createCardElement() {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.id = this.id;
        cardElement.dataset.baseId = this.baseId;
        cardElement.dataset.level = this.level;
        cardElement.dataset.name = this.name;
        cardElement.dataset.instanceId = this.instanceId;

        const cardContent = `
            <h3>${this.name} <span class="card-level">Lv ${this.level}</span></h3>
            <div class="card-stats">
                <div class="card-stat">❤️<br>${this.health}</div>
                <div class="card-stat">⚔️<br>${this.attack}</div>
                <div class="card-stat">⚡<br>${this.speed}</div>
                <div class="card-stat">🛡️<br>${this.armor}</div>
            </div>
            <div class="card-description">${this.description}</div>
        `;

        cardElement.innerHTML = cardContent;
        
        // Öldüyse ölü sınıfını ekle
        if (this.health <= 0) {
            cardElement.classList.add('dead');
        }
        
        // Sahibi 1 ise oyuncu 1'e ait sınıf ekle
        if (this.owner === 1) {
            cardElement.classList.add('player1-card');
        }
        // Sahibi 2 ise oyuncu 2'ye ait sınıf ekle
        else if (this.owner === 2) {
            cardElement.classList.add('player2-card');
        }
        
        // Element referansını kaydet
        this.element = cardElement;
        
        return cardElement;
    }

    // Kartın seviyesine göre HP / Attack değerini hesaplar
    calculateLevelStat(baseStat, level, flatIncrease, statName = null) {
        if (statName && this.levelStats && Array.isArray(this.levelStats[statName])) {
            const statValues = this.levelStats[statName];
            const index = Math.max(0, Math.min(statValues.length - 1, level - 1));
            return statValues[index];
        }
        return Math.floor(baseStat + (baseStat * 0.1 * (level - 1)) + (flatIncrease * (level - 1)));
    }

    updateLevelStats(newLevel) {
        this.level = Math.min(5, Math.max(1, newLevel));
        this.compoundId = this.baseId * 100 + this.level;
        this.id = this.compoundId;
        this.maxHealth = this.calculateLevelStat(this.startingValues.health, this.level, 10, 'health');
        this.health = this.maxHealth;
        this.attack = this.calculateLevelStat(this.startingValues.attack, this.level, 2, 'attack');
        this.speed = this.calculateLevelStat(this.startingValues.speed, this.level, 0, 'speed');
        this.armor = this.calculateLevelStat(this.startingValues.armor, this.level, 0, 'armor');
        
        // Seviye açıklamalarını güncelle
        if (this.levelDescriptions && this.levelDescriptions[this.level - 1]) {
            this.description = this.levelDescriptions[this.level - 1];
        }
        
        this.updateCardElement();
    }

    // Kart elementini günceller (savaş sırasında)
    updateCardElement() {
        if (typeof UI !== 'undefined' && UI.updateCard) {
            UI.updateCard(this);
        }
    }

    // Saldırı animasyonu
    attackAnimation() {
        if (typeof UI !== 'undefined' && UI.addAnimationClass) {
            UI.addAnimationClass(this, 'attacking', 500);
        } else {
            console.error(`${this.name} kartının elementi bulunamadı, animasyon yapılamıyor!`);
        }
    }

    // Hasar alma
    takeDamage(amount, attacker = null, type = 'physical') {
        // HATA KORUMASI: Gelen hasar zaten 0 veya daha az ise (kaçınma vb.),
        // negatif zırhın hasarı artıran matematiksel bug'ını önlemek için zırhı tamamen bypass ediyoruz.
        if (amount <= 0) {
            return { actualDamage: 0, isDead: this.health <= 0 };
        }

        let actualDamage = amount;
        let armorLog = '';
        if (typeof this.armor === 'number' && this.armor !== 0) {
            const beforeArmor = actualDamage;
            actualDamage -= this.armor;
            if (actualDamage < 0) actualDamage = 0;
            
            // Zırh log'unu sadece gerçek hasar varsa yaz
            if (actualDamage > 0 && attacker && attacker.gameState) {
                if (this.armor > 0) {
                    armorLog = `${this.name} zırhı sayesinde ${beforeArmor - actualDamage} hasarı engelledi! 🛡️`;
                    attacker.gameState.addToBattleLog(armorLog);
                } else if (this.armor < 0) {
                    armorLog = `${this.name} düşük zırhı nedeniyle ${Math.abs(this.armor)} fazladan hasar aldı! 🛡️`;
                    attacker.gameState.addToBattleLog(armorLog);
                }
            }
        }
        this.health = Math.max(0, this.health - actualDamage);
        this.updateCardElement();
        if (actualDamage > 0 && typeof UI !== 'undefined' && UI.showDamageText) {
            UI.showDamageText(this.element, actualDamage, type);
        }
        if (actualDamage > 0 && typeof UI !== 'undefined' && UI.addAnimationClass) {
            UI.addAnimationClass(this, 'damaged', 500);
        }
        const olduMu = this.health <= 0;
        if (olduMu && !this._deathEffectTriggered) {
            this._deathEffectTriggered = true;
            if (this.cardEffects) {
                const effect = this.cardEffects[this.baseId];
                if (effect && typeof effect.onDeath === 'function') {
                    effect.onDeath(this, this.gameState || null);
                }
            }
        }
        return { actualDamage, isDead: olduMu };
    }

    // Kart klonlama (yeni oyun için)
    clone() {
        const clonedCard = new Card({
            id: this.baseId,
            baseId: this.baseId,
            level: this.level,
            compoundId: this.compoundId,
            name: this.name,
            health: this.startingValues.health,
            attack: this.startingValues.attack,
            speed: this.startingValues.speed,
            armor: this.startingValues.armor,
            description: this.description,
            levelStats: this.levelStats,
            levelDescriptions: this.levelDescriptions,
            levelAbilities: this.levelAbilities
        }, this.cardEffects);

        clonedCard.hasAttackedThisTurn = this.hasAttackedThisTurn;

        if (this.effects && Object.keys(this.effects).length > 0) {
            clonedCard.effects = {...this.effects};
        }

        if (this._originalAttack !== null && this._originalAttack !== undefined) {
            clonedCard._originalAttack = this._originalAttack;
        }

        if (this._originalSpeed !== null && this._originalSpeed !== undefined) {
            clonedCard._originalSpeed = this._originalSpeed;
        }

        return clonedCard;
    }
    
    // Tur başlangıcında yapılacak işlemler
    onTurnStart(gameState) {
        this.hasAttackedThisTurn = false;
        this.hasAttackIncreasedThisTurn = false;

        if (this.cardEffects) {
            const effect = this.cardEffects[this.baseId];
            if (effect && typeof effect.onTurnStart === 'function') {
                effect.onTurnStart(this, gameState);
            }
        }

        this.hasAttackedThisTurn = false;
    }
    
    // Saldırı fonksiyonu - özel yetenekler
    performAttack(target, gameState) {
        if (!gameState) {
            console.error("gameState bulunamadı, saldırı yapılamıyor");
            return false;
        }

        if (this.hasAttackedThisTurn) {
            console.log(`${this.name} kartı bu turda zaten saldırdı!`);
            return false;
        }

        if (this.health <= 0) {
            console.log(`${this.name} kartı ölü olduğu için saldıramaz`);
            return false;
        }

        if (target.health <= 0) {
            console.log(`Hedef ${target.name} kartı ölü olduğu için saldırılamaz`);
            return false;
        }

        this.hasAttackedThisTurn = true;
        console.log(`${this.name} kartının hasAttackedThisTurn=true olarak işaretlendi`);

        this.gameState = gameState;
        this.attackAnimation();

        const { actualDamage, isDead } = target.takeDamage(this.attack, this);
        gameState.addToBattleLog(`${this.name} ⚔️ ${target.name}'e ${actualDamage} hasar verdi!`);

        if (this.cardEffects) {
            const effect = this.cardEffects[this.baseId];
            if (effect && typeof effect.onAttack === 'function') {
                effect.onAttack(this, target, gameState, { firstHitDamage: actualDamage });
            }
        }

        if (isDead) {
            gameState.addToBattleLog(`${target.name} öldü! ☠️`);
        }

        return isDead;
    }

    onGameStart(gameState) {
        if (this.cardEffects) {
            const effect = this.cardEffects[this.baseId];
            if (effect && typeof effect.onGameStart === 'function') {
                effect.onGameStart(this, gameState);
            }
        }
    }
}
// Bilgisayar (AI) için önceden tanımlanmış esnek deste havuzu
// İleride buraya sadece yeni nesneler ekleyerek deste sayısını dilediğiniz kadar artırabilirsiniz.
const aiPreMadeDecks = [
    {
        id: "random",
        name: "Tamamen Rastgele Deste",
        cardIds: [] // Boş olması, bilgisayarın tamamen rastgele 4 kart seçeceği anlamına gelir
    },
    {
        id: "attack",
        name: "Hücum Deste (Saldırı Odaklı)",
        cardIds: [1, 4, 6, 11] // Ateş Savaşçısı, Çevik Hançer, Kara Şövalye, İkiz Okçu
    },
    {
        id: "defense",
        name: "Savunma Duvarı (Defans & Şifa)",
        cardIds: [3, 7, 12, 9] // Taş Kalkan, Şifacı, Büyü Tazısı, Savaş Borazanı
    },
    {
        id: "poison",
        name: "Zehirli Diken (Yansıtma & Zehir)",
        cardIds: [8, 15, 13, 10] // Zehirli Ok, Dikenli Deri, Kalkan Kopyalayıcı, Kan Emici
    }
];
