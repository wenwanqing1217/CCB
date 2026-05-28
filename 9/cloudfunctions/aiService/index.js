const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 模拟AI润色功能
function aiPolish(text) {
  const polishTemplates = [
    `${text}，希望我的润色能够帮到你！`,
    `优化后的内容：${text}，这样表达更加清晰有力。`,
    `润色完成：${text}，看起来更加专业了。`,
    `经过AI润色：${text}，效果是不是更好了呢？`,
    `润色结果：${text}，这样表达更加流畅自然。`
  ]
  const randomIndex = Math.floor(Math.random() * polishTemplates.length)
  return polishTemplates[randomIndex]
}

// 模拟智能推荐功能
function generateRecommendations(userPreferences = {}) {
  const recommendations = [
    {
      type: 'blindbox',
      title: '数码配件盲盒',
      description: '包含各种实用的数码配件，适合喜欢科技产品的你',
      priority: 5
    },
    {
      type: 'stationery',
      title: '精品文具盲盒',
      description: '精选优质文具，学习必备',
      priority: 4
    },
    {
      type: 'clothing',
      title: '潮流服饰盲盒',
      description: '时尚单品，展现个性',
      priority: 3
    },
    {
      type: 'beauty',
      title: '美妆护肤盲盒',
      description: '精选美妆产品，让你更加美丽',
      priority: 3
    },
    {
      type: 'book',
      title: '精品书籍盲盒',
      description: '优质图书，丰富你的精神世界',
      priority: 4
    }
  ]
  
  // 根据用户偏好调整推荐顺序
  if (userPreferences.category) {
    recommendations.sort((a, b) => {
      if (a.type === userPreferences.category) return -1
      if (b.type === userPreferences.category) return 1
      return b.priority - a.priority
    })
  } else {
    // 默认按优先级排序
    recommendations.sort((a, b) => b.priority - a.priority)
  }
  
  return recommendations.slice(0, 3)
}

// 模拟AI问答功能
function aiChat(message) {
  const lowerMessage = message.toLowerCase()
  
  const responses = {
    '润色': '我可以帮你润色文本，让你的表达更加流畅自然。请输入你想要润色的内容。',
    '推荐': '我可以根据你的兴趣为你推荐合适的盲盒。你对哪个类别的商品更感兴趣呢？',
    '数码': '数码配件盲盒是我们的热门推荐，包含各种实用的数码产品和配件。',
    '文具': '精品文具盲盒适合学生党，包含各种高品质的文具用品。',
    '服饰': '潮流服饰盲盒让你走在时尚前沿，展现个性魅力。',
    '美妆': '美妆护肤盲盒包含精选美妆产品，让你更加美丽动人。',
    '书籍': '精品书籍盲盒让你在阅读中收获知识和乐趣。',
    '你好': '你好！我是校园智能助手艾米，有什么可以帮你的吗？',
    '谢谢': '不客气！有问题随时找我。',
    '帮助': '我可以帮你：\n• 润色文本\n• 推荐盲盒\n• 回答问题\n• 提供校园生活建议',
    '天气': '今天天气晴朗，适合外出活动。记得做好防晒哦！',
    '学习': '学习是学生的主要任务，合理安排时间，提高学习效率。',
    '生活': '校园生活丰富多彩，希望你能享受这段美好的时光。',
    '健康': '保持健康的生活习惯，合理饮食，适量运动。'
  }
  
  for (const [keyword, response] of Object.entries(responses)) {
    if (lowerMessage.includes(keyword)) {
      return response
    }
  }
  
  // 默认回复
  return '抱歉，我可能没理解你的问题。你可以尝试问我关于润色、推荐、天气、学习等方面的问题。'
}

exports.main = async (event, context) => {
  try {
    const { action, data } = event
    
    switch (action) {
      case 'polish':
        return {
          result: aiPolish(data.text)
        }
      case 'recommend':
        return {
          recommendations: generateRecommendations(data.preferences)
        }
      case 'chat':
        return {
          response: aiChat(data.message)
        }
      default:
        return {
          error: '未知的操作类型'
        }
    }
  } catch (error) {
    console.error('AI服务错误', error)
    return {
      error: '服务暂时不可用，请稍后重试'
    }
  }
}