const starterDeck = [1, 3, 5, 7];

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

if (typeof window !== 'undefined') {
  window.campaignData = { starterDeck, missions, getRewardPool };
}

module.exports = { starterDeck, missions, getRewardPool };
