const starterDeck = [2, 11, 6, 4]; // Buz Büyücüsü, İkiz Okçu, Kara Şövalye, Çevik Hançer

// 26 Düğümlü Sefer Haritası
const campaignMap = [
  { id: 0, type: 'battle', title: 'Eğitim', description: 'İlk savaşın', isTutorial: true },
  { id: 1, type: 'battle', title: 'Düşman 1', description: 'Orman sınırı' },
  { id: 2, type: 'battle', title: 'Düşman 2', description: 'Dağ geçidi' },
  { id: 3, type: 'workshop', title: 'Atölye', description: 'Kartlarını güçlendir' },
  { id: 4, type: 'battle', title: 'Düşman 3', description: 'Zehirli bataklık' },
  { id: 5, type: 'market', title: 'Market', description: 'Kart satın al' },
  { id: 6, type: 'battle', title: 'Düşman 4', description: 'Karanlık orman' },
  { id: 7, type: 'battle', title: 'Düşman 5', description: 'Buzul zirvesi' },
  { id: 8, type: 'campfire', title: 'Kamp Ateşi', description: 'Dinlen ve canını yenile' },
  { id: 9, type: 'battle', title: 'Düşman 6', description: 'Alev vadisi' },
  { id: 10, type: 'workshop', title: 'Atölye', description: 'Kartlarını güçlendir' },
  { id: 11, type: 'battle', title: 'Düşman 7', description: 'Son kale' },
  { id: 12, type: 'market', title: 'Market', description: 'Kart satın al' },
  { id: 13, type: 'battle', title: 'Düşman 8', description: 'Karanlık mağara' },
  { id: 14, type: 'battle', title: 'Düşman 9', description: 'Eski tapınak' },
  { id: 15, type: 'workshop', title: 'Atölye', description: 'Kartlarını güçlendir' },
  { id: 16, type: 'battle', title: 'Düşman 10', description: 'Yıldız kulesi' },
  { id: 17, type: 'campfire', title: 'Kamp Ateşi', description: 'Dinlen ve canını yenile' },
  { id: 18, type: 'battle', title: 'Düşman 11', description: 'Ejderha yuvası' },
  { id: 19, type: 'market', title: 'Market', description: 'Kart satın al' },
  { id: 20, type: 'battle', title: 'Düşman 12', description: 'Karanlık orman' },
  { id: 21, type: 'battle', title: 'Düşman 13', description: 'Buzul zirvesi' },
  { id: 22, type: 'battle', title: 'Düşman 14', description: 'Son kale' },
  { id: 23, type: 'market', title: 'Market', description: 'Kart satın al' },
  { id: 24, type: 'campfire', title: 'Kamp Ateşi', description: 'Dinlen ve canını yenile' },
  { id: 25, type: 'boss', title: 'Final Boss', description: 'Son savaş' }
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
