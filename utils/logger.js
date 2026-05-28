// 日志管理模块 - 统一管理小程序日志

const config = require('./config');

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// 日志级别名称映射
const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR'
};

class Logger {
  constructor() {
    this.config = config.getLogConfig();
    this.logQueue = [];
    this.isReporting = false;
    this.reportInterval = null;
    
    this.init();
  }

  init() {
    // 设置定时上报
    this.setupReportInterval();
    
    // 监听配置变化
    this.watchConfig();
  }

  /**
   * 设置定时上报
   */
  setupReportInterval() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
    
    // 每30秒上报一次日志
    this.reportInterval = setInterval(() => {
      this.reportLogs();
    }, 30000);
  }

  /**
   * 监听配置变化
   */
  watchConfig() {
    // 定时检查配置变化
    setInterval(() => {
      this.config = config.getLogConfig();
    }, 5000);
  }

  /**
   * 获取当前日志级别
   * @returns {number}
   */
  getCurrentLevel() {
    const level = this.config.level || 'info';
    return LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  }

  /**
   * 是否应该输出日志
   * @param {number} level - 日志级别
   * @returns {boolean}
   */
  shouldLog(level) {
    return level >= this.getCurrentLevel();
  }

  /**
   * 格式化日志消息
   * @param {number} level - 日志级别
   * @param {string} message - 消息
   * @param {any} data - 附加数据
   * @returns {Object}
   */
  formatLog(level, message, data) {
    return {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      message,
      data: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null,
      page: this.getCurrentPage(),
      device: this.getDeviceInfo(),
      appVersion: this.getAppVersion()
    };
  }

  /**
   * 获取当前页面
   * @returns {string}
   */
  getCurrentPage() {
    try {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        return pages[pages.length - 1].route || 'unknown';
      }
    } catch (e) {
      // 忽略错误
    }
    return 'unknown';
  }

  /**
   * 获取设备信息
   * @returns {Object}
   */
  getDeviceInfo() {
    try {
      const info = wx.getSystemInfoSync();
      return {
        platform: info.platform,
        version: info.version,
        screenWidth: info.screenWidth,
        screenHeight: info.screenHeight,
        devicePixelRatio: info.devicePixelRatio,
        model: info.model,
        system: info.system
      };
    } catch (e) {
      return {};
    }
  }

  /**
   * 获取应用版本
   * @returns {string}
   */
  getAppVersion() {
    try {
      const info = wx.getAccountInfoSync();
      return info.miniProgram.version || '1.0.0';
    } catch (e) {
      return '1.0.0';
    }
  }

  /**
   * 输出日志到控制台
   * @param {number} level - 日志级别
   * @param {Object} log - 日志对象
   */
  logToConsole(level, log) {
    if (!this.config.enableConsole) {
      return;
    }

    const prefix = `[${log.timestamp}] [${log.level}] [${log.page}]`;
    
    switch (level) {
      case LOG_LEVELS.DEBUG:
        console.debug(`${prefix} ${log.message}`, log.data ? JSON.parse(log.data) : '');
        break;
      case LOG_LEVELS.INFO:
        console.info(`${prefix} ${log.message}`, log.data ? JSON.parse(log.data) : '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(`${prefix} ${log.message}`, log.data ? JSON.parse(log.data) : '');
        break;
      case LOG_LEVELS.ERROR:
        console.error(`${prefix} ${log.message}`, log.data ? JSON.parse(log.data) : '');
        break;
    }
  }

  /**
   * 添加到日志队列
   * @param {Object} log - 日志对象
   */
  addToQueue(log) {
    this.logQueue.push(log);
    
    // 限制队列大小
    if (this.logQueue.length > 100) {
      this.logQueue = this.logQueue.slice(-100);
    }
  }

  /**
   * 上报日志
   */
  async reportLogs() {
    if (!this.config.enableReport || this.logQueue.length === 0 || this.isReporting) {
      return;
    }

    this.isReporting = true;
    
    try {
      // 采样
      let logsToReport = this.logQueue;
      if (this.config.sampleRate < 1) {
        logsToReport = this.logQueue.filter(() => Math.random() < this.config.sampleRate);
      }
      
      if (logsToReport.length > 0) {
        const result = await wx.cloud.callFunction({
          name: 'reportError',
          data: {
            logs: logsToReport,
            type: 'log'
          },
          showLoading: false,
          showError: false
        });
        
        if (result && result.errMsg === 'cloud.callFunction:ok') {
          // 上报成功，清空队列
          this.logQueue = [];
          console.log('日志上报成功');
        }
      }
    } catch (e) {
      console.error('日志上报失败:', e);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 调试日志
   * @param {string} message - 消息
   * @param {any} data - 附加数据
   */
  debug(message, data = null) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) {
      return;
    }
    
    const log = this.formatLog(LOG_LEVELS.DEBUG, message, data);
    this.logToConsole(LOG_LEVELS.DEBUG, log);
    this.addToQueue(log);
  }

  /**
   * 信息日志
   * @param {string} message - 消息
   * @param {any} data - 附加数据
   */
  info(message, data = null) {
    if (!this.shouldLog(LOG_LEVELS.INFO)) {
      return;
    }
    
    const log = this.formatLog(LOG_LEVELS.INFO, message, data);
    this.logToConsole(LOG_LEVELS.INFO, log);
    this.addToQueue(log);
  }

  /**
   * 警告日志
   * @param {string} message - 消息
   * @param {any} data - 附加数据
   */
  warn(message, data = null) {
    if (!this.shouldLog(LOG_LEVELS.WARN)) {
      return;
    }
    
    const log = this.formatLog(LOG_LEVELS.WARN, message, data);
    this.logToConsole(LOG_LEVELS.WARN, log);
    this.addToQueue(log);
  }

  /**
   * 错误日志
   * @param {string} message - 消息
   * @param {any} data - 附加数据
   */
  error(message, data = null) {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) {
      return;
    }
    
    const log = this.formatLog(LOG_LEVELS.ERROR, message, data);
    this.logToConsole(LOG_LEVELS.ERROR, log);
    this.addToQueue(log);
  }

  /**
   * 记录API调用
   * @param {string} apiName - API名称
   * @param {number} duration - 耗时(ms)
   * @param {boolean} success - 是否成功
   * @param {Object} params - 参数
   */
  api(apiName, duration, success, params = {}) {
    const message = `API调用: ${apiName}, 耗时: ${duration}ms, 成功: ${success}`;
    const data = {
      apiName,
      duration,
      success,
      params
    };
    
    if (success) {
      this.debug(message, data);
    } else {
      this.error(message, data);
    }
  }

  /**
   * 记录页面加载
   * @param {string} pageName - 页面名称
   * @param {number} duration - 耗时(ms)
   */
  pageLoad(pageName, duration) {
    const message = `页面加载: ${pageName}, 耗时: ${duration}ms`;
    this.info(message, { pageName, duration });
  }

  /**
   * 记录用户行为
   * @param {string} action - 行为名称
   * @param {Object} details - 详细信息
   */
  userAction(action, details = {}) {
    const message = `用户行为: ${action}`;
    this.info(message, details);
  }

  /**
   * 记录性能数据
   * @param {string} type - 性能类型
   * @param {Object} data - 性能数据
   */
  performance(type, data) {
    const message = `性能数据: ${type}`;
    this.debug(message, data);
  }

  /**
   * 记录异常
   * @param {Error} error - 异常对象
   * @param {string} context - 上下文信息
   */
  exception(error, context = '') {
    const message = `异常: ${error.message || error}`;
    const data = {
      error: error.message || error,
      stack: error.stack,
      context
    };
    this.error(message, data);
  }

  /**
   * 手动上报日志
   */
  async flush() {
    await this.reportLogs();
  }

  /**
   * 获取日志队列状态
   * @returns {Object}
   */
  getStatus() {
    return {
      queueSize: this.logQueue.length,
      level: LOG_LEVEL_NAMES[this.getCurrentLevel()],
      enabled: this.config.enableConsole,
      reporting: this.config.enableReport
    };
  }
}

// 导出单例
module.exports = new Logger();