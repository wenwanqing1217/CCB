const cloud = require('../../../utils/cloud.js')
const ui = require('../../../utils/ui.js')

Page({
  data: {
    activeTab: 'all',
    orders: [],
    loading: false,
    page: 1,
    limit: 20,
    finished: false,
    statusFilter: 'all',
    statusOptions: [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待接单' },
      { value: 'paid', label: '已支付' },
      { value: 'grabed', label: '已接单' },
      { value: 'delivering', label: '配送中' },
      { value: 'completed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ]
  },

  onLoad() {
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.loadOrders(true)
  },

  onReachBottom() {
    if (!this.data.finished && !this.data.loading) {
      this.loadOrders(false)
    }
  },

  async loadOrders(reset = true) {
    if (this.data.loading) return
    
    const page = reset ? 1 : this.data.page + 1
    this.setData({ loading: true })

    try {
      const result = await cloud.callCloudFunction({
        name: 'getOrders',
        data: {
          page,
          limit: this.data.limit,
          status: this.data.statusFilter === 'all' ? undefined : this.data.statusFilter
        },
        showLoading: false
      })

      const newOrders = result?.success ? result.data : this.getMockOrders()
      
      this.setData({
        orders: reset ? newOrders : [...this.data.orders, ...newOrders],
        page,
        finished: newOrders.length < this.data.limit,
        loading: false
      })
    } catch (error) {
      console.error('加载订单失败:', error)
      this.setData({
        orders: this.getMockOrders(),
        finished: true,
        loading: false
      })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  getMockOrders() {
    return [
      {
        _id: 'ORDER001',
        boxInfo: { title: '数码配件盲盒', price: 9.9 },
        totalPrice: 12.9,
        status: 'delivering',
        statusText: '配送中',
        createdAt: '2024-01-15 10:30',
        contact: { name: '张三', phone: '138****8000' },
        address: '东区1栋'
      },
      {
        _id: 'ORDER002',
        boxInfo: { title: '文具套装', price: 14.9 },
        totalPrice: 17.9,
        status: 'completed',
        statusText: '已完成',
        createdAt: '2024-01-15 09:20',
        contact: { name: '李四', phone: '139****9000' },
        address: '西区3栋'
      },
      {
        _id: 'ORDER003',
        boxInfo: { title: '零食盲盒', price: 19.9 },
        totalPrice: 22.9,
        status: 'pending',
        statusText: '待接单',
        createdAt: '2024-01-15 11:00',
        contact: { name: '王五', phone: '137****7000' },
        address: '北区2栋'
      }
    ]
  },

  filterByStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ 
      statusFilter: status,
      page: 1,
      finished: false 
    }, () => this.loadOrders(true))
  },

  viewOrderDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `./order-detail/order-detail?id=${id}` })
  },

  async cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await ui.loadingStates.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？'
    })

    if (confirmed) {
      try {
        const result = await cloud.callCloudFunction({
          name: 'orderService',
          data: { action: 'cancelOrder', orderId: id },
          loadingTitle: '处理中...'
        })
        if (result?.success) {
          ui.loadingStates.showSuccess('取消成功')
          this.loadOrders(true)
        } else {
          ui.loadingStates.showError('取消失败')
        }
      } catch (error) {
        console.error('取消订单失败:', error)
        ui.loadingStates.showError('取消失败')
      }
    }
  },

  goBack() {
    wx.navigateBack()
  }
})