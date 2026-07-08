const starterDeck = [1, 3, 5, 7];

// 15 Aşamalı Harita Yapısı
const campaignMap = [
  { id: 0, type: 'battle', title: 'Eğitim', description: 'İlk savaşın', aiDeck: { deckId: 'attack', levelMode: 'flat', flatLevel: 1 } },
  { id: 1, type: 'battle', title: 'Düşman 1', description: 'Orman sınırı', aiDeck: { deckId: 'attack', levelMode: 'flat', flatLevel: 1 } },
  { id: 2, type: 'campfire', title: 'Kamp Ateşi', description: 'Dinlen ve canını yenile' },
  { id: 3, type: 'battle', title: 'Düşman 2', description: 'Dağ geçidi', aiDeck: { deckId: 'defense', levelMode: 'flat', flatLevel: 2 } },
  { id: 4, type: 'market', title: 'Market', description: 'Kart satın al' },
  { id: 5, type: 'battle', title: 'Düşman 3', description: 'Zehirli bataklık', aiDeck: { deckId: 'poison', levelMode: 'flat', flatLevel: 2 } },
  { id: 6, type: 'campfire', title: 'Kamp Ateşi', description: 'Dinlen ve canını yenile' },
  { id: 7, type: 'battle', title: 'Düşman 4', description: 'Karanlık orman', aiDeck: { deckId: 'attack', levelMode: 'flat', flatLevel: 3 } },
  { id: 8, type: 'workshop', title: 'Atölye', description: 'Kartlarını güçlendir' },
  { id: 9, type: 'battle', title: 'Düşman 5', description: 'Buzul zirvesi', aiDeck: { deckId: 'defense', levelMode: 'flat', flatLevel: 3 } },
  { id: 10, type: 'campfire', title: 'Kamp Ateşi', description: 'Dinlen ve canını yenile' },
  { id: 11, type: 'battle', title: 'Düşman 6', description: 'Alev vadisi', aiDeck: { deckId: 'attack', levelMode: 'flat', flatLevel: 4 } },
  { id: 12, type: 'market', title: 'Market', description: 'Kart satın al' },
  { id: 13, type: 'battle', title: 'Düşman 7', description: 'Son kale', aiDeck: { deckId: 'defense', levelMode: 'flat', flatLevel: 4 } },
  { id: 14, type: 'boss', title: 'Final Boss', description: 'Son savaş', aiDeck: { deckId: 'attack', levelMode: 'flat', flatLevel: 5 } }
];

const missions = [
  {
    id: 'mission_1',
    title: 'Orman Sınırı',
    description: 'İlk görevde orman bölgesindeki AI karşısında kendini kanıtla.',
    aiDeck: { deckId: 'attack', levelMode: 'flat', flatLevel: 1 },
    rewardChoices: 3,
    rewardPool: [2, 4, 6, 8]
  },
  {
    id: 'mission_2',
    title: 'Dağ Geçidi',
    description: 'Daha sert bir rakibe karşı yüksekte duran savunmayı test et.',
    aiDeck: { deckId: 'defense', levelMode: 'flat', flatLevel: 2 },
    rewardChoices: 3,
    rewardPool: [9, 10, 11]
  }
];

function getRewardPool(missionId) {
  const mission = missions.find(item => item.id === missionId);
  return mission ? mission.rewardPool : [];
}

function getNodeById(nodeId) {
  return campaignMap.find(node => node.id === nodeId);
}

function getNextNode(currentNodeId) {
  const currentIndex = campaignMap.findIndex(node => node.id === currentNodeId);
  if (currentIndex >= 0 && currentIndex < campaignMap.length - 1) {
    return campaignMap[currentIndex + 1];
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.campaignData = { starterDeck, missions, getRewardPool, campaignMap, getNodeById, getNextNode };
}

// Node.js için module.exports (tarayıcıda çalışmaz)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { starterDeck, missions, getRewardPool, campaignMap, getNodeById, getNextNode };
}
