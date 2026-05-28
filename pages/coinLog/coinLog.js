Page({
  data: {
    coinLogs: [],
    isLoading: true,
    hasMore: true,
    page: 0,
    totalCoins: 0
  },

  onLoad() {
    this.loadCoinLogs();
  },

  onShow() {
    // 页面显示时刷新数据
    this.setData({ page: 0, coinLogs: [], hasMore: true });
    this.loadCoinLogs();
  },

  loadCoinLogs() {
    if (!this.data.hasMore || this.data.isLoading) {
      return;
    }

    this.setData({ isLoading: true });

    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.openid) {
      this.setData({ isLoading: false });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
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
          const logs = res.result.logs || [];
          const newLogs = this.data.page === 0 ? logs : [...this.data.coinLogs, ...logs];
          
          this.setData({
            coinLogs: newLogs,
            hasMore: logs.length === 20,
            isLoading: false
          });
        } else {
          this.setData({ isLoading: false, coinLogs: [], hasMore: false });
          wx.showToast({ title: '获取记录失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ isLoading: false, coinLogs: [], hasMore: false });
        wx.showToast({ title: '获取记录失败', icon: 'none' });
      }
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({ page: this.data.page + 1 });
      this.loadCoinLogs();
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
    };
    return icons[type] || '📊';
  },

  getTypeColor(type) {
    const colors = {
      signIn: '#22c55e',
      share: '#3b82f6',
      invite: '#8b5cf6',
      firstTrade: '#f59e0b',
      donate: '#ef4444',
      consume: '#6b7280'
    };
    return colors[type] || '#6b7280';
  },

  formatTime(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    } else if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前';
    } else {
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    }
  },

  goBack() {
    wx.navigateBack();
  }
});