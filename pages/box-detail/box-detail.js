// 抖音风格商品详情页 - 支持上下滑动切换商品

// 模拟商品数据列表
// 使用共享数据层，替代原有的硬编码 mockProductList
const { boxes, getBoxById } = require('../../data/mock-data.js');
const mockProductList = boxes;;

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
      } else {
        // ID 不在列表中时显示第一个
        console.warn('未找到商品:', productId, '显示默认商品');
        this.setData({ currentIndex: 0 });
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
      title: '确认购买',
      content: '确认购买此盲盒？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '支付成功！', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
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
      avatar: '/images/blindbox/life_2_2.jpg',
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
      title: '确认购买',
      content: '确认购买此盲盒？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '支付成功！', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        }
      }
    });
  }
});
