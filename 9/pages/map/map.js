const app = getApp()

Page({
  data: {
    longitude: 113.3249,
    latitude: 23.1065,
    markers: [],
    polyline: [],
    currentOrder: null,
    statusText: '开始配送',
    locationText: '获取位置中...',
    updateTime: '',
    locationWatchId: null,
    mapContext: null
  },

  onLoad(options) {
    if (options.orderId) {
      this.loadOrderDetail(options.orderId)
    }
    this.initMap()
    this.startLocationUpdate()
  },

  onShow() {
    this.mapContext = wx.createMapContext('map')
  },

  onUnload() {
    if (this.data.locationWatchId) {
      wx.stopLocationUpdate({ success: () => {} })
    }
  },

  initMap() {
    this.setData({
      markers: [],
      polyline: []
    })
  },

  startLocationUpdate() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.updateLocation(res)
      },
      fail: (error) => {
        console.error('获取位置失败', error)
        this.setData({ locationText: '位置获取失败' })
      }
    })

    wx.startLocationUpdate({
      type: 'gcj02',
      success: (res) => {
        console.log('开始位置更新')
      },
      fail: (error) => {
        console.error('开始位置更新失败', error)
      }
    })

    this.setData({
      locationWatchId: wx.onLocationChange((res) => {
        this.updateLocation(res)
      })
    })
  },

  updateLocation(location) {
    const { longitude, latitude } = location
    this.setData({
      longitude,
      latitude,
      locationText: `经度: ${longitude.toFixed(4)}, 纬度: ${latitude.toFixed(4)}`,
      updateTime: new Date().toLocaleTimeString('zh-CN')
    })

    if (this.data.currentOrder) {
      this.updateRoute()
    }
  },

  loadOrderDetail(orderId) {
    // 模拟订单数据
    const mockOrder = {
      orderId: orderId || 'ORD20240101001',
      deliveryFee: 5,
      fromDorm: '东5栋',
      fromRoom: '302室',
      toDorm: '西3栋',
      toRoom: '401室',
      status: 'accepted',
      customerPhone: '13800138000'
    }

    this.setData({
      currentOrder: mockOrder,
      statusText: mockOrder.status === 'accepted' ? '已取货' : '完成配送'
    })

    this.updateRoute()
  },

  updateRoute() {
    if (!this.data.currentOrder) return

    // 模拟地点坐标（实际应用中应该通过地址解析获取）
    const fromLocation = { longitude: 113.3249, latitude: 23.1065 }
    const toLocation = { longitude: 113.3289, latitude: 23.1045 }

    // 更新标记
    const markers = [
      {
        id: 1,
        longitude: fromLocation.longitude,
        latitude: fromLocation.latitude,
        title: '取货点',
        iconPath: '/images/location-pick.png',
        width: 40,
        height: 40
      },
      {
        id: 2,
        longitude: toLocation.longitude,
        latitude: toLocation.latitude,
        title: '送货点',
        iconPath: '/images/location-drop.png',
        width: 40,
        height: 40
      }
    ]

    // 模拟路线
    const polyline = [{
      points: [
        fromLocation,
        { longitude: 113.3269, latitude: 23.1055 },
        toLocation
      ],
      color: '#7c3aed',
      width: 4,
      dottedLine: false
    }]

    this.setData({ markers, polyline })
  },

  onMarkerTap(e) {
    const markerId = e.markerId
    const marker = this.data.markers.find(m => m.id === markerId)
    if (marker) {
      wx.showToast({ title: marker.title, icon: 'none' })
    }
  },

  onRegionChange(e) {
    if (e.type === 'end') {
      // 地图区域变化结束时的处理
    }
  },

  callCustomer() {
    if (this.data.currentOrder && this.data.currentOrder.customerPhone) {
      wx.makePhoneCall({
        phoneNumber: this.data.currentOrder.customerPhone,
        fail: () => {
          wx.showToast({ title: '拨打电话失败', icon: 'none' })
        }
      })
    }
  },

  updateOrderStatus() {
    if (!this.data.currentOrder) return

    const currentStatus = this.data.currentOrder.status
    const nextStatus = currentStatus === 'accepted' ? 'picked' : 'completed'
    const nextStatusText = nextStatus === 'picked' ? '完成配送' : '订单完成'

    this.setData({
      currentOrder: {
        ...this.data.currentOrder,
        status: nextStatus
      },
      statusText: nextStatusText
    })

    if (nextStatus === 'completed') {
      wx.showToast({ title: '订单已完成', icon: 'success' })
      setTimeout(() => {
        this.goBack()
      }, 1500)
    } else {
      wx.showToast({ title: '已标记为取货', icon: 'success' })
    }
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '../rider/rider' })
      }
    })
  }
})
