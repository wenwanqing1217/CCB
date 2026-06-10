const mockDonationItems = [
  {
    _id: '1',
    title: '闲置书籍一批',
    description: '捐赠一批闲置书籍，包括小说、教材等，希望能帮助到有需要的同学',
    images: ['https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png'],
    userId: 'user1',
    userName: '小明',
    userAvatar: 'https://img.zcool.cn/community/01c7a57e4a6fa0000018c1b6e8f91a.jpg@1280w_1l_2o_100sh.jpg',
    category: 'book',
    location: '中园公寓',
    status: 'pending',
    statusText: '待领取'
  },
  {
    _id: '2',
    title: '全新数码配件',
    description: '捐赠一些全新的数码配件，包括数据线、充电器等',
    images: ['https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'],
    userId: 'user2',
    userName: '小红',
    userAvatar: 'https://img.zcool.cn/community/01b7a57e4a6fa0000018c1ba2902b.jpg@1280w_1l_2o_100sh.jpg',
    category: 'daily',
    location: '苏园居',
    status: 'claimed',
    statusText: '已领取'
  },
  {
    _id: '3',
    title: '生活用品',
    description: '捐赠一些生活用品，包括洗发水、沐浴露等',
    images: ['https://img.zcool.cn/community/014c7a57e4a6fa0000018c1b4a2c3d.png@1280w_1l_2o_100sh.png'],
    userId: 'user3',
    userName: '小张',
    userAvatar: 'https://img.zcool.cn/community/01a7a57e4a6fa0000018c1bdc13cc.jpg@1280w_1l_2o_100sh.jpg',
    category: 'tech',
    location: '中南公寓',
    status: 'pending',
    statusText: '待领取'
  }
];

Page({
  data: {
    activeCategory: 'all',
    donationItems: [],
    stats: {
      total: 128,
      users: 86,
      today: 5
    },
    loading: true,
    hasMore: true,
    page: 1
  },

  onLoad() {
    this.loadDonationItems();
    this.loadStats();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, donationItems: [] });
    this.loadDonationItems();
    this.loadStats();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  setCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category, page: 1, donationItems: [] });
    this.loadDonationItems();
  },

  loadStats() {
    const that = this;
    wx.cloud.callFunction({
      name: 'getDonationStats',
      success: res => {
        if (res.result) {
          that.setData({ stats: res.result });
        }
      },
      fail: () => {
        that.setData({
          stats: { total: 128, users: 86, today: 5 }
        });
      }
    });
  },

  loadDonationItems() {
    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'getDonationItems',
      data: {
        category: this.data.activeCategory,
        page: this.data.page
      },
      success: res => {
        if (res.result && res.result.length > 0) {
          this.setData({
            donationItems: res.result,
            hasMore: res.result.length === 10,
            loading: false
          });
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
    let items = mockDonationItems;
    if (this.data.activeCategory !== 'all') {
      items = mockDonationItems.filter(item => item.category === this.data.activeCategory);
    }
    this.setData({
      donationItems: items,
      loading: false,
      hasMore: false
    });
  },

  loadMore() {
    this.setData({ loading: true, page: this.data.page + 1 });
    this.loadDonationItems();
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `../box-detail/box-detail?id=${id}` });
  },

  navigateToPublish() {
    wx.switchTab({ url: '../box-publish/box-publish' });
  }
});