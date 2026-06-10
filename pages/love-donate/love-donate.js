// 爱心捐赠列表页面

const mockDonationItems = [
  {
    _id: '1',
    title: '闲置书籍一批',
    description: '捐赠一批闲置书籍，包括小说、教材等，希望能帮助到有需要的同学',
    images: ['/images/blindbox/electronics_0_0.jpg'],
    userId: 'user1',
    userName: '小明',
    userAvatar: '/images/blindbox/fashion_0_0.jpg',
    category: 'book',
    location: '中园公寓',
    status: 'pending',
    statusText: '待领取',
    lovePoints: 10,
    createTime: '2024-01-15'
  },
  {
    _id: '2',
    title: '全新数码配件',
    description: '捐赠一些全新的数码配件，包括数据线、充电器等',
    images: ['/images/blindbox/fashion_1_1.jpg'],
    userId: 'user2',
    userName: '小红',
    userAvatar: '/images/blindbox/study_0_0.jpg',
    category: 'electronics',
    location: '苏园居',
    status: 'pending',
    statusText: '待领取',
    lovePoints: 15,
    createTime: '2024-01-14'
  },
  {
    _id: '3',
    title: '生活用品套装',
    description: '捐赠一些生活用品，包括洗发水、沐浴露等',
    images: ['/images/blindbox/study_1_1.jpg'],
    userId: 'user3',
    userName: '小张',
    userAvatar: '/images/blindbox/sports_0_0.jpg',
    category: 'daily',
    location: '中南公寓',
    status: 'claimed',
    statusText: '已领取',
    lovePoints: 8,
    createTime: '2024-01-13'
  },
  {
    _id: '4',
    title: '考研资料全套',
    description: '考研结束，资料免费赠送，包含各科笔记和真题',
    images: ['/images/blindbox/electronics_0_0.jpg'],
    userId: 'user4',
    userName: '小李',
    userAvatar: '/images/blindbox/fashion_0_0.jpg',
    category: 'book',
    location: '新柏居',
    status: 'pending',
    statusText: '待领取',
    lovePoints: 20,
    createTime: '2024-01-12'
  },
  {
    _id: '5',
    title: '闲置衣物',
    description: '一些闲置的衣物， mostly 9成新，适合女生',
    images: ['/images/blindbox/fashion_1_1.jpg'],
    userId: 'user5',
    userName: '小王',
    userAvatar: '/images/blindbox/study_0_0.jpg',
    category: 'other',
    location: '中园公寓',
    status: 'pending',
    statusText: '待领取',
    lovePoints: 12,
    createTime: '2024-01-11'
  }
];

Page({
  data: {
    activeFilter: 'all',
    donationItems: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    limit: 10
  },

  onLoad() {
    this.loadDonationItems();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, donationItems: [] });
    this.loadDonationItems();
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ 
      activeFilter: filter, 
      page: 1, 
      donationItems: [],
      hasMore: true
    });
    this.loadDonationItems();
  },

  loadDonationItems() {
    this.setData({ loading: true });
    
    // 模拟网络请求
    setTimeout(() => {
      let items = mockDonationItems;
      
      // 根据分类筛选
      if (this.data.activeFilter !== 'all') {
        items = mockDonationItems.filter(item => item.category === this.data.activeFilter);
      }
      
      this.setData({
        donationItems: items,
        loading: false,
        hasMore: false
      });
      
      wx.stopPullDownRefresh();
    }, 500);
  },

  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    
    this.setData({ loadingMore: true });
    
    setTimeout(() => {
      this.setData({
        loadingMore: false,
        hasMore: false
      });
    }, 500);
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../box-detail/box-detail?id=${id}`
    });
  },

  navigateToPublish() {
    wx.switchTab({
      url: '../box-publish/box-publish'
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
