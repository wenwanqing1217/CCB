const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 模拟社区动态数据
    const communityFeed = [
      {
        _id: '1',
        userId: 'user001',
        nickName: '校园小达人',
        avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=young%20student%20avatar%20cartoon%20style%20friendly&image_size=square',
        content: '今天收到了一个超棒的盲盒！里面是我一直想要的手办，太开心了！',
        images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20anime%20figure%20blind%20box%20gift&image_size=landscape_4_3'],
        likes: 128,
        comments: 23,
        shares: 15,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        isLiked: false
      },
      {
        _id: '2',
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
        _id: '3',
        userId: 'user003',
        nickName: '校园跑腿王',
        avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=rider%20avatar%20cartoon%20style%20energetic&image_size=square',
        content: '今天完成了15单配送，感谢大家的信任！继续加油！',
        images: [],
        likes: 89,
        comments: 12,
        shares: 8,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        isLiked: false
      },
      {
        _id: '4',
        userId: 'user004',
        nickName: '爱分享的学姐',
        avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=female%20student%20avatar%20cartoon%20style%20kind&image_size=square',
        content: '毕业季出闲置，有需要的学弟学妹可以联系我~',
        images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=secondhand%20items%20books%20clothes%20desk&image_size=landscape_4_3'],
        likes: 67,
        comments: 18,
        shares: 12,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        isLiked: false
      },
      {
        _id: '5',
        userId: 'user005',
        nickName: '神秘盲盒君',
        avatarUrl: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=mysterious%20avatar%20blind%20box%20theme%20purple&image_size=square',
        content: '新到了一批限量版盲盒，数量有限，先到先得！',
        images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=limited%20edition%20blind%20boxes%20premium%20packaging&image_size=landscape_4_3'],
        likes: 312,
        comments: 56,
        shares: 45,
        createdAt: new Date(Date.now() - 18000000).toISOString(),
        isLiked: true
      }
    ]
    
    return {
      success: true,
      data: communityFeed
    }
  } catch (error) {
    console.error('获取社区动态失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}