Page({
  data: {
    boxInfo: {},
    address: {
      name: '',
      phone: '',
      detail: ''
    },
    paymentMethod: 'offline',
    remark: '',
    deliveryFee: 0,
    totalPrice: 0,
    orderType: 'blindBox',
    isShakeOrder: false
  },

  onLoad(options) {
    if (options.type === 'blindBox') {
      this.loadBlindBoxOrder(options)
    } else if (options.boxId) {
      this.loadBoxInfo(options.boxId)
    }
  },

  loadBlindBoxOrder(options) {
    const mockBoxes = {
      '1': {
        _id: '1',
        title: '神秘电子产品盲盒',
        price: 29.9,
        images: ['https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600'],
        desc: '内含各种电子产品，可能开出蓝牙耳机、充电宝、数据线等实用物品',
        campus: '中园公寓',
        category: 'electronics'
      },
      '2': {
        _id: '2',
        title: '校园生活盲盒',
        price: 19.9,
        images: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600'],
        desc: '内含各种校园生活用品，可能开出保温杯、台灯、收纳盒等实用物品',
        campus: '苏园居',
        category: 'life'
      },
      '3': {
        _id: '3',
        title: '学习资料盲盒',
        price: 24.9,
        images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'],
        desc: '内含各种学习资料，可能开出考研资料、四六级词汇、笔记本等',
        campus: '中南公寓',
        category: 'study'
      },
      '4': {
        _id: '4',
        title: '运动装备盲盒',
        price: 39.9,
        images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600'],
        desc: '内含各种运动装备，可能出瑜伽垫、哑铃、跳绳、护具等',
        campus: '新柏居',
        category: 'sports'
      },
      '5': {
        _id: '5',
        title: '时尚配饰盲盒',
        price: 29.9,
        images: ['https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600'],
        desc: '内含各种时尚配饰，可能开出戒指、耳钉、手链、发饰等',
        campus: '三友园',
        category: 'fashion'
      },
      '6': {
        _id: '6',
        title: '文创用品盲盒',
        price: 14.9,
        images: ['https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600'],
        desc: '内含各种文创用品，可能出水杯、鼠标垫、文件夹、文件袋等',
        campus: '中园公寓',
        category: 'study'
      },
      '7': {
        _id: '7',
        title: '创意电子产品盲盒',
        price: 39.9,
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
        desc: '内含各种创意电子产品，可能出智能手环、蓝牙音箱、智能闹钟等',
        campus: '苏园居',
        category: 'electronics'
      },
      '8': {
        _id: '8',
        title: '潮流运动盲盒',
        price: 49.9,
        images: ['https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600'],
        desc: '内含各种潮流运动装备，可能出运动背包、护腕、运动水壶等',
        campus: '中南公寓',
        category: 'sports'
      }
    }

    let boxInfo
    if (options.id && mockBoxes[options.id]) {
      boxInfo = mockBoxes[options.id]
    } else {
      const keys = Object.keys(mockBoxes)
      const randomKey = keys[Math.floor(Math.random() * keys.length)]
      boxInfo = mockBoxes[randomKey]
    }

    if (options.price) {
      boxInfo.price = parseFloat(options.price)
    }

    const deliveryFee = 2 // 配送费2元/单
    const totalPrice = boxInfo.price + deliveryFee

    this.setData({
      boxInfo,
      orderType: 'blindBox',
      isShakeOrder: true,
      deliveryFee,
      totalPrice
    })
  },

  loadBoxInfo(boxId) {
    const mockBoxes = {
      '1': {
        _id: '1',
        title: '全新数码配件盲盒',
        price: 9.9,
        images: ['https://res.wx.qq.com/wxdoc/dist/assets/img/demo.ef5c5bef.jpg'],
        desc: '包含全新数据线、耳机、充电器等',
        campus: '中园公寓'
      },
      '2': {
        _id: '2',
        title: '精美文具套装',
        price: 14.9,
        images: ['https://res.wx.qq.com/wxdoc/dist/assets/img/demo.ef5c5bef.jpg'],
        desc: '笔、本子、尺子、橡皮等文具',
        campus: '苏园居'
      }
    }

    const boxInfo = mockBoxes[boxId] || mockBoxes['1']
    const deliveryFee = 2 // 配送费2元/单
    const totalPrice = boxInfo.price + deliveryFee

    this.setData({
      boxInfo,
      orderType: 'normal',
      isShakeOrder: false,
      deliveryFee,
      totalPrice
    })
  },

  chooseAddress() {
    wx.chooseAddress({
      success: (res) => {
        this.setData({
          address: {
            name: res.userName,
            phone: res.telNumber,
            detail: res.provinceName + res.cityName + res.countyName + res.detailInfo
          }
        })
      },
      fail: (err) => {
        console.log('选择地址失败:', err)
        // 开发环境或用户取消时，使用模拟数据
        if (err.errMsg && err.errMsg.includes('cancel')) {
          return
        }
        // 显示手动输入地址的提示
        wx.showModal({
          title: '提示',
          content: '请手动输入收货地址',
          showCancel: false,
          success: () => {
            // 使用模拟地址数据
            this.setData({
              address: {
                name: '张三',
                phone: '13800138000',
                detail: '武汉生物工程学院中园公寓302室'
              }
            })
          }
        })
      }
    })
  },

  selectPayment(e) {
    const method = e.currentTarget.dataset.method
    this.setData({ paymentMethod: method })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  submitOrder() {
    if (!this.data.address.name) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交订单中...' })

    setTimeout(() => {
      wx.hideLoading()

      if (this.data.isShakeOrder) {
        wx.showModal({
          title: '🎉 购买成功',
          content: '恭喜你抽中了"' + this.data.boxInfo.title + '"！卖家会尽快与你联系。',
          showCancel: false,
          success: () => {
            wx.navigateBack()
          }
        })
      } else {
        wx.showToast({ title: '订单提交成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateTo({ url: '../order-list/order-list' })
        }, 1500)
      }
    }, 1000)
  }
})
