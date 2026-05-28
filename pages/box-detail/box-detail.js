// 抖音风格商品详情页 - 支持上下滑动切换商品

// 模拟商品数据列表
const mockProductList = [
  {
    _id: '2',
    title: '精美文具套装盲盒',
    price: 14.9,
    images: [
      'https://picsum.photos/600/600?random=11',
      'https://picsum.photos/600/600?random=12'
    ],
    type: 'original',
    mode: 'light',
    campus: '苏园居',
    building: '3层',
    desc: '笔、本子、尺子、橡皮等文具一应俱全，学习必备良品！',
    likes: 86,
    comments: 18,
    favorites: 42,
    liked: false,
    favorited: false,
    isFollowing: false,
    commentList: [
      { _id: '1', user: '小王', avatar: 'https://picsum.photos/100/100?random=20', content: '文具质量很好，本子超好看', time: '3小时前' },
      { _id: '2', user: '小张', avatar: 'https://picsum.photos/100/100?random=21', content: '送给朋友的，她很喜欢', time: '2小时前' }
    ],
    publisher: {
      name: '李四',
      avatar: 'https://picsum.photos/100/100?random=22',
      rating: 4.9
    },
    fromDorm: '苏园居',
    sales: 189
  },
  {
    _id: '3',
    title: '时尚服饰盲盒',
    price: 19.9,
    images: [
      'https://picsum.photos/600/600?random=13',
      'https://picsum.photos/600/600?random=14'
    ],
    type: 'secondhand',
    mode: 'dark',
    campus: '中南公寓',
    building: '2层',
    desc: 'T恤、袜子、帽子等时尚单品，潮流穿搭从这里开始！',
    likes: 215,
    comments: 45,
    favorites: 89,
    liked: false,
    favorited: false,
    isFollowing: false,
    commentList: [
      { _id: '1', user: '小陈', avatar: 'https://picsum.photos/100/100?random=23', content: '衣服质量超好，款式也很潮', time: '5小时前' },
      { _id: '2', user: '小刘', avatar: 'https://picsum.photos/100/100?random=24', content: '帽子太喜欢了，正好是我想要的款式', time: '4小时前' },
      { _id: '3', user: '小赵', avatar: 'https://picsum.photos/100/100?random=25', content: '性价比无敌，已经推荐给室友了', time: '3小时前' }
    ],
    publisher: {
      name: '王五',
      avatar: 'https://picsum.photos/100/100?random=26',
      rating: 4.7
    },
    fromDorm: '中南公寓',
    sales: 312
  },
  {
    _id: '4',
    title: '图书盲盒',
    price: 12.9,
    images: [
      'https://picsum.photos/600/600?random=15',
      'https://picsum.photos/600/600?random=16'
    ],
    type: 'original',
    mode: 'light',
    campus: '中园公寓',
    building: '1层',
    desc: '小说、教材、课外书等，知识的海洋等着你探索！',
    likes: 42,
    comments: 12,
    favorites: 28,
    liked: false,
    favorited: false,
    isFollowing: false,
    commentList: [
      { _id: '1', user: '小孙', avatar: 'https://picsum.photos/100/100?random=27', content: '图书质量很好，内容丰富', time: '7小时前' },
      { _id: '2', user: '小周', avatar: 'https://picsum.photos/100/100?random=28', content: '正好需要，性价比很高', time: '6小时前' }
    ],
    publisher: {
      name: '钱七',
      avatar: 'https://picsum.photos/100/100?random=29',
      rating: 4.8
    },
    fromDorm: '中园公寓',
    sales: 128
  },
  {
    _id: '5',
    title: '零食大礼包盲盒',
    price: 29.9,
    images: [
      'https://picsum.photos/600/600?random=17',
      'https://picsum.photos/600/600?random=18'
    ],
    type: 'original',
    mode: 'light',
    campus: '新柏居',
    building: '5层',
    desc: '各种网红零食、进口美食，满足你的味蕾！',
    likes: 342,
    comments: 78,
    favorites: 156,
    liked: false,
    favorited: false,
    isFollowing: false,
    commentList: [
      { _id: '1', user: '小林', avatar: 'https://picsum.photos/100/100?random=30', content: '零食种类超多，每一个都很好吃', time: '4小时前' },
      { _id: '2', user: '小黄', avatar: 'https://picsum.photos/100/100?random=31', content: '性价比超级高，宿舍必备！', time: '3小时前' },
      { _id: '3', user: '小朱', avatar: 'https://picsum.photos/100/100?random=32', content: '都是很火的零食，强烈推荐！', time: '2小时前' },
      { _id: '4', user: '小何', avatar: 'https://picsum.photos/100/100?random=33', content: '已经回购第三次了！', time: '1小时前' }
    ],
    publisher: {
      name: '孙八',
      avatar: 'https://picsum.photos/100/100?random=34',
      rating: 5.0
    },
    fromDorm: '新柏居',
    sales: 478
  }
];

Page({
  data: {
    currentIndex: 0,
    productList: [],
    box: null,
    currentImageIndex: 0,
    showPopup: false,
    isSwiperAnimating: false
  },

  onLoad(options) {
    console.log('🔗 详情页接收到的参数:', options);
    this.initData(options);
  },

  onShareAppMessage() {
    const box = this.data.box;
    return {
      title: box ? `${box.title} - ¥${box.price}` : '发现一个好东西',
      path: '/pages/box-detail/box-detail'
    };
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  initData(options) {
    const productId = options.id;
    console.log('📦 商品ID:', productId);

    this.setData({ productList: mockProductList });

    if (productId) {
      const index = mockProductList.findIndex(p => p._id === productId);
      if (index !== -1) {
        this.setData({ currentIndex: index });
      }
    }

    this.updateCurrentProduct();
  },

  updateCurrentProduct() {
    const box = this.data.productList[this.data.currentIndex];
    console.log('📦 当前商品:', box);
    this.setData({
      box: box,
      currentImageIndex: 0
    });
  },

  onImageChange(e) {
    this.setData({ currentImageIndex: e.detail.current });
  },

  onSwiperChange(e) {
    if (this.data.isSwiperAnimating) {
      return;
    }
    this.setData({ isSwiperAnimating: true, currentIndex: e.detail.current });
    this.updateCurrentProduct();
    setTimeout(() => this.setData({ isSwiperAnimating: false }), 300);
  },

  toggleLike() {
    const box = this.data.box;
    if (!box) {
      return;
    }

    const newLiked = !box.liked;
    const newLikes = box.likes + (newLiked ? 1 : -1);

    box.liked = newLiked;
    box.likes = newLikes;

    this.updateProductInList(box);
    wx.showToast({
      title: newLiked ? '已点赞' : '已取消',
      icon: 'none'
    });
  },

  toggleFavorite() {
    const box = this.data.box;
    if (!box) {
      return;
    }

    const newFavorited = !box.favorited;
    const newFavorites = box.favorites + (newFavorited ? 1 : -1);

    box.favorited = newFavorited;
    box.favorites = newFavorites;

    this.updateProductInList(box);
    wx.showToast({
      title: newFavorited ? '已收藏' : '已取消收藏',
      icon: 'none'
    });
  },

  toggleFollow() {
    const box = this.data.box;
    if (!box) {
      return;
    }

    box.isFollowing = !box.isFollowing;
    this.updateProductInList(box);
    wx.showToast({
      title: box.isFollowing ? '已关注' : '已取消关注',
      icon: 'none'
    });
  },

  updateProductInList(updatedBox) {
    const list = [...this.data.productList];
    list[this.data.currentIndex] = updatedBox;
    this.setData({ productList: list, box: updatedBox });
  },

  buyNow() {
    wx.showModal({
      title: '购买提示',
      content: '功能开发中，敬请期待~',
      showCancel: false
    });
  },

  showCommentPopup() {
    this.setData({ showPopup: true });
  },

  closePopup() {
    this.setData({ showPopup: false });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  submitComment() {
    const input = this.data.commentInput?.trim();
    if (!input) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    const box = this.data.box;
    const newComment = {
      _id: Date.now().toString(),
      user: '我',
      avatar: 'https://picsum.photos/100/100?random=35',
      content: input,
      time: '刚刚'
    };

    box.commentList = [newComment, ...box.commentList];
    box.comments = (box.comments || 0) + 1;

    this.updateProductInList(box);
    this.setData({ commentInput: '', showPopup: false });
    wx.showToast({ title: '评论成功', icon: 'success' });
  },

  buyBox() {
    wx.showModal({
      title: '购买提示',
      content: '功能开发中，敬请期待~',
      showCancel: false
    });
  }
});
