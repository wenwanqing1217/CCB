const toast = require('./toast.js');

const CACHE_CONFIG = {
  DEFAULT_EXPIRE: 5 * 60 * 1000,
  LONG_EXPIRE: 30 * 60 * 1000,
  SHORT_EXPIRE: 1 * 60 * 1000,
  MAX_CACHE_SIZE: 100,
  CACHE_CLEAN_INTERVAL: 10 * 60 * 1000,
  LRU_ENABLED: true,
  STATS_ENABLED: true
};

const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 5000,
  BACKOFF_FACTOR: 2,
  RETRY_ERROR_CODES: ['ERR_NETWORK', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH'],
  RETRY_ON_HTTP_STATUS: [500, 502, 503, 504]
};

const cache = {};
let cacheCleanInterval = null;

const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  expired: 0,
  maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
  currentSize: 0
};

const retryStats = {
  totalRetries: 0,
  successfulRetries: 0,
  failedRetries: 0,
  retryHistory: []
};

function initCacheClean() {
  if (!cacheCleanInterval) {
    cacheCleanInterval = setInterval(() => {
      cleanExpiredCache();
      if (CACHE_CONFIG.LRU_ENABLED) {
        checkCacheSizeWithLRU();
      } else {
        checkCacheSize();
      }
    }, CACHE_CONFIG.CACHE_CLEAN_INTERVAL);
  }
}

function cleanExpiredCache() {
  const now = Date.now();
  Object.keys(cache).forEach(key => {
    const item = cache[key];
    if (now - item.timestamp > (item.expireTime || CACHE_CONFIG.DEFAULT_EXPIRE)) {
      delete cache[key];
      if (CACHE_CONFIG.STATS_ENABLED) {
        cacheStats.expired++;
        cacheStats.currentSize--;
      }
    }
  });
}

function checkCacheSize() {
  const keys = Object.keys(cache);
  if (keys.length > CACHE_CONFIG.MAX_CACHE_SIZE) {
    const sortedKeys = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
    const deleteCount = keys.length - CACHE_CONFIG.MAX_CACHE_SIZE;
    for (let i = 0; i < deleteCount; i++) {
      delete cache[sortedKeys[i]];
      if (CACHE_CONFIG.STATS_ENABLED) {
        cacheStats.deletes++;
        cacheStats.currentSize--;
      }
    }
  }
}

function checkCacheSizeWithLRU() {
  const keys = Object.keys(cache);
  if (keys.length > CACHE_CONFIG.MAX_CACHE_SIZE) {
    const sortedKeys = keys.sort((a, b) => cache[a].lastAccessTime - cache[b].lastAccessTime);
    const deleteCount = keys.length - CACHE_CONFIG.MAX_CACHE_SIZE;
    for (let i = 0; i < deleteCount; i++) {
      delete cache[sortedKeys[i]];
      if (CACHE_CONFIG.STATS_ENABLED) {
        cacheStats.deletes++;
        cacheStats.currentSize--;
      }
    }
  }
}

function getCache(key) {
  const item = cache[key];
  if (item) {
    const expireTime = item.expireTime || CACHE_CONFIG.DEFAULT_EXPIRE;
    if (Date.now() - item.timestamp < expireTime) {
      item.lastAccessTime = Date.now();
      item.accessCount = (item.accessCount || 0) + 1;
      if (CACHE_CONFIG.STATS_ENABLED) {
        cacheStats.hits++;
      }
      return item.data;
    } else {
      delete cache[key];
      if (CACHE_CONFIG.STATS_ENABLED) {
        cacheStats.expired++;
        cacheStats.currentSize--;
        cacheStats.misses++;
      }
    }
  } else if (CACHE_CONFIG.STATS_ENABLED) {
    cacheStats.misses++;
  }
  return null;
}

function setCache(key, data, expireTime = CACHE_CONFIG.DEFAULT_EXPIRE) {
  cache[key] = {
    data,
    timestamp: Date.now(),
    expireTime,
    accessCount: 1,
    lastAccessTime: Date.now()
  };
  if (CACHE_CONFIG.STATS_ENABLED) {
    cacheStats.sets++;
    cacheStats.currentSize++;
  }
  if (CACHE_CONFIG.LRU_ENABLED) {
    checkCacheSizeWithLRU();
  } else {
    checkCacheSize();
  }
}

function clearCache(key) {
  if (key) {
    if (cache[key]) {
      delete cache[key];
      if (CACHE_CONFIG.STATS_ENABLED) {
        cacheStats.deletes++;
        cacheStats.currentSize--;
      }
    }
  } else {
    const count = Object.keys(cache).length;
    Object.keys(cache).forEach(k => delete cache[k]);
    if (CACHE_CONFIG.STATS_ENABLED) {
      cacheStats.deletes += count;
      cacheStats.currentSize = 0;
    }
  }
}

function getCacheStats() {
  const hitRate = cacheStats.hits + cacheStats.misses > 0
    ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2)
    : '0.00';
  
  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    totalRequests: cacheStats.hits + cacheStats.misses
  };
}

function resetCacheStats() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.sets = 0;
  cacheStats.deletes = 0;
  cacheStats.expired = 0;
}

function warmupCache(warmupList) {
  warmupList.forEach(item => {
    if (item.key && item.data) {
      setCache(item.key, item.data, item.expireTime || CACHE_CONFIG.DEFAULT_EXPIRE);
    }
  });
}

function conditionalSetCache(key, data, condition, expireTime = CACHE_CONFIG.DEFAULT_EXPIRE) {
  if (condition) {
    setCache(key, data, expireTime);
  }
}

function shouldRetry(error) {
  if (!error) {
    return false;
  }
  
  if (error.errMsg) {
    const errMsg = error.errMsg.toLowerCase();
    if (errMsg.includes('network') || errMsg.includes('timeout')) {
      return true;
    }
  }
  
  if (error.code && RETRY_CONFIG.RETRY_ERROR_CODES.includes(error.code)) {
    return true;
  }
  
  if (error.statusCode && RETRY_CONFIG.RETRY_ON_HTTP_STATUS.includes(error.statusCode)) {
    return true;
  }
  
  return false;
}

function getRetryDelay(attempt) {
  const delay = RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt);
  const jitter = Math.random() * 0.5 * RETRY_CONFIG.BASE_DELAY;
  return Math.min(delay + jitter, RETRY_CONFIG.MAX_DELAY);
}

function recordRetryAttempt(functionName, attempt, success, error) {
  retryStats.totalRetries++;
  
  if (success) {
    retryStats.successfulRetries++;
  } else {
    retryStats.failedRetries++;
  }
  
  retryStats.retryHistory.push({
    functionName,
    attempt,
    success,
    error: error ? error.message : null,
    timestamp: Date.now()
  });
  
  if (retryStats.retryHistory.length > 100) {
    retryStats.retryHistory.shift();
  }
}

function getRetryStats() {
  const successRate = retryStats.totalRetries > 0
    ? ((retryStats.successfulRetries / retryStats.totalRetries) * 100).toFixed(2)
    : '0.00';
  
  return {
    ...retryStats,
    successRate: `${successRate}%`
  };
}

async function retryCallCloudFunction(options, maxRetries = RETRY_CONFIG.MAX_RETRIES) {
  const { name, data = {}, showLoading = true, loadingTitle = '加载中...' } = options;
  
  let lastError;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      if (showLoading && attempt === 0) {
        toast.loading(loadingTitle);
      }
      
      const result = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name,
          data,
          success: resolve,
          fail: reject
        });
      });
      
      if (showLoading) {
        toast.hideLoading();
      }
      
      if (attempt > 0) {
        recordRetryAttempt(name, attempt, true, null);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      attempt++;
      
      if (showLoading && attempt < maxRetries) {
        toast.hideLoading();
      }
      
      if (!shouldRetry(error) || attempt >= maxRetries) {
        recordRetryAttempt(name, attempt, false, error);
        break;
      }
      
      const delay = getRetryDelay(attempt);
      console.log(`云函数 ${name} 第 ${attempt} 次重试，延迟 ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

async function batchCallCloudFunctions(functions) {
  const results = [];
  for (const func of functions) {
    try {
      const result = await callCloudFunction(func);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error });
    }
  }
  return results;
}

function categorizeError(error) {
  if (!error) {
    return 'unknown_error';
  }
  
  if (error.errMsg) {
    const errMsg = error.errMsg.toLowerCase();
    if (errMsg.includes('network') || errMsg.includes('timeout')) {
      return 'network_error';
    } else if (errMsg.includes('permission') || errMsg.includes('权限')) {
      return 'permission_error';
    } else if (errMsg.includes('login') || errMsg.includes('登录')) {
      return 'login_error';
    } else if (errMsg.includes('database') || errMsg.includes('数据库')) {
      return 'database_error';
    }
  }
  
  if (error.statusCode) {
    if (error.statusCode >= 500) {
      return 'server_error';
    }
    if (error.statusCode === 401) {
      return 'login_error';
    }
    if (error.statusCode === 403) {
      return 'permission_error';
    }
  }
  
  return 'unknown_error';
}

async function callCloudFunction(options) {
  const {
    name,
    data = {},
    showLoading = true,
    loadingTitle = '加载中...',
    showSuccess = false,
    successTitle = '操作成功',
    showError = true,
    useCache = false,
    skipCache = false,
    cacheKey,
    cacheExpire = CACHE_CONFIG.DEFAULT_EXPIRE,
    retry: shouldRetry = false,
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    retryDelay = RETRY_CONFIG.BASE_DELAY,
    timeout = 10000,
    priority = 'normal'
  } = options;

  const startTime = Date.now();

  if (useCache && cacheKey && !skipCache) {
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log(`云函数 ${name} 使用缓存数据`);
      return cachedData;
    }
  }

  if (showLoading) {
    toast.loading(loadingTitle);
  }

  try {
    let result;
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('云函数调用超时')), timeout);
    });

    if (shouldRetry) {
      result = await Promise.race([
        retryCallCloudFunction(
          { ...options, retry: false },
          maxRetries
        ),
        timeoutPromise
      ]);
    } else {
      result = await Promise.race([
        new Promise((resolve, reject) => {
          wx.cloud.callFunction({
            name,
            data,
            success: resolve,
            fail: reject
          });
        }),
        timeoutPromise
      ]);
    }

    if (showLoading) {
      toast.hideLoading();
    }

    const executionTime = Date.now() - startTime;
    console.log(`云函数 ${name} 执行时间: ${executionTime}ms`);

    if (result.errMsg !== 'cloud.callFunction:ok') {
      throw new Error(result.errMsg || '云函数调用失败');
    }

    if (useCache && cacheKey && result.result) {
      setCache(cacheKey, result.result, cacheExpire);
    }

    if (showSuccess) {
      toast.success(successTitle);
    }

    // 暂时禁用性能上报（云函数未部署）
    // try {
    //   await wx.cloud.callFunction({
    //     name: 'performanceMonitor',
    //     data: {
    //       functionName: name,
    //       executionTime: executionTime,
    //       success: true,
    //       timestamp: new Date().toISOString(),
    //       priority
    //     },
    //     showLoading: false,
    //     showError: false
    //   })
    // } catch (perfError) {
    //   console.error('性能数据上报失败:', perfError)
    // }

    return result.result;
    
  } catch (error) {
    if (showLoading) {
      toast.hideLoading();
    }

    const executionTime = Date.now() - startTime;

    const errorType = categorizeError(error);

    if (showError) {
      if (errorType === 'network_error') {
        toast.networkError('网络连接失败，请检查网络设置');
      } else if (errorType === 'permission_error') {
        toast.error('权限不足，请检查权限设置');
      } else if (errorType === 'login_error') {
        toast.error('登录状态已过期，请重新登录');
        wx.removeStorageSync('userInfo');
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/login/login' });
        }, 1500);
      } else {
        toast.error('操作失败，请稍后重试');
      }
    }

    console.error(`云函数 ${name} 调用失败:`, error);
    
    try {
      await wx.cloud.callFunction({
        name: 'reportError',
        data: {
          error: error.toString(),
          errorType,
          functionName: name,
          executionTime,
          timestamp: new Date().toISOString(),
          data: JSON.stringify(data)
        }
      });
    } catch (reportError) {
      console.error('错误上报失败:', reportError);
    }

    // 暂时禁用性能上报（云函数未部署）
    // try {
    //   await wx.cloud.callFunction({
    //     name: 'performanceMonitor',
    //     data: {
    //       functionName: name,
    //       executionTime,
    //       success: false,
    //       errorType,
    //       timestamp: new Date().toISOString(),
    //       priority
    //     },
    //     showLoading: false,
    //     showError: false
    //   })
    // } catch (perfError) {
    //   console.error('性能数据上报失败:', perfError)
    // }

    throw error;
  }
}

initCacheClean();

module.exports = {
  callCloudFunction,
  batchCallCloudFunctions,
  retryCallCloudFunction,
  getCache,
  setCache,
  clearCache,
  getCacheStats,
  resetCacheStats,
  warmupCache,
  conditionalSetCache,
  getRetryStats,
  shouldRetry,
  CACHE_CONFIG,
  RETRY_CONFIG
};