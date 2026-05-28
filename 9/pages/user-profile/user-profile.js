// 用户主页页面
Page({
  data: {
    userId: null,
    userInfo: null,
    userStats: null,
    userBoxes: [],
    userDonations: [],
    isFollowing: false,
    loading: true
  },

  onLoad(options) {
    const userId = options.userId || '1'
    this.setData({ userId })
    
    // 加载用户信息
    this.loadUserInfo()
    
    // 加载用户统计数据
    this.loadUserStats()
    
    // 加载用户发布的盲盒
    this.loadUserBoxes()
    
    // 加载用户的捐赠记录
    this.loadUserDonations()
  },

  // 加载用户信息
  loadUserInfo() {
    // 模拟加载用户信息
    setTimeout(() => {
      const userInfo = {
        id: this.data.userId,
        name: this.data.userId === '1' ? '小明' : '小红',
        avatar: this.data.userId === '1' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        college: '计算机学院',
        dorm: '东区1号楼',
        vipLevel: 2,
        vipName: '银卡会员',
        isCertified: true,
        isRider: true,
        isMerchant: false
      }
      
      this.setData({ userInfo })
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: userInfo.name
      })
    }, 500)
  },

  // 加载用户统计数据
  loadUserStats() {
    // 模拟加载用户统计数据
    setTimeout(() => {
      const userStats = {
        publish: 12,
        sold: 8,
        bought: 5,
        score: 230
      }
      this.setData({ userStats })
    }, 600)
  },

  // 加载用户发布的盲盒
  loadUserBoxes() {
    // 模拟加载用户发布的盲盒
    setTimeout(() => {
      const userBoxes = [
        {
          _id: '1',
          title: '全新数码配件盲盒',
          images: ['https://images.unsplash.com/photo-1550009158-9ebf69056955?w=400&h=400&fit=crop'],
          price: 9.9,
          sales: 32,
          likes: 15,
          comments: 5,
          status: 'selling'
        },
        {
          _id: '2',
          title: '精美文具套装',
          images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop'],
          price: 14.9,
          sales: 18,
          likes: 8,
          comments: 2,
          status: 'sold'
        },
        {
          _id: '3',
          title: '时尚服饰盲盒',
          images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop'],
          price: 19.9,
          sales: 5,
          likes: 3,
          comments: 1,
          status: 'selling'
        }
      ]
      this.setData({ userBoxes })
      this.setData({ loading: false })
    }, 700)
  },

  // 加载用户的捐赠记录
  loadUserDonations() {
    // 模拟加载用户的捐赠记录
    setTimeout(() => {
      const userDonations = [
        {
          _id: '1',
          title: '闲置书籍一批',
          image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop',
          time: '2024-01-15',
          status: 'completed'
        },
        {
          _id: '2',
          title: '旧衣物捐赠',
          image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop',
          time: '2024-01-10',
          status: 'completed'
        }
      ]
      this.setData({ userDonations })
    }, 800)
  },

  // 关注/取消关注
  toggleFollow() {
    const isFollowing = !this.data.isFollowing
    this.setData({ isFollowing })
    
    wx.showToast({
      title: isFollowing ? '已关注' : '已取消关注',
      icon: 'none',
      duration: 800
    })
  },

  // 联系用户
  contactUser() {
    if (!this.data.userInfo) return
    
    wx.navigateTo({
      url: `../chat/chat?userId=${this.data.userInfo.id}&userName=${this.data.userInfo.name}&userAvatar=${this.data.userInfo.avatar}`
    })
  },

  // 查看盲盒详情
  viewBoxDetail(e) {
    const boxId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `../box-detail/box-detail?id=${boxId}`
    })
  },

  // 查看捐赠详情
  viewDonationDetail(e) {
    const donationId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `../donationDetail/donationDetail?id=${donationId}`
    })
  }
})
