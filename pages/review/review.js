Page({
  data: {
    order: {},
    rating: 0,
    ratingText: '',
    tags: [
      { text: '非常满意', selected: false },
      { text: '服务态度好', selected: false },
      { text: '物超所值', selected: false },
      { text: '包装精美', selected: false }
    ],
    content: '',
    images: [],
    canSubmit: false
  },

  onLoad(options) {
    this.loadOrder(options.orderId)
  },

  loadOrder(orderId) {
    this.setData({
      order: {
        images: ['https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'],
        title: '盲盒',
        price: 9.9
      }
    })
  },

  setRating(e) {
    const rating = e.currentTarget.dataset.rating
    const texts = ['', '很差', '较差', '一般', '满意', '非常满意']
    this.setData({
      rating,
      ratingText: texts[rating]
    })
    this.checkCanSubmit()
  },

  toggleTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = this.data.tags
    tags[index].selected = !tags[index].selected
    this.setData({ tags })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
    this.checkCanSubmit()
  },

  addImage() {
    const that = this
    wx.chooseMedia({
      count: 9 - that.data.images.length,
      mediaType: ['image'],
      success: res => {
        const newImages = res.tempFiles.map(file => file.tempFilePath)
        that.setData({
          images: [...that.data.images, ...newImages]
        })
      }
    })
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  checkCanSubmit() {
    const canSubmit = this.data.rating > 0
    this.setData({ canSubmit })
  },

  submitReview() {
    if (!this.data.canSubmit) return

    wx.showLoading({ title: '提交中..' })

    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '评价成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 800)
  }
})