const mockBox = {
  _id: '1',
  title: '全新数码配件盲盒',
  price: 9.9,
  type: 'secondhand',
  typeName: '二手数码盲盒',
  images: [
    'https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png',
    'https://img.zcool.cn/community/016c7a57e4a6fa0000018c1b9b1b39.png@1280w_1l_2o_100sh.png'
  ],
  fromDorm: '东区',
  toDorm: '西区',
  school: '北京大学',
  sales: 128,
  isHot: true,
  probability: 5,
  contents: [
    { name: '全新数码配件', probability: 30 },
    { name: '精美耳机', probability: 25 },
    { name: '手机支架', probability: 20 },
    { name: '数据线', probability: 15 },
    { name: '手机壳', probability: 10 }
  ],
  seller: {
    name: '小明',
    avatar: 'https://img.zcool.cn/community/01c7a57e4a6fa0000018c1b6e8f91a.jpg@1280w_1l_2o_100sh.jpg',
    rating: 4.8,
    reviewCount: 23
  },
  comments: [
    {
      id: '1',
      user: {
        name: '小红',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
      },
      content: '开到了耳机！音质超级好，卖家包装也很用心',
      createTime: '2小时前',
      likes: 5
    },
    {
      id: '2',
      user: {
        name: '小刚',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
      },
      content: '这个盲盒性价比很高，推荐大家购买',
      createTime: '昨天',
      likes: 3
    }
  ],
  openRecords: [
    {
      id: '1',
      user: {
        name: '小莉',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200'
      },
      content: '精美耳机',
      createTime: '30分钟前'
    },
    {
      id: '2',
      user: {
        name: '小强',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200'
      },
      content: '手机支架',
      createTime: '1小时前'
    }
  ]
}

Page({
  data: {
    box: null,
    isFavorite: false,
    currentImage: 0,
    loading: true
  },

  onLoad(options) {
    const boxId = options.id
    this.loadBoxDetail(boxId)
  },

  loadBoxDetail(boxId) {
    this.setData({ loading: true })
    
    wx.cloud.callFunction({
      name: 'getBlindBoxDetail',
      data: { boxId },
      success: res => {
        if (res.result) {
          this.setData({ box: res.result, loading: false })
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
    this.setData({ box: mockBox, loading: false })
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
      title: this.data.isFavorite ? '收藏成功' : '取消收藏',
      icon: 'success'
    })
  },

  showComments() {
    wx.showToast({ title: '评论功能开发中', icon: 'none' })
  },

  shareBox() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onShareAppMessage() {
    const box = this.data.box
    return {
      title: box.title,
      path: `/pages/blindBoxDetail/blindBoxDetail?id=${box._id}`,
      imageUrl: box.images[0]
    }
  },

  openBox() {
    wx.showModal({
      title: '开启盲盒',
      content: '确定要开启这个盲盒吗？开启后将无法退还',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '开启中..' })
          
          setTimeout(() => {
            wx.hideLoading()
            wx.showModal({
              title: '开启成功',
              content: '恭喜获得全新数码配件！',
              showCancel: false
            })
          }, 1500)
        }
      }
    })
  },

  buyBox() {
    const box = this.data.box
    wx.showModal({
      title: '购买盲盒',
      content: `确认购买 ${box.title}\n价格: ${box.price}\n配送费: 1元\n总价: ${box.price + 1}元`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '购买中..' })
          
          setTimeout(() => {
            wx.hideLoading()
            wx.showToast({ title: '购买成功', icon: 'success' })
            
            setTimeout(() => {
              wx.navigateTo({ url: '../order-list/order-list' })
            }, 1500)
          }, 1000)
        }
      }
    })
  },

  contactSeller() {
    wx.showToast({ title: '聊天功能开发中', icon: 'none' })
  },

  viewSeller() {
    wx.showToast({ title: '查看卖家信息功能暂未开放', icon: 'none' })
  },

  // 点赞评论
  likeComment(e) {
    const commentId = e.currentTarget.dataset.id
    const box = this.data.box
    const updatedComments = box.comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.likes + 1
        }
      }
      return comment
    })
    this.setData({
      'box.comments': updatedComments
    })
    wx.showToast({ title: '点赞成功', icon: 'success' })
  },

  // 添加评论
  addComment() {
    wx.showModal({
      title: '写下你的开盒体验',
      editable: true,
      placeholderText: '分享你的开盒心得...',
      success: (res) => {
        if (res.confirm && res.content.trim()) {
          const newComment = {
            id: Date.now().toString(),
            user: {
              name: '我',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
            },
            content: res.content.trim(),
            createTime: '刚刚',
            likes: 0
          }
          const box = this.data.box
          box.comments.unshift(newComment)
          this.setData({
            'box.comments': box.comments
          })
          wx.showToast({ title: '评论成功', icon: 'success' })
        }
      }
    })
  }
})