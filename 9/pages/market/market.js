Page({
  data: {
    boxes: [],
    activeCategory: 'all',
    activeSort: 'default',
    loading: true,
    hasMore: true,
    page: 1
  },

  onShow() {
    this.loadBoxes()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, boxes: [] })
    this.loadBoxes()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  setCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category, page: 1, boxes: [] })
    this.loadBoxes()
  },

  setSort(e) {
    const sort = e.currentTarget.dataset.sort
    this.setData({ activeSort: sort, page: 1, boxes: [] })
    this.loadBoxes()
  },

  loadBoxes() {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'getBlindBoxes',
      data: {
        category: this.data.activeCategory,
        sort: this.data.activeSort,
        page: this.data.page
      },
      success: res => {
        if (res.result && res.result.length > 0) {
          this.setData({
            boxes: res.result,
            hasMore: res.result.length === 10,
            loading: false
          })
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
        { _id: '1', title: '神秘盲盒', price: 9.9, images: ['https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'], from_dorm: '东', to_dorm: '西', sales: 23 },
        { _id: '2', title: '零食盲盒', price: 14.9, images: ['https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png'], from_dorm: '西', to_dorm: '南', sales: 45 }
      ],
      loading: false,
      hasMore: false
    })
  },

  loadMore() {
    this.setData({ loading: true, page: this.data.page + 1 })
    this.loadBoxes()
  },

  onSearchChange(e) {
    this.setData({ keyword: e.detail.value })
  },

  searchBoxes() {
    if (!this.data.keyword) return
    this.setData({ page: 1, boxes: [] })
    this.loadBoxes()
  },

  navigateToBoxDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `../box-detail/box-detail?id=${id}` })
  }
})