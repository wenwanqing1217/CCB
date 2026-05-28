Page({
  data: {
    item: null,
    isFollowing: false,
    isFavorite: false,
    matchedItems: [],
    exchangeRecords: []
  },

  onLoad(options) {
    this.loadDetail(options.id);
  },

  loadDetail(id) {
    wx.cloud.callFunction({
      name: 'getExchangeDetail',
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
        wantItem: '蓝牙耳机',
        haveItem: '机械键盘',
        images: ['https://img.zcool.cn/community/014c7a57e4a6fa0000018c1b4a2c3d.png@1280w_1l_2o_100sh.png'],
        description: '想换一个蓝牙耳机，键盘是樱桃轴的，手感很好，9成新',
        category: '电子产品',
        condition: '9成新',
        location: '中园公寓',
        deliveryFee: 3,
        tags: ['电子产品', '耳机', '键盘'],
        userAvatar: 'https://img.zcool.cn/community/01c7a57e4a6fa0000018c1b6e8f91a.jpg@1280w_1l_2o_100sh.jpg',
        userName: '小明',
        school: '北京大学',
        status: 'pending',
        statusText: '待交换',
        createTime: '2小时前'
      },
      matchedItems: [
        { _id: '2', wantItem: '机械键盘', haveItem: '蓝牙耳机', matchRate: 95 }
      ]
    });
  },

  followUser() {
    this.setData({ isFollowing: !this.data.isFollowing });
    wx.showToast({
      title: this.data.isFollowing ? '关注成功' : '取消关注',
      icon: 'success'
    });
  },

  toggleFavorite() {
    this.setData({ isFavorite: !this.data.isFavorite });
    wx.showToast({
      title: this.data.isFavorite ? '收藏成功' : '取消收藏',
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

  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `../exchangeDetail/exchangeDetail?id=${id}` });
  },

  applyExchange() {
    if (this.data.item.status !== 'pending') {
      return;
    }

    wx.showModal({
      title: '申请交换',
      content: '确定要申请这个交换吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '申请中..' });
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '申请成功', icon: 'success' });
          }, 800);
        }
      }
    });
  }
});