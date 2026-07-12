// Server-side validation functions

// Deste doğrulama: 4 kart ve 18 puan kontrolü
function validateDeck(deck) {
    if (!deck || !Array.isArray(deck)) {
        return { valid: false, error: 'Deste geçersiz' };
    }

    // Tam olarak 4 kart olmalı
    if (deck.length !== 4) {
        return { valid: false, error: 'Tam olarak 4 kart seçilmelidir' };
    }

    // Her kartın baseId ve level özelliği olmalı
    for (let i = 0; i < deck.length; i++) {
        const card = deck[i];
        if (card.baseId === undefined || card.baseId === null) {
            return { valid: false, error: `Kart ${i + 1} geçersiz - baseId eksik` };
        }

        // Level kontrolü - string gelirse sayıya çevir
        const level = typeof card.level === 'string' ? parseInt(card.level) : card.level;
        if (typeof level !== 'number' || isNaN(level)) {
            return { valid: false, error: `Kart ${i + 1} seviyesi geçersiz` };
        }

        // Seviye 1-5 arası olmalı
        if (level < 1 || level > 5) {
            return { valid: false, error: `Kart ${i + 1} seviyesi geçersiz (1-5 arası olmalı)` };
        }
    }

    // Toplam puan hesapla (kümülatif seviye maliyeti)
    let totalPoints = 0;
    for (const card of deck) {
        const level = typeof card.level === 'string' ? parseInt(card.level) : card.level;
        // Seviye 1 → 2: 1 puan
        // Seviye 2 → 3: 2 puan (toplam: 3)
        // Seviye 3 → 4: 3 puan (toplam: 6)
        // Seviye 4 → 5: 4 puan (toplam: 10)
        const upgradeCost = Math.floor(((level - 1) * level) / 2);
        totalPoints += upgradeCost;
    }

    // 18 puan sınırı
    if (totalPoints > 18) {
        return { valid: false, error: `Puan limiti aşıldı (${totalPoints}/18)` };
    }

    return { valid: true, totalPoints };
}

module.exports = {
    validateDeck
};
