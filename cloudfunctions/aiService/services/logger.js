/**
 * AI调用日志服务
 * 记录AI请求、返回、耗时，方便排查问题
 */

const CONFIG = require('../config/model-config');

class Logger {
  constructor() {
    this.enabled = CONFIG.log?.enabled ?? true;
    this.level = CONFIG.log?.level || 'info';
  }

  debug(message, data = {}) {
    if (this.enabled && this.level === 'debug') {
      console.log(`[AI-DEBUG] ${message}`, JSON.stringify(data));
    }
  }

  info(message, data = {}) {
    if (this.enabled && ['debug', 'info'].includes(this.level)) {
      console.log(`[AI-INFO] ${message}`, JSON.stringify(data));
    }
  }

  warn(message, data = {}) {
    if (this.enabled && ['debug', 'info', 'warn'].includes(this.level)) {
      console.warn(`[AI-WARN] ${message}`, JSON.stringify(data));
    }
  }

  error(message, data = {}) {
    if (this.enabled) {
      console.error(`[AI-ERROR] ${message}`, JSON.stringify(data));
    }
  }
}

module.exports = new Logger();
