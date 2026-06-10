// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, arguments);
    }, wait);
  };
}

// 节流函数
function throttle(func, limit) {
  let inThrottle;
  return function () {
    if (!inThrottle) {
      func.apply(this, arguments);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

Page({
  data: {
    boxes: [],
    activeTab: 'all',
    sortType: 'default',
    loading: true,
    hasMore: true,
    page: 1,
    luckyBox: {
      price: 10,  // 改为积分消耗
      originalPrice: 19.9,
      remaining: 10
    },
    demandList: [],
    supplyList: [],
    grabOrders: [],
    pendingOrders: 0,
    isOpening: false,
    showResult: false,
    resultData: {},
    skeleton: true,
    refreshing: false,
    searchKeyword: '',
    userCoins: 0  // 用户盲盒积分
  },

  onLoad() {
    wx.switchTab({ url: '/pages/love/love' });
  },

  onShow() {
    // 每次显示页面时加载用户积分
    this.loadUserCoins();
  },

  loadUserCoins() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.openid) {
      this.setData({ userCoins: 0 });
      return;
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
          this.setData({
            userCoins: res.result.user.blindBoxCoins || 0
          });
        }
      },
      fail: () => {
        this.setData({ userCoins: 0 });
      }
    });
  },

  onUnload() {
    // 移除事件监听
    this.app.off('loginSuccess', this.onLoginSuccess);
  },

  onLoginSuccess(userInfo) {
    // 登录成功后更新数据
    this.loadBoxes();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, boxes: [], refreshing: true });
    this.loadBoxes();
    this.loadGrabOrders();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  initData() {
    // 先显示骨架屏
    this.setData({ skeleton: true });
    
    // 延迟加载数据，模拟网络请求
    setTimeout(() => {
      this.loadBoxes();
      this.loadGrabOrders();
    }, 500);
  },

  // 防抖处理的标签切换
  setTab: debounce(function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab, page: 1, boxes: [], skeleton: true });
    this.loadBoxes();
  }, 300),

  // 防抖处理的排序切换
  setSort: debounce(function (e) {
    const sort = e.currentTarget.dataset.sort;
    this.setData({ sortType: sort, page: 1, boxes: [], skeleton: true });
    this.loadBoxes();
  }, 300),

  loadBoxes() {
    if (this.data.loading) {
      return;
    }
    
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'getBlindBoxes',
      data: {
        type: this.data.activeTab,
        sort: this.data.sortType,
        page: this.data.page
      },
      success: res => {
        try {
          if (res.result && res.result.length > 0) {
            const newBoxes = this.data.page === 1 ? res.result : [...this.data.boxes, ...res.result];
            this.setData({
              boxes: newBoxes,
              hasMore: res.result.length === 10,
              loading: false,
              skeleton: false,
              refreshing: false
            });
            // 缓存数据
            this.cacheData();
          } else {
            this.useMockData();
          }
        } catch (error) {
          console.error('处理盲盒数据失败:', error);
          this.useMockData();
        } finally {
          wx.stopPullDownRefresh();
        }
      },
      fail: (err) => {
        console.error('获取盲盒数据失败:', err);
        this.useMockData();
        wx.stopPullDownRefresh();
      }
    });
  },

  useMockData() {
    const mockBoxes = [
      { _id: '1', title: '全新数码配件盲盒', price: 9.9, images: ['/images/blindbox/electronics_0_0.jpg'], fromDorm: '中园公寓', sales: 23, type: 'secondhand', typeName: '二手数码盲盒', isHot: true },
      { _id: '2', title: '精美文具套装', price: 14.9, images: ['/images/blindbox/fashion_0_0.jpg'], fromDorm: '苏园居', sales: 45, type: 'creative', typeName: '创意盲盒' },
      { _id: '3', title: '时尚服饰盲盒', price: 19.9, images: ['/images/blindbox/fashion_1_1.jpg'], fromDorm: '中南公寓', sales: 12, type: 'fashion', typeName: '时尚盲盒' },
      { _id: '4', title: '图书盲盒', price: 12.9, images: ['/images/blindbox/study_0_0.jpg'], fromDorm: '新柏居', sales: 34, type: 'book', typeName: '图书盲盒' },
      { _id: '5', title: '运动装备盲盒', price: 29.9, images: ['/images/blindbox/study_1_1.jpg'], fromDorm: '三友园', sales: 18, type: 'sports', typeName: '运动盲盒', isNew: true },
      { _id: '6', title: '校园生活盲盒', price: 19.9, images: ['/images/blindbox/sports_0_0.jpg'], fromDorm: '知行1栋', sales: 56, type: 'life', typeName: '生活盲盒' }
    ];
    this.setData({
      boxes: mockBoxes,
      loading: false,
      hasMore: false,
      skeleton: false,
      refreshing: false
    });
  },

  loadMore() {
    if (this.data.loading) {
      return;
    }
    
    this.setData({ loading: true, page: this.data.page + 1 });
    this.loadBoxes();
  },

  loadGrabOrders() {
    wx.cloud.callFunction({
      name: 'getPendingOrders',
      success: res => {
        try {
          if (res.result) {
            this.setData({ 
              grabOrders: res.result,
              pendingOrders: res.result.length
            });
          }
        } catch (error) {
          console.error('处理抢单数据失败:', error);
          this.useMockGrabOrders();
        }
      },
      fail: (err) => {
        console.error('获取抢单数据失败:', err);
        this.useMockGrabOrders();
      }
    });
  },

  useMockGrabOrders() {
    this.setData({
      grabOrders: [
        { _id: '1', fromDorm: '中园公寓', toDorm: '苏园居', fee: 1 },
        { _id: '2', fromDorm: '中南公寓', toDorm: '知行1栋', fee: 1 }
      ],
      pendingOrders: 2
    });
  },

  // 防抖处理的导航函数
  navigateToDetail: debounce(function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: `../box-detail/box-detail?id=${id}`,
      success: () => {
        // 预加载盲盒详情页数据
        this.preloadBoxDetail(id);
      }
    });
  }, 300),

  preloadBoxDetail(id) {
    // 预加载盲盒详情页数据
    wx.cloud.callFunction({
      name: 'getBoxDetail',
      data: { id },
      success: res => {
        if (res.result) {
          // 可以将数据存储到全局，供详情页使用
          getApp().globalData.currentBox = res.result;
        }
      },
      fail: err => console.error('预加载盲盒详情失败:', err)
    });
  },

  openLuckyBox() {
    if (this.data.isOpening) {
      return;
    }
    
    // 检查积分是否足够
    if (this.data.userCoins < this.data.luckyBox.price) {
      wx.showModal({
        title: '积分不足',
        content: '您的盲盒积分不足，请通过签到、分享、交易等方式获取积分',
        showCancel: false
      });
      return;
    }
    
    this.setData({ isOpening: true });
    
    // 显示加载动画
    wx.showLoading({
      title: '正在开盲盒...',
      mask: true
    });
    
    // 调用云函数消耗积分
    wx.cloud.callFunction({
      name: 'coinService',
      data: {
        action: 'consume',
        data: {
          openid: wx.getStorageSync('userInfo').openid,
          amount: this.data.luckyBox.price
        }
      },
      success: (coinRes) => {
        if (coinRes.result && coinRes.result.success) {
          // 积分扣除成功，执行开盒逻辑
          setTimeout(() => {
            wx.hideLoading();
            
            // 更新用户积分
            this.setData({
              userCoins: this.data.userCoins - this.data.luckyBox.price,
              isOpening: false,
              showResult: true,
              resultData: {
                isLucky: Math.random() > 0.8,
                image: 'https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png',
                name: '全新数码配件',
                description: '恭喜获得全新数码配件盲盒',
                score: Math.floor(Math.random() * 5) + 1
              }
            });
            
            // 播放开盒音效
            this.playOpenBoxSound();
          }, 2000);
        } else {
          wx.hideLoading();
          this.setData({ isOpening: false });
          wx.showToast({
            title: coinRes.result?.message || '开盒失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isOpening: false });
        console.error('消耗积分失败:', err);
        wx.showToast({
          title: '开盒失败',
          icon: 'none'
        });
      }
    });
  },

  playOpenBoxSound() {
    // 这里可以添加开盒音效
    console.log('播放开盒音效');
  },

  closeResult() {
    this.setData({ showResult: false });
  },

  shareResult() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 防抖处理的导航函数
  navigateToPublishDemand: debounce(function () {
    wx.navigateTo({ 
      url: '../box-publish/box-publish?type=demand',
      success: () => {
        wx.showToast({
          title: '前往发布需求',
          icon: 'none',
          duration: 1000
        });
      }
    });
  }, 300),

  // 防抖处理的导航函数
  navigateToPublishSupply: debounce(function () {
    wx.navigateTo({ 
      url: '../box-publish/box-publish?type=supply',
      success: () => {
        wx.showToast({
          title: '前往发布供给',
          icon: 'none',
          duration: 1000
        });
      }
    });
  }, 300),

  // 防抖处理的响应需求
  respondDemand: debounce(function (e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '响应成功', icon: 'success' });
  }, 300),

  // 防抖处理的联系供给
  contactSupply: debounce(function (e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '私信已发送', icon: 'none' });
  }, 300),

  cacheData() {
    try {
      // 缓存数据到本地
      wx.setStorageSync('blindBoxData', {
        boxes: this.data.boxes,
        activeTab: this.data.activeTab,
        sortType: this.data.sortType,
        cachedAt: new Date().getTime()
      });
    } catch (error) {
      console.error('缓存数据失败:', error);
    }
  },

  onShareAppMessage() {
    const that = this;
    return {
      title: 'CBB校园盲盒 - 发现惊喜，分享快乐',
      path: '/pages/love/love',
      imageUrl: 'https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png',
      success: function (res) {
        // 分享成功后获取积分
        wx.cloud.callFunction({
          name: 'coinService',
          data: {
            action: 'share',
            data: {
              openid: getApp().globalData.openid
            }
          },
          success: (coinRes) => {
            if (coinRes.result && coinRes.result.success) {
              that.setData({
                userCoins: that.data.userCoins + coinRes.result.coins
              });
              wx.showToast({
                title: `分享成功，获得${coinRes.result.coins}积分`,
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: coinRes.result?.message || '分享成功',
                icon: 'none'
              });
            }
          },
          fail: () => {
            wx.showToast({
              title: '分享成功',
              icon: 'success'
            });
          }
        });
      },
      fail: function (res) {
        wx.showToast({
          title: '分享失败',
          icon: 'none'
        });
      }
    };
  },

  onShareTimeline() {
    return {
      title: 'CBB校园盲盒 - 发现惊喜，分享快乐',
      query: 'from=timeline',
      imageUrl: 'https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'
    };
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }
    console.log('搜索：', keyword);
    wx.navigateTo({
      url: `../search/search?keyword=${encodeURIComponent(keyword)}`
    });
  },

  // 图片加载成功
  imageLoad(e) {
    console.log('图片加载成功:', e);
  },

  // 图片加载失败
  imageError(e) {
    console.error('图片加载失败:', e);
    // 可以设置默认图片
  }
});