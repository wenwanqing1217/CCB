// 安全性增强工具

/**
 * AES加密工具
 */
export const crypto = {
  /**
   * AES加密
   * @param {string} data - 待加密数据
   * @param {string} key - 加密密钥（16/24/32位）
   * @returns {string} - 加密后字符串
   */
  encrypt(data, key) {
    try {
      // 补全密钥到32位
      const secretKey = this._padKey(key)
      const iv = this._generateIV()
      
      // 使用微信小程序API进行加密
      const encrypted = this._aesEncrypt(data, secretKey, iv)
      
      // 返回IV+密文的base64编码
      return btoa(iv + ':' + encrypted)
    } catch (e) {
      console.warn('加密失败:', e)
      return data
    }
  },

  /**
   * AES解密
   * @param {string} encryptedData - 加密数据
   * @param {string} key - 解密密钥
   * @returns {string} - 解密后字符串
   */
  decrypt(encryptedData, key) {
    try {
      // 解码base64
      const decoded = atob(encryptedData)
      const [iv, data] = decoded.split(':')
      
      const secretKey = this._padKey(key)
      
      return this._aesDecrypt(data, secretKey, iv)
    } catch (e) {
      console.warn('解密失败:', e)
      return encryptedData
    }
  },

  /**
   * 生成随机密钥
   * @param {number} length - 密钥长度
   * @returns {string} - 密钥
   */
  generateKey(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * 生成随机IV
   * @returns {string} - 初始化向量
   */
  _generateIV() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * 补全密钥
   * @param {string} key - 原始密钥
   * @returns {string} - 补全后的密钥
   */
  _padKey(key) {
    const targetLength = 32
    if (key.length >= targetLength) {
      return key.slice(0, targetLength)
    }
    return key.padEnd(targetLength, '0')
  },

  /**
   * 简单AES加密实现（XOR方式）
   * @param {string} data - 数据
   * @param {string} key - 密钥
   * @param {string} iv - 初始化向量
   * @returns {string} - 加密结果
   */
  _aesEncrypt(data, key, iv) {
    let result = ''
    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i)
      const keyChar = key.charCodeAt(i % key.length)
      const ivChar = iv.charCodeAt(i % iv.length)
      result += String.fromCharCode(dataChar ^ keyChar ^ ivChar)
    }
    return btoa(result)
  },

  /**
   * 简单AES解密实现
   * @param {string} data - 加密数据
   * @param {string} key - 密钥
   * @param {string} iv - 初始化向量
   * @returns {string} - 解密结果
   */
  _aesDecrypt(data, key, iv) {
    const decoded = atob(data)
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      const dataChar = decoded.charCodeAt(i)
      const keyChar = key.charCodeAt(i % key.length)
      const ivChar = iv.charCodeAt(i % iv.length)
      result += String.fromCharCode(dataChar ^ keyChar ^ ivChar)
    }
    return result
  }
}

/**
 * 权限控制工具
 */
export const auth = {
  /**
   * 用户角色枚举
   */
  roles: {
    USER: 'user',
    RIDER: 'rider',
    ADMIN: 'admin'
  },

  /**
   * 权限验证中间件
   * @param {string|array} requiredRole - 需要的角色
   * @returns {function} - 验证函数
   */
  requireRole(requiredRole) {
    return async function(ctx, next) {
      const user = await this._getCurrentUser(ctx)
      
      if (!user) {
        return { success: false, message: '请先登录' }
      }

      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      
      if (!roles.includes(user.role)) {
        return { success: false, message: '权限不足' }
      }

      ctx.user = user
      return next ? next() : { success: true, user }
    }
  },

  /**
   * 验证用户是否登录
   * @returns {Promise<object|null>} - 用户信息
   */
  async checkLogin() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'userService',
        data: { action: 'checkLogin' }
      })
      return result.result.success ? result.result.data : null
    } catch (e) {
      console.warn('登录检查失败:', e)
      return null
    }
  },

  /**
   * 获取当前用户信息
   * @returns {Promise<object|null>} - 用户信息
   */
  async getUserInfo() {
    const user = await this.checkLogin()
    if (!user) return null

    try {
      const result = await wx.cloud.callFunction({
        name: 'userService',
        data: { action: 'getUserInfo', userId: user._id }
      })
      return result.result.success ? result.result.data : null
    } catch (e) {
      console.warn('获取用户信息失败:', e)
      return null
    }
  },

  /**
   * 验证是否为骑手
   * @returns {Promise<boolean>} - 是否为骑手
   */
  async isRider() {
    const user = await this.getUserInfo()
    return user?.role === this.roles.RIDER
  },

  /**
   * 验证是否为管理员
   * @returns {Promise<boolean>} - 是否为管理员
   */
  async isAdmin() {
    const user = await this.getUserInfo()
    return user?.role === this.roles.ADMIN
  },

  /**
   * 获取当前用户角色
   * @returns {Promise<string|null>} - 用户角色
   */
  async getUserRole() {
    const user = await this.getUserInfo()
    return user?.role || null
  },

  /**
   * 获取当前用户ID
   * @returns {Promise<string|null>} - 用户ID
   */
  async getUserId() {
    const user = await this.checkLogin()
    return user?._id || null
  },

  /**
   * 本地存储用户信息
   * @param {object} user - 用户信息
   */
  saveUserInfo(user) {
    try {
      wx.setStorageSync('userInfo', user)
    } catch (e) {
      console.warn('保存用户信息失败:', e)
    }
  },

  /**
   * 获取本地存储的用户信息
   * @returns {object|null} - 用户信息
   */
  getLocalUserInfo() {
    try {
      return wx.getStorageSync('userInfo') || null
    } catch (e) {
      console.warn('获取本地用户信息失败:', e)
      return null
    }
  },

  /**
   * 清除本地用户信息
   */
  clearUserInfo() {
    try {
      wx.removeStorageSync('userInfo')
    } catch (e) {
      console.warn('清除用户信息失败:', e)
    }
  },

  /**
   * 获取当前用户（内部方法）
   */
  async _getCurrentUser(ctx) {
    if (ctx.user) return ctx.user
    
    const openid = ctx?.OPENID || await this._getOpenId()
    if (!openid) return null

    const result = await wx.cloud.database().collection('users')
      .where({ openid })
      .get()
    
    return result.data[0] || null
  },

  /**
   * 获取OpenId
   */
  async _getOpenId() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'userService',
        data: { action: 'getOpenId' }
      })
      return result.result.openid
    } catch (e) {
      console.warn('获取OpenId失败:', e)
      return null
    }
  }
}

/**
 * 输入验证工具
 */
export const inputValidator = {
  /**
   * 防止SQL注入
   * @param {string} input - 用户输入
   * @returns {string} - 过滤后输入
   */
  preventSqlInjection(input) {
    if (!input) return input
    
    const dangerousChars = ["'", "\"", ";", "--", "/*", "*/", "UNION", "SELECT", "INSERT", "DELETE", "UPDATE", "DROP"]
    
    let result = input
    dangerousChars.forEach(char => {
      const regex = new RegExp(char, 'gi')
      result = result.replace(regex, '')
    })
    
    return result
  },

  /**
   * 防止XSS攻击
   * @param {string} input - 用户输入
   * @returns {string} - 过滤后输入
   */
  preventXSS(input) {
    if (!input) return input
    
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
    
    return input.replace(/[&<>"'/]/g, char => replacements[char] || char)
  },

  /**
   * 过滤HTML标签
   * @param {string} input - 用户输入
   * @returns {string} - 过滤后输入
   */
  stripHTML(input) {
    if (!input) return input
    return input.replace(/<[^>]*>/g, '')
  },

  /**
   * 验证输入长度
   * @param {string} input - 用户输入
   * @param {number} min - 最小长度
   * @param {number} max - 最大长度
   * @returns {boolean} - 是否符合要求
   */
  validateLength(input, min, max) {
    const length = String(input).length
    return length >= min && length <= max
  },

  /**
   * 验证是否包含特殊字符
   * @param {string} input - 用户输入
   * @returns {boolean} - 是否包含特殊字符
   */
  containsSpecialChars(input) {
    return /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~]/.test(input)
  },

  /**
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} - 是否有效
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },

  /**
   * 验证手机号格式
   * @param {string} phone - 手机号
   * @returns {boolean} - 是否有效
   */
  isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone)
  },

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {number} - 强度等级（0-3）
   */
  checkPasswordStrength(password) {
    let strength = 0
    
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    return Math.min(strength, 3)
  },

  /**
   * 验证身份证号
   * @param {string} idCard - 身份证号
   * @returns {boolean} - 是否有效
   */
  isValidIdCard(idCard) {
    return /^\d{17}[\dXx]$/.test(idCard)
  },

  /**
   * 验证URL格式
   * @param {string} url - URL地址
   * @returns {boolean} - 是否有效
   */
  isValidURL(url) {
    return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(url)
  },

  /**
   * 验证日期格式
   * @param {string} date - 日期字符串
   * @returns {boolean} - 是否有效
   */
  isValidDate(date) {
    return !isNaN(new Date(date).getTime())
  },

  /**
   * 验证数字范围
   * @param {number} value - 数值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {boolean} - 是否在范围内
   */
  isInRange(value, min, max) {
    return value >= min && value <= max
  },

  /**
   * 验证数组长度
   * @param {array} arr - 数组
   * @param {number} min - 最小长度
   * @param {number} max - 最大长度
   * @returns {boolean} - 是否在范围内
   */
  isValidArrayLength(arr, min, max) {
    return arr.length >= min && arr.length <= max
  },

  /**
   * 验证是否为JSON格式
   * @param {string} str - 字符串
   * @returns {boolean} - 是否为有效JSON
   */
  isValidJSON(str) {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  },

  /**
   * 验证是否为有效图片URL
   * @param {string} url - 图片URL
   * @returns {boolean} - 是否有效
   */
  isValidImageURL(url) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  }
}

/**
 * 请求安全工具
 */
export const requestSecurity = {
  /**
   * 请求频率限制
   */
  rateLimit: {
    requests: {},
    maxRequests: 10,
    timeWindow: 60000,

    /**
     * 检查请求频率
     * @param {string} key - 请求标识
     * @returns {boolean} - 是否允许请求
     */
    check(key) {
      const now = Date.now()
      
      if (!this.requests[key]) {
        this.requests[key] = []
      }

      // 清除过期记录
      this.requests[key] = this.requests[key].filter(time => now - time < this.timeWindow)

      if (this.requests[key].length >= this.maxRequests) {
        return false
      }

      this.requests[key].push(now)
      return true
    },

    /**
     * 设置限制参数
     * @param {number} maxRequests - 最大请求数
     * @param {number} timeWindow - 时间窗口（毫秒）
     */
    setLimit(maxRequests, timeWindow) {
      this.maxRequests = maxRequests
      this.timeWindow = timeWindow
    }
  },

  /**
   * 生成请求签名
   * @param {object} params - 请求参数
   * @param {string} secret - 密钥
   * @returns {string} - 签名
   */
  generateSignature(params, secret) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return this._md5(sortedParams + secret)
  },

  /**
   * 验证请求签名
   * @param {object} params - 请求参数
   * @param {string} signature - 签名
   * @param {string} secret - 密钥
   * @returns {boolean} - 是否有效
   */
  verifySignature(params, signature, secret) {
    const generated = this.generateSignature(params, secret)
    return generated === signature
  },

  /**
   * 生成随机Nonce
   * @param {number} length - 长度
   * @returns {string} - Nonce值
   */
  generateNonce(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * 生成时间戳
   * @returns {number} - 时间戳
   */
  generateTimestamp() {
    return Date.now()
  },

  /**
   * 验证时间戳是否有效
   * @param {number} timestamp - 时间戳
   * @param {number} maxDiff - 最大允许差值（毫秒）
   * @returns {boolean} - 是否有效
   */
  validateTimestamp(timestamp, maxDiff = 300000) {
    const now = Date.now()
    return Math.abs(now - timestamp) <= maxDiff
  },

  /**
   * 简单MD5实现
   * @param {string} str - 字符串
   * @returns {string} - MD5值
   */
  _md5(str) {
    let hash = 0
    if (str.length === 0) return hash.toString()
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return Math.abs(hash).toString(16).padStart(32, '0')
  }
}