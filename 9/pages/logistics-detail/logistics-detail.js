// 物流详情页面
Page({
  data: {
    orderId: '',
    logisticsInfo: {
      company: '校园跑腿',
      trackingNo: 'XP20240402001',
      status: 'delivering',
      statusText: '派送中',
      rider: {
        name: '小王',
        phone: '138****8888',
        avatar: ''
      },
      timeline: [
        {
          time: '14:30',
          date: '今天',
          status: '派送中',
          desc: '骑手小王已取件，正在派送中，预计30分钟内送达中园公寓3栋',
          active: true
        },
        {
          time: '14:15',
          date: '今天',
          status: '已取件',
          desc: '骑手小王已到达取货地点，正在确认商品',
          active: false
        },
        {
          time: '14:00',
          date: '今天',
          status: '待取件',
          desc: '订单已分配给骑手小王，等待取件',
          active: false
        },
        {
          time: '13:45',
          date: '今天',
          status: '已发货',
          desc: '卖家已将商品交给配送员',
          active: false
        }
      ]
    },
    orderInfo: {
      id: '123456',
      itemName: '精美文具套装盲盒',
      itemImage: 'https://picsum.photos/400/400?random=10',
      price: '29.9',
      seller: '张三',
      buyer: '我',
      createTime: '2024-04-02 13:30'
    }
  },

  onLoad(options) {
    console.log('物流详情页面加载:', options);
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadLogisticsData(options.id);
    }
  },

  // 加载物流数据
  loadLogisticsData(orderId) {
    console.log('加载物流数据:', orderId);
    // 这里可以从服务器获取真实的物流数据
    // 目前使用模拟数据
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '../message/message' });
      }
    });
  },

  // 联系骑手
  contactRider() {
    const phone = this.data.logisticsInfo.rider.phone;
    wx.makePhoneCall({
      phoneNumber: phone.replace(/\*/g, '0'),
      fail: () => {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  // 查看订单详情
  viewOrderDetail() {
    wx.navigateTo({
      url: `../order-detail/order-detail?id=${this.data.orderId}`
    });
  },

  // 复制运单号
  copyTrackingNo() {
    wx.setClipboardData({
      data: this.data.logisticsInfo.trackingNo,
      success: () => {
        wx.showToast({
          title: '已复制运单号',
          icon: 'success'
        });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '物流详情 - 校园盲盒',
      path: `/pages/logistics-detail/logistics-detail?id=${this.data.orderId}`
    };
  }
});
