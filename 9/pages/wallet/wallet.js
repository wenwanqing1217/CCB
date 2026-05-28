Page({
  data: {
    balance: 128.50,
    totalIncome: 356.00,
    totalExpense: 127.50,
    totalWithdraw: 100.00,
    coins: 580,
    records: [],
    showWithdraw: false,
    withdrawAmount: '',
    canWithdraw: false,
    showGameModal: false,
    gameType: '',
    gameTitle: '',
    gameTip: '',
    gameResult: null
  },

  onLoad() {
    this.loadRecords()
  },

  loadRecords() {
    wx.cloud.callFunction({
      name: 'getWalletRecords',
      success: res => {
        if (res.result) {
          this.setData({ records: res.result })
        }
      },
      fail: () => {
        this.setData({
          records: [
            { _id: '1', type: 'income', title: '盲盒出售收入', amount: 25.00, createTime: '2024-01-15 10:30' },
            { _id: '2', type: 'expense', title: '购买盲盒', amount: 15.00, createTime: '2024-01-14 15:20' },
            { _id: '3', type: 'income', title: '骑手配送收入', amount: 8.00, createTime: '2024-01-13 18:00' }
          ]
        })
      }
    })
  },

  showWithdraw() {
    this.setData({ showWithdraw: true })
  },

  closeWithdraw() {
    this.setData({ showWithdraw: false, withdrawAmount: '' })
  },

  onWithdrawInput(e) {
    const value = parseFloat(e.detail.value) || 0
    this.setData({ 
      withdrawAmount: e.detail.value,
      canWithdraw: value >= 1 && value <= this.data.balance
    })
  },

  withdrawAll() {
    this.setData({ 
      withdrawAmount: String(this.data.balance),
      canWithdraw: true
    })
  },

  confirmWithdraw() {
    if (!this.data.canWithdraw) return
    
    wx.showLoading({ title: '提现中..' })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '提现成功', icon: 'success' })
      this.closeWithdraw()
    }, 1000)
  },

  navigateToRecharge() {
    wx.showToast({ title: '充值功能暂未开放', icon: 'none' })
  },

  viewAllRecords() {
    wx.showToast({ title: '查看全部记录功能暂未开放', icon: 'none' })
  },

  playGame(e) {
    const game = e.currentTarget.dataset.game
    const titles = { spin: '幸运转盘', quiz: '知识问答', sign: '每日签到' }
    const tips = { spin: '点击开始抽奖', quiz: '回答问题赢取奖励', sign: '每日签到领取奖励' }
    
    this.setData({
      showGameModal: true,
      gameType: game,
      gameTitle: titles[game],
      gameTip: tips[game],
      gameResult: null
    })
  },

  closeGameModal() {
    this.setData({ showGameModal: false })
  },

  startGame() {
    wx.showLoading({ title: '游戏中..' })
    
    setTimeout(() => {
      wx.hideLoading()
      this.setData({
        gameResult: {
          icon: '一等奖',
          title: '恭喜中奖',
          amount: Math.floor(Math.random() * 50) + 10,
          desc: '获得金币奖励'
        },
        coins: this.data.coins + Math.floor(Math.random() * 50) + 10
      })
    }, 1500)
  }
})