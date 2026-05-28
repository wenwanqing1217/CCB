Page({
  data: {
    coinLogs: [],
    isLoading: true,
    hasMore: true,
    page: 0,
    totalCoins: 0
  },

  onLoad() {
    this.loadCoinLogs()
  },

  onShow() {
    // 页面显示时刷新数据
    this.setData({ page: 0, coinLogs: [], hasMore: true })
    this.loadCoinLogs()
  },

  loadCoinLogs() {
    if (!this.data.hasMore || this.data.isLoading) return

    this.setData({ isLoading: true })

    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.openid) {
      this.setData({ isLoading: false })
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    wx.cloud.callFunction({
      name: 'coinService',
      data: {
        action: 'getCoinLog',
        data: {
          openid: userInfo.openid,
          page: this.data.page,
          size: 20
        }
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const logs = res.result.logs || []
          const newLogs = this.data.page === 0 ? logs : [...this.data.coinLogs, ...logs]
          
          this.setData({
            coinLogs: newLogs,
            hasMore: logs.length === 20,
            isLoading: false
          })
        } else {
          this.setData({ isLoading: false })
          wx.showToast({ title: '获取记录失败', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ isLoading: false })
        // 使用模拟数据
        this.useMockData()
      }
    })
  },

  useMockData() {
    const mockLogs = [
      {
        _id: '1',
        type: 'signIn',
        amount: 1,
        balance: 25,
        description: '每日签到',
        createdAt: new Date()
      },
      {
        _id: '2',
        type: 'consume',
        amount: -10,
        balance: 24,
        description: '摇一摇消耗',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        _id: '3',
        type: 'share',
        amount: 2,
        balance: 34,
        description: '分享商品',
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        _id: '4',
        type: 'signIn',
        amount: 1,
        balance: 32,
        description: '每日签到',
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        _id: '5',
        type: 'donate',
        amount: 5,
        balance: 31,
        description: '参与公益捐赠',
        createdAt: new Date(Date.now() - 172800000)
      }
    ]
    this.setData({
      coinLogs: mockLogs,
      isLoading: false,
      hasMore: false
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({ page: this.data.page + 1 })
      this.loadCoinLogs()
    }
  },

  getTypeIcon(type) {
    const icons = {
      signIn: '📅',
      share: '🔗',
      invite: '👥',
      firstTrade: '💼',
      donate: '❤️',
      consume: '🎁'
    }
    return icons[type] || '📊'
  },

  getTypeColor(type) {
    const colors = {
      signIn: '#22c55e',
      share: '#3b82f6',
      invite: '#8b5cf6',
      firstTrade: '#f59e0b',
      donate: '#ef4444',
      consume: '#6b7280'
    }
    return colors[type] || '#6b7280'
  },

  formatTime(date) {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前'
    } else if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前'
    } else {
      return `${d.getMonth() + 1}月${d.getDate()}日`
    }
  },

  goBack() {
    wx.navigateBack()
  }
})