Page({
  data: {
    targetImage: '',
    targetTitle: '',
    reportTypes: [
      { icon: '举报', label: '违法违规', value: 'illegal' },
      { icon: '价格', label: '价格欺诈', value: 'price' },
      { icon: '假货', label: '虚假宣传', value: 'fake' },
      { icon: '冒充', label: '冒充他人', value: 'impersonate' },
      { icon: '骚扰', label: '骚扰/辱骂', value: 'harassment' },
      { icon: '其他', label: '其他问题', value: 'other' }
    ],
    activeType: '',
    description: '',
    images: [],
    canSubmit: false
  },

  onLoad(options) {
    if (options.targetImage) {
      this.setData({ targetImage: decodeURIComponent(options.targetImage) });
    }
    if (options.targetTitle) {
      this.setData({ targetTitle: decodeURIComponent(options.targetTitle) });
    }
  },

  setType(e) {
    this.setData({ activeType: e.currentTarget.dataset.type });
    this.checkCanSubmit();
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
    this.checkCanSubmit();
  },

  addImage() {
    const that = this;
    wx.chooseMedia({
      count: 9 - that.data.images.length,
      mediaType: ['image'],
      success: res => {
        const newImages = res.tempFiles.map(file => file.tempFilePath);
        that.setData({
          images: [...that.data.images, ...newImages]
        });
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  checkCanSubmit() {
    const canSubmit = this.data.activeType && this.data.description.trim().length >= 10;
    this.setData({ canSubmit });
  },

  submitReport() {
    if (!this.data.canSubmit) {
      return;
    }

    wx.showLoading({ title: '提交中..' });

    wx.cloud.callFunction({
      name: 'submitReport',
      data: {
        type: this.data.activeType,
        description: this.data.description,
        images: this.data.images
      },
      success: () => {
        wx.hideLoading();
        wx.showToast({ title: '举报成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '举报成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    });
  }
});