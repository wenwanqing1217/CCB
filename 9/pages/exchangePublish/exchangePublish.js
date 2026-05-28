Page({
  data: {
    wantItem: '',
    haveItem: '',
    images: [],
    description: '',
    dormIndex: -1,
    dorms: ['东1', '东2', '东3', '东4', '东5', '西1', '西2', '西3', '西4', '西5', '南1', '南2', '南3', '南4'],
    contact: '',
    canSubmit: false
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
    this.checkCanSubmit()
  },

  onDormChange(e) {
    this.setData({ dormIndex: parseInt(e.detail.value) })
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
    const { wantItem, haveItem, dormIndex } = this.data
    const canSubmit = wantItem.trim() && haveItem.trim() && dormIndex >= 0
    this.setData({ canSubmit })
  },

  submitExchange() {
    if (!this.data.canSubmit) return

    wx.showLoading({ title: '发布中..' })

    const data = {
      wantItem: this.data.wantItem.trim(),
      haveItem: this.data.haveItem.trim(),
      images: this.data.images,
      description: this.data.description,
      dorm: this.data.dorms[this.data.dormIndex],
      contact: this.data.contact
    }

    wx.cloud.callFunction({
      name: 'publishExchange',
      data,
      success: () => {
        wx.hideLoading()
        wx.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  }
})