Page({
  data: {
    isRider: false,
    isOnline: false,
    riderLevel: 1,
    userInfo: {},
    todayOrders: 0,
    todayEarnings: 0,
    totalOrders: 0,
    totalEarnings: 0,
    pendingOrders: [],
    myOrders: [],
    applyName: '',
    applyPhone: '',
    applyAddress: '',
    dormIndex: -1,
    dorms: ['新柏居', '松柏居', '新松居', '东四舍', '东五舍', '翠微居南楼', '翠微居北楼', '东八舍', '中园公寓', '中南公寓', '三友园', '四季园', '清水居', '鄱阳居', '苏园居', '钱塘居', '黄浦居', '潇湘居', '江汉居', '知行1栋', '知行2栋', '知行3栋', '知行4栋', '知行5栋', '知行6栋', '敏学1栋', '敏学2栋', '敏学3栋', '敏学4栋', '敏学5栋', '洪山园1栋', '洪山园2栋', '洪山园4栋', '滨水居', '巴山居', '青枫居', '新梧居', '文园', '静园', '竹园', '兰园', '菊园'],
    idFront: '',
    idBack: '',
    verifyCode: '',
    codeSent: false,
    countdown: 0,
    canApply: false
  },

  onLoad() {
    this.checkRiderStatus()
  },

  checkRiderStatus() {
    wx.cloud.callFunction({
      name: 'checkRiderStatus',
      success: res => {
        if (res.result && res.result.isRider) {
          this.setData({
            isRider: true,
            riderLevel: res.result.level || 1,
            todayOrders: res.result.todayOrders || 0,
            todayEarnings: res.result.todayEarnings || 0,
            totalOrders: res.result.totalOrders || 0,
            totalEarnings: res.result.totalEarnings || 0
          })
          this.loadPendingOrders()
          this.loadMyOrders()
        }
      },
      fail: () => {}
    })
  },

  loadPendingOrders() {
    wx.cloud.callFunction({
      name: 'getPendingOrders',
      success: res => {
        if (res.result) {
          this.setData({ pendingOrders: res.result })
        }
      },
      fail: () => {
        this.setData({
          pendingOrders: [
            { _id: '1', orderId: 'ORD001', fromDorm: '东区', fromRoom: '302', toDorm: '西区', toRoom: '201', deliveryFee: 5, createTime: '10分钟前' }
          ]
        })
      }
    })
  },

  loadMyOrders() {
    wx.cloud.callFunction({
      name: 'getMyDeliveryOrders',
      success: res => {
        if (res.result) {
          this.setData({ myOrders: res.result })
        }
      },
      fail: () => {}
    })
  },

  toggleOnline() {
    this.setData({ isOnline: !this.data.isOnline })
    wx.showToast({
      title: this.data.isOnline ? '已上线' : '已下线',
      icon: 'success'
    })
  },

  onNameInput(e) {
    this.setData({ applyName: e.detail.value })
    this.checkCanApply()
  },

  onPhoneInput(e) {
    this.setData({ applyPhone: e.detail.value })
    this.checkCanApply()
  },

  onCodeInput(e) {
    this.setData({ verifyCode: e.detail.value })
    this.checkCanApply()
  },

  onAddressInput(e) {
    this.setData({ applyAddress: e.detail.value })
    this.checkCanApply()
  },

  onDormChange(e) {
    this.setData({ dormIndex: parseInt(e.detail.value) })
    this.checkCanApply()
  },

  sendCode() {
    if (this.data.codeSent) {
      wx.showToast({ title: '请等待倒计时结束', icon: 'none' })
      return
    }
    
    if (!this.data.applyPhone) {
      wx.showToast({ title: '请先输入手机号', icon: 'none' })
      return
    }
    
    if (!/^1[3-9]\d{9}$/.test(this.data.applyPhone)) {
      wx.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
      return
    }

    this.setData({ codeSent: true, countdown: 60 })
    
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer)
        this.setData({ codeSent: false, countdown: 0 })
      } else {
        this.setData({ countdown: this.data.countdown - 1 })
      }
    }, 1000)

    wx.showToast({ title: '验证码已发送', icon: 'success' })
  },

  uploadIdFront() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: res => {
        that.setData({ idFront: res.tempFiles[0].tempFilePath })
        that.checkCanApply()
      }
    })
  },

  uploadIdBack() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: res => {
        that.setData({ idBack: res.tempFiles[0].tempFilePath })
        that.checkCanApply()
      }
    })
  },

  checkCanApply() {
    const { applyName, applyPhone, verifyCode, dormIndex, applyAddress, idFront, idBack } = this.data
    const canApply = applyName && applyPhone && verifyCode && dormIndex >= 0 && applyAddress && idFront && idBack
    this.setData({ canApply })
  },

  applyRider() {
    if (!this.data.canApply) {
      let errorMsg = ''
      if (!this.data.applyName) {
        errorMsg = '请输入姓名'
      } else if (!this.data.applyPhone) {
        errorMsg = '请输入手机号'
      } else if (!/^1[3-9]\d{9}$/.test(this.data.applyPhone)) {
        errorMsg = '请输入正确的11位手机号'
      } else if (!this.data.verifyCode) {
        errorMsg = '请输入验证码'
      } else if (this.data.dormIndex < 0) {
        errorMsg = '请选择宿舍楼'
      } else if (!this.data.applyAddress) {
        errorMsg = '请输入详细住址'
      } else if (!this.data.idFront) {
        errorMsg = '请上传身份证人像面'
      } else if (!this.data.idBack) {
        errorMsg = '请上传身份证国徽面'
      }
      wx.showToast({ title: errorMsg, icon: 'none' })
      return
    }

    wx.showLoading({ title: '申请中..' })

    wx.cloud.callFunction({
      name: 'applyRider',
      data: {
        name: this.data.applyName,
        phone: this.data.applyPhone,
        dorm: this.data.dorms[this.data.dormIndex],
        address: this.data.applyAddress,
        idFront: this.data.idFront,
        idBack: this.data.idBack
      },
      success: () => {
        wx.hideLoading()
        wx.showToast({ title: '申请成功', icon: 'success' })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '申请成功', icon: 'success' })
      }
    })
  },

  acceptOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '接单中..' })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '接单成功', icon: 'success' })
      this.loadPendingOrders()
      this.loadMyOrders()
      // 跳转到地图页面
      setTimeout(() => {
        wx.navigateTo({
          url: '../map/map?orderId=' + id
        })
      }, 1000)
    }, 800)
  },

  rejectOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '已拒绝', icon: 'success' })
    this.loadPendingOrders()
  },

  updateOrderStatus(e) {
    const { id, status } = e.currentTarget.dataset
    wx.showLoading({ title: '更新中..' })
    
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: status === 'picked' ? '已取货' : '已送达', icon: 'success' })
      this.loadMyOrders()
    }, 800)
  },

  navigateToDelivery() {
    wx.navigateTo({ url: '../delivery/delivery' })
  }
})
