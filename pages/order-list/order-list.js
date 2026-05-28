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
    this.loadOrders(true);
  },

  onShow() {},

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (this.data.tab === tab) {
      return;
    }

    this.setData({
      tab,
      list: [],
      page: 1,
      finished: false
    });

    this.loadOrders(true);
  },

  loadOrders(reset) {
    if (this.data.loading) {
      return;
    }
    if (!reset && this.data.finished) {
      return;
    }

    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'getMyOrders',
      data: {
        status: 'all'
      },
      success: res => {
        const orders = Array.isArray(res.result) ? res.result : [];
        const mapped = orders.map(order => ({
          _id: order._id,
          boxInfo: {
            title: order.title || '未知商品',
            images: order.images || [],
            desc: ''
          },
          price: order.price || 0,
          status: order.status || 'pending',
          createdAt: order.createTime || order.createdAt || '',
          contact: order.contact || {},
          address: order.to_dorm || order.address || ''
        }));

        this.setData({
          list: mapped,
          loading: false,
          finished: true
        });
      },
      fail: () => {
        wx.showToast({ title: '加载订单失败', icon: 'none' });
        this.setData({ list: [], loading: false, finished: true });
      },
      complete: () => {
        wx.stopPullDownRefresh();
      }
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../order-detail/order-detail?id=${id}`,
      fail: () => {
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },

  contactSeller() {
    wx.showToast({ title: '联系功能暂未开放', icon: 'none' });
  },

  goToMarket() {
    wx.switchTab({ url: '../love/love' });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  onPullDownRefresh() {
    this.setData({ list: [], page: 1, finished: false });
    this.loadOrders(true);
  },

  onReachBottom() {},

  onShareAppMessage() {
    return {
      title: '我的订单 - 校园盲盒',
      path: '/pages/order-list/order-list'
    };
  }
});
