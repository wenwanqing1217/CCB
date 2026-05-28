Page({
  data: {
    activeTab: 'all',
    orders: []
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  setTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab, orders: [] })
    this.loadOrders()
  },

  loadOrders() {
    wx.cloud.callFunction({
      name: 'getDeliveryOrders',
      data: { status: this.data.activeTab },
      success: res => {
        if (res.result) {
          this.setData({ orders: res.result })
        } else {
          this.useMockData()
        }
      },
      fail: () => {
        this.useMockData()
      }
    })
  },

  useMockData() {
    this.setData({
      orders: [
        { _id: '1', orderId: 'ORD001', type: 'box', typeText: '盲盒订单', itemTitle: '全新数码配件盲盒', itemImage: 'https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png', itemPrice: 9.9, fromDorm: '中园公寓', fromRoom: '302', fromPerson: '小明', fromPhone: '13800138000', toDorm: '苏园居', toRoom: '201', toPerson: '小红', toPhone: '13900139000', deliveryFee: 5, status: 'pending', statusText: '待接单', timeline: [{ text: '订单已创建', time: '10:30', active: true }] },
        { _id: '2', orderId: 'ORD002', type: 'donation', typeText: '捐赠订单', itemTitle: '闲置书籍', itemImage: 'https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png', fromDorm: '中南公寓', fromRoom: '101', fromPerson: '小张', fromPhone: '13700137000', toDorm: '知行1栋', toRoom: '405', toPerson: '小李', toPhone: '13600136000', deliveryFee: 3, status: 'delivering', statusText: '配送中', riderName: '小王', riderAvatar: 'https://img.zcool.cn/community/01a7a57e4a6fa0000018c1bdc13cc.jpg@1280w_1l_2o_100sh.jpg', riderLevel: 3, timeline: [{ text: '订单已创建', time: '09:00', active: false }, { text: '骑手已接单', time: '09:05', active: false }, { text: '骑手已取货', time: '09:30', active: true }] }
      ]
    })
  },

  contactRider(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '联系骑手功能暂未开放', icon: 'none' })
  },

  trackOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '订单追踪功能暂未开放', icon: 'none' })
  },

  confirmReceive(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认收货',
      content: '确认已收到商品吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已确认收货', icon: 'success' })
          this.loadOrders()
        }
      }
    })
  },

  navigateToDonation() {
    wx.navigateTo({ url: '../donation/donation' })
  }
})