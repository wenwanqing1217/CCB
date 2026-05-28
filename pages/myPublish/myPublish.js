Page({
  data: {
    boxes: [],
    activeStatus: 'all',
    loading: true
  },

  onLoad() {
    this.loadBoxes();
  },

  onShow() {
    this.loadBoxes();
  },

  onPullDownRefresh() {
    this.loadBoxes();
  },

  setStatus(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ activeStatus: status, boxes: [] });
    this.loadBoxes();
  },

  loadBoxes() {
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'getMyBoxes',
      data: { status: this.data.activeStatus },
      success: res => {
        if (res.result) {
          this.setData({ boxes: res.result, loading: false });
        } else {
          this.useMockData();
        }
        wx.stopPullDownRefresh();
      },
      fail: () => {
        this.useMockData();
        wx.stopPullDownRefresh();
      }
    });
  },

  useMockData() {
    const campusData = require('../../utils/campusData.js');
    const mockBoxes = campusData.getDemoHotBoxes().map(box => ({
      ...box,
      status: 'active',
      statusText: '在售'
    }));
    this.setData({
      boxes: mockBoxes,
      loading: false
    });
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '../box-detail/box-detail?id=' + id });
  },

  editBox(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '../box-publish/box-publish?id=' + id + '&mode=edit' });
  },

  offlineBox(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认下架',
      content: '确定要下架这个盲盒吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '下架成功', icon: 'success' });
          this.loadBoxes();
        }
      }
    });
  },

  navigateToPublish() {
    wx.switchTab({ url: '../box-publish/box-publish' });
  }
});
