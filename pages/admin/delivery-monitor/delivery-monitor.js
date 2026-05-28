const cloud = require('../../../utils/cloud.js');
const ui = require('../../../utils/ui.js');

Page({
  data: {
    deliveries: [],
    stats: {
      total: 0,
      pending: 0,
      delivering: 0,
      completed: 0
    },
    refreshTimer: null,
    isAutoRefresh: true
  },

  onLoad() {
    this.loadDeliveries();
    this.startAutoRefresh();
  },

  onShow() {
    if (this.data.isAutoRefresh) {
      this.startAutoRefresh();
    }
  },

  onHide() {
    this.stopAutoRefresh();
  },

  onUnload() {
    this.stopAutoRefresh();
  },

  async loadDeliveries() {
    try {
      const [deliveriesResult, statsResult] = await Promise.all([
        cloud.callCloudFunction({
          name: 'deliveryService',
          data: { action: 'getActiveDeliveries' },
          showLoading: false
        }),
        cloud.callCloudFunction({
          name: 'deliveryService',
          data: { action: 'getDeliveryStats' },
          showLoading: false
        })
      ]);

      this.setData({
        deliveries: deliveriesResult?.success ? deliveriesResult.data : this.getMockDeliveries(),
        stats: statsResult?.success ? statsResult.data : this.getMockStats()
      });
    } catch (error) {
      console.error('加载配送数据失败:', error);
      this.setData({
        deliveries: this.getMockDeliveries(),
        stats: this.getMockStats()
      });
    }
  },

  getMockDeliveries() {
    return [
      {
        _id: 'DEL001',
        orderId: 'ORDER001',
        boxTitle: '数码配件盲盒',
        riderName: '骑手小张',
        riderPhone: '138****1001',
        status: 'delivering',
        statusText: '配送中',
        address: '中园公寓302',
        progress: 60,
        estimatedTime: '约5分钟',
        updateTime: '2分钟前'
      },
      {
        _id: 'DEL002',
        orderId: 'ORDER002',
        boxTitle: '文具套装',
        riderName: '骑手小李',
        riderPhone: '139****1002',
        status: 'grabed',
        statusText: '已接单',
        address: '苏园居201',
        progress: 20,
        estimatedTime: '约15分钟',
        updateTime: '5分钟前'
      },
      {
        _id: 'DEL003',
        orderId: 'ORDER003',
        boxTitle: '零食盲盒',
        riderName: '骑手小王',
        riderPhone: '137****1003',
        status: 'picked',
        statusText: '已取货',
        address: '新柏居105',
        progress: 40,
        estimatedTime: '约10分钟',
        updateTime: '3分钟前'
      }
    ];
  },

  getMockStats() {
    return {
      total: 12,
      pending: 2,
      delivering: 6,
      completed: 4
    };
  },

  startAutoRefresh() {
    if (this.data.refreshTimer) {
      return;
    }
    
    this.data.refreshTimer = setInterval(() => {
      this.loadDeliveries();
    }, 30000);
  },

  stopAutoRefresh() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
      this.data.refreshTimer = null;
    }
  },

  toggleAutoRefresh() {
    this.setData({ isAutoRefresh: !this.data.isAutoRefresh });
    
    if (this.data.isAutoRefresh) {
      ui.loadingStates.showToast('已开启自动刷新', 'none');
      this.startAutoRefresh();
    } else {
      ui.loadingStates.showToast('已关闭自动刷新', 'none');
      this.stopAutoRefresh();
    }
  },

  refreshData() {
    ui.loadingStates.showLoading('刷新中...');
    this.loadDeliveries();
    ui.loadingStates.hideLoading();
  },

  viewDeliveryDetail(e) {
    const orderId = e.currentTarget.dataset.orderId || e.currentTarget.dataset.id;
    if (!orderId) {
      ui.loadingStates.showToast('订单信息缺失', 'none');
      return;
    }
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${orderId}` });
  },

  async contactRider(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone.replace(/\*/g, '0'),
      fail: () => {
        ui.loadingStates.showToast('拨打电话失败', 'none');
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});