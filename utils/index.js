// 工具类统一入口

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function}
 */
function debounce(func, wait, immediate = false) {
  let timeout = null;
  return function (...args) {
    const context = this;
    const later = function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} limit - 节流时间（毫秒）
 * @returns {Function}
 */
function throttle(func, limit) {
  let inThrottle = false;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 深拷贝对象
 * @param {any} obj - 需要拷贝的对象
 * @returns {any}
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳（毫秒）
 * @param {string} format - 格式化字符串
 * @returns {string}
 */
function formatTime(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number}
 */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成唯一ID
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 数组去重
 * @param {Array} arr - 需要去重的数组
 * @returns {Array}
 */
function uniqueArray(arr) {
  return [...new Set(arr)];
}

/**
 * 对象数组去重
 * @param {Array} arr - 需要去重的对象数组
 * @param {string} key - 去重依据的键
 * @returns {Array}
 */
function uniqueObjectArray(arr, key) {
  const seen = new Set();
  return arr.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * 数组分组
 * @param {Array} arr - 需要分组的数组
 * @param {string|Function} key - 分组依据的键或函数
 * @returns {Object}
 */
function groupBy(arr, key) {
  return arr.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
}

/**
 * 防抖Promise
 * @param {Function} asyncFunc - 返回Promise的异步函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function}
 */
function debouncePromise(asyncFunc, wait) {
  let timeout = null;
  let lastPromise = null;
  
  return function (...args) {
    return new Promise((resolve, reject) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          lastPromise = asyncFunc.apply(this, args);
          const result = await lastPromise;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}

/**
 * 安全解析JSON
 * @param {string} str - JSON字符串
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

/**
 * 安全获取对象属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径，如 'a.b.c'
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
function getProperty(obj, path, defaultValue = null) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
}

// 导出所有工具类和工具函数
module.exports = {
  // 云函数调用工具
  cloud: require('./cloud'),
  
  // 提示工具
  toast: require('./toast'),
  
  // 认证工具
  auth: require('./auth'),
  
  // 图片懒加载工具
  lazyLoad: require('./lazyLoad'),
  
  // 性能监控工具
  performanceMonitor: require('./performanceMonitor'),
  
  // 推送管理工具
  pushManager: require('./pushManager'),
  
  // 图片处理工具
  imageProcessor: require('./imageProcessor'),
  
  // 工具函数
  debounce,
  throttle,
  deepClone,
  formatTime,
  random,
  generateId,
  uniqueArray,
  uniqueObjectArray,
  groupBy,
  debouncePromise,
  safeJsonParse,
  getProperty
};
