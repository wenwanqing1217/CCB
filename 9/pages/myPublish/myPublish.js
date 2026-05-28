Page({
  data: {
    boxes: [],
    activeStatus: 'all',
    loading: true
  },

  onLoad() {
    this.loadBoxes()
  },

  onShow() {
    this.loadBoxes()
  },

  onPullDownRefresh() {
    this.loadBoxes()
  },

  setStatus(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ activeStatus: status, boxes: [] })
    this.loadBoxes()
  },

  loadBoxes() {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'getMyBoxes',
      data: { status: this.data.activeStatus },
      success: res => {
        if (res.result) {
          this.setData({ boxes: res.result, loading: false })
        } else {
          this.useMockData()
        }
        wx.stopPullDownRefresh()
      },
      fail: () => {
        this.useMockData()
        wx.stopPullDownRefresh()
      }
    })
  },

  useMockData() {
    this.setData({
      boxes: [
        { _id: '1', images: ['https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'], title: '盲盒', price: 9.9, from_dorm: '东', to_dorm: '西', status: 'active', statusText: '在售', sales: 23 },
        { _id: '2', images: ['https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png'], title: '零食盲盒', price: 14.9, from_dorm: '西', to_dorm: '南', status: 'sold', statusText: '已售罄', sales: 45 }
      ],
      loading: false
    })
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '../box-detail/box-detail?id=' + id })
  },

  editBox(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '../box-publish/box-publish?id=' + id + '&mode=edit' })
  },

  offlineBox(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认下架',
      content: '确定要下架这个盲盒吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '下架成功', icon: 'success' })
          this.loadBoxes()
        }
      }
    })
  },

  navigateToPublish() {
    wx.switchTab({ url: '../box-publish/box-publish' })
  }
})
