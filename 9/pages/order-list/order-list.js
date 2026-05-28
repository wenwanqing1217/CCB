// 订单列表页面

Page({
  data: {
    tab: 'buy',
    list: [],
    loading: false,
    finished: false,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    console.log('订单列表页面加载');
    this.loadOrders();
  },

  onShow() {
    console.log('订单列表页面显示');
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log('切换标签:', tab);
    if (this.data.tab === tab) return;
    
    this.setData({
      tab: tab,
      list: [],
      page: 1,
      finished: false
    });
    
    this.loadOrders();
  },

  // 加载订单
  loadOrders() {
    if (this.data.loading || this.data.finished) return;
    
    console.log('加载订单，页码:', this.data.page);
    this.setData({ loading: true });
    
    // 模拟数据
    const mockOrders = [
      {
        _id: '123456',
        boxInfo: {
          title: '全新数码配件盲盒',
          images: ['https://images.unsplash.com/photo-1603871122039-c646692707e4?w=400'],
          desc: '包含全新数据线、耳机、充电器等数码配件，超值盲盒！'
        },
        price: 9.9,
        status: 'pending',
        createdAt: new Date().toISOString(),
        contact: {
          name: '张三',
          phone: '13800138000'
        },
        address: '东区1栋',
        paymentMethod: 'offline'
      },
      {
        _id: '123457',
        boxInfo: {
          title: '精美文具套装',
          images: ['https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400'],
          desc: '包含笔记本、笔、橡皮擦等精美文具，适合学生使用！'
        },
        price: 14.9,
        status: 'delivering',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        contact: {
          name: '李四',
          phone: '13900139000'
        },
        address: '西区2栋',
        paymentMethod: 'offline'
      },
      {
        _id: '123458',
        boxInfo: {
          title: '零食大礼包',
          images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'],
          desc: '包含各种零食，适合追剧、聚会时享用！'
        },
        price: 29.9,
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        contact: {
          name: '王五',
          phone: '13700137000'
        },
        address: '南区3栋',
        paymentMethod: 'offline'
      }
    ];
    
    setTimeout(() => {
      const newList = [...this.data.list, ...mockOrders];
      this.setData({
        list: newList,
        loading: false,
        finished: true
      });
    }, 800);
  },

  // 跳转到订单详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    console.log('跳转到订单详情:', id);
    
    wx.navigateTo({
      url: `../order-detail/order-detail?id=${id}`,
      success: function(res) {
        console.log('跳转到订单详情页面成功');
      },
      fail: function(err) {
        console.error('跳转到订单详情页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 联系卖家
  contactSeller(e) {
    const id = e.currentTarget.dataset.id;
    console.log('联系卖家:', id);
    
    wx.showModal({
      title: '联系卖家',
      content: '是否通过微信联系卖家？',
      confirmText: '联系',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '正在跳转微信...',
            icon: 'none',
            duration: 1500
          });
          // 这里可以添加跳转微信的逻辑
        }
      }
    });
  },

  // 去购物
  goToMarket() {
    console.log('去购物');
    wx.switchTab({
      url: '../box-list/box-list',
      success: function(res) {
        console.log('跳转到商品列表页面成功');
      },
      fail: function(err) {
        console.error('跳转到商品列表页面失败:', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 返回上一页
  goBack() {
    console.log('返回上一页');
    wx.navigateBack({
      delta: 1,
      success: function(res) {
        console.log('返回成功');
      },
      fail: function(err) {
        console.error('返回失败:', err);
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.setData({
      list: [],
      page: 1,
      finished: false
    });
    this.loadOrders();
    wx.stopPullDownRefresh();
  },

  // 上拉加载
  onReachBottom() {
    console.log('上拉加载');
    this.loadOrders();
  },

  onShareAppMessage() {
    return {
      title: '我的订单 - 校园盲盒',
      path: '/pages/order-list/order-list'
    };
  }
});
