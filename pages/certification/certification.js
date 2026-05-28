Page({
  data: {
    realName: '',
    school: '武汉生物工程学院',
    studentId: '',
    phone: '',
    verifyCode: '',
    codeSent: false,
    countdown: 0,
    studentCard: '',
    canSubmit: false,
    status: ''
  },

  onNameInput(e) {
    this.setData({ realName: e.detail.value });
    this.checkCanSubmit();
  },


  onStudentIdInput(e) {
    this.setData({ studentId: e.detail.value });
    this.checkCanSubmit();
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
    this.checkCanSubmit();
  },

  onCodeInput(e) {
    this.setData({ verifyCode: e.detail.value });
    this.checkCanSubmit();
  },

  sendCode() {
    if (this.data.codeSent || !this.data.phone) {
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号码', icon: 'none' });
      return;
    }

    this.setData({ codeSent: true, countdown: 60 });
    
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({ codeSent: false, countdown: 0 });
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);

    wx.showToast({ title: '验证码已发送', icon: 'success' });
  },

  uploadStudentCard() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: res => {
        that.setData({ studentCard: res.tempFiles[0].tempFilePath });
        that.checkCanSubmit();
      }
    });
  },

  removeStudentCard() {
    this.setData({ studentCard: '' });
    this.checkCanSubmit();
  },

  checkCanSubmit() {
    const { realName, school, studentId, phone, verifyCode, studentCard } = this.data;
    const canSubmit = realName.trim() && school && studentId.trim() && phone.trim() && verifyCode.trim() && studentCard;
    this.setData({ canSubmit });
  },

  submitCertification() {
    if (!this.data.canSubmit) {
      return;
    }

    wx.showLoading({ title: '提交中..' });

    const data = {
      realName: this.data.realName.trim(),
      school: this.data.school,
      studentId: this.data.studentId.trim(),
      phone: this.data.phone.trim(),
      studentCard: this.data.studentCard
    };

    wx.cloud.callFunction({
      name: 'userService',
      data: {
        action: 'submitCertification',
        data
      },
      success: (res) => {
        wx.hideLoading();
        const result = res.result || {};
        if (result.success) {
          this.setData({ status: 'pending' });
          wx.showToast({ title: '提交成功', icon: 'success' });
        } else {
          wx.showToast({ title: result.message || '提交失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
      }
    });
  }
});