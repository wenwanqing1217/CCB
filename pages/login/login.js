Page({
  data: {
    isLoggingIn: false,
    redirectUrl: ''
  },

  onLoad(options) {
    if (options.redirect) {
      this.setData({ redirectUrl: decodeURIComponent(options.redirect) })
    }
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo._id) {
      this.navigateAfterLogin()
    }
  },

  doLogin() {
    if (this.data.isLoggingIn) return
    this.setData({ isLoggingIn: true })
    const that = this

    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: res => {
        that.loginWithCloud(res.userInfo)
      },
      fail: () => {
        that.setData({ isLoggingIn: false })
        wx.showToast({ title: '需要授权才能登录', icon: 'none' })
      }
    })
  },

  loginWithCloud(userInfo) {
    const that = this
    wx.cloud.callFunction({
      name: 'userService',
      data: {
        action: 'login',
        data: { userInfo, code: '' }
      },
      success: loginRes => {
        const result = loginRes.result || {}
        if (!result.success || !result.user) {
          that.setData({ isLoggingIn: false })
          wx.showToast({ title: result.message || '登录失败', icon: 'none' })
          return
        }
        const user = result.user
        const stored = {
          ...userInfo,
          _id: user._id,
          openid: user.openid
        }
        wx.setStorageSync('userInfo', stored)
        that.setData({ isLoggingIn: false })
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => that.navigateAfterLogin(), 500)
      },
      fail: () => {
        that.setData({ isLoggingIn: false })
        wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      }
    })
  },

  navigateAfterLogin() {
    const redirect = this.data.redirectUrl
    if (redirect) {
      const tabPages = [
        '/pages/index/index',
        '/pages/love/love',
        '/pages/box-publish/box-publish',
        '/pages/message/message',
        '/pages/profile/profile'
      ]
      if (tabPages.some(p => redirect.indexOf(p) === 0)) {
        wx.switchTab({ url: redirect.split('?')[0] })
      } else {
        wx.redirectTo({ url: redirect, fail: () => wx.navigateBack() })
      }
      return
    }
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/profile/profile' })
    }
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  }
})
