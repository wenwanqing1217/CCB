Page({
  data: {
    balance: 0,
    totalIncome: 0,
    totalExpense: 0,
    totalWithdraw: 0,
    coins: 0,
    showBalance: true,
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
    this.loadWalletData();
  },

  // 合并 setData 更新，减少渲染压力
  scheduleSetData(changes) {
    if (!this._pendingSetData) this._pendingSetData = {};
    Object.assign(this._pendingSetData, changes);
    if (!this._flushScheduled) {
      this._flushScheduled = true;
      setTimeout(() => {
        this._flushScheduled = false;
        try {
          this.setData(this._pendingSetData);
        } catch (e) {
          for (const k in this._pendingSetData) {
            const o = {};
            o[k] = this._pendingSetData[k];
            this.setData(o);
          }
        }
        this._pendingSetData = {};
      }, 16);
    }
  },

  loadWalletData() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.openid) {
      wx.cloud.callFunction({
        name: 'userService',
        data: {
          action: 'getUserInfo',
          data: { openid: userInfo.openid }
        },
        success: res => {
          if (res.result && res.result.success && res.result.user) {
            const user = res.result.user;
            this.scheduleSetData({
              balance: user.walletBalance || 0,
              coins: user.blindBoxCoins || 0
            });
          }
        },
        fail: () => {
          wx.showToast({ title: '加载余额失败', icon: 'none' });
        }
      });
    }
    this.loadRecords();
  },

  loadRecords() {
    wx.cloud.callFunction({
      name: 'getWalletRecords',
      success: res => {
        const result = res.result || {};
        if (result.success === false) {
          wx.showToast({ title: '加载记录失败', icon: 'none' });
          this.scheduleSetData({ records: [] });
          return;
        }
        const records = result.records || (Array.isArray(result) ? result : []);
        const totalIncome = records
          .filter(r => r.type === 'income')
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const totalExpense = records
          .filter(r => r.type === 'expense')
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const totalWithdraw = records
          .filter(r => r.type === 'withdraw')
          .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        this.scheduleSetData({ records, totalIncome, totalExpense, totalWithdraw });
      },
      fail: () => {
        wx.showToast({ title: '加载记录失败', icon: 'none' });
        this.scheduleSetData({ records: [] });
      }
    });
  },

  toggleBalance() {
    this.scheduleSetData({ showBalance: !this.data.showBalance });
  },

  showWithdraw() {
    this.scheduleSetData({ showWithdraw: true });
  },

  closeWithdraw() {
    this.scheduleSetData({ showWithdraw: false, withdrawAmount: '' });
  },

  onWithdrawInput(e) {
    const value = parseFloat(e.detail.value) || 0;
    this.scheduleSetData({
      withdrawAmount: e.detail.value,
      canWithdraw: value >= 1 && value <= this.data.balance
    });
  },

  withdrawAll() {
    this.scheduleSetData({
      withdrawAmount: String(this.data.balance),
      canWithdraw: this.data.balance >= 1
    });
  },

  confirmWithdraw() {
    if (!this.data.canWithdraw) {
      return;
    }

    wx.showLoading({ title: '提现中..' });

    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '提现功能暂未开放', icon: 'none' });
      this.closeWithdraw();
    }, 500);
  },

  navigateToRecharge() {
    wx.showToast({ title: '充值功能暂未开放', icon: 'none' });
  },

  viewAllRecords() {
    wx.showToast({ title: '查看全部记录功能暂未开放', icon: 'none' });
  },

  playGame(e) {
    const game = e.currentTarget.dataset.game;
    const titles = { spin: '幸运转盘', quiz: '知识问答', sign: '每日签到' };
    const tips = { spin: '点击开始抽奖', quiz: '回答问题赢取奖励', sign: '每日签到领取奖励' };

    this.scheduleSetData({
      showGameModal: true,
      gameType: game,
      gameTitle: titles[game],
      gameTip: tips[game],
      gameResult: null
    });
  },

  closeGameModal() {
    this.scheduleSetData({ showGameModal: false });
  },

  startGame() {
    wx.showToast({ title: '游戏功能暂未开放', icon: 'none' });
    this.closeGameModal();
  },

  shareApp() {
    wx.showToast({ title: '请使用右上角分享', icon: 'none' });
  },

  viewIncome() {},
  viewExpense() {},
  viewWithdraw() {}
});
