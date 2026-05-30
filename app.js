/**
 * Campus BlindBox - App Entry
 * 校园盲盒小程序入口
 */

const cloudUtils = require('./utils/cloud.js')

App({
  onLaunch() {
    // 检查云能力
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-0g18d9ik5f541e32',
        traceUser: true
      });
    }

    // 检查登录状态
    this.checkLoginStatus();
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
        // 延迟获取用户角色，等待云函数就绪
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
        this.globalData.userDorm = result.campusInfo?.dorm || '';
        this.globalData.loveScore = result.lovePoints || 0;
        this.globalData.blindBoxCoins = result.blindBoxCoins || 0;
        this.emit('loginSuccess', result);
      }
    } catch (err) {
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
      if (result && result.boxes) {
        this.globalData.hotBoxes = result.boxes;
      }
    } catch (err) {
      console.error('预加载数据失败:', err);
    }
  },

  // 自定义事件系统
  _eventHandlers: {},

  on(event, callback) {
    if (!this._eventHandlers[event]) {
      this._eventHandlers[event] = [];
    }
    this._eventHandlers[event].push(callback);
  },

  off(event, callback) {
    if (this._eventHandlers[event]) {
      this._eventHandlers[event] = this._eventHandlers[event].filter(cb => cb !== callback);
    }
  },

  emit(event, data) {
    if (this._eventHandlers[event]) {
      this._eventHandlers[event].forEach(callback => {
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
