const lazyLoad = require('../../utils/lazyLoad');
const { blindBoxesData } = require('./love_data');

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

Page({
  data: {
    // 搜索关键词
    searchKeyword: '',
    // 当前分类
    activeCategory: 'all',
    // 是否显示详情页
    showDetail: false,
    // 当前选中的盲盒
    currentBox: {},
    // 是否已点赞
    isLiked: false,
    // 是否已关注
    isFollowing: false,
    // 摇一摇相关
    showShakeModal: false,
    isShaking: false,
    showShakeResult: false,
    shakedBox: null,
    // 错误处理
    error: null,
    // 加载状态
    loading: false,
    // 搜索加载状态
    searchLoading: false,
    // 浏览历史
    browseHistory: [],
    // 推荐商品
    recommendedBoxes: [],
    // 盲盒数据
    blindBoxes: blindBoxesData,
    // 过滤后的盲盒数据
    filteredBlindBoxes: [],
    // 视频容器高度
    videoContainerHeight: 0,
    // 用户盲盒积分
    userCoins: 100,
    // 每次摇一摇消耗的盲盒积分
    shakeCost: 10,
    // 摇一摇池 - 按概率分布
    shakePool: [
      { probability: 5, type: 'rare', minPrice: 50 },
      { probability: 15, type: 'epic', minPrice: 30 },
      { probability: 30, type: 'uncommon', minPrice: 20 },
      { probability: 50, type: 'common', minPrice: 10 }
    ],
    // 滑动手势相关
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0
  },

  onLoad() {
    console.log('盲盒广场页面加载 - 修改已生效');
    console.log('导航栏高度已调整，分类标签位置已优化');
    this.calculateContainerHeight();
    this.filterBlindBoxes();
    this.initRecommendedBoxes();
    // 初始化懒加载
    this.initLazyLoad();
  },

  onShow() {
    console.log('盲盒广场页面显示');
    this.initLazyLoad();
    // 设置自定义 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },

  // 初始化图片懒加载
  initLazyLoad() {
    setTimeout(() => {
      this.lazyLoadImages();
    }, 300);
  },

  // 懒加载图片
  lazyLoadImages() {
    const query = wx.createSelectorQuery();
    query.selectAll('.lazy-image').boundingClientRect();
    query.exec((res) => {
      if (res && res[0]) {
        res[0].forEach((image) => {
          const imgElement = image;
          if (imgElement.dataset.src) {
            imgElement.src = imgElement.dataset.src;
          }
        });
      }
    });
  },


  // 计算视频容器高度
  calculateContainerHeight() {
    const windowInfo = wx.getWindowInfo();
    const headerHeight = 240; // 搜索栏 + 导航栏 + 分类标签的高度
    const containerHeight = windowInfo.windowHeight - headerHeight;
    this.setData({ videoContainerHeight: containerHeight });
  },

  // 摇一摇功能
  startShake: debounce(function () {
    const { userCoins, shakeCost } = this.data;
    
    if (userCoins < shakeCost) {
      wx.showToast({
        title: '盲盒积分不足',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 添加按钮点击反馈
    wx.vibrateShort({ type: 'light' });
    
    this.setData({
      showShakeModal: true,
      isShaking: false
    });
  }, 300),

  closeShakeModal() {
    this.setData({
      showShakeModal: false,
      isShaking: false
    });
  },

  preventClose() {
    // 阻止冒泡，防止点击内容区域关闭弹窗
  },

  startShakeAction: debounce(function () {
    if (this.data.isShaking) {
      return;
    }

    this.setData({ isShaking: true });

    // 消耗盲盒积分
    const { userCoins, shakeCost } = this.data;
    const newCoins = userCoins - shakeCost;
    this.setData({ userCoins: newCoins });

    // 模拟摇动过程
    setTimeout(() => {
      // 按概率抽取盲盒类型
      const shakedType = this.getRandomBoxType();
      // 根据类型选择盲盒
      const shakedBox = this.selectBoxByType(shakedType);

      this.setData({
        isShaking: false,
        showShakeModal: false,
        showShakeResult: true,
        shakedBox: shakedBox
      });

      // 播放震动效果
      wx.vibrateShort({
        type: 'medium'
      });

      // 播放音效（如果有）
      // wx.createInnerAudioContext().play();
    }, 2000);
  }, 300),

  // 根据概率获取盲盒类型
  getRandomBoxType() {
    const { shakePool } = this.data;
    const random = Math.random() * 100;
    let cumulativeProbability = 0;

    for (const item of shakePool) {
      cumulativeProbability += item.probability;
      if (random <= cumulativeProbability) {
        return item;
      }
    }

    return shakePool[shakePool.length - 1]; // 默认返回最常见的类型
  },

  // 根据类型选择盲盒
  selectBoxByType(boxType) {
    const { blindBoxes } = this.data;
    const eligibleBoxes = blindBoxes.filter(box => box.price >= boxType.minPrice);

    if (eligibleBoxes.length > 0) {
      const randomIndex = Math.floor(Math.random() * eligibleBoxes.length);
      return eligibleBoxes[randomIndex];
    }

    // 如果没有符合条件的盲盒，随机选择一个
    const randomIndex = Math.floor(Math.random() * blindBoxes.length);
    return blindBoxes[randomIndex];
  },

  closeShakeResult() {
    this.setData({
      showShakeResult: false,
      shakedBox: null
    });
  },

  // 存入我的盲盒
  saveToMyBoxes: debounce(function () {
    const { shakedBox } = this.data;
    
    // 添加按钮点击反馈
    wx.vibrateShort({ type: 'light' });
    
    // 这里可以实现存入我的盲盒的逻辑
    // 例如，将盲盒添加到本地存储或发送到服务器
    wx.showToast({
      title: '已存入我的盲盒',
      icon: 'success',
      duration: 800
    });
    
    this.setData({
      showShakeResult: false,
      shakedBox: null
    });
  }, 300),

  // 直接发货
  sendDirectly: debounce(function () {
    const { shakedBox } = this.data;
    
    // 添加按钮点击反馈
    wx.vibrateShort({ type: 'light' });
    
    // 这里可以实现直接发货的逻辑
    // 例如，跳转到订单确认页面或发送到服务器
    wx.showToast({
      title: '正在处理发货',
      icon: 'loading',
      duration: 2000
    });
    
    setTimeout(() => {
      wx.showToast({
        title: '发货成功',
        icon: 'success',
        duration: 800
      });
      
      this.setData({
        showShakeResult: false,
        shakedBox: null
      });
    }, 2000);
  }, 300),


  // 设置分类
  setCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
    this.filterBlindBoxes();
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    
    // 防抖处理
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.filterBlindBoxes();
    }, 300);
  },

  // 搜索
  onSearch() {
    this.filterBlindBoxes();
  },

  // 过滤盲盒数据
  filterBlindBoxes() {
    const { blindBoxes, searchKeyword, activeCategory } = this.data;
    
    this.setData({ searchLoading: true, error: null });
    
    try {
      let filtered = blindBoxes;
      
      // 按分类过滤
      if (activeCategory !== 'all') {
        filtered = filtered.filter(box => box.category === activeCategory);
      }
      
      // 按关键词搜索
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        filtered = filtered.filter(box => 
          box.title.toLowerCase().includes(keyword)
        );
      }
      
      this.setData({ 
        filteredBlindBoxes: filtered, 
        searchLoading: false 
      }, () => {
        // 筛选后重新初始化懒加载
        this.initLazyLoad();
      });
    } catch (err) {
      this.setData({ 
        error: '搜索失败，请重试', 
        searchLoading: false 
      });
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    }
  },

  // 显示盲盒详情（类似抖音点击视频）
  showBoxDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    // 跳转到独立详情页，与首页点击盲盒行为一致
    wx.navigateTo({
      url: '../box-detail/box-detail?id=' + id,
      fail: () => {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },
  
  // 原有的内联详情已废弃，保留方法仅做兼容
  _legacyShowBoxDetail(e) {
    const id = e.currentTarget.dataset.id;
    const box = this.data.blindBoxes.find(item => item._id === id);
    
    if (box) {
      this.addToBrowseHistory(box);
      const originalPrice = (box.originalPrice || box.price * 1.5).toFixed(1);
      const priceSave = ((box.originalPrice || box.price * 1.5) - box.price).toFixed(1);
      
      wx.setNavigationBarTitle({
        title: '盲盒详情'
      });
      
      this.setData({
        showDetail: true,
        currentBox: box,
        originalPrice: originalPrice,
        priceSave: priceSave,
        isLiked: false,
        isFollowing: false
      });
    }
  },

  // 添加到浏览历史
  addToBrowseHistory(box) {
    const { browseHistory } = this.data;
    // 移除已存在的相同商品
    const filteredHistory = browseHistory.filter(item => item._id !== box._id);
    // 添加到历史记录开头
    const newHistory = [box, ...filteredHistory].slice(0, 10); // 只保留最近10条
    
    this.setData({ browseHistory: newHistory });
    // 更新推荐商品
    this.updateRecommendedBoxes();
  },

  // 初始化推荐商品
  initRecommendedBoxes() {
    const { blindBoxes } = this.data;
    // 随机推荐3个商品
    const recommended = this.getRandomBoxes(blindBoxes, 3);
    this.setData({ recommendedBoxes: recommended });
  },

  // 更新推荐商品
  updateRecommendedBoxes() {
    const { blindBoxes, browseHistory } = this.data;
    
    if (browseHistory.length === 0) {
      // 如果没有浏览历史，随机推荐
      const recommended = this.getRandomBoxes(blindBoxes, 3);
      this.setData({ recommendedBoxes: recommended });
      return;
    }
    
    // 基于浏览历史推荐同类商品
    const categoryMap = {};
    browseHistory.forEach(box => {
      if (!categoryMap[box.category]) {
        categoryMap[box.category] = 0;
      }
      categoryMap[box.category]++;
    });
    
    // 找出浏览最多的分类
    const mostViewedCategory = Object.keys(categoryMap).reduce((a, b) => 
      categoryMap[a] > categoryMap[b] ? a : b
    );
    
    // 推荐该分类的商品
    const sameCategoryBoxes = blindBoxes.filter(
      box => box.category === mostViewedCategory && 
             !browseHistory.some(item => item._id === box._id)
    );
    
    let recommended = [];
    if (sameCategoryBoxes.length > 0) {
      recommended = this.getRandomBoxes(sameCategoryBoxes, 3);
    } else {
      // 如果该分类没有更多商品，随机推荐
      recommended = this.getRandomBoxes(blindBoxes, 3);
    }
    
    this.setData({ recommendedBoxes: recommended });
  },

  // 随机获取指定数量的商品
  getRandomBoxes(boxes, count) {
    const shuffled = [...boxes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  },

  // 隐藏盲盒详情（返回列表）
  hideBoxDetail() {
    // 恢复导航栏标题
    wx.setNavigationBarTitle({
      title: '盲盒'
    });
    
    this.setData({
      showDetail: false,
      currentBox: {},
      isLiked: false,
      isFollowing: false
    });
  },

  // 切换点赞状态
  toggleLike() {
    const { isLiked, currentBox } = this.data;
    const newLikeCount = isLiked ? currentBox.likeCount - 1 : currentBox.likeCount + 1;
    
    this.setData({
      isLiked: !isLiked,
      'currentBox.likeCount': newLikeCount
    });
    
    wx.showToast({
      title: isLiked ? '取消点赞' : '点赞成功',
      icon: 'none'
    });
  },

  // 显示评论
  showComments() {
    wx.showToast({
      title: '评论已提交',
      icon: 'none'
    });
  },

  // 分享盲盒
  shareBox() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onShareAppMessage() {
    const { currentBox, showDetail } = this.data;
    
    if (showDetail && currentBox._id) {
      return {
        title: currentBox.title,
        path: '/pages/love/love?id=' + currentBox._id,
        imageUrl: currentBox.images[0]
      };
    }
    
    return {
      title: '盲盒广场 - 发现惊喜',
      path: '/pages/love/love'
    };
  },

  // 关注用户
  followUser() {
    this.setData({
      isFollowing: !this.data.isFollowing
    });
    
    wx.showToast({
      title: this.data.isFollowing ? '关注成功' : '取消关注',
      icon: 'success'
    });
  },

  // 购买盲盒
  buyBlindBox(e) {
    let box = null;
    if (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.box) {
      box = e.currentTarget.dataset.box;
    }
    const targetBox = box || this.data.currentBox;
    
    if (!targetBox) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '购买确认',
      content: `确定要购买"${targetBox.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '购买成功',
            icon: 'success'
          });
          
          // 如果是当前详情页的商品，更新库存
          if (!box && this.data.showDetail) {
            const newStock = targetBox.stock - 1;
            this.setData({
              'currentBox.stock': newStock
            });
          }
          
          // 跳转到订单确认页面
          setTimeout(() => {
            wx.navigateTo({
              url: '../order-confirm/order-confirm?type=blindBox&id=' + targetBox._id + '&price=' + targetBox.price
            });
          }, 1000);
        }
      }
    });
  },

  // 加载更多
  loadMore() {
    if (this.data.loading) {
      return;
    }
    
    this.setData({ loading: true });
    
    // 模拟加载更多数据
    setTimeout(() => {
      this.setData({ loading: false });
    }, 1000);
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新');
    
    // 显示刷新提示
    wx.showToast({
      title: '刷新中...',
      icon: 'loading',
      duration: 1000,
      mask: true
    });
    
    // 模拟刷新过程
    setTimeout(() => {
      // 重新初始化数据
      this.filterBlindBoxes();
      this.initRecommendedBoxes();
      
      // 停止刷新
      wx.stopPullDownRefresh();
      
      // 显示刷新成功提示
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      });
    }, 1000);
  },

  // 触摸开始
  onCardTouchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY
    });
  },

  // 触摸移动
  onCardTouchMove(e) {
    this.setData({
      touchEndX: e.touches[0].clientX,
      touchEndY: e.touches[0].clientY
    });
  },

  // 触摸结束
  onCardTouchEnd(e) {
    const { touchStartX, touchEndX, touchStartY, touchEndY } = this.data;
    const index = e.currentTarget.dataset.index;
    const box = this.data.filteredBlindBoxes[index];
    
    // 计算水平和垂直滑动距离
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // 只有当水平滑动距离大于垂直滑动距离，且滑动距离足够大时，才认为是水平滑动
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // 右滑 - 喜欢
        this.handleLike(box);
      } else {
        // 左滑 - 不喜欢
        this.handleDislike(index);
      }
    }
  },

  // 处理喜欢
  handleLike(box) {
    // 添加按钮点击反馈
    wx.vibrateShort({ type: 'light' });
    
    // 这里可以实现喜欢的逻辑，例如添加到喜欢列表
    wx.showToast({
      title: '喜欢成功',
      icon: 'success',
      duration: 800
    });
  },

  // 处理不喜欢
  handleDislike(index) {
    // 添加按钮点击反馈
    wx.vibrateShort({ type: 'light' });
    
    // 从过滤后的列表中移除该商品
    const filteredBlindBoxes = [...this.data.filteredBlindBoxes];
    filteredBlindBoxes.splice(index, 1);
    
    this.setData({
      filteredBlindBoxes: filteredBlindBoxes
    });
    
    wx.showToast({
      title: '已跳过',
      icon: 'none',
      duration: 800
    });
  }
});
