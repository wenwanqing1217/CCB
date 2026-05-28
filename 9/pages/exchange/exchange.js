Page({
  data: {
    activeTab: 'all',
    searchText: '',
    exchangeItems: [],
    filteredItems: [],
    currentIndex: 0,
    cardTranslateX: 0,
    cardRotate: 0,
    startX: 0,
    startY: 0,
    isDragging: false,
    showLikeIndicator: false,
    showNopeIndicator: false
  },

  onLoad() {
    this.loadData();
  },

  loadData() {
    const mockExchangeItems = [
      {
        _id: '101',
        userName: '小明',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        school: '东区',
        createTime: '2小时前',
        wantItem: '游戏手柄',
        haveItem: '全新笔记本电脑',
        images: ['https://images.unsplash.com/photo-1593642532400-2682810df593?w=400'],
        description: '全新未拆封笔记本电脑，想换一个游戏手柄，有意者私信',
        userId: 'user1'
      },
      {
        _id: '102',
        userName: '小红',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        school: '西区',
        createTime: '4小时前',
        wantItem: '英语四级资料',
        haveItem: '考研资料',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'],
        description: '考研资料全套，想换英语四级资料，有需要的同学联系我',
        userId: 'user2'
      },
      {
        _id: '103',
        userName: '小李',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
        school: '南区',
        createTime: '6小时前',
        wantItem: '篮球',
        haveItem: '足球',
        images: ['https://images.unsplash.com/photo-1576410597635-72f4a4013690?w=400'],
        description: '全新足球，想换一个篮球，有意者请私信',
        userId: 'user3'
      },
      {
        _id: '104',
        userName: '小王',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        school: '北区',
        createTime: '8小时前',
        wantItem: '滑板',
        haveItem: '羽毛球拍',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
        description: '尤尼克斯羽毛球拍，几乎全新，想换一个滑板',
        userId: 'user4'
      }
    ];

    this.setData({
      exchangeItems: mockExchangeItems,
      filteredItems: mockExchangeItems
    });
  },

  filterItems() {
    const { activeTab, searchText, exchangeItems } = this.data;
    let filtered = [...exchangeItems];

    if (searchText) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter(item => 
        item.wantItem.toLowerCase().includes(text) || 
        item.haveItem.toLowerCase().includes(text) ||
        (item.description && item.description.toLowerCase().includes(text))
      );
    }

    if (activeTab === 'want') {
      filtered = filtered.filter(item => item.wantItem);
    } else if (activeTab === 'have') {
      filtered = filtered.filter(item => item.haveItem);
    }

    this.setData({
      filteredItems: filtered,
      currentIndex: 0,
      cardTranslateX: 0,
      cardRotate: 0
    });
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
    this.filterItems();
  },

  onSearchConfirm() {
    this.filterItems();
  },

  setTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.filterItems();
  },

  onTouchStart(e) {
    this.setData({
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      isDragging: false
    });
  },

  onTouchMove(e) {
    const currentX = e.touches[0].clientX - this.data.startX;
    const currentY = e.touches[0].clientY - this.data.startY;

    if (!this.data.isDragging) {
      if (Math.abs(currentX) > 3 || Math.abs(currentY) > 3) {
        this.setData({ isDragging: true });
      }
    }

    if (this.data.isDragging && Math.abs(currentX) > Math.abs(currentY)) {
      const rotate = currentX / 35;
      // 添加视觉反馈，根据滑动方向显示不同的指示器
      const showLikeIndicator = currentX > 80;
      const showNopeIndicator = currentX < -80;
      
      this.setData({
        cardTranslateX: currentX * 1.5,
        cardRotate: Math.min(Math.max(rotate, -15), 15),
        showLikeIndicator: showLikeIndicator,
        showNopeIndicator: showNopeIndicator
      });
    }
  },

  onTouchEnd(e) {
    const { cardTranslateX, currentIndex, filteredItems } = this.data;

    if (Math.abs(cardTranslateX) > 80) {
      const direction = cardTranslateX > 0 ? 'right' : 'left';
      
      // 添加振动反馈
      wx.vibrateShort({ type: 'light' });
      
      this.setData({
        cardTranslateX: direction === 'right' ? 500 : -500,
        cardRotate: direction === 'right' ? 20 : -20
      });

      setTimeout(() => {
        this.setData({
          currentIndex: currentIndex + 1,
          cardTranslateX: 0,
          cardRotate: 0,
          isDragging: false,
          showLikeIndicator: false,
          showNopeIndicator: false
        });

        if (direction === 'right') {
          wx.showToast({
            title: '已发送交换申请',
            icon: 'success',
            duration: 800
          });
        } else {
          wx.showToast({
            title: '已跳过',
            icon: 'none',
            duration: 800
          });
        }
      }, 180);
    } else {
      this.setData({
        cardTranslateX: 0,
        cardRotate: 0,
        isDragging: false,
        showLikeIndicator: false,
        showNopeIndicator: false
      });
    }
  },

  onSkip(e) {
    e.stopPropagation();
    
    // 添加振动反馈
    wx.vibrateShort({ type: 'light' });
    
    this.setData({
      cardTranslateX: -500,
      cardRotate: -20,
      showNopeIndicator: true
    });

    setTimeout(() => {
      this.setData({
        currentIndex: this.data.currentIndex + 1,
        cardTranslateX: 0,
        cardRotate: 0,
        showNopeIndicator: false
      });
      wx.showToast({
        title: '已跳过',
        icon: 'none',
        duration: 800
      });
    }, 180);
  },

  onLike(e) {
    e.stopPropagation();
    
    // 添加振动反馈
    wx.vibrateShort({ type: 'light' });
    
    this.setData({
      cardTranslateX: 500,
      cardRotate: 20,
      showLikeIndicator: true
    });

    setTimeout(() => {
      this.setData({
        currentIndex: this.data.currentIndex + 1,
        cardTranslateX: 0,
        cardRotate: 0,
        showLikeIndicator: false
      });
      wx.showToast({
        title: '已发送交换申请',
        icon: 'success',
        duration: 800
      });
    }, 180);
  },

  onChat(e) {
    e.stopPropagation();
    const user = e.currentTarget.dataset.user;
    wx.navigateTo({
      url: `../chat/chat?userId=${user}`
    });
  },

  onRefresh() {
    this.setData({
      currentIndex: 0,
      cardTranslateX: 0,
      cardRotate: 0
    });
  },

  navigateToPublish() {
    wx.navigateTo({
      url: '../exchangePublish/exchangePublish'
    });
  }
});
