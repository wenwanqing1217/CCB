const mockDonations = [
  {
    _id: '1',
    title: 'Books Collection',
    images: ['https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png'],
    description: 'A set of textbooks',
    from_dorm: 'East 5',
    status: 'completed',
    statusText: 'Completed',
    createTime: '2024-01-15'
  },
  {
    _id: '2',
    title: 'Stationery Set',
    images: ['https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'],
    description: 'Unused stationery items',
    from_dorm: 'West 3',
    status: 'pending',
    statusText: 'Pending',
    createTime: '2024-01-18'
  }
]

Page({
  data: {
    donations: [],
    activeTab: 'sent',
    stats: {
      total: 5,
      completed: 3,
      pending: 2
    }
  },

  onLoad() {
    this.loadDonations()
  },

  onShow() {
    this.loadDonations()
  },

  loadDonations() {
    wx.cloud.callFunction({
      name: 'getMyDonations',
      data: { type: this.data.activeTab },
      success: res => {
        if (res.result && res.result.length > 0) {
          this.setData({ donations: res.result })
        } else {
          this.useLocalData()
        }
      },
      fail: () => {
        this.useLocalData()
      }
    })
  },

  useLocalData() {
    this.setData({ donations: mockDonations })
  },

  setTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    this.loadDonations()
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `../boxDetail/boxDetail?id=${id}`
    })
  }
})
