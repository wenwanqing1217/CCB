Page({
  data: {},

  onLoad() {},

  copyEmail() {
    wx.setClipboardData({
      data: 'contact@cbb-campus.com',
      success: () => {
        wx.showToast({ title: '复制成功', icon: 'success' });
      }
    });
  }
});