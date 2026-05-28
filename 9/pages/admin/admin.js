const cloud = require('../../utils/cloud.js')
const toast = require('../../utils/toast.js')

Page({
  data: {
    activeTab: 'users',
    users: [],
    boxes: [],
    donations: [],
    merchantApplies: [],
    dashboardStats: {
      totalUsers: 128,
      totalBoxes: 256,
      totalOrders: 89,
      totalDonations: 45
    },
    showRejectModal: false,
    rejectApplyId: '',
    rejectReason: ''
  },

  onLoad() {
    this.loadUsers()
  },

  setTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    
    switch (tab) {
      case 'users': this.loadUsers(); break
      case 'boxes': this.loadBoxes(); break
      case 'donations': this.loadDonations(); break
      case 'merchants': this.loadMerchantApplies(); break
      case 'stats': this.loadDashboardStats(); break
    }
  },

  async loadUsers() {
    try {
      const result = await cloud.callCloudFunction({
        name: 'getUsers',
        showLoading: false,
        showError: false
      })
      if (result && result.success) {
        this.setData({ users: result.data || [] })
      } else {
        this.setData({ users: this.getMockUsers() })
      }
    } catch (error) {
      console.error('加载用户失败:', error)
      this.setData({ users: this.getMockUsers() })
    }
  },

  async loadBoxes() {
    try {
      const result = await cloud.callCloudFunction({
        name: 'getAllBoxes',
        showLoading: false,
        showError: false
      })
      if (result && result.success) {
        this.setData({ boxes: result.data || [] })
      } else {
        this.setData({ boxes: this.getMockBoxes() })
      }
    } catch (error) {
      console.error('加载盲盒失败:', error)
      this.setData({ boxes: this.getMockBoxes() })
    }
  },

  loadDonations() {
    wx.cloud.callFunction({
      name: 'getDonations',
      success: res => {
        this.setData({ donations: res.result || [] })
      },
      fail: () => {
        this.setData({ donations: this.getMockDonations() })
      }
    })
  },

  async loadMerchantApplies() {
    try {
      const result = await cloud.callCloudFunction({
        name: 'getMerchantApplies',
        data: { status: 'all' },
        showLoading: false,
        showError: false
      })
      if (result && result.success) {
        this.setData({ merchantApplies: result.data || [] })
      } else {
        this.setData({ merchantApplies: this.getMockMerchantApplies() })
      }
    } catch (error) {
      console.error('加载商家申请失败:', error)
      this.setData({ merchantApplies: this.getMockMerchantApplies() })
    }
  },

  async loadDashboardStats() {
    try {
      const result = await cloud.callCloudFunction({
        name: 'getDashboardStats',
        showLoading: false,
        showError: false
      })
      if (result && result.success) {
        this.setData({ dashboardStats: result.data || this.data.dashboardStats })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  getMockUsers() {
    return [
      { _id: '1', nickName: 'Alex', role: 'student', dorm: 'East 5', status: 'active' },
      { _id: '2', nickName: 'Emma', role: 'merchant', dorm: 'West 3', status: 'active' },
      { _id: '3', nickName: 'Sophie', role: 'student', dorm: 'North 2', status: 'banned' }
    ]
  },

  getMockBoxes() {
    return [
      { _id: '1', title: 'Stationery Box', price: 9.9, status: 'active', sales: 23 },
      { _id: '2', title: 'Snack Pack', price: 19.9, status: 'sold', sales: 45 }
    ]
  },

  getMockDonations() {
    return [
      { _id: '1', title: 'Books', status: 'completed', time: '2024-01-15' },
      { _id: '2', title: 'Clothes', status: 'pending', time: '2024-01-18' }
    ]
  },

  getMockMerchantApplies() {
    return [
      { _id: '1', shopName: '校园便利店', category: '生活用品', contactName: '张三', contactPhone: '13800138000', status: 'pending', applyTime: '2024-01-15 10:30' },
      { _id: '2', shopName: '二手书吧', category: '图书音像', contactName: '李四', contactPhone: '13900139000', status: 'approved', applyTime: '2024-01-14 14:20' }
    ]
  },

  navigateToBoxDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `../box-detail/box-detail?id=${id}` })
  },

  navigateToUserDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: 'User details', icon: 'none' })
  },

  async banUser(e) {
    const userId = e.currentTarget.dataset.id
    const confirmed = await toast.confirm('确定要封禁这个用户吗？', '确认封禁')
    if (confirmed) {
      try {
        const result = await cloud.callCloudFunction({
          name: 'banUser',
          data: { userId },
          loadingTitle: '处理中...',
          showSuccess: true,
          successTitle: '封禁成功'
        })
        if (result && result.success) {
          this.loadUsers()
        }
      } catch (error) {
        console.error('封禁用户失败:', error)
      }
    }
  },

  async unbanUser(e) {
    const userId = e.currentTarget.dataset.id
    const confirmed = await toast.confirm('确定要解封这个用户吗？', '确认解封')
    if (confirmed) {
      try {
        const result = await cloud.callCloudFunction({
          name: 'unbanUser',
          data: { userId },
          loadingTitle: '处理中...',
          showSuccess: true,
          successTitle: '解封成功'
        })
        if (result && result.success) {
          this.loadUsers()
        }
      } catch (error) {
        console.error('解封用户失败:', error)
      }
    }
  },

  approveBox(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: 'Approved', icon: 'success' })
    this.loadBoxes()
  },

  removeBox(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: 'Confirm',
      content: 'Remove this box?',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: 'Removed', icon: 'success' })
          this.loadBoxes()
        }
      }
    })
  },

  async approveMerchant(e) {
    const id = e.currentTarget.dataset.id
    const confirmed = await toast.confirm('确定要审核通过这个商家申请吗？', '确认审核')
    if (confirmed) {
      try {
        const result = await cloud.callCloudFunction({
          name: 'reviewMerchantApply',
          data: {
            applyId: id,
            approved: true
          },
          loadingTitle: '审核中...',
          showSuccess: true,
          successTitle: '审核通过'
        })
        if (result && result.success) {
          this.loadMerchantApplies()
        }
      } catch (error) {
        console.error('审核商家失败:', error)
      }
    }
  },

  showRejectInput(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      showRejectModal: true,
      rejectApplyId: id,
      rejectReason: ''
    })
  },

  hideRejectModal() {
    this.setData({ showRejectModal: false })
  },

  onRejectReasonInput(e) {
    this.setData({ rejectReason: e.detail.value })
  },

  async submitReject() {
    if (!this.data.rejectReason.trim()) {
      toast.info('请填写拒绝原因')
      return
    }

    try {
      const result = await cloud.callCloudFunction({
        name: 'reviewMerchantApply',
        data: {
          applyId: this.data.rejectApplyId,
          approved: false,
          rejectReason: this.data.rejectReason
        },
        loadingTitle: '处理中...',
        showSuccess: true,
        successTitle: '已拒绝'
      })
      if (result && result.success) {
        this.setData({ showRejectModal: false })
        this.loadMerchantApplies()
      }
    } catch (error) {
      console.error('拒绝商家申请失败:', error)
    }
  },

  viewApplyDetail(e) {
    const id = e.currentTarget.dataset.id
    const apply = this.data.merchantApplies.find(item => item._id === id)
    if (apply) {
      let content = `店铺名称: ${apply.shopName}\n经营类别: ${apply.category}\n联系人: ${apply.contactName}\n联系电话: ${apply.contactPhone}\n店铺描述: ${apply.shopDesc || '无'}`
      wx.showModal({
        title: '申请详情',
        content: content,
        showCancel: false
      })
    }
  }
})