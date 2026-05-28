// 性能优化工具

/**
 * 图片压缩工具
 * @param {string} filePath - 图片路径
 * @param {object} options - 压缩选项
 * @returns {string} - 压缩后的临时路径
 */
export async function compressImage(filePath, options = {}) {
  const {
    quality = 80,
    maxWidth = 800,
    maxHeight = 800
  } = options

  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality,
      success: (res) => {
        resolve(res.tempFilePath)
      },
      fail: (err) => {
        console.warn('图片压缩失败，使用原图片:', err)
        resolve(filePath)
      }
    })
  })
}

/**
 * 批量压缩图片
 * @param {string[]} filePaths - 图片路径数组
 * @param {object} options - 压缩选项
 * @returns {string[]} - 压缩后的路径数组
 */
export async function compressImages(filePaths, options = {}) {
  const promises = filePaths.map(path => compressImage(path, options))
  return Promise.all(promises)
}

/**
 * 智能缓存管理器
 */
export const smartCache = {
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} - 缓存数据
   */
  get(key) {
    try {
      const cache = wx.getStorageSync(key)
      if (cache && cache.expire > Date.now()) {
        return cache.data
      }
      return null
    } catch (e) {
      console.warn('获取缓存失败:', e)
      return null
    }
  },

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 缓存数据
   * @param {number} expireMinutes - 过期时间（分钟）
   */
  set(key, data, expireMinutes = 30) {
    try {
      wx.setStorageSync(key, {
        data,
        expire: Date.now() + expireMinutes * 60 * 1000
      })
    } catch (e) {
      console.warn('设置缓存失败:', e)
    }
  },

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  remove(key) {
    try {
      wx.removeStorageSync(key)
    } catch (e) {
      console.warn('删除缓存失败:', e)
    }
  },

  /**
   * 清空所有缓存
   */
  clear() {
    try {
      wx.clearStorageSync()
    } catch (e) {
      console.warn('清空缓存失败:', e)
    }
  },

  /**
   * 获取缓存状态
   * @returns {object} - 缓存信息
   */
  getInfo() {
    try {
      return wx.getStorageInfoSync()
    } catch (e) {
      console.warn('获取缓存信息失败:', e)
      return null
    }
  }
}

/**
 * 请求缓存装饰器
 * @param {number} expireMinutes - 缓存时间（分钟）
 * @returns {function} - 装饰后的函数
 */
export function cacheable(expireMinutes = 30) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function(...args) {
      const cacheKey = `${propertyKey}_${JSON.stringify(args)}`
      const cached = smartCache.get(cacheKey)

      if (cached !== null) {
        console.log(`[缓存命中] ${cacheKey}`)
        return cached
      }

      const result = await originalMethod.apply(this, args)
      smartCache.set(cacheKey, result, expireMinutes)
      return result
    }

    return descriptor
  }
}

/**
 * 防抖函数
 * @param {function} func - 执行函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {function} - 防抖后的函数
 */
export function debounce(func, wait = 300) {
  let timeout = null
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

/**
 * 节流函数
 * @param {function} func - 执行函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {function} - 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle = false
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 懒加载图片
 * @param {string} selector - 选择器
 * @param {object} options - 选项
 */
export function lazyLoadImages(selector = '.lazy-image', options = {}) {
  const {
    placeholder = '/images/placeholder.png',
    threshold = 100
  } = options

  const observer = wx.createIntersectionObserver({
    thresholds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  })

  observer
    .relativeToViewport({ bottom: threshold })
    .observe(selector, (res) => {
      if (res.intersectionRatio > 0) {
        const target = res.dataset.target
        if (target && !target.dataset.loaded) {
          target.dataset.loaded = true
          const src = target.dataset.src
          if (src) {
            target.src = src
          }
        }
      }
    })
}

/**
 * 性能监控
 */
export const performanceMonitor = {
  timers: {},

  /**
   * 开始计时
   * @param {string} name - 计时器名称
   */
  start(name) {
    this.timers[name] = Date.now()
  },

  /**
   * 结束计时
   * @param {string} name - 计时器名称
   * @returns {number} - 耗时（毫秒）
   */
  end(name) {
    if (!this.timers[name]) return 0
    const elapsed = Date.now() - this.timers[name]
    console.log(`[性能监控] ${name}: ${elapsed}ms`)
    delete this.timers[name]
    return elapsed
  },

  /**
   * 记录内存使用
   */
  logMemory() {
    const info = wx.getStorageInfoSync()
    console.log(`[内存使用] 当前: ${info.currentSize}KB, 限制: ${info.limitSize}KB`)
  },

  /**
   * 上报性能数据
   * @param {object} data - 性能数据
   */
  async report(data) {
    try {
      await wx.cloud.callFunction({
        name: 'performanceMonitor',
        data: {
          action: 'report',
          ...data,
          timestamp: Date.now()
        }
      })
    } catch (e) {
      console.warn('性能上报失败:', e)
    }
  }
}

/**
 * 预加载资源
 * @param {string[]} urls - 资源URL数组
 */
export async function preloadResources(urls) {
  const promises = urls.map(url => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = () => resolve(url)
      img.src = url
    })
  })
  await Promise.all(promises)
}

/**
 * 优化JSON字符串化（处理循环引用）
 * @param {any} obj - 对象
 * @returns {string} - JSON字符串
 */
export function safeStringify(obj) {
  const seen = new Set()
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  })
}