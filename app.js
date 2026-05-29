/**
 * Campus BlindBox - App Entry
 */

const cloudUtils = require('./utils/cloud.js')

App({
  onLaunch() {
          console.error('璇蜂娇鐢?2.2.3 鎴栦互涓婄殑鍩虹搴撲互浣跨敤浜戣兘鍔?);
    } else {
      wx.cloud.init({
        env: 'cloud1-0g18d9ik5f541e32',
        traceUser: true
      });
    }
    
        
        
      },
  
  setupErrorHandler() {
    wx.onError((error) => {
      console.error('鍏ㄥ眬閿欒:', error);
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
      console.error('閿欒涓婃姤鍑芥暟鎵ц澶辫触:', err);
    }
  },
  
  checkLoginStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
                  this.getUserRole();
        }, 500);
      }
    } catch (error) {
      console.warn('妫€鏌ョ櫥褰曠姸鎬佸け璐?', error);
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
        },
  
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
          console.error('浜嬩欢鍥炶皟閿欒:', error);
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

