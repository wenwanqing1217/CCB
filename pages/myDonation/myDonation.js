const mockDonations = [
  {
    _id: '1',
    title: '书籍套装',
    images: ['https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png'],
    description: '一套教材',
    from_dorm: '中园公寓',
    status: 'completed',
    statusText: '已完成',
    createTime: '2024-01-15'
  },
  {
    _id: '2',
    title: '文具套装',
    images: ['https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'],
    description: '全新文具用品',
    from_dorm: '苏园居',
    status: 'pending',
    statusText: '待处理',
    createTime: '2024-01-18'
  }
];

Page({
  data: {
    donations: [],
    activeTab: 'sent',
    stats: {
      total: 5,
      completed: 3,
      pending: 2
    }
  },

  onLoad() {
    this.loadDonations();
  },

  onShow() {
    this.loadDonations();
  },

  loadDonations() {
    wx.cloud.callFunction({
      name: 'getMyDonations',
      data: { type: this.data.activeTab },
      success: res => {
        if (res.result && res.result.length > 0) {
          this.setData({ donations: res.result });
        } else {
          this.useLocalData();
        }
      },
      fail: () => {
        this.useLocalData();
      }
    });
  },

  useLocalData() {
    this.setData({ donations: mockDonations });
  },

  setTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    this.loadDonations();
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../box-detail/box-detail?id=${id}`
    });
  }
});
