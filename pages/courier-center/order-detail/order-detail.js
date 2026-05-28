const cloud = require('../../../utils/cloud.js')
const ui = require('../../../utils/ui.js')

Page({
  data: {
    orderId: '',
    order: null,
    delivery: null,
    statusText: '',
    statusColor: '',
    showContactModal: false,
    currentStep: 0,
    steps: [
      { title: '订单创建', desc: '用户提交订单' },
      { title: '骑手接单', desc: '骑手已接受订单' },
      { title: '已取货', desc: '骑手已取到盲盒' },
      { title: '配送中', desc: '骑手正在配送' },
      { title: '已送达', desc: '订单完成' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id })
      this.loadOrderDetail(options.id)
    }
  },

  async loadOrderDetail(orderId) {
    ui.loadingStates.showLoading('加载中...')
    
    try {
      const [orderResult, deliveryResult] = await Promise.all([
        cloud.callCloudFunction({
          name: 'getOrderDetail',
          data: { orderId }
        }),
        cloud.callCloudFunction({
          name: 'deliveryService',
          data: { action: 'getDelivery', orderId }
        })
      ])

      const order = orderResult?.success ? orderResult.data : this.getMockOrder()
      const delivery = deliveryResult?.success ? deliveryResult.data : null

      this.setData({
        order,
        delivery,
        currentStep: this.getStepIndex(order.status)
      })

      this.updateStatusInfo(order.status)
    } catch (error) {
      console.error('加载订单详情失败:', error)
      this.setData({
        order: this.getMockOrder(),
        currentStep: 2
      })
      this.updateStatusInfo('delivering')
    } finally {
      ui.loadingStates.hideLoading()
    }
  },

  getStepIndex(status) {
    const statusMap = {
      'pending': 0,
      'paid': 0,
      'grabed': 1,
      'picked': 2,
      'delivering': 3,
      'completed': 4
    }
    return statusMap[status] || 0
  },

  updateStatusInfo(status) {
    const statusConfig = {
      'pending': { text: '待接单', color: '#999999' },
      'paid': { text: '待接单', color: '#999999' },
      'grabed': { text: '已接单', color: '#576B95' },
      'picked': { text: '已取货', color: '#34A853' },
      'delivering': { text: '配送中', color: '#FBBC05' },
      'completed': { text: '已完成', color: '#34A853' }
    }
    
    const config = statusConfig[status] || { text: '未知状态', color: '#999999' }
    this.setData({
      statusText: config.text,
      statusColor: config.color
    })
  },

  showContactModal() {
    this.setData({ showContactModal: true })
  },

  hideContactModal() {
    this.setData({ showContactModal: false })
  },

  makePhoneCall() {
    const phone = this.data.order?.contact?.phone || '13800138000'
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        ui.loadingStates.showToast('拨打电话失败', 'none')
      }
    })
    this.hideContactModal()
  },

  copyPhone() {
    const phone = this.data.order?.contact?.phone || ''
    wx.setClipboardData({
      data: phone,
      success: () => {
        ui.loadingStates.showToast('已复制', 'success')
      }
    })
    this.hideContactModal()
  },

  navigateToPickup() {
    const address = this.data.order?.pickupAddress || this.data.order?.address || '校园内'
    ui.loadingStates.showToast('正在打开地图...', 'none')
    
    wx.chooseLocation({
      success: (res) => {
        wx.openLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          name: address,
          address: address,
          scale: 18
        })
      },
      fail: () => {
        ui.loadingStates.showToast('打开地图失败', 'none')
      }
    })
  },

  navigateToDelivery() {
    const address = this.data.order?.deliveryAddress || this.data.order?.address || '校园内'
    ui.loadingStates.showToast('正在打开地图...', 'none')
    
    wx.chooseLocation({
      success: (res) => {
        wx.openLocation({
          latitude: res.latitude,
          longitude: res.longitude,
          name: address,
          address: address,
          scale: 18
        })
      },
      fail: () => {
        ui.loadingStates.showToast('打开地图失败', 'none')
      }
    })
  },

  async updateStatus(status) {
    const confirmed = await ui.loadingStates.showModal({
      title: '确认操作',
      content: this.getStatusConfirmText(status)
    })

    if (!confirmed) return

    ui.loadingStates.showLoading('处理中...')

    try {
      const result = await cloud.callCloudFunction({
        name: 'deliveryService',
        data: {
          action: 'updateStatus',
          data: {
            orderId: this.data.orderId,
            status
          }
        }
      })

      if (result?.success) {
        ui.loadingStates.showSuccess('操作成功')
        this.loadOrderDetail(this.data.orderId)
      } else {
        ui.loadingStates.showError('操作失败')
      }
    } catch (error) {
      console.error('更新状态失败:', error)
      ui.loadingStates.showError('操作失败')
    } finally {
      ui.loadingStates.hideLoading()
    }
  },

  getStatusConfirmText(status) {
    const textMap = {
      'picked': '确认已取到盲盒？',
      'delivering': '确认开始配送？',
      'completed': '确认订单已送达？'
    }
    return textMap[status] || '确认此操作？'
  },

  confirmPickup() {
    this.updateStatus('picked')
  },

  startDelivery() {
    this.updateStatus('delivering')
  },

  confirmDelivery() {
    this.updateStatus('completed')
  },

  getMockOrder() {
    return {
      _id: 'ORDER001',
      boxInfo: {
        title: '全新数码配件盲盒',
        images: ['https://res.wx.qq.com/wxdoc/dist/assets/img/demo.ef5c5bef.jpg'],
        price: 9.9,
        rarity: 'SR'
      },
      price: 9.9,
      deliveryFee: 3,
      totalPrice: 12.9,
      status: 'delivering',
      createdAt: new Date().toISOString(),
      pickupAddress: '中园公寓快递站',
      deliveryAddress: '中园公寓302',
      contact: {
        name: '张三',
        phone: '13800138000'
      },
      userInfo: {
        nickName: '用户A',
        avatar: ''
      }
    }
  },

  goBack() {
    wx.navigateBack()
  }
})