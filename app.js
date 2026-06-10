const cloudUtils = require('./utils/cloud.js')
// Patch runtime to add scheduleSetData helper to Page and Component
try { require('./utils/schedule.js')(); } catch (e) { console.warn('schedule init failed', e); }

App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-0g18d9ik5f541e32',
        traceUser: true
      });
    }
    
    // 简化错误处理，避免控制台刷屏
    // this.setupErrorHandler(); // 暂时禁用
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 预加载常用数据（已移除，改为由首页统一加载）
    // this.preloadData();
  },
  
  setupErrorHandler() {
    wx.onError((error) => {
      console.error('全局错误:', error);
      this.reportError(error);
    });
  },
  
  async reportError(error) {
    try {
      await cloudUtils.callCloudFunction({
        name: 'reportError',
        data: {
          error: error.toString(),
          timestamp: new Date().toISOString(),
          path: getCurrentPages().length ? getCurrentPages()[getCurrentPages().length - 1].route : 'unknown'
        },
        showLoading: false,
        showError: false
      });
    } catch (err) {
      console.error('错误上报函数执行失败:', err);
    }
  },
  
  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        // 延迟获取角色信息，避免阻塞启动
        setTimeout(() => {
          this.getUserRole();
        }, 500);
      }
    } catch (error) {
      console.warn('检查登录状态失败:', error);
    }
  },
  
  async getUserRole() {
    try {
      const result = await cloudUtils.callCloudFunction({
        name: 'getUserInfo',
        showLoading: false,
        showError: false,
        useCache: true,
        cacheKey: 'userInfo'
      });
      if (result) {
        this.globalData.userRole = result.role || 'student';
        this.globalData.userDorm = result.dorm || '';
        this.globalData.loveScore = result.love_score || 0;
        this.globalData.blindBoxCoins = result.blindBoxCoins || 0;
        this.triggerEvent('loginSuccess', result);
      }
    } catch (err) {
      // 静默处理，不显示错误，避免控制台刷屏
      this.globalData.userRole = 'student';
    }
  },
  
  async preloadData() {
    try {
      const result = await cloudUtils.callCloudFunction({
        name: 'getHotBoxes',
        showLoading: false,
        showError: false,
        useCache: true,
        cacheKey: 'hotBoxes'
      });
      if (result && result.data) {
        this.globalData.hotBoxes = result.data;
      }
    } catch (err) {
      // 静默处理，热门数据不是关键路径
    }
  },
  
  // 事件触发机制
  events: {},
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  },
  
  triggerEvent(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('事件回调错误:', error);
        }
      });
    }
  },
  
  globalData: {
    userInfo: null,
    userRole: 'student',
    userDorm: '',
    loveScore: 0,
    hotBoxes: [],
    loading: false,
    blindBoxCoins: 0
  }
});
