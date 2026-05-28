const mockBoxData = {
  '1': {
    _id: '1',
    title: 'Stationery Mystery Box',
    price: 9.9,
    images: [
      'https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png',
      'https://img.zcool.cn/community/016c7a57e4a6fa0000018c1b9b1b39.png@1280w_1l_2o_100sh.png'
    ],
    from_dorm: 'East 1',
    to_dorm: 'West 5',
    stock: 50,
    sales: 23,
    category: 'stationery',
    category_name: 'Stationery',
    note: 'A surprise box full of useful stationery items. Perfect for students!',
    publisher: {
      name: 'Alex',
      avatar: 'https://img.zcool.cn/community/01c7a57e4a6fa0000018c1b6e8f91a.jpg@1280w_1l_2o_100sh.jpg',
      rating: 4.8,
      id: 'user1'
    },
    publish_time: Date.now() - 2 * 24 * 60 * 60 * 1000
  },
  '2': {
    _id: '2',
    title: 'Snack Gift Pack',
    price: 19.9,
    images: [
      'https://img.zcool.cn/community/016c7a57e4a6fa0000018c1b9b1b39.png@1280w_1l_2o_100sh.png'
    ],
    from_dorm: 'East 3',
    to_dorm: 'South 7',
    stock: 30,
    sales: 45,
    category: 'food',
    category_name: 'Snacks',
    note: 'A carefully selected snack pack. All items are fresh and unopened.',
    publisher: {
      name: 'Emma',
      avatar: 'https://img.zcool.cn/community/01b7a57e4a6fa0000018c1ba2902b.jpg@1280w_1l_2o_100sh.jpg',
      rating: 4.9,
      id: 'user2'
    },
    publish_time: Date.now() - 1 * 24 * 60 * 60 * 1000
  },
  '3': {
    _id: '3',
    title: 'Beauty Box',
    price: 29.9,
    images: [
      'https://img.zcool.cn/community/015c7a57e4a6fa0000018c1b0f9b2b.png@1280w_1l_2o_100sh.png'
    ],
    from_dorm: 'West 2',
    to_dorm: 'North 6',
    stock: 20,
    sales: 18,
    category: 'beauty',
    category_name: 'Beauty',
    note: 'Premium beauty products waiting for you to discover.',
    publisher: {
      name: 'Sophie',
      avatar: 'https://img.zcool.cn/community/01a7a57e4a6fa0000018c1bdc13cc.jpg@1280w_1l_2o_100sh.jpg',
      rating: 4.7,
      id: 'user3'
    },
    publish_time: Date.now() - 3 * 24 * 60 * 60 * 1000
  }
}

Page({
  data: {
    box: null,
    loading: true,
    currentImage: 0,
    showShareMenu: false,
    isFavorite: false
  },

  onLoad(options) {
    const boxId = options.id
    this.loadBoxDetail(boxId)
  },

  loadBoxDetail(boxId) {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'getBoxDetail',
      data: { boxId },
      success: res => {
        if (res.result) {
          this.setData({ box: res.result, loading: false })
        } else {
          this.useLocalData(boxId)
        }
      },
      fail: err => {
        console.error('Load failed, using local data', err)
        this.useLocalData(boxId)
      }
    })
  },

  useLocalData(boxId) {
    const box = mockBoxData[boxId] || mockBoxData['1']
    this.setData({ box: box, loading: false })
  },

  onImageChange(e) {
    this.setData({ currentImage: e.detail.current })
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.src
    wx.previewImage({
      current,
      urls: this.data.box.images
    })
  },

  goBack() {
    wx.navigateBack()
  },

  toggleFavorite() {
    this.setData({ isFavorite: !this.data.isFavorite })
    wx.showToast({
      title: this.data.isFavorite ? 'Added' : 'Removed',
      icon: 'success'
    })
  },

  showComments() {
    wx.showToast({ title: '评论功能开发中', icon: 'none' })
  },

  buyBox() {
    const app = getApp()
    if (!app.globalData.userInfo || !app.globalData.userInfo.nickName) {
      wx.showModal({
        title: 'Login Required',
        content: 'Please login to purchase',
        confirmText: 'Login',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '../profile/profile' })
          }
        }
      })
      return
    }

    const box = this.data.box
    if (!box) return

    wx.showModal({
      title: 'Confirm Purchase',
      content: `Item: ${box.title}\nPrice: ${box.price} CNY\nDelivery: 1 CNY\nTotal: ${(box.price + 1).toFixed(2)} CNY`,
      success: (res) => {
        if (res.confirm) {
          this.processBuy()
        }
      }
    })
  },

  processBuy() {
    wx.showLoading({ title: 'Processing...' })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: 'Success', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateTo({ url: '../order-list/order-list' })
      }, 1500)
    }, 1000)
  },

  contactPublisher() {
    const box = this.data.box
    if (!box || !box.publisher) return
    
    wx.showModal({
      title: 'Contact Seller',
      content: `Send a message to ${box.publisher.name}?`,
      confirmText: 'Send',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ 
            url: `../message/message?userId=${box.publisher.id}&userName=${box.publisher.name}`
          })
        }
      }
    })
  },

  shareBox() {
    this.setData({ showShareMenu: true })
  },

  closeShareMenu() {
    this.setData({ showShareMenu: false })
  },

  copyLink() {
    const box = this.data.box
    wx.setClipboardData({
      data: `https://cbb.app/box/${box._id}`,
      success: () => {
        wx.showToast({ title: 'Link copied', icon: 'success' })
        this.closeShareMenu()
      }
    })
  },

  onShareAppMessage() {
    const box = this.data.box
    return {
      title: `${box.title} - ${box.price} CNY`,
      path: `/pages/boxDetail/boxDetail?id=${box._id}`,
      imageUrl: box.images[0]
    }
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  }
})
