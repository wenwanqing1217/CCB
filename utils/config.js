// 配置管理模块 - 统一管理小程序配置

// 默认配置
const defaultConfig = {
  // 环境配置
  env: {
    name: 'production', // development | testing | production
    cloudEnv: 'cloud1-0g18d9ik5f541e32',
    baseUrl: '',
    timeout: 10000
  },
  
  // 性能配置
  performance: {
    enable: true,
    fpsMonitor: true,
    memoryMonitor: true,
    apiMonitor: true,
    pageLoadMonitor: true
  },
  
  // 缓存配置
  cache: {
    enable: true,
    defaultExpire: 5 * 60 * 1000, // 5分钟
    longExpire: 30 * 60 * 1000, // 30分钟
    shortExpire: 1 * 60 * 1000, // 1分钟
    dormHeatExpire: 2 * 60 * 1000, // 宿舍热度 2分钟
    maxSize: 100,
    lruEnabled: true
  },
  
  // 图片配置
  image: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 80,
    compressEnabled: true,
    lazyLoadEnabled: true,
    preloadEnabled: true,
    maxConcurrentPreload: 3
  },
  
  // 用户配置
  user: {
    defaultRole: 'student',
    defaultCoins: 10, // 新用户默认盲盒积分
    maxDormLength: 20,
    maxCollegeLength: 50
  },
  
  // 盲盒配置
  blindBox: {
    shakeCost: 10, // 摇一摇消耗盲盒积分
    maxShakeCount: 100, // 每日最大摇一摇次数
    rarityProbability: {
      rare: 5,     // 稀有 5%
      epic: 15,    // 史诗 15%
      uncommon: 30, // 优秀 30%
      common: 50   // 普通 50%
    }
  },
  
  // 积分配置
  points: {
    donationBase: 10, // 捐赠基础积分
    exchangeBase: 5,  // 交换基础积分
    shareBonus: 2,    // 分享奖励积分
    dailySignBonus: 5 // 每日签到奖励
  },
  
  // UI配置
  ui: {
    theme: 'dark', // dark | light
    animationEnabled: true,
    animationDuration: 300,
    toastDuration: 1500,
    loadingDelay: 300 // 显示加载的延迟时间（避免闪烁）
  },
  
  // 推送配置
  push: {
    enabled: true,
    autoSubscribe: true,
    categories: ['order', 'system', 'activity']
  },
  
  // 安全配置
  security: {
    requestLimit: 10, // 每分钟最大请求数
    passwordMinLength: 6,
    enableXssFilter: true,
    enableRateLimit: true
  },
  
  // 日志配置
  log: {
    level: 'info', // debug | info | warn | error
    enableConsole: true,
    enableReport: true,
    sampleRate: 0.1 // 采样率
  },
  
  // 开发配置
  dev: {
    mockData: false,
    showPerformancePanel: false,
    enableDebugTools: false
  }
};

class Config {
  constructor() {
    this.config = { ...defaultConfig };
    this.init();
  }

  init() {
    // 从本地存储加载配置
    this.loadFromStorage();
    
    // 根据环境变量覆盖配置
    this.loadFromEnv();
  }

  /**
   * 获取配置值
   * @param {string} path - 配置路径，如 'env.name'
   * @param {any} defaultValue - 默认值
   * @returns {any}
   */
  get(path, defaultValue = null) {
    if (!path) return this.config;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, this.config);
  }

  /**
   * 设置配置值
   * @param {string} path - 配置路径
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
    }, this.config);
    
    target[lastKey] = value;
    
    // 保存到本地存储
    this.saveToStorage();
  }

  /**
   * 更新配置（合并对象）
   * @param {string} path - 配置路径
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
   * 重置配置到默认值
   * @param {string} path - 配置路径（可选）
   */
  reset(path) {
    if (!path) {
      this.config = { ...defaultConfig };
    } else {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((current, key) => current[key], this.config);
      const defaultTarget = keys.reduce((current, key) => current[key], defaultConfig);
      
      if (defaultTarget && defaultTarget[lastKey] !== undefined) {
        target[lastKey] = defaultTarget[lastKey];
      }
    }
    
    this.saveToStorage();
  }

  /**
   * 保存到本地存储
   */
  saveToStorage() {
    try {
      wx.setStorageSync('appConfig', JSON.stringify(this.config));
    } catch (e) {
      console.error('保存配置失败:', e);
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromStorage() {
    try {
      const data = wx.getStorageSync('appConfig');
      if (data) {
        const parsed = JSON.parse(data);
        this.config = { ...this.config, ...parsed };
      }
    } catch (e) {
      console.error('加载配置失败:', e);
    }
  }

  /**
   * 从环境变量加载
   */
  loadFromEnv() {
    try {
      // #ifdef DEVELOPMENT
      this.config.env.name = 'development';
      this.config.dev.mockData = true;
      this.config.log.level = 'debug';
      // #endif
      
      // #ifdef TESTING
      this.config.env.name = 'testing';
      this.config.log.level = 'info';
      // #endif
      
      // #ifdef PRODUCTION
      this.config.env.name = 'production';
      this.config.log.level = 'warn';
      // #endif
    } catch (e) {
      console.error('加载环境配置失败:', e);
    }
  }

  /**
   * 获取环境名称
   * @returns {string}
   */
  getEnv() {
    return this.get('env.name', 'production');
  }

  /**
   * 是否为开发环境
   * @returns {boolean}
   */
  isDevelopment() {
    return this.get('env.name') === 'development';
  }

  /**
   * 是否为生产环境
   * @returns {boolean}
   */
  isProduction() {
    return this.get('env.name') === 'production';
  }

  /**
   * 获取云开发环境ID
   * @returns {string}
   */
  getCloudEnv() {
    return this.get('env.cloudEnv', 'cloud1-0g18d9ik5f541e32');
  }

  /**
   * 获取请求超时时间
   * @returns {number}
   */
  getTimeout() {
    return this.get('env.timeout', 10000);
  }

  /**
   * 获取图片配置
   * @returns {Object}
   */
  getImageConfig() {
    return this.get('image', {});
  }

  /**
   * 获取缓存配置
   * @returns {Object}
   */
  getCacheConfig() {
    return this.get('cache', {});
  }

  /**
   * 获取盲盒配置
   * @returns {Object}
   */
  getBlindBoxConfig() {
    return this.get('blindBox', {});
  }

  /**
   * 获取日志配置
   * @returns {Object}
   */
  getLogConfig() {
    return this.get('log', {});
  }

  /**
   * 获取UI配置
   * @returns {Object}
   */
  getUiConfig() {
    return this.get('ui', {});
  }

  /**
   * 获取性能配置
   * @returns {Object}
   */
  getPerformanceConfig() {
    return this.get('performance', {});
  }

  /**
   * 获取安全配置
   * @returns {Object}
   */
  getSecurityConfig() {
    return this.get('security', {});
  }

  /**
   * 获取开发配置
   * @returns {Object}
   */
  getDevConfig() {
    return this.get('dev', {});
  }

  /**
   * 打印当前配置
   */
  printConfig() {
    console.log('当前配置:', JSON.stringify(this.config, null, 2));
  }
}

// 导出单例
module.exports = new Config();