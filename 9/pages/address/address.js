const cloud = require('../../utils/cloud.js')
const toast = require('../../utils/toast.js')

Page({
  data: {
    addresses: [],
    showForm: false,
    form: {
      name: '',
      phone: '',
      dormIndex: -1,
      room: '',
      isDefault: false
    },
    dormList: ['中园公寓', '中南公寓', '新柏居', '清水居', '三友园', '四季园', '松柏居'],
    pasteText: ''
  },

  onLoad() {
    this.loadAddresses()
  },

  onShow() {
    this.loadAddresses()
  },

  async loadAddresses() {
    try {
      const result = await cloud.callCloudFunction({
        name: 'getAddresses',
        showLoading: false,
        showError: false
      })
      if (result) {
        this.setData({ addresses: result })
      }
    } catch (error) {
      console.error('加载地址失败:', error)
      this.setData({
        addresses: [
          { _id: '1', name: '小明', phone: '13800138000', dorm: '东1', room: '302', isDefault: true },
          { _id: '2', name: '小红', phone: '13900139000', dorm: '西2', room: '201', isDefault: false }
        ]
      })
    }
  },

  onPasteInput(e) {
    this.setData({ pasteText: e.detail.value })
  },

  parseAddress() {
    if (!this.data.pasteText.trim()) return
    
    const text = this.data.pasteText
    
    const phoneMatch = text.match(/1[3-9]\d{9}/)
    const phone = phoneMatch ? phoneMatch[0] : ''
    
    const nameMatch = text.match(/[^\d\s\u4e00-\u9fa5]{2,4}|[\u4e00-\u9fa5]{2,4}/)
    const name = nameMatch ? nameMatch[0] : ''
    
    this.setData({
      'form.name': name,
      'form.phone': phone,
      pasteText: ''
    })
    
    wx.showToast({ title: '解析成功', icon: 'success' })
  },

  selectAddress(e) {
    const id = e.currentTarget.dataset.id
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    
    if (prevPage && prevPage.route === 'pages/order/order') {
      const address = this.data.addresses.find(item => item._id === id)
      prevPage.setData({ selectedAddress: address })
      wx.navigateBack()
    }
  },

  addAddress() {
    this.setData({
      showForm: true,
      form: {
        name: '',
        phone: '',
        dormIndex: -1,
        room: '',
        isDefault: false
      }
    })
  },

  editAddress(e) {
    const id = e.currentTarget.dataset.id
    const address = this.data.addresses.find(item => item._id === id)
    if (address) {
      this.setData({
        showForm: true,
        form: {
          id: address._id,
          name: address.name,
          phone: address.phone,
          dormIndex: this.data.dormList.indexOf(address.dorm),
          room: address.room,
          isDefault: address.isDefault
        }
      })
    }
  },

  closeForm() {
    this.setData({ showForm: false })
  },

  onFormInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onDormChange(e) {
    this.setData({ 'form.dormIndex': parseInt(e.detail.value) })
  },

  onSwitchChange(e) {
    this.setData({ 'form.isDefault': e.detail.value })
  },

  async saveAddress() {
    const { name, phone, dormIndex, room, isDefault, id } = this.data.form
    
    if (!name.trim() || !phone.trim() || dormIndex < 0 || !room.trim()) {
      toast.info('请填写完整地址信息')
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.info('请输入正确的手机号码')
      return
    }

    const data = {
      name: name.trim(),
      phone: phone.trim(),
      dorm: this.data.dormList[dormIndex],
      room: room.trim(),
      isDefault
    }

    try {
      await cloud.callCloudFunction({
        name: 'saveAddress',
        data: { ...data, id },
        loadingTitle: '保存中...',
        showSuccess: true,
        successTitle: '保存成功'
      })
      this.setData({ showForm: false })
      this.loadAddresses()
    } catch (error) {
      console.error('保存地址失败:', error)
    }
  },

  setDefault(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '设置成功', icon: 'success' })
    this.loadAddresses()
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '删除成功', icon: 'success' })
          this.loadAddresses()
        }
      }
    })
  }
})