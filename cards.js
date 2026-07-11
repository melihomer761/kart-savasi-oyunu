const cardsData = [
    {
        id: 0,
        name: "Gardiyan",
        health: 10,
        attack: 10,
        speed: 5,
        armor: 0,
        description: "Basit bir gardiyan kartı. Özelliği yok.",
        levelStats: {
            health: [10, 25, 40, 55, 70],
            attack: [10, 15, 20, 25, 30],
            speed: [5, 6, 7, 8, 9],
            armor: [0, 1, 2, 3, 4]
        },
        levelAbilities: {},
        levelDescriptions: [
            "Basit bir gardiyan kartı. Özelliği yok.",
            "Basit bir gardiyan kartı. Özelliği yok.",
            "Basit bir gardiyan kartı. Özelliği yok.",
            "Basit bir gardiyan kartı. Özelliği yok.",
            "Basit bir gardiyan kartı. Özelliği yok."
        ]
    },
    {
        id: 1,
        name: "Ateş Savaşçısı",
        health: 137,
        attack: 18,
        speed: 7,
        armor: 2,
        description: "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 11 hasar alır.",
        levelStats: {
            health: [137, 137, 137, 137, 137],
            attack: [18, 24, 24, 24, 24],
            speed: [7, 7, 7, 7, 7],
            armor: [2, 2, 2, 4, 4]
        },
        levelAbilities: {
            splashDamage: [11, 11, 17, 17, 22]
        },
        levelDescriptions: [
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 11 hasar alır.",
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 11 hasar alır. (+6 Hasar)",
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 17 hasar alır. (+6 Hasar)",
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 17 hasar alır. (+6 Hasar, +2 Zırh)",
            "Saldırısı rakibini ve yanındaki kartları alev patlamasıyla vurur. Yan kartlar 22 hasar alır. (+6 Hasar, +2 Zırh)"
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
        description: "Gelen hasarın %30'unu engeller.",
        levelStats: {
            health: [150, 170, 170, 170, 170],
            attack: [15, 15, 15, 21, 21],
            speed: [3, 3, 3, 3, 3],
            armor: [0, 0, 0, 0, 0]
        },
        levelAbilities: {
            damageReduction: [30, 30, 40, 40, 50]
        },
        levelDescriptions: [
            "Gelen hasarın %30'unu engeller.",
            "Gelen hasarın %30'unu engeller. (+20 Can)",
            "Gelen hasarın %40'ını engeller. (+20 Can)",
            "Gelen hasarın %40'ını engeller. (+20 Can, +6 Hasar)",
            "Gelen hasarın %50'sini engeller. (+20 Can, +6 Hasar)"
        ]
    },
    {
        id: 4,
        name: "Çevik Hançer",
        health: 70,
        attack: 13,
        speed: 10,
        armor: 0,
        description: "Peş peşe 3 kez hasar verir.",
        levelStats: {
            health: [70, 84, 84, 84, 84],
            attack: [13, 13, 7, 10, 4],
            speed: [10, 10, 10, 10, 10],
            armor: [0, 0, 0, 2, 2]
        },
        levelAbilities: {
            attackCount: [3, 3, 4, 4, 5]
        },
        levelDescriptions: [
            "Peş peşe 3 kez hasar verir.",
            "Peş peşe 3 kez hasar verir. (+14 Can)",
            "Peş peşe 4 kez hasar verir. (+14 Can, -6 Hasar)",
            "Peş peşe 4 kez hasar verir. (+14 Can, +3 Hasar, +2 Zırh)",
            "Peş peşe 5 kez hasar verir. (+14 Can, -6 Hasar, +2 Zırh)"
        ]
    },
    {
        id: 5,
        name: "Hayalet",
        health: 48,
        attack: 35,
        speed: 9,
        armor: -4,
        description: "İlk 3 saldırıda %55 kaçınma şansına sahiptir.",
        levelStats: {
            health: [48, 60, 60, 60, 60],
            attack: [35, 35, 35, 43, 43],
            speed: [8, 8, 8, 8, 8],
            armor: [-4, -4, -4, -4, -4]
        },
        levelAbilities: {
            dodgeChance: [45, 45, 55, 55, 55],
            dodgeCount: [3, 3, 4, 4, 6]
        },
        levelDescriptions: [
            "İlk 3 saldırıda %45 kaçınma şansına sahiptir.",
            "İlk 3 saldırıda %45 kaçınma şansına sahiptir. (+12 Can)",
            "İlk 4 saldırıda %55 kaçınma şansına sahiptir. (+12 Can)",
            "İlk 4 saldırıda %55 kaçınma şansına sahiptir. (+12 Can, +8 Hasar,)",
            "İlk 6 saldırıda %55 kaçınma şansına sahiptir. (+12 Can, +8 Hasar,)"
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
            health: [185, 185, 185, 185, 210],
            attack: [20, 23, 23, 23, 23],
            speed: [5, 5, 5, 5, 5],
            armor: [-8, -8, -4, -4, 1]
        },
        levelAbilities: {
            attackGrowth: [4, 4, 4, 6, 6]
        },
        levelDescriptions: [
            "Her tur başında saldırı gücü 4 artar.",
            "Her tur başında saldırı gücü 4 artar. (+3 Hasar)",
            "Her tur başında saldırı gücü 4 artar. (+3 Hasar, +4 Zırh)",
            "Her tur başında saldırı gücü 6 artar. (+3 Hasar, +4 Zırh)",
            "Her tur başında saldırı gücü 6 artar. (+3 Hasar, +4 Zırh, +25 can)"
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
            health: [75, 75, 75, 90, 90],
            attack: [10, 10, 14, 14, 14],
            speed: [6, 6, 6, 6, 6],
            armor: [2, 2, 2, 2, 2]
        },
        levelAbilities: {
            healAmount: [8, 12, 12, 12, 18]
        },
        levelDescriptions: [
            "Her turda tüm dost kartlara +8 can verir. Maksimum canı aşabilir.",
            "Her turda tüm dost kartlara +12 can verir. Maksimum canı aşabilir.",
            "Her turda tüm dost kartlara +12 can verir. Maksimum canı aşabilir. (+4 Hasar)",
            "Her turda tüm dost kartlara +12 can verir. Maksimum canı aşabilir. (+4 Hasar, +10 Can)",
            "Her turda tüm dost kartlara +18 can verir. Maksimum canı aşabilir. (+4 Hasar, +10 Can)"
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
            health: [175, 175, 175, 175, 175],
            attack: [16, 16, 16, 16, 16],
            speed: [6, 6, 6, 6, 6],
            armor: [-2, -2, -2, -2, -2]
        },
        levelAbilities: {
            poisonDamage: [9, 11, 14, 14, 19],
            poisonArmorReduction: [1, 1, 2, 2, 2],
            poisonDuration: [2, 3, 3, 5, 5]
        },
        levelDescriptions: [
            "Zehirlediği rakip 2 tur boyunca her tur 9 hasar alır ve zırhı 1 azalır.",
            "Zehirlediği rakip 3 tur boyunca her tur 11 hasar alır ve zırhı 1 azalır.",
            "Zehirlediği rakip 3 tur boyunca her tur 14 hasar alır ve zırhı 2 azalır. ",
            "Zehirlediği rakip 5 tur boyunca her tur 14 hasar alır ve zırhı 2 azalır.",
            "Zehirlediği rakip 5 tur boyunca her tur 19 hasar alır ve zırhı 2 azalır."
        ]
    },
    {
        id: 9,
        name: "Savaş Borazanı",
        health: 130,
        attack: 12,
        speed: 1,
        armor: 1,
        description: "Yaşadığı sürece dost kartların saldırı gücü +3, hızı +1 artar.",
        levelStats: {
            health: [100, 100, 100, 100, 123],
            attack: [12, 17, 17, 17, 17],
            speed: [1, 1, 1, 1, 1],
            armor: [1, 1, 1, 1, 1]
        },
        levelAbilities: {
            attackBonus: [2, 2, 3, 3, 6],
            speedBonus: [1, 1, 1, 2, 2]
        },
        levelDescriptions: [
            "Yaşadığı sürece dost kartların saldırı gücü +2, hızı +1 artar.",
            "Yaşadığı sürece dost kartların saldırı gücü +2, hızı +1 artar. (+5 Hasar)",
            "Yaşadığı sürece dost kartların saldırı gücü +3, hızı +1 artar. (+5 Hasar)",
            "Yaşadığı sürece dost kartların saldırı gücü +3, hızı +2 artar. (+5 Hasar)",
            "Yaşadığı sürece dost kartların saldırı gücü +6, hızı +2 artar. (+5 Hasar, +23 Can)"
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
            healPercentage: [55, 55, 55, 55, 65]
        },
        levelDescriptions: [
            "İki kez vurur ve verdiği hasarın %55'ı kadar kendi canını iyileştirir.",
            "İki kez vurur ve verdiği hasarın %55'ı kadar kendi canını iyileştirir. (+2 Hasar)",
            "İki kez vurur ve verdiği hasarın %55'ı kadar kendi canını iyileştirir. (+2 Hasar, +2 Hız)",
            "İki kez vurur ve verdiği hasarın %55'ı kadar kendi canını iyileştirir. (+5 Hasar, +2 Hız)",
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
            attack: [21, 21, 26, 26, 26],
            speed: [5, 5, 5, 5, 5],
            armor: [3, 3, 3, 5, 5]
        },
        levelAbilities: {
            doubleTargetChance: [60, 60, 60, 60, 100]
        },
        levelDescriptions: [
            "Her saldırıda %60 şansla rastgele ikinci hedef vurur.",
            "Her saldırıda %60 şansla rastgele ikinci hedef vurur. (+20 Can)",
            "Her saldırıda %60 şansla rastgele ikinci hedef vurur. (+20 Can, +5 Hasar,)",
            "Her saldırıda %60 şansla rastgele ikinci hedef vurur. (+20 Can, +5 Hasar, +2 Zırh)",
            "Her saldırıda iki hedef vurur. (+20 Can, +5 Hasar, +1 Hız, +2 Zırh)"
        ]
    },
    {
        id: 12,
        name: "Büyü Tazısı",
        health: 112,
        attack: 21,
        speed: 4,
        armor: 6,
        description: "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır.",
        levelStats: {
            health: [112, 120, 120, 120, 130],
            attack: [21, 21, 26, 26, 26],
            speed: [4, 4, 4, 4, 4],
            armor: [6, 6, 6, 7, 7]
        },
        levelDescriptions: [
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır.",
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır. (+8 Can)",
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır. (+8 Can, +5 Hasar)",
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır. (+8 Can, +5 Hasar, +1 Zırh)",
            "Sahadayken tüm düşman saldırılarını üzerine çeker. Zehirli saldırılara karşı bağışıktır. (+18 Can, +5 Hasar, +1 Zırh)"
        ]
    },
    {
        id: 13,
        name: "Kalkan Kopyalayıcı",
        health: 77,
        attack: 23,
        speed: 6,
        armor: 0,
        description: "Saldırıya uğradığında rakibin zırhını +2 ile kopyalar.",
        levelStats: {
            health: [77, 77, 77, 77, 77],
            attack: [23, 23, 29, 29, 29],
            speed: [6, 6, 6, 10, 10],
            armor: [0, 0, 0, 0, 0]
        },
        levelAbilities: {
            armorCopyBonus: [2, 3, 3, 3, 5]
        },
        levelDescriptions: [
            "Saldırıya uğradığında rakibin zırhını +2 ile kopyalar.",
            "Saldırıya uğradığında rakibin zırhını +3 ile kopyalar.",
            "Saldırıya uğradığında rakibin zırhını +3 ile kopyalar. (+6 Hasar)",
            "Saldırıya uğradığında rakibin zırhını +3 ile kopyalar. (+6 Hasar, +4 Hız)",
            "Saldırıya uğradığında rakibin zırhını +5 ile kopyalar. (+6 Hasar, +4 Hız)"
        ]
    },
    {
        id: 14,
        name: "Öfke Ayini",
        health: 70,
        attack: 19,
        speed: 4,
        armor: 0,
        description: "Savaş başında tüm dost kartların hızını 3, zırhını 2 azaltır; ancak saldırı güçlerini 6 arttırır.",
        levelStats: {
            health: [65, 65, 65, 65, 65],
            attack: [19, 25, 25, 25, 25],
            speed: [4, 4, 4, 4, 4],
            armor: [0, 0, 0, 0, 0]
        },
        levelAbilities: {
            speedDebuff: [2, 2, 4, 3, 5],
            armorDebuff: [4, 4, 6, 4, 6],
            attackBuff: [6, 6, 9, 9, 15]
        },
        levelDescriptions: [
            "Savaş başında tüm dost kartların hızını 2, zırhını 4 azaltır; ancak saldırı güçlerini 6 arttırır.",
            "Savaş başında tüm dost kartların hızını 2, zırhını 4 azaltır; ancak saldırı güçlerini 6 arttırır. (+6 Hasar)",
            "Savaş başında tüm dost kartların hızını 4, zırhını 6 azaltır; ancak saldırı güçlerini 9 arttırır. (+6 Hasar)",
            "Savaş başında tüm dost kartların hızını 3, zırhını 4 azaltır; ancak saldırı güçlerini 9 arttırır. (+6 Hasar)",
            "Savaş başında tüm dost kartların hızını 5, zırhını 6 azaltır; ancak saldırı güçlerini 15 arttırır. (+6 Hasar)"
        ]
    },
    {
        id: 15,
        name: "Dikenli Deri",
        health: 200,
        attack: 9,
        speed: 6,
        armor: -10,
        description: "Saldırana alınan hasarın %30'unu yansıtır.",
        levelStats: {
            health: [210, 240, 240, 240, 275],
            attack: [9, 9, 9, 16, 16],
            speed: [6, 6, 6, 6, 6],
            armor: [-10, -10, -10, -5, -5]
        },
        levelAbilities: {
            reflectPercentage: [30, 30, 40, 40, 45]
        },
        levelDescriptions: [
            "Saldırana alınan hasarın %30'unu yansıtır.",
            "Saldırana alınan hasarın %30'unu yansıtır. (+30 Can)",
            "Saldırana alınan hasarın %40'ını yansıtır. (+30 Can)",
            "Saldırana alınan hasarın %40'ını yansıtır. (+30 Can, +7 Hasar, +5 Zırh)",
            "Saldırana alınan hasarın %45'ini yansıtır. (+65 Can, +7 Hasar, +5 Zırh)"
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

        // Maç sonu istatistikleri
        this.battleStats = {
            damageDealt: 0,
            damageBlocked: 0,
            attacksCount: 0,
            damageTaken: 0  // Giden can istatistiği
        };
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
        if (amount <= 0) {
            return { actualDamage: 0, isDead: this.health <= 0 };
        }

        let actualDamage = amount;
        let armorLog = '';

        // Yansıtma (reflect) ve Zehir (poison) hasarı zırhı tamamen yok sayar
        if (type !== 'reflect' && type !== 'poison' && typeof this.armor === 'number' && this.armor !== 0) {
            const beforeArmor = actualDamage;
            actualDamage -= this.armor;
            if (actualDamage < 0) actualDamage = 0;
            
            const blocked = beforeArmor - actualDamage;
            if (blocked > 0) {
                this.battleStats.damageBlocked += blocked;
            }

            // Zırh log'unu sadece gerçek hasar varsa yaz
            if (actualDamage > 0 && attacker && attacker.gameState) {
                if (this.armor > 0) {
                    armorLog = `${this.name} zırhı sayesinde ${blocked} hasarı engelledi! 🛡️`;
                    attacker.gameState.addToBattleLog(armorLog);
                } else if (this.armor < 0) {
                    armorLog = `${this.name} düşük zırhı nedeniyle ${Math.abs(this.armor)} fazladan hasar aldı! 🛡️`;
                    attacker.gameState.addToBattleLog(armorLog);
                }
            }
        }

        this.health = Math.max(0, this.health - actualDamage);
        this.battleStats.damageTaken += actualDamage; // Giden can kaydı

        // Hasar veren karta istatistik yaz
        if (attacker && actualDamage > 0) {
            attacker.battleStats.damageDealt += actualDamage;
        }

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
        this.battleStats.attacksCount++; // Sadece aktif olarak saldırdığı turlarda 1 kez artar
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
const aiPreMadeDecks = [
    {
        id: "random",
        name: "Tamamen Rastgele Deste",
        cardIds: []
    },
    {
        id: "attack",
        name: "Hücum Deste (Saldırı Odaklı)",
        cardIds: [1, 4, 6, 11]
    },
    {
        id: "defense",
        name: "Savunma Duvarı (Defans & Şifa)",
        cardIds: [3, 7, 12, 9]
    },
    {
        id: "poison",
        name: "Zehirli Diken (Yansıtma & Zehir)",
        cardIds: [8, 15, 13, 10]
    }
];

// Global olarak expose et
if (typeof window !== 'undefined') {
    window.cardsData = cardsData;
    window.aiPreMadeDecks = aiPreMadeDecks;
}