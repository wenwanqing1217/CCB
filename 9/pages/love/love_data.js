// 盲盒商品数据 - 使用在线图片
const blindBoxesData = [
  {
    _id: '1',
    title: '神秘电子产品盲盒',
    category: 'electronics',
    categoryName: '电子产品',
    description: '内含各种电子产品，可能开出蓝牙耳机、充电宝、数据线、手机支架等实用物品。每个盲盒至少包含3件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600'
    ],
    price: 29.9,
    originalPrice: 89.9,
    stock: 23,
    campus: '东区',
    userName: '科技达人',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    rating: 4.9,
    sellerCount: 8,
    viewCount: 1258,
    likeCount: 89,
    commentCount: 23
  },
  {
    _id: '2',
    title: '校园生活盲盒',
    category: 'life',
    categoryName: '生活用品',
    description: '内含各种校园生活用品，可能开出保温杯、台灯、收纳盒、文具等实用物品。每个盲盒至少包含3件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
      'https://images.unsplash.com/photo-1516961642265-531546e84af2?w=600',
      'https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?w=600'
    ],
    price: 19.9,
    originalPrice: 59.9,
    stock: 15,
    campus: '西区',
    userName: '生活家',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    rating: 4.7,
    sellerCount: 5,
    viewCount: 892,
    likeCount: 67,
    commentCount: 15
  },
  {
    _id: '3',
    title: '学习资料盲盒',
    category: 'study',
    categoryName: '学习资料',
    description: '内含各种学习资料，可能开出考研资料、四六级资料、专业课笔记、参考书等。每个盲盒至少包含3件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600'
    ],
    price: 24.9,
    originalPrice: 79.9,
    stock: 30,
    campus: '南区',
    userName: '学霸君',
    userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=200',
    rating: 4.8,
    sellerCount: 12,
    viewCount: 1567,
    likeCount: 123,
    commentCount: 34
  },
  {
    _id: '4',
    title: '运动装备盲盒',
    category: 'sports',
    categoryName: '运动装备',
    description: '内含各种运动装备，可能开出羽毛球拍、篮球、跳绳、运动护具等。每个盲盒至少包含3件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600',
      'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=600',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600'
    ],
    price: 39.9,
    originalPrice: 119.9,
    stock: 18,
    campus: '北区',
    userName: '运动达人',
    userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200',
    rating: 4.6,
    sellerCount: 6,
    viewCount: 987,
    likeCount: 76,
    commentCount: 21
  },
  {
    _id: '5',
    title: '时尚配饰盲盒',
    category: 'fashion',
    categoryName: '时尚配饰',
    description: '内含各种时尚配饰，可能开出耳环、项链、手链、发饰等。每个盲盒至少包含3件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600'
    ],
    price: 29.9,
    originalPrice: 99.9,
    stock: 25,
    campus: '中区',
    userName: '时尚博主',
    userAvatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200',
    rating: 4.9,
    sellerCount: 9,
    viewCount: 1890,
    likeCount: 156,
    commentCount: 45
  },
  {
    _id: '6',
    title: '文具用品盲盒',
    category: 'study',
    categoryName: '学习资料',
    description: '内含各种文具用品，可能开出笔、笔记本、便利贴、文件夹等。每个盲盒至少包含5件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600',
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600'
    ],
    price: 14.9,
    originalPrice: 49.9,
    stock: 40,
    campus: '东区',
    userName: '文具控',
    userAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
    rating: 4.5,
    sellerCount: 7,
    viewCount: 1345,
    likeCount: 98,
    commentCount: 28
  },
  {
    _id: '7',
    title: '创意电子产品盲盒',
    category: 'electronics',
    categoryName: '电子产品',
    description: '内含各种创意电子产品，可能开出智能手环、蓝牙音箱、无线充电器等。每个盲盒至少包含2件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600',
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'
    ],
    price: 39.9,
    originalPrice: 129.9,
    stock: 12,
    campus: '西区',
    userName: '科技达人',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    rating: 4.8,
    sellerCount: 4,
    viewCount: 2100,
    likeCount: 189,
    commentCount: 56
  },
  {
    _id: '8',
    title: '健身装备盲盒',
    category: 'sports',
    categoryName: '运动装备',
    description: '内含各种健身装备，可能开出瑜伽垫、哑铃、弹力带、健身手套等。每个盲盒至少包含3件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600'
    ],
    price: 49.9,
    originalPrice: 149.9,
    stock: 10,
    campus: '南区',
    userName: '健身教练',
    userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200',
    rating: 4.7,
    sellerCount: 3,
    viewCount: 1567,
    likeCount: 134,
    commentCount: 42
  },
  {
    _id: '9',
    title: '美妆护肤盲盒',
    category: 'fashion',
    categoryName: '时尚配饰',
    description: '内含各种美妆护肤产品，可能开出面膜、口红、眼影盘、护肤品等。每个盲盒至少包含3件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600'
    ],
    price: 59.9,
    originalPrice: 199.9,
    stock: 8,
    campus: '北区',
    userName: '美妆达人',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    rating: 4.8,
    sellerCount: 5,
    viewCount: 2345,
    likeCount: 267,
    commentCount: 89
  },
  {
    _id: '10',
    title: '宿舍神器盲盒',
    category: 'life',
    categoryName: '生活用品',
    description: '内含各种宿舍神器，可能开出床上桌、台灯、收纳架、挂钩等。每个盲盒至少包含3件物品，价值远超价格！',
    images: [
      'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600',
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'
    ],
    price: 34.9,
    originalPrice: 109.9,
    stock: 20,
    campus: '中区',
    userName: '宿舍改造家',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    rating: 4.6,
    sellerCount: 6,
    viewCount: 1789,
    likeCount: 145,
    commentCount: 38
  }
];

module.exports = {
  blindBoxesData
};
