const config = require('../../utils/config.js');
const { ALL_DORMS, COLLEGES } = require('../../utils/campusData.js');

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      name: '',
      avatar: '',
      id: ''
    },
    campusInfo: {
      college: '',
      dorm: ''
    },
    stats: {
      publish: 0,
      sold: 0,
      bought: 0,
      score: 0
    },
    userLevel: 1,
    levelClass: 'level-1',
    vipLevel: 0,
    vipName: '',
    vipDesc: '',
    vipProgress: 0,
    vipNeedScore: 100,
    isRider: false,
    isMerchant: false,
    isCertified: false,
    isAdmin: false,
    riderLevel: 1,
    todayEarnings: 0,
    walletBalance: 0,
    certStatus: 'none',
    certStatusText: '未认证',
    unreadCount: 0,
    showCampusInfo: false,
    colleges: COLLEGES,
    dorms: ALL_DORMS,
    isLoggingIn: false, // 添加登录状态锁
    blindBoxCoins: 0, // 盲盒积分
    hasSignedIn: false, // 是否已签到
    isSigningIn: false // 签到状态锁
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    // 避免重复检查登录状态
    if (!this.data.isLoggedIn) {
      this.checkLogin();
    }
    // 设置自定义 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4
      });
    }
  },

  onPullDownRefresh() {
    this.loadUserData();
    wx.stopPullDownRefresh();
  },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: {
          name: userInfo.nickName || '用户',
          avatar: userInfo.avatarUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20icon%20simple%20clean&image_size=square',
          id: userInfo._id || '100001'
        }
      });
      this.loadUserData();
    }
  },

  doLogin() {
    // 防止重复调用
    if (this.data.isLoggingIn) {
      wx.showToast({ title: '登录中，请稍候', icon: 'none' });
      return;
    }

    this.setData({ isLoggingIn: true });
    const that = this;

    // 先尝试使用 wx.getUserProfile（推荐方式）
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: res => {
        console.log('getUserProfile 成功:', res);
        that.handleLoginSuccess(res.userInfo);
      },
      fail: err => {
        console.log('getUserProfile 失败:', err);
        // 降级方案：使用 wx.getUserInfo
        that.tryGetUserInfo();
      }
    });
  },

  // 降级方案：使用 wx.getUserInfo
  tryGetUserInfo() {
    const that = this;
    wx.getUserInfo({
      success: res => {
        console.log('getUserInfo 成功:', res);
        that.handleLoginSuccess(res.userInfo);
      },
      fail: err => {
        console.log('getUserInfo 失败:', err);
        that.setData({ isLoggingIn: false });
        if (config.getDevConfig().mockData) {
          that.handleAnonymousLogin();
        } else {
          wx.showToast({ title: '需要授权才能登录', icon: 'none' });
        }
      }
    });
  },

  // 处理登录成功
  handleLoginSuccess(userInfo) {
    const that = this;
    
    // 调用登录云函数
    wx.cloud.callFunction({
      name: 'userService',
      data: {
        action: 'login',
        data: {
          userInfo,
          code: ''
        }
      },
      success: loginRes => {
        console.log('云函数登录成功:', loginRes);
        console.log('result内容:', loginRes.result);
        console.log('success字段:', loginRes.result?.success);
        console.log('user字段:', loginRes.result?.user);
        
        // 兼容处理：云函数可能直接返回数据，也可能包装在 result 中
        const result = loginRes.result || loginRes;
        
        if (!result.success || !result.user) {
          console.warn('云函数返回异常:', result);
          that.setData({ isLoggingIn: false });
          wx.showToast({ title: result.message || '登录失败，请重试', icon: 'none' });
          return;
        }
        
        const user = result.user;
        userInfo._id = user._id;
        userInfo.openid = user.openid;
        wx.setStorageSync('userInfo', userInfo);
        that.setData({
          isLoggedIn: true,
          isLoggingIn: false,
          userInfo: {
            name: userInfo.nickName || '微信用户',
            avatar: userInfo.avatarUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20icon%20simple%20clean&image_size=square',
            id: user._id || '100001'
          },
          campusInfo: user.campusInfo || { college: '', dorm: '' }
        });
        wx.showToast({ title: '登录成功', icon: 'success' });
        that.loadUserData();
      },
      fail: err => {
        console.error('云函数登录失败:', err);
        that.setData({ isLoggingIn: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  // 匿名登录（仅开发环境 mockData 开启时可用）
  handleAnonymousLogin() {
    if (!config.getDevConfig().mockData) {
      wx.showToast({ title: '需要授权才能登录', icon: 'none' });
      return;
    }
    const that = this;
    const userInfo = {
      nickName: '微信用户',
      avatarUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20user%20avatar%20icon%20simple%20clean&image_size=square'
    };
    
    wx.cloud.callFunction({
      name: 'userService',
      data: {
        action: 'login',
        data: {
          userInfo,
          code: ''
        }
      },
      success: loginRes => {
        if (loginRes.result && loginRes.result.success) {
          const user = loginRes.result.user;
          userInfo._id = user._id;
          wx.setStorageSync('userInfo', userInfo);
          that.setData({
            isLoggedIn: true,
            isLoggingIn: false,
            userInfo: {
              name: userInfo.nickName,
              avatar: userInfo.avatarUrl,
              id: user._id
            },
            campusInfo: user.campusInfo || { college: '', dorm: '' }
          });
          wx.showToast({ title: '登录成功', icon: 'success' });
          that.loadUserData();
        } else {
          that.setData({ isLoggingIn: false });
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      },
      fail: err => {
        console.error('匿名登录失败:', err);
        that.setData({ isLoggingIn: false });
        wx.showToast({ title: '登录失败，请检查网络', icon: 'none' });
      }
    });
  },

  loadUserData() {
    if (!this.data.isLoggedIn) {
      return;
    }

    const userInfo = wx.getStorageSync('userInfo');
    // 获取用户信息，包括校园信息
    wx.cloud.callFunction({
      name: 'userService',
      data: {
        action: 'getUserInfo',
        data: {
          openid: userInfo.openid
        }
      },
      success: userRes => {
        if (userRes.result.success) {
          const user = userRes.result.user;
          this.setData({
            campusInfo: user.campusInfo || { college: '', dorm: '' }
          });
        }
      }
    });

    wx.cloud.callFunction({
      name: 'getUserStats',
      success: res => {
        if (res.result) {
          const stats = res.result.stats || this.data.stats;
          const levelInfo = this.calculateLevel(stats.score);
          const vipInfo = this.calculateVIP(stats.score);
          
          this.setData({
            stats,
            isRider: res.result.isRider || false,
            isMerchant: res.result.isMerchant || false,
            isCertified: res.result.certStatus === 'verified',
            isAdmin: res.result.isAdmin || false,
            riderLevel: res.result.riderLevel || 1,
            todayEarnings: res.result.todayEarnings || 0,
            walletBalance: res.result.walletBalance || 0,
            certStatus: res.result.certStatus || 'none',
            certStatusText: res.result.certStatusText || '未认证',
            unreadCount: res.result.unreadCount || 0,
            ...levelInfo,
            ...vipInfo
          });
        }
      },
      fail: () => {
        wx.showToast({ title: '加载用户信息失败', icon: 'none' });
      }
    });
  },

  toggleCampusInfo() {
    this.setData({
      showCampusInfo: !this.data.showCampusInfo
    });
  },

  bindCollegeChange(e) {
    this.setData({
      'campusInfo.college': this.data.colleges[e.detail.value]
    });
  },

  bindDormChange(e) {
    this.setData({
      'campusInfo.dorm': this.data.dorms[e.detail.value]
    });
  },

  submitCampusInfo() {
    const { college, dorm } = this.data.campusInfo;
    if (!college || !dorm) {
      wx.showToast({ title: '请填写完整校园信息', icon: 'none' });
      return;
    }

    const userInfo = wx.getStorageSync('userInfo');
    wx.cloud.callFunction({
      name: 'userService',
      data: {
        action: 'updateCampusInfo',
        data: {
          openid: userInfo.openid,
          college,
          dorm
        }
      },
      success: res => {
        if (res.result.success) {
          wx.showToast({ title: '校园信息更新成功', icon: 'success' });
          this.setData({ showCampusInfo: false });
        } else {
          wx.showToast({ title: '更新失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '更新失败', icon: 'none' });
      }
    });
  },

  calculateLevel(score) {
    let level = 1;
    let levelClass = 'level-1';
    
    if (score >= 1000) {
      level = 5;
      levelClass = 'level-5';
    } else if (score >= 500) {
      level = 4;
      levelClass = 'level-4';
    } else if (score >= 200) {
      level = 3;
      levelClass = 'level-3';
    } else if (score >= 50) {
      level = 2;
      levelClass = 'level-2';
    }
    
    return { userLevel: level, levelClass };
  },

  calculateVIP(score) {
    let vipLevel = 0;
    let vipName = '';
    let vipDesc = '';
    let vipProgress = 0;
    let vipNeedScore = 0;
    
    if (score >= 2000) {
      vipLevel = 3;
      vipName = '钻石会员';
      vipDesc = '享受所有高级特权，包括优先发货、专属客服等';
      vipProgress = Math.min(100, ((score - 2000) / 1000) * 100);
      vipNeedScore = Math.max(0, 3000 - score);
    } else if (score >= 500) {
      vipLevel = 2;
      vipName = '黄金会员';
      vipDesc = '享受部分高级特权，包括免费配送等';
      vipProgress = ((score - 500) / 1500) * 100;
      vipNeedScore = 2000 - score;
    } else if (score >= 100) {
      vipLevel = 1;
      vipName = '白银会员';
      vipDesc = '享受基础特权，包括积分加速等';
      vipProgress = ((score - 100) / 400) * 100;
      vipNeedScore = 500 - score;
    } else {
      vipProgress = (score / 100) * 100;
      vipNeedScore = 100 - score;
    }
    
    return { vipLevel, vipName, vipDesc, vipProgress, vipNeedScore };
  },

  editProfile() {
    wx.navigateTo({ url: '../certification/certification' });
  },

  navigateToMyPublish() {
    if (!this.checkLoginStatus()) {
      return;
    }
    wx.navigateTo({ url: '../myPublish/myPublish' });
  },

  navigateToOrder() {
    if (!this.checkLoginStatus()) {
      return;
    }
    wx.navigateTo({ url: '../order/order' });
  },

  navigateToFavorite() {
    if (!this.checkLoginStatus()) {
      return;
    }
    wx.navigateTo({ url: '../favorite/favorite' });
  },

  navigateToAddress() {
    if (!this.checkLoginStatus()) {
      return;
    }
    wx.navigateTo({ url: '../address/address' });
  },

  navigateToWallet() {
    if (!this.checkLoginStatus()) {
      return;
    }
    wx.navigateTo({ url: '../wallet/wallet' });
  },

  navigateToCertification() {
    if (!this.checkLoginStatus()) {
      return;
    }
    wx.navigateTo({ url: '../certification/certification' });
  },

  navigateToRider() {
    wx.navigateTo({ url: '../rider/rider' });
  },

  navigateToMerchantApply() {
    wx.navigateTo({ url: '../merchantApply/merchantApply' });
  },

  navigateToMerchant() {
    wx.navigateTo({ url: '../merchant/merchant' });
  },

  navigateToMessage() {
    if (!this.checkLoginStatus()) {
      return;
    }
    wx.navigateTo({ url: '../ai/ai?tab=message' });
  },

  navigateToAI() {
    wx.navigateTo({ url: '../ai/ai' });
  },

  navigateToAdmin() {
    if (!this.checkLoginStatus()) {
      return;
    }
    wx.navigateTo({ url: '../admin/admin' });
  },

  checkLoginStatus() {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return false;
    }
    return true;
  },

  showAbout() {
    wx.navigateTo({ url: '../about/about' });
  },

  // 签到功能
  doSignIn() {
    if (this.data.isSigningIn) {
      wx.showToast({ title: '签到中，请稍候', icon: 'none' });
      return;
    }

    if (this.data.hasSignedIn) {
      wx.showToast({ title: '今日已签到', icon: 'none' });
      return;
    }

    this.setData({ isSigningIn: true });

    wx.cloud.callFunction({
      name: 'coinService',
      data: {
        action: 'signIn',
        data: {
          openid: wx.getStorageSync('userInfo').openid
        }
      },
      success: (res) => {
        this.setData({ isSigningIn: false });
        if (res.result && res.result.success) {
          this.setData({
            blindBoxCoins: this.data.blindBoxCoins + res.result.coins,
            hasSignedIn: true
          });
          wx.showToast({
            title: `签到成功，获得${res.result.coins}积分`,
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.result?.message || '签到失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        this.setData({ isSigningIn: false });
        console.error('签到失败:', err);
        wx.showToast({ title: '签到失败', icon: 'none' });
      }
    });
  },

  // 获取盲盒积分
  loadBlindBoxCoins() {
    if (!this.data.isLoggedIn) {
      return;
    }

    wx.cloud.callFunction({
      name: 'userService',
      data: {
        action: 'getUserInfo',
        data: {
          openid: wx.getStorageSync('userInfo').openid
        }
      },
      success: (res) => {
        if (res.result && res.result.success && res.result.user) {
          this.setData({
            blindBoxCoins: res.result.user.blindBoxCoins || 0
          });
        }
      },
      fail: () => {
        console.warn('获取盲盒积分失败');
      }
    });
  },

  // 跳转到摇一摇页面
  navigateToBlindBox() {
    wx.switchTab({ url: '../love/love' });
  },

  navigateToCoinLog() {
    wx.navigateTo({ url: '../coinLog/coinLog' });
  }
});