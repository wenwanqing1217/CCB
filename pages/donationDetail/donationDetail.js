Page({
  data: {
    item: null,
    isFollowing: false,
    isFavorite: false,
    delivery: null,
    similarItems: []
  },

  onLoad(options) {
    this.loadDetail(options.id);
  },

  loadDetail(id) {
    wx.cloud.callFunction({
      name: 'getDonationDetail',
      data: { id },
      success: res => {
        if (res.result) {
          this.setData({ item: res.result });
        } else {
          this.useMockData();
        }
      },
      fail: () => {
        this.useMockData();
      }
    });
  },

  useMockData() {
    this.setData({
      item: {
        _id: '1',
        title: '闲置书籍一批',
        images: [
          '/images/blindbox/electronics_0_0.jpg',
          '/images/blindbox/fashion_0_0.jpg'
        ],
        description: '整理宿舍发现很多书没地方放，都是很好的书，希望送给有需要的同学。包括高等数学、大学英语、计算机基础等教材，都是八成新以上。',
        category: '图书',
        condition: '八成新',
        location: '中园公寓',
        deliveryFee: 1,
        tags: ['图书', '学习', '教材'],
        userAvatar: '/images/blindbox/fashion_1_1.jpg',
        userName: '小明',
        status: 'pending',
        statusText: '待领取',
        createTime: '2024-01-15'
      },
      similarItems: [
        { _id: '2', images: ['/images/blindbox/study_0_0.jpg'], title: '文具套装', location: '中南公寓' },
        { _id: '3', images: ['/images/blindbox/study_1_1.jpg'], title: '台灯', location: '新柏居' },
        { _id: '4', images: ['/images/blindbox/sports_0_0.jpg'], title: '收纳盒', location: '清水居' }
      ]
    });
  },

  followUser() {
    this.setData({ isFollowing: !this.data.isFollowing });
    wx.showToast({
      title: this.data.isFollowing ? '已关注' : '已取消关注',
      icon: 'success'
    });
  },

  toggleFavorite() {
    this.setData({ isFavorite: !this.data.isFavorite });
    wx.showToast({
      title: this.data.isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.item.images[index],
      urls: this.data.item.images
    });
  },

  navigateToChat() {
    wx.navigateTo({ url: '../chat/chat' });
  },

  navigateToDonation() {
    wx.navigateTo({ url: '/pages/love/love' });
  },

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '../box-detail/box-detail?id=' + id });
  },

  claimDonation() {
    if (this.data.item.status !== 'pending') {
      return;
    }

    wx.showModal({
      title: '认领物品',
      content: '确定要认领该物品吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' });
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '认领成功', icon: 'success' });
            this.setData({
              'item.status': 'claimed',
              'item.statusText': '已认领'
            });
          }, 800);
        }
      }
    });
  }
});
