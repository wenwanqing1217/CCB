const categories = ['生活用品', '餐饮服务', '零食饮品', '盲盒玩具', '文具用品', '电子产品', '服装配饰', '其他'];

Page({
  data: {
    isLoggedIn: false,
    status: '',
    merchantType: '',
    categories: categories,
    categoryIndex: -1,
    shopName: '',
    shopDesc: '',
    contactName: '',
    contactPhone: '',
    businessLicense: '',
    shopImages: [],
    idFront: '',
    idBack: '',
    canSubmit: false,
    rejectReason: '',
    applyTime: ''
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    this.loadApplyStatus();
  },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      this.setData({ isLoggedIn: false });
      wx.showModal({
        title: '提示',
        content: '请先登录后再申请商家',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '../profile/profile' });
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    }
    this.setData({ isLoggedIn: true });
    this.loadApplyStatus();
  },

  loadApplyStatus() {
    if (!this.data.isLoggedIn) {
      return;
    }

    wx.cloud.callFunction({
      name: 'getMerchantApply',
      success: res => {
        if (res.result) {
          const data = res.result;
          this.setData({
            status: data.status || '',
            merchantType: data.merchantType || '',
            shopName: data.shopName || '',
            shopDesc: data.shopDesc || '',
            contactName: data.contactName || '',
            contactPhone: data.contactPhone || '',
            categoryIndex: categories.indexOf(data.category || ''),
            businessLicense: data.businessLicense || '',
            shopImages: data.shopImages || [],
            idFront: data.idFront || '',
            idBack: data.idBack || '',
            rejectReason: data.rejectReason || '',
            applyTime: data.applyTime || ''
          });
        }
      },
      fail: () => {}
    });
  },

  setMerchantType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ merchantType: type });
    this.checkForm();
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: parseInt(e.detail.value) });
    this.checkForm();
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
    this.checkForm();
  },

  validatePhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  uploadBusinessLicense() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        that.setData({ businessLicense: res.tempFiles[0].tempFilePath });
        that.checkForm();
      }
    });
  },

  removeBusinessLicense() {
    this.setData({ businessLicense: '' });
    this.checkForm();
  },

  uploadShopImage() {
    const that = this;
    const currentImages = this.data.shopImages;
    if (currentImages.length >= 5) {
      wx.showToast({ title: '最多只能上传5张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: 5 - currentImages.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const newImages = res.tempFiles.map(file => file.tempFilePath);
        that.setData({ shopImages: [...currentImages, ...newImages] });
        that.checkForm();
      }
    });
  },

  removeShopImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.shopImages.filter((_, i) => i !== index);
    this.setData({ shopImages: images });
    this.checkForm();
  },

  uploadIdFront() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        that.setData({ idFront: res.tempFiles[0].tempFilePath });
        that.checkForm();
      }
    });
  },

  uploadIdBack() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        that.setData({ idBack: res.tempFiles[0].tempFilePath });
        that.checkForm();
      }
    });
  },

  checkForm() {
    const { merchantType, categoryIndex, shopName, shopDesc, contactName, contactPhone, businessLicense, shopImages, idFront, idBack } = this.data;
    
    let canSubmit = false;
    if (merchantType === 'student') {
      canSubmit = categoryIndex >= 0 && 
                  shopName.trim() && 
                  shopDesc.trim() && 
                  contactName.trim() && 
                  contactPhone.trim() && 
                  shopImages.length > 0 && 
                  idFront && 
                  idBack;
    } else if (merchantType === 'formal') {
      canSubmit = categoryIndex >= 0 && 
                  shopName.trim() && 
                  shopDesc.trim() && 
                  contactName.trim() && 
                  contactPhone.trim() && 
                  businessLicense && 
                  shopImages.length > 0 && 
                  idFront && 
                  idBack;
    }
    
    this.setData({ canSubmit });
  },

  submitApply() {
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请填写完整申请信息', icon: 'none' });
      return;
    }

    if (!this.validatePhone(this.data.contactPhone)) {
      wx.showToast({ title: '请输入正确的手机号码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中..' });

    const data = {
      merchantType: this.data.merchantType,
      category: this.data.categories[this.data.categoryIndex],
      shopName: this.data.shopName.trim(),
      shopDesc: this.data.shopDesc.trim(),
      contactName: this.data.contactName.trim(),
      contactPhone: this.data.contactPhone.trim(),
      shopImages: this.data.shopImages,
      idFront: this.data.idFront,
      idBack: this.data.idBack
    };

    if (this.data.merchantType === 'formal') {
      data.businessLicense = this.data.businessLicense;
    }

    wx.cloud.callFunction({
      name: 'applyMerchant',
      data,
      success: () => {
        wx.hideLoading();
        this.setData({ status: 'pending' });
        wx.showToast({ title: '提交成功', icon: 'success' });
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ status: 'pending' });
        wx.showToast({ title: '提交成功', icon: 'success' });
      }
    });
  },

  reApply() {
    this.setData({ 
      status: '',
      merchantType: '',
      categoryIndex: -1,
      canSubmit: false
    });
  },

  navigateToMerchant() {
    wx.navigateTo({ url: '../merchant/merchant' });
  }
});
