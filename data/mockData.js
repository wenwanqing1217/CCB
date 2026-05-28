// 模拟数据文件，用于云函数不可用时的降级方案
const { getDemoDormHeat, getDemoOrders, getDemoHotBoxes } = require('../utils/campusData.js')

const mockHotBoxes = getDemoHotBoxes().map((box, i) => ({
  ...box,
  category: ['study', 'fashion', 'electronics', 'sports', 'life', 'fashion'][i] || 'life',
  publish_time: Date.now() - (i + 1) * 3600000,
  status: 'active',
  views: [128, 96, 156, 89, 234, 312][i] || 100,
  likes: [45, 32, 67, 23, 89, 156][i] || 30
}))

const mockGrabOrders = getDemoOrders().concat([
  {
    _id: 'order004',
    box_title: '生活用品盲盒',
    price: 15.9,
    delivery_fee: 5,
    from_dorm: '三友园',
    to_dorm: '松柏居',
    status: 'pending',
    create_time: Date.now() - 7200000,
    distance: 1.5
  }
])

const mockDormHeat = getDemoDormHeat()

// 社区动态模拟数据
export const mockCommunityFeed = [
  {
    _id: 'feed001',
    userId: 'user001',
    nickName: '校园小达人',
    avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=young%20student%20avatar%20cartoon%20friendly&image_size=square',
    content: '今天收到了一个超棒的盲盒！里面是我一直想要的手办，太开心了！',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20anime%20figure%20blind%20box%20gift&image_size=landscape_4_3'],
    likes: 128,
    comments: 23,
    shares: 15,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isLiked: false
  },
  {
    _id: 'feed002',
    userId: 'user002',
    nickName: '盲盒收藏家',
    avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=collector%20avatar%20cartoon%20style&image_size=square',
    content: '分享一下我的盲盒收藏墙，已经收集了50多个了！',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=collection%20of%20blind%20boxes%20display%20shelf&image_size=landscape_4_3'],
    likes: 256,
    comments: 45,
    shares: 32,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isLiked: true
  },
  {
    _id: 'feed003',
    userId: 'user003',
    nickName: '校园跑腿王',
    avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=rider%20avatar%20cartoon%20energetic&image_size=square',
    content: '今天完成了15单配送，感谢大家的信任！继续加油！',
    images: [],
    likes: 89,
    comments: 12,
    shares: 8,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    isLiked: false
  },
  {
    _id: 'feed004',
    userId: 'user004',
    nickName: '爱分享的学姐',
    avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=female%20student%20avatar%20cartoon%20kind&image_size=square',
    content: '毕业季出闲置，有需要的学弟学妹可以联系我~',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=secondhand%20items%20books%20clothes%20desk&image_size=landscape_4_3'],
    likes: 67,
    comments: 18,
    shares: 12,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    isLiked: false
  },
  {
    _id: 'feed005',
    userId: 'user005',
    nickName: '神秘盲盒君',
    avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=mysterious%20avatar%20blind%20box%20purple&image_size=square',
    content: '新到了一批限量版盲盒，数量有限，先到先得！',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=limited%20edition%20blind%20boxes%20premium&image_size=landscape_4_3'],
    likes: 312,
    comments: 56,
    shares: 45,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    isLiked: true
  }
]

const mockRecommendedBoxes = [
  {
    _id: 'rec001',
    title: '精选图书盲盒',
    price: 25.9,
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=book%20blind%20box%20literature%20collection&image_size=square'],
    category: 'study',
    from_dorm: '中园公寓',
    to_dorm: '新柏居',
    publish_time: Date.now() - 7200000,
    status: 'active'
  },
  {
    _id: 'rec002',
    title: '创意礼品盲盒',
    price: 35.9,
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=creative%20gift%20blind%20box%20crafts&image_size=square'],
    category: 'life',
    from_dorm: '三友园',
    to_dorm: '松柏居',
    publish_time: Date.now() - 10800000,
    status: 'active'
  },
  {
    _id: 'rec003',
    title: '潮流服饰盲盒',
    price: 45.9,
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=fashion%20clothes%20blind%20box%20trendy&image_size=square'],
    category: 'fashion',
    from_dorm: '苏园居',
    to_dorm: '中南公寓',
    publish_time: Date.now() - 14400000,
    status: 'active'
  },
  {
    _id: 'rec004',
    title: '游戏周边盲盒',
    price: 55.9,
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=game%20merchandise%20blind%20box%20collectible&image_size=square'],
    category: 'electronics',
    from_dorm: '知行1栋',
    to_dorm: '中园公寓',
    publish_time: Date.now() - 18000000,
    status: 'active'
  },
  {
    _id: 'rec005',
    title: '零食惊喜盲盒',
    price: 18.9,
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=snack%20blind%20box%20candy%20treats&image_size=square'],
    category: 'life',
    from_dorm: '敏学1栋',
    to_dorm: '三友园',
    publish_time: Date.now() - 21600000,
    status: 'active'
  },
  {
    _id: 'rec006',
    title: '运动器材盲盒',
    price: 65.9,
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=sports%20equipment%20blind%20box%20fitness&image_size=square'],
    category: 'sports',
    from_dorm: '松柏居',
    to_dorm: '新松居',
    publish_time: Date.now() - 25200000,
    status: 'active'
  }
]

export { mockHotBoxes, mockGrabOrders, mockDormHeat, mockRecommendedBoxes }

export const getMockData = async (functionName) => {
  switch (functionName) {
    case 'getHotBoxes':
      return { data: mockHotBoxes }
    case 'getGrabOrders':
      return { data: mockGrabOrders }
    case 'getDormHeat':
      return { data: mockDormHeat, meta: { isDemo: true } }
    case 'getCommunityFeed':
      return { data: mockCommunityFeed }
    case 'recommendationService':
      return { result: { success: true, data: mockRecommendedBoxes } }
    default:
      return { data: [] }
  }
}
