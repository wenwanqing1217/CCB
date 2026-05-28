Page({
  data: {
    favorites: [],
    isEditing: false,
    allSelected: false,
    selectedCount: 0,
    recommendations: []
  },

  onLoad() {
    this.loadFavorites();
    this.loadRecommendations();
  },

  onShow() {
    this.loadFavorites();
  },

  loadFavorites() {
    wx.cloud.callFunction({
      name: 'getFavorites',
      success: res => {
        if (res.result) {
          this.setData({ 
            favorites: res.result.map(item => ({ ...item, selected: false }))
          });
        }
      },
      fail: () => {
        // 模拟数据 - 带类型图标
        const typeMap = {
          'stationery': { icon: '✏️', name: '文具' },
          'clothing': { icon: '👕', name: '服饰' },
          'book': { icon: '📚', name: '图书' },
          'snack': { icon: '🍿', name: '零食' },
          'digital': { icon: '📱', name: '数码' },
          'secondhand': { icon: '📦', name: '二手' },
          'original': { icon: '🎨', name: '原创' }
        };
        
        const mockFavorites = [
          {
            _id: '1',
            images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400'],
            title: '精美文具套装盲盒',
            price: 14.9,
            originalPrice: 29.9,
            type: 'stationery',
            typeIcon: typeMap['stationery'].icon,
            typeName: typeMap['stationery'].name,
            campus: '中园公寓',
            sales: 128,
            status: 'onsale',
            statusText: '在售',
            tags: ['全新', '热门'],
            selected: false
          },
          {
            _id: '2',
            images: [],
            title: '考研图书盲盒',
            price: 29.9,
            type: 'book',
            typeIcon: typeMap['book'].icon,
            typeName: typeMap['book'].name,
            campus: '新柏居',
            sales: 86,
            status: 'onsale',
            statusText: '在售',
            tags: ['考研', '资料'],
            selected: false
          },
          {
            _id: '3',
            images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400'],
            title: '时尚服饰盲盒',
            price: 39.9,
            originalPrice: 79.9,
            type: 'clothing',
            typeIcon: typeMap['clothing'].icon,
            typeName: typeMap['clothing'].name,
            campus: '中南公寓',
            sales: 256,
            status: 'soldout',
            statusText: '已售罄',
            tags: ['二手', '九成新'],
            selected: false
          }
        ];
        this.setData({ favorites: mockFavorites });
      }
    });
  },

  loadRecommendations() {
    const typeMap = {
      'stationery': { icon: '✏️', name: '文具' },
      'clothing': { icon: '👕', name: '服饰' },
      'book': { icon: '📚', name: '图书' },
      'snack': { icon: '🍿', name: '零食' },
      'digital': { icon: '📱', name: '数码' },
      'secondhand': { icon: '📦', name: '二手' },
      'original': { icon: '🎨', name: '原创' }
    };
    
    const recommendations = [
      {
        _id: 'r1',
        images: ['https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'],
        title: '零食大礼包',
        price: 25.0,
        type: 'snack',
        typeIcon: typeMap['snack'].icon
      },
      {
        _id: 'r2',
        images: [],
        title: '数码配件盲盒',
        price: 35.0,
        type: 'digital',
        typeIcon: typeMap['digital'].icon
      },
      {
        _id: 'r3',
        images: ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'],
        title: '原创手作盲盒',
        price: 49.9,
        type: 'original',
        typeIcon: typeMap['original'].icon
      }
    ];
    this.setData({ recommendations });
  },

  // 切换编辑模式
  toggleEdit() {
    const isEditing = !this.data.isEditing;
    const favorites = this.data.favorites.map(item => ({
      ...item,
      selected: false
    }));
    this.setData({
      isEditing,
      favorites,
      allSelected: false,
      selectedCount: 0
    });
  },

  // 选择/取消选择
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    const favorites = this.data.favorites.map(item => {
      if (item._id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });
    
    const selectedCount = favorites.filter(item => item.selected).length;
    const allSelected = selectedCount === favorites.length;
    
    this.setData({
      favorites,
      selectedCount,
      allSelected
    });
  },

  // 全选/取消全选
  selectAll() {
    const allSelected = !this.data.allSelected;
    const favorites = this.data.favorites.map(item => ({
      ...item,
      selected: allSelected
    }));
    const selectedCount = allSelected ? favorites.length : 0;
    
    this.setData({
      favorites,
      allSelected,
      selectedCount
    });
  },

  // 批量删除
  batchDelete() {
    if (this.data.selectedCount === 0) {
      return;
    }
    
    wx.showModal({
      title: '删除收藏',
      content: `确定要删除选中的 ${this.data.selectedCount} 个收藏吗？`,
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          
          const favorites = this.data.favorites.filter(item => !item.selected);
          
          setTimeout(() => {
            wx.hideLoading();
            this.setData({
              favorites,
              isEditing: false,
              allSelected: false,
              selectedCount: 0
            });
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          }, 600);
        }
      }
    });
  },

  navigateToDetail(e) {
    if (this.data.isEditing) {
      return;
    }
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: '../box-detail/box-detail?id=' + id,
      fail: () => {
        wx.showToast({ title: '页面跳转中', icon: 'none' });
      }
    });
  },

  removeFavorite(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '移除收藏',
      content: '确定要移除这个收藏吗？',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          const favorites = this.data.favorites.filter(item => item._id !== id);
          this.setData({ favorites });
          wx.showToast({ title: '移除成功', icon: 'success' });
        }
      }
    });
  },

  navigateToMarket() {
    wx.switchTab({ url: '../index/index' });
  }
});
