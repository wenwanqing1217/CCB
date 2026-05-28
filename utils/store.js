// 状态管理模块 - 用于管理小程序全局状态

class Store {
  constructor() {
    this.state = {
      // 用户信息
      user: {
        info: null,
        role: 'student',
        dorm: '',
        loveScore: 0,
        blindBoxCoins: 0
      },
      // 应用状态
      app: {
        loading: false,
        networkStatus: 'online',
        theme: 'dark',
        language: 'zh-CN'
      },
      // UI状态
      ui: {
        showAITip: true,
        toast: null,
        modal: null,
        loading: false
      },
      // 数据缓存
      cache: {
        hotBoxes: [],
        communityFeed: [],
        grabOrders: [],
        dormHeat: []
      }
    };
    
    // 订阅者列表
    this.subscribers = {};
    
    // 初始化
    this.init();
  }

  init() {
    // 从本地存储恢复状态
    this.restoreFromStorage();
    
    // 监听网络状态
    this.listenNetworkStatus();
  }

  /**
   * 获取状态
   * @param {string} path - 状态路径，如 'user.info'
   * @returns {any}
   */
  get(path) {
    if (!path) {
      return this.state;
    }
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, this.state);
  }

  /**
   * 设置状态
   * @param {string} path - 状态路径
   * @param {any} value - 新值
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, this.state);
    
    target[lastKey] = value;
    
    // 触发订阅者
    this.notifySubscribers(path, value);
    
    // 保存到本地存储
    this.saveToStorage();
  }

  /**
   * 更新状态（合并对象）
   * @param {string} path - 状态路径
   * @param {Object} value - 要合并的值
   */
  update(path, value) {
    const current = this.get(path);
    if (current && typeof current === 'object') {
      const merged = { ...current, ...value };
      this.set(path, merged);
    } else {
      this.set(path, value);
    }
  }

  /**
   * 重置状态
   * @param {string} path - 状态路径（可选）
   */
  reset(path) {
    if (!path) {
      this.state = {
        user: {
          info: null,
          role: 'student',
          dorm: '',
          loveScore: 0,
          blindBoxCoins: 0
        },
        app: {
          loading: false,
          networkStatus: 'online',
          theme: 'dark',
          language: 'zh-CN'
        },
        ui: {
          showAITip: true,
          toast: null,
          modal: null,
          loading: false
        },
        cache: {
          hotBoxes: [],
          communityFeed: [],
          grabOrders: [],
          dormHeat: []
        }
      };
    } else {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((current, key) => current[key], this.state);
      
      // 根据类型重置
      if (typeof target[lastKey] === 'object' && target[lastKey] !== null) {
        if (Array.isArray(target[lastKey])) {
          target[lastKey] = [];
        } else {
          target[lastKey] = {};
        }
      } else {
        target[lastKey] = null;
      }
    }
    
    this.notifySubscribers(path, this.get(path));
    this.saveToStorage();
  }

  /**
   * 订阅状态变化
   * @param {string} path - 状态路径
   * @param {Function} callback - 回调函数
   * @returns {Function} - 取消订阅函数
   */
  subscribe(path, callback) {
    if (!this.subscribers[path]) {
      this.subscribers[path] = [];
    }
    
    this.subscribers[path].push(callback);
    
    // 返回取消订阅函数
    return () => {
      const index = this.subscribers[path].indexOf(callback);
      if (index > -1) {
        this.subscribers[path].splice(index, 1);
      }
    };
  }

  /**
   * 通知订阅者
   * @param {string} path - 状态路径
   * @param {any} value - 新值
   */
  notifySubscribers(path, value) {
    // 通知精确匹配的订阅者
    if (this.subscribers[path]) {
      this.subscribers[path].forEach(callback => {
        try {
          callback(value);
        } catch (e) {
          console.error('订阅者回调出错:', e);
        }
      });
    }
    
    // 通知父级路径的订阅者
    const keys = path.split('.');
    for (let i = keys.length - 1; i > 0; i--) {
      const parentPath = keys.slice(0, i).join('.');
      if (this.subscribers[parentPath]) {
        this.subscribers[parentPath].forEach(callback => {
          try {
            callback(this.get(parentPath));
          } catch (e) {
            console.error('订阅者回调出错:', e);
          }
        });
      }
    }
  }

  /**
   * 保存到本地存储
   */
  saveToStorage() {
    try {
      // 只保存需要持久化的数据
      const persistData = {
        user: this.state.user,
        ui: {
          showAITip: this.state.ui.showAITip
        }
      };
      wx.setStorageSync('store', JSON.stringify(persistData));
    } catch (e) {
      console.error('保存状态失败:', e);
    }
  }

  /**
   * 从本地存储恢复
   */
  restoreFromStorage() {
    try {
      const data = wx.getStorageSync('store');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.user) {
          this.state.user = { ...this.state.user, ...parsed.user };
        }
        if (parsed.ui && parsed.ui.showAITip !== undefined) {
          this.state.ui.showAITip = parsed.ui.showAITip;
        }
      }
    } catch (e) {
      console.error('恢复状态失败:', e);
    }
  }

  /**
   * 监听网络状态
   */
  listenNetworkStatus() {
    wx.onNetworkStatusChange((res) => {
      this.set('app.networkStatus', res.isConnected ? 'online' : 'offline');
      
      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none',
          duration: 2000
        });
      }
    });
    
    // 初始检查
    wx.getNetworkType({
      success: (res) => {
        this.set('app.networkStatus', res.networkType === 'none' ? 'offline' : 'online');
      }
    });
  }

  /**
   * 设置用户信息
   * @param {Object} userInfo - 用户信息
   */
  setUser(userInfo) {
    this.update('user', userInfo);
  }

  /**
   * 获取用户信息
   * @returns {Object}
   */
  getUser() {
    return this.get('user');
  }

  /**
   * 设置加载状态
   * @param {boolean} loading - 是否加载中
   */
  setLoading(loading) {
    this.set('app.loading', loading);
    this.set('ui.loading', loading);
  }

  /**
   * 显示Toast
   * @param {Object} toast - Toast配置
   */
  showToast(toast) {
    this.set('ui.toast', toast);
    wx.showToast({
      title: toast.title,
      icon: toast.icon || 'none',
      duration: toast.duration || 1500,
      mask: toast.mask || false
    });
    
    // 自动隐藏
    setTimeout(() => {
      this.set('ui.toast', null);
    }, toast.duration || 1500);
  }

  /**
   * 显示Modal
   * @param {Object} modal - Modal配置
   * @returns {Promise}
   */
  showModal(modal) {
    this.set('ui.modal', modal);
    
    return new Promise((resolve) => {
      wx.showModal({
        title: modal.title || '提示',
        content: modal.content || '',
        showCancel: modal.showCancel !== undefined ? modal.showCancel : true,
        cancelText: modal.cancelText || '取消',
        confirmText: modal.confirmText || '确定',
        cancelColor: modal.cancelColor || '#999999',
        confirmColor: modal.confirmColor || '#7c3aed',
        success: (res) => {
          this.set('ui.modal', null);
          resolve(res.confirm);
        }
      });
    });
  }

  /**
   * 更新缓存数据
   * @param {string} key - 缓存键
   * @param {Array} data - 数据
   */
  updateCache(key, data) {
    if (this.state.cache[key] !== undefined) {
      this.set(`cache.${key}`, data);
    }
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @returns {Array}
   */
  getCache(key) {
    return this.get(`cache.${key}`);
  }
}

// 导出单例
module.exports = new Store();