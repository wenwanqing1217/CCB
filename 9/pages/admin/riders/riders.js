const cloud = require('../../../utils/cloud.js')
const ui = require('../../../utils/ui.js')

Page({
  data: {
    riders: [],
    loading: false,
    onlineFilter: 'all',
    filterOptions: [
      { value: 'all', label: '全部' },
      { value: 'online', label: '在线' },
      { value: 'offline', label: '离线' }
    ]
  },

  onLoad() {
    this.loadRiders()
  },

  onPullDownRefresh() {
    this.loadRiders()
  },

  async loadRiders() {
    this.setData({ loading: true })

    try {
      const result = await cloud.callCloudFunction({
        name: 'deliveryService',
        data: { action: 'getRiders', status: this.data.onlineFilter },
        showLoading: false
      })

      this.setData({
        riders: result?.success ? result.data : this.getMockRiders(),
        loading: false
      })
    } catch (error) {
      console.error('加载骑手失败:', error)
      this.setData({
        riders: this.getMockRiders(),
        loading: false
      })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  getMockRiders() {
    return [
      {
        _id: 'RIDER001',
        nickName: '骑手小张',
        avatar: '',
        phone: '138****1001',
        status: 'online',
        statusText: '在线',
        todayOrders: 5,
        totalOrders: 128,
        rating: 4.8,
        earnings: 1152
      },
      {
        _id: 'RIDER002',
        nickName: '骑手小李',
        avatar: '',
        phone: '139****1002',
        status: 'offline',
        statusText: '离线',
        todayOrders: 3,
        totalOrders: 96,
        rating: 4.6,
        earnings: 864
      },
      {
        _id: 'RIDER003',
        nickName: '骑手小王',
        avatar: '',
        phone: '137****1003',
        status: 'online',
        statusText: '在线',
        todayOrders: 7,
        totalOrders: 156,
        rating: 4.9,
        earnings: 1404
      }
    ]
  },

  filterByStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ onlineFilter: status }, () => this.loadRiders())
  },

  viewRiderDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `./rider-detail/rider-detail?id=${id}` })
  },

  async suspendRider(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await ui.loadingStates.showModal({
      title: '暂停骑手',
      content: '确定要暂停此骑手的服务吗？'
    })

    if (confirmed) {
      try {
        const result = await cloud.callCloudFunction({
          name: 'deliveryService',
          data: { action: 'suspendRider', riderId: id },
          loadingTitle: '处理中...'
        })
        if (result?.success) {
          ui.loadingStates.showSuccess('操作成功')
          this.loadRiders()
        } else {
          ui.loadingStates.showError('操作失败')
        }
      } catch (error) {
        console.error('暂停骑手失败:', error)
        ui.loadingStates.showError('操作失败')
      }
    }
  },

  async resumeRider(e) {
    const id = e.currentTarget.dataset.id
    try {
      const result = await cloud.callCloudFunction({
        name: 'deliveryService',
        data: { action: 'resumeRider', riderId: id },
        loadingTitle: '处理中...'
      })
      if (result?.success) {
        ui.loadingStates.showSuccess('操作成功')
        this.loadRiders()
      } else {
        ui.loadingStates.showError('操作失败')
      }
    } catch (error) {
      console.error('恢复骑手失败:', error)
      ui.loadingStates.showError('操作失败')
    }
  },

  goBack() {
    wx.navigateBack()
  }
})