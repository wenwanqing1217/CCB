Page({
  data: {
    isMerchant: false,
    stats: {
      totalSales: 0,
      totalRevenue: 0,
      totalProducts: 0,
      pendingOrders: 0
    },
    products: [],
    orders: []
  },

  onLoad() {
    this.checkMerchantStatus()
  },

  onShow() {
    if (this.data.isMerchant) {
      this.loadStats()
      this.loadProducts()
      this.loadOrders()
    }
  },

  checkMerchantStatus() {
    wx.cloud.callFunction({
      name: 'getUserInfo',
      success: res => {
        if (res.result && res.result.isMerchant) {
          this.setData({ isMerchant: true })
          this.loadStats()
          this.loadProducts()
          this.loadOrders()
        } else {
          this.setData({ isMerchant: false })
        }
      },
      fail: () => {
        this.setData({ isMerchant: false })
      }
    })
  },

  loadStats() {
    wx.cloud.callFunction({
      name: 'getMerchantStats',
      success: res => {
        if (res.result) {
          this.setData({ stats: res.result })
        }
      },
      fail: () => {
        this.setData({
          stats: { totalSales: 128, totalRevenue: 1280, totalProducts: 12, pendingOrders: 5 }
        })
      }
    })
  },

  loadProducts() {
    wx.cloud.callFunction({
      name: 'getMerchantProducts',
      success: res => {
        if (res.result) {
          this.setData({ products: res.result })
        }
      },
      fail: () => {
        this.setData({
          products: [
            { _id: '1', title: '閺傚洤鍙块惄鑼磪', price: 9.9, stock: 50, sales: 23, status: 'active' },
            { _id: '2', title: '閸ュ彞鍔熼惄鑼磪', price: 14.9, stock: 30, sales: 45, status: 'active' }
          ]
        })
      }
    })
  },

  loadOrders() {
    wx.cloud.callFunction({
      name: 'getMerchantOrders',
      success: res => {
        if (res.result) {
          this.setData({ orders: res.result })
        }
      },
      fail: () => {}
    })
  },

  navigateToPublish() {
    wx.switchTab({ url: '../box-publish/box-publish' })
  },

  navigateToMerchantApply() {
    wx.navigateTo({ url: '../merchantApply/merchantApply' })
  },

  editProduct(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `../box-publish/box-publish?id=${id}&mode=edit` })
  },

  viewOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `../order-detail/order-detail?id=${id}` })
  }
})