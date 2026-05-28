// 导入统一工具函数
const { debounce } = require('../../utils/index.js')
// 导入懒加载工具
const lazyLoad = require('../../utils/lazyLoad.js')
// 导入性能监控工具
const performanceMonitor = require('../../utils/performanceMonitor.js')
// 导入图片处理工具
const imageProcessor = require('../../utils/imageProcessor.js')
// 导入统一状态管理
const store = require('../../utils/store.js')
// 导入统一日志管理
const logger = require('../../utils/logger.js')
// 导入统一配置管理
const config = require('../../utils/config.js')
const { getDemoDormHeat, getDemoOrders } = require('../../utils/campusData.js')

// 生产环境数据结构定义
const defaultEmptyData = {
  grabOrders: [],
  dormHeat: [],
  hotBoxes: [],
  communityFeed: []
}

Page({
  data: {
    userInfo: null,
    grabOrders: [],
    dormHeat: [],
    dormHeatLabel: '交易活跃度',
    hotBoxes: [],
    communityFeed: [],
    recommendedBoxes: [], // 推荐盲盒
    unreadCount: 0,
    isLoading: false,
    showBackTop: false,
    scrollTop: 0,
    searchKeyword: '',
    pendingOrders: 0,
    stats: {
      users: 1234,
      boxes: 567,
      deliveries: 890
    },
    riderCount: 23,
    unreadMessageCount: 5,
    showAITip: true,
    // 用户盲盒积分
    blindBoxCoins: 0,
    // AI按钮位置和拖动状态 - 初始位置与CBB平行，位于页面最右侧外边
    aiBtnPosition: { x: 320, y: 40 },
    isDragging: false,
    _aiBtnStartPos: { x: 0, y: 0 },
    _touchStartPos: { x: 0, y: 0 }
  },

  onLoad(options) {
    logger.info('首页加载', { options })
    // 开始页面加载监控
    performanceMonitor.startPageLoad('index')
    this.checkUserInfo()
    this.loadHomeData()
  },

  onReady() {
    // 初始化懒加载
    this.initLazyLoad()
  },

  onShow() {
    logger.info('首页显示')
    this.updateUnreadCount()
    // 再次初始化懒加载，确保图片能正确显示
    this.initLazyLoad()
    // 设置自定义 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    // 加载用户积分
    this.loadUserCoins()
  },

  // 加载用户盲盒积分
  loadUserCoins() {
    const userInfo = store.getUser()
    if (!userInfo || !userInfo.openid) {
      this.setData({ blindBoxCoins: 0 })
      return
    }

    wx.cloud.callFunction({
      name: 'userService',
      data: {
        action: 'getUserInfo',
        data: {
          openid: userInfo.openid
        }
      },
      success: (res) => {
        if (res.result && res.result.success && res.result.user) {
          const coins = res.result.user.blindBoxCoins || 0
          this.setData({ blindBoxCoins: coins })
          // 更新状态管理
          store.set('user.blindBoxCoins', coins)
          logger.info('用户积分加载成功', { coins })
        }
      },
      fail: (err) => {
        logger.error('用户积分加载失败', err)
        this.setData({ blindBoxCoins: 0 })
      }
    })
  },

  onPullDownRefresh() {
    logger.info('下拉刷新')
    const cloudUtils = require('../../utils/cloud.js')
    cloudUtils.clearCache('dormHeat')
    cloudUtils.clearCache('dormHeat_v2')
    this.loadHomeData({ forceRefresh: true })
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 优化滚动事件，使用防抖减少setData调用
  onPageScroll: debounce(function(e) {
    const showBackTop = e.scrollTop > 500
    if (showBackTop !== this.data.showBackTop) {
      this.setData({ showBackTop })
    }
  }, 100),

  // 初始化懒加载
  initLazyLoad() {
    if (!this.data.hotBoxes.length && !this.data.communityFeed.length) return
    
    // 监听盲盒图片
    this.initBoxImageLazyLoad()
    
    // 监听社区动态头像和图片
    this.initCommunityFeedLazyLoad()
  },

  // 初始化盲盒图片懒加载
  initBoxImageLazyLoad() {
    if (this.data.hotBoxes.length > 0) {
      this.data.hotBoxes.forEach((box, index) => {
        const selector = `.lazy-image-${index}`
        this.setupIntersectionObserver(selector, index, 'hotBoxes', 'lazyLoaded')
      })
    }
  },

  // 初始化社区动态懒加载
  initCommunityFeedLazyLoad() {
    if (this.data.communityFeed.length > 0) {
      this.data.communityFeed.forEach((feed, index) => {
        // 监听头像
        const avatarSelector = `.lazy-avatar-${index}`
        this.setupIntersectionObserver(avatarSelector, index, 'communityFeed', 'avatarLoaded')
        
        // 监听图片
        const imageSelector = `.lazy-feed-${index}`
        this.setupIntersectionObserver(imageSelector, index, 'communityFeed', 'imageLoaded')
      })
    }
  },

  // 设置交叉观察器
  setupIntersectionObserver(selector, index, arrayName, propertyName) {
    if ('IntersectionObserver' in wx) {
      const observer = wx.createIntersectionObserver(this, {
        thresholds: [0.1],
        observeAll: false
      })
      observer.observe(selector, (res) => {
        if (res.intersectionRatio > 0) {
          this.loadImage(index, arrayName, propertyName)
          observer.disconnect()
        }
      })
    } else {
      // 兼容处理，直接加载
      this.loadImage(index, arrayName, propertyName)
    }
  },

  // 加载图片
  loadImage(index, arrayName, propertyName) {
    const data = this.data[arrayName]
    if (data && data[index] && !data[index][propertyName]) {
      const newData = [...data]
      newData[index] = { ...newData[index], [propertyName]: true }
      this.setData({
        [arrayName]: newData
      })
    }
  },

  checkUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
    }
  },

  parseDormHeat(res) {
    if (!res) return []
    if (Array.isArray(res)) return res
    if (Array.isArray(res.data)) return res.data
    if (res.result && Array.isArray(res.result.data)) return res.result.data
    return []
  },

  formatDormHeatLabel(meta) {
    if (!meta) return '交易活跃度'
    if (meta.windowHours == null) return '累计交易活跃度'
    if (meta.windowHours <= 24) return '近24小时交易活跃度'
    if (meta.windowHours <= 24 * 7) return '近7天交易活跃度'
    return '近30天交易活跃度'
  },

  loadHomeData(options = {}) {
    const { forceRefresh = false } = options
    const cacheConfig = config.getCacheConfig()
    
    this.setData({ isLoading: true })
    performanceMonitor.startApiCall('loadHomeData')
    
    const cloudUtils = require('../../utils/cloud.js')
    const userInfo = store.getUser()
    const openid = userInfo?.openid || ''
    const campusData = require('../../utils/campusData.js')
    
    Promise.all([
      cloudUtils.callCloudFunction({
        name: 'getHotBoxes',
        showLoading: false,
        useCache: !forceRefresh,
        cacheKey: 'hotBoxes',
        cacheExpire: cacheConfig.defaultExpire
      }),
      cloudUtils.callCloudFunction({
        name: 'getGrabOrders',
        showLoading: false,
        useCache: !forceRefresh,
        cacheKey: 'grabOrders',
        cacheExpire: cacheConfig.shortExpire
      }),
      cloudUtils.callCloudFunction({
        name: 'getDormHeat',
        showLoading: false,
        useCache: !forceRefresh,
        skipCache: forceRefresh,
        cacheKey: 'dormHeat_v2',
        cacheExpire: cacheConfig.dormHeatExpire || cacheConfig.shortExpire
      }),
      cloudUtils.callCloudFunction({
        name: 'getCommunityFeed',
        showLoading: false,
        useCache: !forceRefresh,
        cacheKey: 'communityFeed',
        cacheExpire: cacheConfig.defaultExpire
      }),
      cloudUtils.callCloudFunction({
        name: 'recommendationService',
        data: {
          action: 'getGuessYouLike',
          data: { openid, limit: 6 }
        },
        showLoading: false,
        useCache: !forceRefresh,
        cacheKey: 'recommendedBoxes',
        cacheExpire: cacheConfig.defaultExpire
      })
    ])
    .then(([hotBoxesRes, grabOrdersRes, dormHeatRes, communityFeedRes, recommendRes]) => {
      let hotBoxes = hotBoxesRes && hotBoxesRes.data ? hotBoxesRes.data : []
      let grabOrders = grabOrdersRes && grabOrdersRes.data ? grabOrdersRes.data : []
      let dormHeat = this.parseDormHeat(dormHeatRes)
      const dormHeatMeta = dormHeatRes && dormHeatRes.meta ? dormHeatRes.meta : null
      let communityFeed = communityFeedRes && communityFeedRes.data ? communityFeedRes.data : []
      const recommendedBoxes = recommendRes && recommendRes.result && recommendRes.result.success ? recommendRes.result.data : []

      if (!dormHeat.length) dormHeat = campusData.getDemoDormHeat()
      if (!grabOrders.length) grabOrders = campusData.getDemoOrders()
      if (!hotBoxes.length) hotBoxes = campusData.getDemoHotBoxes()
      
      const pendingOrders = grabOrders.length
      
      const newData = {
        grabOrders,
        dormHeat,
        dormHeatLabel: this.formatDormHeatLabel(dormHeatMeta),
        hotBoxes: hotBoxes.map(box => ({ ...box, lazyLoaded: false })),
        communityFeed: communityFeed.map(feed => ({
          ...feed,
          avatarLoaded: false,
          imageLoaded: false
        })),
        recommendedBoxes: recommendedBoxes.map(box => ({ ...box, lazyLoaded: false })),
        pendingOrders,
        isLoading: false
      }
      
      this.setData(newData, () => {
        logger.info('首页数据加载完成')
        store.updateCache('hotBoxes', hotBoxes)
        store.updateCache('communityFeed', communityFeed)
        store.updateCache('grabOrders', grabOrders)
        store.updateCache('dormHeat', dormHeat)
        this.initLazyLoad()
        this.preloadImages()
        performanceMonitor.endApiCall('loadHomeData', true)
        performanceMonitor.endPageLoad('index')
      })
    })
    .catch(err => {
      logger.error('数据加载失败，使用模拟数据', err)
      const dormHeat = campusData.getDemoDormHeat()
      const grabOrders = campusData.getDemoOrders()
      const hotBoxes = campusData.getDemoHotBoxes()
      const pendingOrders = grabOrders.length
      
      this.setData({
        grabOrders,
        dormHeat,
        dormHeatLabel: '近24小时交易活跃度',
        hotBoxes: hotBoxes.map(box => ({ ...box, lazyLoaded: false })),
        communityFeed: [],
        recommendedBoxes: [],
        pendingOrders,
        isLoading: false
      })
      performanceMonitor.endApiCall('loadHomeData', false)
      performanceMonitor.endPageLoad('index')
    })
  },

  // 预加载图片
  preloadImages() {
    // 使用配置管理获取图片配置
    const imageConfig = config.getImageConfig()
    
    // 预加载热门盲盒图片
    const boxImages = this.data.hotBoxes.map(box => box.images[0])
    imageProcessor.preloadImages(boxImages, imageConfig.maxConcurrentPreload)
    
    // 预加载社区动态图片
    const feedImages = this.data.communityFeed.map(feed => feed.image)
    imageProcessor.preloadImages(feedImages, imageConfig.maxConcurrentPreload)
    
    // 预加载社区用户头像
    const avatarImages = this.data.communityFeed.map(feed => feed.userAvatar)
    imageProcessor.preloadImages(avatarImages, imageConfig.maxConcurrentPreload)
    
    logger.info('图片预加载完成', { 
      boxImages: boxImages.length, 
      feedImages: feedImages.length, 
      avatarImages: avatarImages.length 
    })
  },

  updateUnreadCount() {
    const unreadCount = Math.floor(Math.random() * 10) + 1
    this.setData({ unreadCount })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearchConfirm() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({ 
        title: '请输入搜索内容', 
        icon: 'none',
        duration: 1500
      })
      return
    }
    console.log('搜索：', keyword)
    // 添加搜索反馈动画
    this.setData({ isSearching: true })
    setTimeout(() => {
      wx.navigateTo({
        url: `../box-list/box-list?keyword=${encodeURIComponent(keyword)}`,
        success: () => {
          this.setData({ isSearching: false })
        },
        fail: () => {
          this.setData({ isSearching: false })
        }
      })
    }, 300)
  },

  navigateToOrderGrab: debounce(function() {
    // 添加按钮点击反馈
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({ 
      url: '../courier-center/courier-center',
      success: () => {
        wx.nextTick(() => {
          wx.showToast({
            title: '前往抢单页面',
            icon: 'success',
            duration: 800
          })
        })
      },
      fail: (err) => {
        console.error('跳转到抢单页面失败:', err);
        wx.showToast({
          title: '跳转失败，请稍后重试',
          icon: 'none',
          duration: 1500
        });
      }
    })
  }, 300),

  navigateToBlindBox: debounce(function() {
    wx.vibrateShort({ type: 'light' })
    wx.switchTab({
      url: '../love/love'
    })
  }, 300),

  navigateToCommunity: debounce(function() {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({ 
      url: '../community/community',
      success: () => {
        wx.showToast({ title: '前往社区动态', icon: 'success', duration: 800 })
      }
    })
  }, 300),

  navigateToPublish: debounce(function() {
    wx.vibrateShort({ type: 'light' })
    wx.switchTab({ 
      url: '../box-publish/box-publish',
      success: () => {
        wx.showToast({ title: '前往发布页面', icon: 'success', duration: 800 })
      }
    })
  }, 300),

  navigateToRider: debounce(function() {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({ 
      url: '../rider/rider',
      success: () => {
        wx.showToast({ title: '前往骑手中心', icon: 'success', duration: 800 })
      }
    })
  }, 300),

  navigateToAI: debounce(function() {
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({
      url: '../ai/ai',
      success: function(res) {
        console.log('跳转成功', res)
        wx.showToast({ title: '打开智能助手', icon: 'success', duration: 800 })
      },
      fail: function(err) {
        console.log('跳转失败', err)
        wx.showToast({ title: '打开失败，请稍后重试', icon: 'none', duration: 1500 })
      }
    })
  }, 300),

  navigateToBoxDetail: debounce(function(e) {
    const id = e.currentTarget.dataset.id
    console.log('点击盲盒卡片:', id)
    wx.vibrateShort({ type: 'light' })
    wx.navigateTo({
      url: `../box-detail/box-detail?id=${id}`,
      success: () => {
        console.log('跳转成功')
      },
      fail: (err) => {
        console.error('跳转失败:', err)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 1500
        })
      }
    })
  }, 300),

  onImageError(e) {
    const index = e.currentTarget.dataset.index
    console.log('图片加载失败:', index)
    const defaultImage = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blind%20box%20package%20with%20mystery%20items&image_size=square'
    const hotBoxes = this.data.hotBoxes
    if (hotBoxes[index]) {
      hotBoxes[index].images[0] = defaultImage
      this.setData({ hotBoxes })
    }
  },

  onAvatarError(e) {
    const index = e.currentTarget.dataset.index
    console.log('头像加载失败:', index)
    const defaultAvatar = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20icon%20simple%20style&image_size=square'
    const communityFeed = this.data.communityFeed
    if (communityFeed[index]) {
      communityFeed[index].userAvatar = defaultAvatar
      this.setData({ communityFeed })
    }
  },

  onFeedImageError(e) {
    const index = e.currentTarget.dataset.index
    console.log('动态图片加载失败:', index)
    const defaultImage = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blind%20box%20package%20with%20mystery%20items&image_size=square'
    const communityFeed = this.data.communityFeed
    if (communityFeed[index]) {
      communityFeed[index].image = defaultImage
      this.setData({ communityFeed })
    }
  },

  navigateToFeedDetail: debounce(function(e) {
    const { type, id } = e.currentTarget.dataset
    wx.vibrateShort({ type: 'light' })
    if (type === 'donation') {
      wx.navigateTo({ 
        url: '../donationDetail/donationDetail?id=' + id,
        success: () => {
          wx.showToast({ title: '查看捐赠详情', icon: 'success', duration: 800 })
        }
      })
    } else if (type === 'exchange') {
      wx.navigateTo({ 
        url: '../exchangeDetail/exchangeDetail?id=' + id,
        success: () => {
          wx.showToast({ title: '查看交换详情', icon: 'success', duration: 800 })
        }
      })
    } else {
      wx.navigateTo({ 
        url: '../box-detail/box-detail?id=' + id,
        success: () => {
          wx.showToast({ title: '查看盲盒详情', icon: 'success', duration: 800 })
        }
      })
    }
  }, 300),

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  preloadBoxDetail(id) {
    console.log('预加载盲盒详情:', id)
  },

  onShareAppMessage() {
    return {
      title: 'CBB校园盲盒 - 让闲置物品动起来',
      path: '/pages/index/index',
      imageUrl: '/images/share.png'
    }
  },

  // 分享盲盒
  onShareBox(e) {
    const boxId = e.currentTarget.dataset.boxId
    const boxName = e.currentTarget.dataset.boxName || '盲盒'
    
    // 记录分享行为
    this.trackBehavior('share', boxId)
    
    return {
      title: `快来看看这个${boxName}盲盒！`,
      path: `/pages/box-detail/box-detail?id=${boxId}`,
      imageUrl: '/images/share.png',
      success: (res) => {
        // 分享成功，记录并获取奖励
        this.recordShare(boxId)
        wx.showToast({
          title: '分享成功！获得2积分',
          icon: 'success',
          duration: 2000
        })
      },
      fail: (err) => {
        console.error('分享失败:', err)
      }
    }
  },

  // 记录用户行为
  trackBehavior(actionType, boxId) {
    const userInfo = store.getUser()
    if (!userInfo || !userInfo.openid) return
    
    wx.cloud.callFunction({
      name: 'userBehavior',
      data: {
        action: 'track',
        data: {
          openid: userInfo.openid,
          actionType: actionType,
          boxId: boxId
        }
      },
      success: (res) => {
        console.log('行为记录成功:', actionType)
      },
      fail: (err) => {
        console.error('行为记录失败:', err)
      }
    })
  },

  // 记录分享
  recordShare(boxId) {
    const userInfo = store.getUser()
    if (!userInfo || !userInfo.openid) return
    
    wx.cloud.callFunction({
      name: 'shareService',
      data: {
        action: 'recordShare',
        data: {
          openid: userInfo.openid,
          boxId: boxId,
          shareType: 'wechat'
        }
      },
      success: (res) => {
        console.log('分享记录成功')
        // 更新用户积分
        this.loadUserCoins()
      },
      fail: (err) => {
        console.error('分享记录失败:', err)
      }
    })
  },

  // AI按钮拖动事件
  onAiBtnTouchStart(e) {
    const touch = e.touches[0]
    this.setData({
      isDragging: false,
      '_touchStartPos.x': touch.clientX,
      '_touchStartPos.y': touch.clientY,
      '_aiBtnStartPos.x': this.data.aiBtnPosition.x,
      '_aiBtnStartPos.y': this.data.aiBtnPosition.y
    })
  },

  onAiBtnTouchMove(e) {
    const touch = e.touches[0]
    const deltaX = touch.clientX - this.data._touchStartPos.x
    const deltaY = touch.clientY - this.data._touchStartPos.y
    
    // 如果移动距离超过5px，认为是拖动
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this.setData({ isDragging: true })
    }
    
    if (this.data.isDragging) {
      // 获取屏幕尺寸
      const sysInfo = wx.getSystemInfoSync()
      const screenWidth = sysInfo.windowWidth
      const screenHeight = sysInfo.windowHeight
      const btnSize = 54 // 108rpx ≈ 54px
      
      let newX = this.data._aiBtnStartPos.x + deltaX
      let newY = this.data._aiBtnStartPos.y + deltaY
      
      // 边界限制
      newX = Math.max(0, Math.min(newX, screenWidth - btnSize))
      newY = Math.max(0, Math.min(newY, screenHeight - btnSize))
      
      this.setData({
        'aiBtnPosition.x': newX,
        'aiBtnPosition.y': newY
      })
    }
  },

  onAiBtnTouchEnd(e) {
    const wasDragging = this.data.isDragging
    this.setData({ isDragging: false })
    
    // 如果没有拖动（只是点击），则触发点击事件
    if (!wasDragging) {
      this.navigateToAI()
    } else {
      // 拖动结束后，吸附到左右边缘
      const sysInfo = wx.getSystemInfoSync()
      const screenWidth = sysInfo.windowWidth
      const btnSize = 54
      const currentX = this.data.aiBtnPosition.x
      const centerX = screenWidth / 2
      
      // 吸附到最近的边缘
      const targetX = currentX < centerX ? 10 : screenWidth - btnSize - 10
      
      this.setData({
        'aiBtnPosition.x': targetX
      })
    }
  },

  closeAITip() {
    this.setData({ showAITip: false })
  }
})