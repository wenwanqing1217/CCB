class SmartCache {
  constructor() {
    this.cache = {}
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expired: 0,
      evictions: 0
    }
    this.config = {
      defaultExpire: 5 * 60 * 1000,
      shortExpire: 30 * 1000,
      longExpire: 60 * 60 * 1000,
      maxSize: 500,
      cleanInterval: 5 * 60 * 1000,
      minHitRate: 0.3
    }
    this.priorityRules = {
      userInfo: { expire: 5 * 60 * 1000, priority: 'high' },
      hotBoxes: { expire: 30 * 60 * 1000, priority: 'high' },
      grabOrders: { expire: 30 * 1000, priority: 'critical' },
      communityFeed: { expire: 10 * 60 * 1000, priority: 'medium' },
      recommendedBoxes: { expire: 30 * 60 * 1000, priority: 'medium' },
      dormHeat: { expire: 60 * 60 * 1000, priority: 'low' }
    }
    this.warmupQueue = []
    this.isWarmingUp = false
    this.initCleanup()
  }

  initCleanup() {
    setInterval(() => {
      this.cleanExpired()
      this.enforceMaxSize()
    }, this.config.cleanInterval)
  }

  get(key) {
    const item = this.cache[key]
    if (!item) {
      this.stats.misses++
      return null
    }

    if (this.isExpired(item)) {
      this.delete(key)
      this.stats.misses++
      return null
    }

    this.updateAccess(item)
    this.stats.hits++
    return item.data
  }

  set(key, data, options = {}) {
    const rule = this.priorityRules[key] || {}
    const expireTime = options.expire || rule.expire || this.config.defaultExpire
    const priority = options.priority || rule.priority || 'medium'

    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expireTime,
      priority,
      accessCount: 1,
      lastAccessTime: Date.now(),
      size: this.calculateSize(data)
    }

    this.stats.sets++
    this.enforceMaxSize()
  }

  delete(key) {
    if (this.cache[key]) {
      delete this.cache[key]
      this.stats.deletes++
    }
  }

  clear() {
    const count = Object.keys(this.cache).length
    this.cache = {}
    this.stats.deletes += count
  }

  isExpired(item) {
    return Date.now() - item.timestamp > item.expireTime
  }

  updateAccess(item) {
    item.lastAccessTime = Date.now()
    item.accessCount = (item.accessCount || 0) + 1
  }

  calculateSize(data) {
    try {
      return JSON.stringify(data).length
    } catch {
      return 1024
    }
  }

  cleanExpired() {
    const now = Date.now()
    Object.keys(this.cache).forEach(key => {
      const item = this.cache[key]
      if (now - item.timestamp > item.expireTime) {
        delete this.cache[key]
        this.stats.expired++
      }
    })
  }

  enforceMaxSize() {
    const keys = Object.keys(this.cache)
    if (keys.length <= this.config.maxSize) return

    const sortedKeys = keys.sort((a, b) => {
      const itemA = this.cache[a]
      const itemB = this.cache[b]

      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      if (priorityOrder[itemA.priority] !== priorityOrder[itemB.priority]) {
        return priorityOrder[itemA.priority] - priorityOrder[itemB.priority]
      }

      const scoreA = this.calculateScore(itemA)
      const scoreB = this.calculateScore(itemB)
      return scoreB - scoreA
    })

    const deleteCount = keys.length - this.config.maxSize
    for (let i = sortedKeys.length - 1; i >= sortedKeys.length - deleteCount; i--) {
      delete this.cache[sortedKeys[i]]
      this.stats.evictions++
    }
  }

  calculateScore(item) {
    const now = Date.now()
    const age = now - item.timestamp
    const ageScore = Math.max(0, 1 - age / item.expireTime)
    const frequencyScore = Math.min(item.accessCount / 100, 1)
    const recencyScore = Math.max(0, 1 - (now - item.lastAccessTime) / (5 * 60 * 1000))

    const priorityMultiplier = {
      critical: 1.5,
      high: 1.2,
      medium: 1.0,
      low: 0.5
    }

    return (ageScore * 0.3 + frequencyScore * 0.4 + recencyScore * 0.3) * 
           (priorityMultiplier[item.priority] || 1)
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : '0.00'
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalRequests: this.stats.hits + this.stats.misses,
      currentSize: Object.keys(this.cache).length,
      maxSize: this.config.maxSize
    }
  }

  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expired: 0,
      evictions: 0
    }
  }

  addWarmupItem(key, data, options = {}) {
    this.warmupQueue.push({ key, data, options })
    if (!this.isWarmingUp) {
      this.processWarmup()
    }
  }

  async processWarmup() {
    if (this.warmupQueue.length === 0) {
      this.isWarmingUp = false
      return
    }

    this.isWarmingUp = true
    const item = this.warmupQueue.shift()
    
    try {
      this.set(item.key, item.data, item.options)
    } catch (error) {
      console.error('缓存预热失败:', item.key, error)
    }

    setTimeout(() => this.processWarmup(), 100)
  }

  async warmupFromAPI(apiCalls) {
    for (const call of apiCalls) {
      try {
        const result = await call()
        if (result && call.cacheKey) {
          this.set(call.cacheKey, result, { expire: call.expire })
        }
      } catch (error) {
        console.error('API预热失败:', call.cacheKey, error)
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  getCacheKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    return paramString ? `${prefix}?${paramString}` : prefix
  }

  setWithTTL(key, data, ttl) {
    this.set(key, data, { expire: ttl })
  }

  has(key) {
    const item = this.cache[key]
    return item && !this.isExpired(item)
  }

  peek(key) {
    const item = this.cache[key]
    return item ? item.data : null
  }

  getExpireTime(key) {
    const item = this.cache[key]
    return item ? item.expireTime : null
  }

  touch(key) {
    const item = this.cache[key]
    if (item) {
      this.updateAccess(item)
    }
  }

  conditionalSet(key, data, condition, options = {}) {
    if (condition) {
      this.set(key, data, options)
    }
  }

  batchSet(items) {
    items.forEach(item => {
      if (item.key && item.data !== undefined) {
        this.set(item.key, item.data, item.options || {})
      }
    })
  }

  batchGet(keys) {
    return keys.map(key => ({
      key,
      data: this.get(key)
    }))
  }

  invalidateByPattern(pattern) {
    const regex = new RegExp(pattern)
    Object.keys(this.cache).forEach(key => {
      if (regex.test(key)) {
        this.delete(key)
      }
    })
  }

  getPriorityRules() {
    return this.priorityRules
  }

  updatePriorityRule(key, rule) {
    this.priorityRules[key] = { ...this.priorityRules[key], ...rule }
  }

  enableDebug() {
    this.debug = true
  }

  disableDebug() {
    this.debug = false
  }

  logDebug(message) {
    if (this.debug) {
      console.log(`[SmartCache] ${message}`)
    }
  }
}

module.exports = new SmartCache()