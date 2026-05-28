Page({
  data: {
    // 统计数据
    stats: {
      totalItems: 128,
      todayNew: 12,
      successRate: 95
    },
    
    // 爱心值数据
    lovePoints: 158,
    totalDonations: 23,
    totalExchanges: 8,
    
    // 爱心榜
    loveRank: [
      {
        _id: '1',
        name: '热心学长',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        points: 520
      },
      {
        _id: '2',
        name: '爱心学姐',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        points: 380
      },
      {
        _id: '3',
        name: '环保小卫士',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200',
        points: 320
      },
      {
        _id: '4',
        name: '闲置大王',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200',
        points: 220
      },
      {
        _id: '5',
        name: '分享达人',
        avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200',
        points: 180
      }
    ],
    
    // 发布按钮位置和拖动状态
    publishBtnPosition: { x: 320, y: 500 },
    isDragging: false,
    _publishBtnStartPos: { x: 0, y: 0 },
    
    // 当前Tab
    activeTab: 'donation',
    
    // 免费送物品
    donationItems: [
      {
        _id: '1',
        title: '考研数学复习全书',
        images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'],
        userName: '小明同学',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        location: '中园公寓',
        status: 'pending',
        statusText: '待领取',
        createTime: '10分钟前',
        isNew: true,
        tags: ['书籍', '考研']
      },
      {
        _id: '2',
        title: '闲置台灯 九成新',
        images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400'],
        userName: '小红',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        location: '苏园居',
        status: 'pending',
        statusText: '待领取',
        createTime: '30分钟前',
        isNew: true,
        tags: ['电器', '九成新']
      },
      {
        _id: '3',
        title: '英语四六级资料',
        images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'],
        userName: '学霸君',
        userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200',
        location: '知行1栋',
        status: 'claimed',
        statusText: '已领完',
        createTime: '2小时前',
        isNew: false,
        tags: ['资料', '四六级']
      }
    ],
    
    // 以物换物
    exchangeItems: [
      {
        _id: '1',
        wantItem: '蓝牙耳机',
        haveItem: '机械键盘',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        userName: '键盘侠',
        createTime: '1小时前'
      },
      {
        _id: '2',
        wantItem: '保温杯',
        haveItem: '充电宝',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        userName: '小美美',
        createTime: '3小时前'
      },
      {
        _id: '3',
        wantItem: '羽毛球拍',
        haveItem: '篮球',
        userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200',
        userName: '运动达人',
        createTime: '5小时前'
      }
    ],
    
    // 排行榜
    rankList: [
      { 
        _id: '1', 
        name: '热心学长', 
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', 
        donateCount: 25, 
        exchangeCount: 12, 
        score: 520 
      },
      { 
        _id: '2', 
        name: '爱心学姐', 
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', 
        donateCount: 18, 
        exchangeCount: 8, 
        score: 380 
      },
      { 
        _id: '3', 
        name: '环保小卫士', 
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200', 
        donateCount: 15, 
        exchangeCount: 10, 
        score: 320 
      },
      { 
        _id: '4', 
        name: '闲置大王', 
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200', 
        donateCount: 10, 
        exchangeCount: 6, 
        score: 220 
      },
      { 
        _id: '5', 
        name: '分享达人', 
        avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200', 
        donateCount: 8, 
        exchangeCount: 5, 
        score: 180 
      }
    ],
    
    // 公告
    notices: [
      '欢迎使用校园社区，让闲置物品流转起来！',
      '发布物品请遵守社区规范，禁止发布违禁品',
      '本周活跃达人榜已更新，快来上榜吧！',
      '以物换物功能全新上线，快去体验吧！'
    ],
    
    // 发布菜单显示状态
    showPublishMenu: false
  },

  onLoad() {
    console.log('校园社区页面加载');
    this.loadData();
  },

  onShow() {
    console.log('校园社区页面显示');
  },

  // 加载数据
  loadData() {
    // 这里可以调用接口获取真实数据
    console.log('加载社区数据');
  },

  // 切换Tab
  setTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 跳转到免费送列表
  navigateToDonationList() {
    wx.navigateTo({ 
      url: '../love/love',
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到免费送详情
  navigateToDonationDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: '../donationDetail/donationDetail?id=' + id,
      fail: () => {
        wx.showToast({
          title: '页面跳转中',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到交换列表
  navigateToExchangeList() {
    wx.navigateTo({ 
      url: '../exchange/exchange',
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到交换详情
  navigateToExchangeDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: '../exchangeDetail/exchangeDetail?id=' + id,
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 发布按钮触摸开始
  onPublishBtnTouchStart(e) {
    this.setData({
      isDragging: false,
      '_publishBtnStartPos.x': this.data.publishBtnPosition.x,
      '_publishBtnStartPos.y': this.data.publishBtnPosition.y,
      '_publishBtnStartPos.touchX': e.touches[0].clientX,
      '_publishBtnStartPos.touchY': e.touches[0].clientY
    });
  },

  // 发布按钮触摸移动
  onPublishBtnTouchMove(e) {
    const moveX = e.touches[0].clientX - this.data._publishBtnStartPos.touchX;
    const moveY = e.touches[0].clientY - this.data._publishBtnStartPos.touchY;
    
    if (Math.abs(moveX) > 5 || Math.abs(moveY) > 5) {
      this.setData({ isDragging: true });
    }
    
    const newX = this.data._publishBtnStartPos.x + moveX;
    const newY = this.data._publishBtnStartPos.y + moveY;
    
    // 限制在屏幕范围内
    const maxX = wx.getSystemInfoSync().windowWidth - 60;
    const maxY = wx.getSystemInfoSync().windowHeight - 150;
    
    this.setData({
      'publishBtnPosition.x': Math.max(0, Math.min(newX, maxX)),
      'publishBtnPosition.y': Math.max(50, Math.min(newY, maxY))
    });
  },

  // 发布按钮触摸结束
  onPublishBtnTouchEnd(e) {
    if (!this.data.isDragging) {
      // 如果没有拖动，则显示发布菜单
      this.showPublishMenu();
    }
    
    // 吸附到左右边缘
    const screenWidth = wx.getSystemInfoSync().windowWidth;
    const currentX = this.data.publishBtnPosition.x;
    const targetX = currentX < screenWidth / 2 ? 10 : screenWidth - 70;
    
    this.setData({
      'publishBtnPosition.x': targetX
    });
  },

  // 显示发布菜单
  showPublishMenu() {
    this.setData({ showPublishMenu: true });
  },

  // 隐藏发布菜单
  hidePublishMenu() {
    this.setData({ showPublishMenu: false });
  },

  // 阻止冒泡
  preventHide() {
    // 什么都不做，只是阻止事件冒泡
  },

  // 跳转到发布免费送
  navigateToPublishDonation() {
    this.hidePublishMenu();
    wx.navigateTo({ 
      url: '../love-donate/love-donate',
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到发布交换
  navigateToPublishExchange() {
    this.hidePublishMenu();
    wx.navigateTo({ 
      url: '../exchangePublish/exchangePublish',
      fail: () => {
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.loadData();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '校园社区 - 闲置流转，温暖传递',
      path: '/pages/community/community'
    };
  }
});
