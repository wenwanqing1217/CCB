const { toast } = require('../../utils/index.js')

Page({
  data: {
    isRider: false,
    filterType: 'all',
    orders: [],
    loading: true,
    mapContext: null,
    markers: [],
    currentLocation: null,
    refreshing: false,
    empty: false,
    lastUpdateTime: ''
  },

  onLoad() {
    this.checkRiderStatus()
    this.initMap()
  },

  onShow() {
    if (this.data.isRider) {
      this.loadOrders()
    }
  },

  onPullDownRefresh() {
    if (this.data.isRider) {
      this.setData({ refreshing: true })
      this.loadOrders()
    }
  },

  initMap() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          currentLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        })
        this.createMapContext()
      },
      fail: () => {
        console.error('获取位置失败')
      }
    })
  },

  createMapContext() {
    this.setData({
      mapContext: wx.createMapContext('orderMap')
    })
  },

  checkRiderStatus() {
    wx.cloud.callFunction({
      name: 'checkRiderStatus',
      success: res => {
        if (res.result && res.result.isRider) {
          this.setData({ isRider: true })
          this.loadOrders()
          this.startOrderRefresh()
        } else {
          this.setData({ isRider: false, loading: false })
        }
      },
      fail: () => {
        this.setData({ isRider: false, loading: false })
        toast.networkError()
      }
    })
  },

  startOrderRefresh() {
    this.orderRefreshTimer = setInterval(() => {
      this.loadOrders()
    }, 30000)
  },

  loadOrders() {
    wx.cloud.callFunction({
      name: 'getGrabOrders',
      data: { filter: this.data.filterType },
      success: res => {
        const orders = Array.isArray(res.result) ? res.result : []
        this.setData({
          orders,
          loading: false,
          empty: orders.length === 0,
          lastUpdateTime: this.formatTime(new Date()),
          refreshing: false
        })
        this.updateMarkers(orders)
      },
      fail: () => {
        toast.networkError()
        this.setData({
          orders: [],
          loading: false,
          empty: true,
          lastUpdateTime: this.formatTime(new Date()),
          refreshing: false
        })
        this.updateMarkers([])
      },
      complete: () => {
        wx.stopPullDownRefresh()
      }
    })
  },

  updateMarkers(orders) {
    const markers = []
    
    orders.forEach((order, index) => {
      markers.push({
        id: order._id,
        latitude: order.fromLatitude || 30.5928,
        longitude: order.fromLongitude || 114.3055,
        iconPath: '/images/marker.png',
        title: order.itemName,
        label: {
          content: `¥${order.fee}`,
          color: '#ffffff',
          backgroundColor: '#ff4d4f',
          borderRadius: 4,
          padding: 4
        }
      })
    })
    
    this.setData({ markers })
  },

  setFilter(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ filterType: type })
    this.loadOrders()
  },

  async grabOrder(e) {
    const id = e.currentTarget.dataset.id
    
    const confirmed = await toast.confirm('确定要抢这个订单吗？', '确认抢单')
    if (!confirmed) return
    
    toast.loading('抢单中..')
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'grabOrder',
        data: { orderId: id }
      })
      
      toast.hideLoading()
      if (res.result && res.result.success) {
        toast.success('抢单成功')
        this.loadOrders()
      } else {
        toast.error('抢单失败，请重试')
      }
    } catch (error) {
      toast.hideLoading()
      toast.networkError()
    }
  },

  navigateToRider() {
    wx.navigateTo({ url: '../rider/rider' })
  },

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  },

  onUnload() {
    if (this.orderRefreshTimer) {
      clearInterval(this.orderRefreshTimer)
    }
  }
})