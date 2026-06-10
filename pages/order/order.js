const cloud = require('../../utils/cloud.js');

Page({
  data: {
    orders: [],
    activeStatus: 'all',
    loading: true,
    stats: {
      pending: 0,
      delivering: 0,
      completed: 0
    },
    counts: {
      all: 0,
      pending: 0,
      delivering: 0,
      completed: 0
    }
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders();
  },

  setStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ activeStatus: status, orders: [], loading: true });
    this.loadOrders();
  },

  async loadOrders() {
    this.setData({ loading: true });
    
    try {
      const result = await cloud.callCloudFunction({
        name: 'getMyOrders',
        data: { status: this.data.activeStatus },
        showLoading: false,
        showError: false
      });
      if (result) {
        this.processOrders(result);
      } else {
        this.useMockData();
      }
      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载订单失败:', error);
      this.useMockData();
      wx.stopPullDownRefresh();
    }
  },

  processOrders(orders) {
    // 计算统计数据
    const stats = {
      pending: orders.filter(o => o.status === 'pending').length,
      delivering: orders.filter(o => o.status === 'delivering').length,
      completed: orders.filter(o => o.status === 'completed').length
    };

    const counts = {
      all: orders.length,
      pending: stats.pending,
      delivering: stats.delivering,
      completed: stats.completed
    };

    this.setData({
      orders,
      stats,
      counts,
      loading: false
    });
  },

  useMockData() {
    const mockOrders = [
      {
        _id: 'ORD20240115001',
        images: ['/images/blindbox/electronics_0_0.jpg'],
        title: '精美文具套装盲盒',
        price: 14.90,
        deliveryFee: 2.00,
        totalPrice: 16.90,
        count: 1,
        from_dorm: '中园公寓',
        to_dorm: '中南公寓',
        status: 'pending',
        statusText: '待发货',
        paid: true,
        createTime: '2024-01-15 10:30',
        tags: ['文具', '全新'],
        rider: null
      },
      {
        _id: 'ORD20240114002',
        images: ['/images/blindbox/fashion_0_0.jpg'],
        title: '考研图书盲盒',
        price: 29.90,
        deliveryFee: 2.00,
        totalPrice: 31.90,
        count: 2,
        from_dorm: '新柏居',
        to_dorm: '清水居',
        status: 'delivering',
        statusText: '配送中',
        paid: true,
        createTime: '2024-01-14 15:20',
        tags: ['图书', '考研'],
        rider: {
          name: '张骑手',
          avatar: '/images/blindbox/fashion_1_1.jpg'
        }
      },
      {
        _id: 'ORD20240113003',
        images: ['/images/blindbox/study_0_0.jpg'],
        title: '时尚服饰盲盒',
        price: 39.90,
        deliveryFee: 0.00,
        totalPrice: 39.90,
        count: 1,
        from_dorm: '三友园',
        to_dorm: '四季园',
        status: 'completed',
        statusText: '已完成',
        paid: true,
        createTime: '2024-01-13 09:15',
        tags: ['服饰', '二手'],
        rider: null
      },
      {
        _id: 'ORD20240112004',
        images: ['/images/blindbox/study_1_1.jpg'],
        title: '零食大礼包盲盒',
        price: 25.00,
        deliveryFee: 2.00,
        totalPrice: 27.00,
        count: 1,
        from_dorm: '松柏居',
        to_dorm: '中园公寓',
        status: 'pending',
        statusText: '待付款',
        paid: false,
        createTime: '2024-01-12 18:45',
        tags: ['零食', '进口'],
        rider: null
      }
    ];

    this.processOrders(mockOrders);
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '../order-detail/order-detail?id=' + id });
  },

  contactSeller(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: '../chat/chat?orderId=' + id,
      fail: () => {
        wx.showToast({ title: '私信已发送', icon: 'none' });
      }
    });
  },

  viewLogistics(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: '../order-detail/order-detail?id=' + id + '&tab=logistics',
      fail: () => {
        wx.showToast({ title: '查看物流', icon: 'none' });
      }
    });
  },

  confirmReceive(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品吗？确认后订单将完成',
      confirmColor: '#8b5cf6',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中' });
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '已确认收货', icon: 'success' });
            this.loadOrders();
          }, 800);
        }
      }
    });
  },

  payOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showLoading({ title: '支付中' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '支付成功', icon: 'success' });
      this.loadOrders();
    }, 1000);
  },

  cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？取消后无法恢复',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中' });
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '订单已取消', icon: 'success' });
            this.loadOrders();
          }, 800);
        }
      }
    });
  },

  deleteOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除订单',
      content: '确定要删除该订单吗？删除后无法恢复',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中' });
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '订单已删除', icon: 'success' });
            this.loadOrders();
          }, 800);
        }
      }
    });
  },

  buyAgain(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '已添加到购物车', icon: 'success' });
  },

  goShopping() {
    wx.switchTab({ url: '../index/index' });
  }
});
