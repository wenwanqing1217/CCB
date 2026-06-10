/**
 * data/mock-data.js
 * 共享 Mock 数据层 —— 所有页面从此文件获取数据
 * 确保不同页面间通过 _id 查找的数据一致性
 */

// ============================================================
// 1. 盲盒数据（核心数据）
// ============================================================
// ID 命名规范: box_001, box_002 ...
// 所有页面 (love / box-detail / order-confirm / index) 统一使用此数据

const boxes = [
  {
    _id: 'box_001',
    title: '精美文具套装盲盒',
    price: 14.9,
    images: [
      '/images/blindbox/study_0_0.jpg',
      '/images/blindbox/study_0_1.jpg'
    ],
    category: 'study',
    type: 'original',
    mode: 'light',
    campus: '苏园居',
    building: '3层',
    desc: '笔、本子、尺子、橡皮等文具一应俱全，学习必备良品！',
    sales: 189,
    stock: 45,
    likes: 86,
    comments: 18,
    favorites: 42,
    liked: false,
    favorited: false,
    isFollowing: false,
    publisher: { name: '李四', avatar: '/images/blindbox/fashion_0_0.jpg', rating: 4.9 },
    fromDorm: '苏园居',
    commentList: [
      { _id: 'c001', user: '小王', avatar: '/images/blindbox/life_0_0.jpg', content: '文具质量很好，本子超好看', time: '3小时前' },
      { _id: 'c002', user: '小张', avatar: '/images/blindbox/life_1_1.jpg', content: '送给朋友的，她很喜欢', time: '2小时前' }
    ]
  },
  {
    _id: 'box_002',
    title: '时尚服饰盲盒',
    price: 19.9,
    images: [
      '/images/blindbox/fashion_0_0.jpg',
      '/images/blindbox/fashion_0_1.jpg'
    ],
    category: 'fashion',
    type: 'secondhand',
    mode: 'dark',
    campus: '中南公寓',
    building: '2层',
    desc: 'T恤、袜子、帽子等时尚单品，潮流穿搭从这里开始！',
    sales: 312,
    stock: 28,
    likes: 215,
    comments: 45,
    favorites: 89,
    liked: false,
    favorited: false,
    isFollowing: false,
    publisher: { name: '王五', avatar: '/images/blindbox/life_0_0.jpg', rating: 4.7 },
    fromDorm: '中南公寓',
    commentList: [
      { _id: 'c003', user: '小陈', avatar: '/images/blindbox/sports_0_0.jpg', content: '衣服质量超好，款式也很潮', time: '5小时前' },
      { _id: 'c004', user: '小刘', avatar: '/images/blindbox/sports_1_1.jpg', content: '帽子太喜欢了，正好是我想要的款式', time: '4小时前' }
    ]
  },
  {
    _id: 'box_003',
    title: '图书盲盒',
    price: 12.9,
    images: [
      '/images/blindbox/study_0_0.jpg',
      '/images/blindbox/study_1_1.jpg'
    ],
    category: 'study',
    type: 'original',
    mode: 'light',
    campus: '中园公寓',
    building: '1层',
    desc: '小说、教材、课外书等，知识的海洋等着你探索！',
    sales: 128,
    stock: 60,
    likes: 42,
    comments: 12,
    favorites: 28,
    liked: false,
    favorited: false,
    isFollowing: false,
    publisher: { name: '钱七', avatar: '/images/blindbox/study_2_2.jpg', rating: 4.8 },
    fromDorm: '中园公寓',
    commentList: [
      { _id: 'c005', user: '小孙', avatar: '/images/blindbox/study_0_0.jpg', content: '图书质量很好，内容丰富', time: '7小时前' }
    ]
  },
  {
    _id: 'box_004',
    title: '零食大礼包盲盒',
    price: 29.9,
    images: [
      '/images/blindbox/sports_0_0.jpg',
      '/images/blindbox/sports_0_1.jpg'
    ],
    category: 'food',
    type: 'original',
    mode: 'light',
    campus: '新柏居',
    building: '5层',
    desc: '各种网红零食、进口美食，满足你的味蕾！',
    sales: 478,
    stock: 15,
    likes: 342,
    comments: 78,
    favorites: 156,
    liked: false,
    favorited: false,
    isFollowing: false,
    publisher: { name: '孙八', avatar: '/images/blindbox/fashion_1_1.jpg', rating: 5.0 },
    fromDorm: '新柏居',
    commentList: [
      { _id: 'c006', user: '小林', avatar: '/images/blindbox/life_1_1.jpg', content: '零食种类超多，每一个都很好吃', time: '4小时前' },
      { _id: 'c007', user: '小黄', avatar: '/images/blindbox/sports_1_1.jpg', content: '性价比超级高，宿舍必备！', time: '3小时前' }
    ]
  },
  {
    _id: 'box_005',
    title: '数码配件盲盒',
    price: 39.9,
    images: [
      '/images/blindbox/electronics_0_0.jpg',
      '/images/blindbox/electronics_0_1.jpg'
    ],
    category: 'electronics',
    type: 'original',
    mode: 'dark',
    campus: '知行1栋',
    building: '4层',
    desc: '手机壳、数据线、耳机等数码配件，科技感满满！',
    sales: 256,
    stock: 32,
    likes: 167,
    comments: 34,
    favorites: 78,
    liked: false,
    favorited: false,
    isFollowing: false,
    publisher: { name: '周九', avatar: '/images/blindbox/electronics_1_1.jpg', rating: 4.6 },
    fromDorm: '知行1栋',
    commentList: [
      { _id: 'c008', user: '小吴', avatar: '/images/blindbox/electronics_2_2.jpg', content: '数据线质量很好，充电速度快', time: '6小时前' }
    ]
  },
  {
    _id: 'box_006',
    title: '运动装备盲盒',
    price: 24.9,
    images: [
      '/images/blindbox/sports_0_0.jpg',
      '/images/blindbox/sports_1_1.jpg'
    ],
    category: 'sports',
    type: 'secondhand',
    mode: 'light',
    campus: '敏学1栋',
    building: '2层',
    desc: '运动手环、跳绳、护腕等运动装备，动起来！',
    sales: 89,
    stock: 50,
    likes: 73,
    comments: 15,
    favorites: 36,
    liked: false,
    favorited: false,
    isFollowing: false,
    publisher: { name: '郑十', avatar: '/images/blindbox/sports_2_2.jpg', rating: 4.5 },
    fromDorm: '敏学1栋',
    commentList: []
  },
  {
    _id: 'box_007',
    title: '生活用品盲盒',
    price: 9.9,
    images: [
      '/images/blindbox/life_0_0.jpg',
      '/images/blindbox/life_0_1.jpg'
    ],
    category: 'life',
    type: 'original',
    mode: 'light',
    campus: '松柏居',
    building: '1层',
    desc: '收纳盒、台灯、水杯等实用生活好物！',
    sales: 521,
    stock: 8,
    likes: 423,
    comments: 92,
    favorites: 201,
    liked: false,
    favorited: false,
    isFollowing: false,
    publisher: { name: '吴十一', avatar: '/images/blindbox/life_1_1.jpg', rating: 5.0 },
    fromDorm: '松柏居',
    commentList: [
      { _id: 'c009', user: '小冯', avatar: '/images/blindbox/fashion_2_2.jpg', content: '台灯很实用，性价比超高', time: '2小时前' }
    ]
  },
  {
    _id: 'box_008',
    title: '美妆护肤盲盒',
    price: 34.9,
    images: [
      '/images/blindbox/fashion_3_3.jpg',
      '/images/blindbox/fashion_0_0.jpg'
    ],
    category: 'fashion',
    type: 'original',
    mode: 'dark',
    campus: '三友园',
    building: '3层',
    desc: '面膜、护手霜、唇膏等护肤好物，呵护自己！',
    sales: 167,
    stock: 22,
    likes: 134,
    comments: 28,
    favorites: 67,
    liked: false,
    favorited: false,
    isFollowing: false,
    publisher: { name: '陈十二', avatar: '/images/blindbox/fashion_1_1.jpg', rating: 4.8 },
    fromDorm: '三友园',
    commentList: []
  }
];

// ============================================================
// 2. 宿舍热度数据
// ============================================================
const dormHeat = [
  { dorm: '中园公寓', count: 86, level: 'hot', percent: 100 },
  { dorm: '苏园居', count: 72, level: 'hot', percent: 84 },
  { dorm: '中南公寓', count: 65, level: 'warm', percent: 76 },
  { dorm: '知行1栋', count: 58, level: 'warm', percent: 67 },
  { dorm: '新柏居', count: 51, level: 'normal', percent: 59 },
  { dorm: '三友园', count: 47, level: 'normal', percent: 55 },
  { dorm: '敏学1栋', count: 43, level: 'normal', percent: 50 },
  { dorm: '松柏居', count: 38, level: 'cold', percent: 44 }
];

// ============================================================
// 3. 可抢订单数据
// ============================================================
const grabOrders = [
  {
    _id: 'order_001',
    box_title: '惊喜文具盲盒',
    price: 19.9,
    delivery_fee: 5,
    from_dorm: '中园公寓',
    to_dorm: '苏园居',
    status: 'pending',
    distance: 0.8
  },
  {
    _id: 'order_002',
    box_title: '时尚饰品盲盒',
    price: 29.9,
    delivery_fee: 6,
    from_dorm: '中南公寓',
    to_dorm: '知行1栋',
    status: 'pending',
    distance: 1.2
  },
  {
    _id: 'order_003',
    box_title: '数码配件盲盒',
    price: 39.9,
    delivery_fee: 8,
    from_dorm: '新柏居',
    to_dorm: '敏学1栋',
    status: 'pending',
    distance: 0.6
  }
];

// ============================================================
// 4. 工具函数
// ============================================================

// 根据 ID 获取盲盒
function getBoxById(id) {
  return boxes.find(b => b._id === id) || null;
}

// 按分类获取盲盒
function getBoxesByCategory(category) {
  if (!category || category === 'all') return boxes;
  return boxes.filter(b => b.category === category);
}

// 获取热门盲盒（按销量排序）
function getHotBoxes(limit) {
  return [...boxes].sort((a, b) => b.sales - a.sales).slice(0, limit || boxes.length);
}

// 搜索盲盒
function searchBoxes(keyword) {
  if (!keyword) return boxes;
  const kw = keyword.toLowerCase();
  return boxes.filter(b =>
    b.title.toLowerCase().includes(kw) ||
    b.desc.toLowerCase().includes(kw) ||
    b.category.toLowerCase().includes(kw)
  );
}

module.exports = {
  boxes,
  dormHeat,
  grabOrders,
  getBoxById,
  getBoxesByCategory,
  getHotBoxes,
  searchBoxes
};
