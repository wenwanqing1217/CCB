Page({
  data: {
    activeCategory: 'all',
    showDetailModal: false,
    detailItem: {},
    stats: { total: 18, unlocked: 7, rareCount: 2 },
    progressPercent: 39,
    achievements: [
      { id: 'box1', category: 'box', icon: '🎁', name: '初次开盒', desc: '开启你的第一个盲盒', rarity: 'common', unlocked: true, unlockedTime: '2026-06-01', conditionText: '开启1个盲盒', maxProgress: 0, reward: '10积分' },
      { id: 'box2', category: 'box', icon: '📦', name: '开盒达人', desc: '累计开启50个盲盒', rarity: 'uncommon', unlocked: true, unlockedTime: '2026-06-05', conditionText: '开启50个盲盒', progress: 50, maxProgress: 50, reward: '50积分' },
      { id: 'box3', category: 'box', icon: '💎', name: '开盒大师', desc: '累计开启200个盲盒', rarity: 'rare', unlocked: false, conditionText: '开启200个盲盒', progress: 67, maxProgress: 200, reward: '稀有头像框' },
      { id: 'box4', category: 'box', icon: '🌟', name: '传说收藏家', desc: '获得一个传说级物品', rarity: 'legendary', unlocked: false, conditionText: '开出传说级稀有度', progress: 0, maxProgress: 1, reward: '传说称号' },
      { id: 'social1', category: 'social', icon: '💬', name: '社交新星', desc: '发布第一条社区动态', rarity: 'common', unlocked: true, unlockedTime: '2026-06-02', conditionText: '发布1条动态', maxProgress: 0, reward: '5积分' },
      { id: 'social2', category: 'social', icon: '❤️', name: '人气之星', desc: '累计收到100个赞', rarity: 'uncommon', unlocked: false, conditionText: '获赞100次', progress: 34, maxProgress: 100, reward: '30积分' },
      { id: 'social3', category: 'social', icon: '🤝', name: '爱心使者', desc: '完成1次捐赠', rarity: 'rare', unlocked: false, conditionText: '完成捐赠', progress: 0, maxProgress: 1, reward: '爱心徽章' },
      { id: 'rider1', category: 'rider', icon: '🛵', name: '初出茅庐', desc: '完成第一次配送', rarity: 'common', unlocked: true, unlockedTime: '2026-06-03', conditionText: '完成1单配送', maxProgress: 0, reward: '10积分' },
      { id: 'rider2', category: 'rider', icon: '🏍️', name: '骑手之星', desc: '累计完成100单配送', rarity: 'epic', unlocked: false, conditionText: '完成100单配送', progress: 23, maxProgress: 100, reward: '史诗骑手皮肤' },
      { id: 'rider3', category: 'rider', icon: '⚡', name: '闪电骑手', desc: '单日完成20单配送', rarity: 'rare', unlocked: false, conditionText: '单日配送20单', progress: 0, maxProgress: 20, reward: '闪电称号' },
      { id: 'special1', category: 'special', icon: '🎯', name: '完美开盒', desc: '连续开出3个稀有及以上品质', rarity: 'epic', unlocked: true, unlockedTime: '2026-06-07', conditionText: '连续3次稀有以上', maxProgress: 0, reward: '100积分' },
      { id: 'special2', category: 'special', icon: '👑', name: '校园名人', desc: '在排行榜进入前三', rarity: 'legendary', unlocked: false, conditionText: '排行榜前三', progress: 0, maxProgress: 1, reward: '传说称号+头像框' },
      { id: 'special3', category: 'special', icon: '💪', name: '签到达人', desc: '连续签到30天', rarity: 'uncommon', unlocked: false, conditionText: '连续签到30天', progress: 5, maxProgress: 30, reward: '20积分' },
      { id: 'special4', category: 'special', icon: '🏪', name: '创业先锋', desc: '成功发布10个盲盒', rarity: 'rare', unlocked: false, conditionText: '发布10个盲盒', progress: 3, maxProgress: 10, reward: '商家流量券' },
    ]
  },

  onLoad() {
    this.calcProgress()
  },

  calcProgress() {
    const total = this.data.achievements.length
    const unlocked = this.data.achievements.filter(a => a.unlocked).length
    const rareCount = this.data.achievements.filter(a => a.unlocked && (a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary')).length
    this.setData({
      'stats.total': total,
      'stats.unlocked': unlocked,
      'stats.rareCount': rareCount,
      progressPercent: Math.round(unlocked / total * 100)
    })
  },

  switchCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.cat })
  },

  showDetail(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.achievements.find(a => a.id === id)
    if (item) {
      const rarityLabels = { common: '普通', uncommon: '稀有', rare: '精良', epic: '史诗', legendary: '传说' }
      this.setData({
        detailItem: { ...item, rarityLabel: rarityLabels[item.rarity] || '普通' },
        showDetailModal: true
      })
    }
  },

  closeDetail() {
    this.setData({ showDetailModal: false })
  }
})
