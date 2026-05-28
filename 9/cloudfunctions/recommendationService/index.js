// 推荐服务云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { action, data } = event
    
    switch (action) {
      case 'getRecommendations':
        return await getRecommendations(data)
      case 'getGuessYouLike':
        return await getGuessYouLike(data)
      case 'getHotRecommendations':
        return await getHotRecommendations(data)
      default:
        return {
          success: false,
          message: '无效的操作'
        }
    }
  } catch (error) {
    console.error('推荐服务错误:', error)
    return {
      success: false,
      message: '推荐服务错误'
    }
  }
}

// 获取个性化推荐
async function getRecommendations(data) {
  const { openid, limit = 10 } = data
  
  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    }
  }
  
  // 获取用户历史行为
  const userBehavior = await db.collection('userActions')
    .where({ openid: openid })
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get()
  
  // 分析用户偏好
  const preferences = analyzeUserPreferences(userBehavior.data)
  
  // 根据偏好推荐盲盒
  const recommendedBoxes = await getRecommendedBoxesByPreferences(preferences, limit)
  
  return {
    success: true,
    data: {
      recommendedBoxes: recommendedBoxes,
      preferences: preferences
    }
  }
}

// 获取猜你喜欢（简化版推荐）
async function getGuessYouLike(data) {
  const { openid, limit = 8 } = data
  
  try {
    let query = db.collection('boxes').where({ 
      isDeleted: false, 
      status: 'available' 
    })
    
    // 如果有openid，尝试基于用户行为推荐
    if (openid) {
      const userActions = await db.collection('userActions')
        .where({ openid: openid })
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
      
      // 获取用户浏览过的分类
      const categories = [...new Set(userActions.data.map(a => a.category).filter(Boolean))]
      
      if (categories.length > 0) {
        // 优先推荐相同分类的盲盒
        query = query.where({
          category: _.in(categories)
        })
      }
    }
    
    const boxes = await query
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()
    
    return {
      success: true,
      data: boxes.data
    }
  } catch (error) {
    console.error('获取猜你喜欢失败:', error)
    return {
      success: false,
      message: '获取推荐失败'
    }
  }
}

// 获取热门推荐
async function getHotRecommendations(data) {
  const { limit = 10 } = data
  
  // 获取热门盲盒（基于浏览量）
  const hotResult = await cloud.callFunction({
    name: 'userBehavior',
    data: {
      action: 'getHotBoxes',
      data: { limit }
    }
  })
  
  if (hotResult.result && hotResult.result.success) {
    return {
      success: true,
      data: hotResult.result.data
    }
  }
  
  // 降级：返回最新发布的盲盒
  const boxes = await db.collection('boxes')
    .where({ isDeleted: false, status: 'available' })
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
  
  return {
    success: true,
    data: boxes.data
  }
}

// 分析用户偏好
function analyzeUserPreferences(actions) {
  const preferences = {
    categories: {},
    priceRange: { min: 0, max: 100, average: 0 },
    recentBoxIds: [],
    favoriteCategories: []
  }
  
  let totalPrice = 0
  let priceCount = 0
  
  actions.forEach(action => {
    // 记录最近浏览的盲盒
    if (action.boxId && !preferences.recentBoxIds.includes(action.boxId)) {
      preferences.recentBoxIds.push(action.boxId)
    }
    
    // 分析分类偏好
    if (action.category) {
      preferences.categories[action.category] = (preferences.categories[action.category] || 0) + 1
    }
    
    // 分析价格偏好
    if (action.price) {
      totalPrice += action.price
      priceCount++
      preferences.priceRange.min = preferences.priceRange.min === 0 ? action.price : Math.min(preferences.priceRange.min, action.price)
      preferences.priceRange.max = Math.max(preferences.priceRange.max, action.price)
    }
  })
  
  // 计算平均价格
  if (priceCount > 0) {
    preferences.priceRange.average = Math.round(totalPrice / priceCount)
  }
  
  // 获取最受欢迎的分类
  preferences.favoriteCategories = Object.entries(preferences.categories)
    .sort((a, b) => b[1] - a[1])
    .map(item => item[0])
  
  return preferences
}

// 根据偏好获取推荐盲盒
async function getRecommendedBoxesByPreferences(preferences, limit) {
  let query = db.collection('boxes').where({ 
    isDeleted: false, 
    status: 'available' 
  })
  
  // 根据收藏的分类过滤
  if (preferences.favoriteCategories.length > 0) {
    query = query.where({
      category: _.in(preferences.favoriteCategories.slice(0, 3))
    })
  }
  
  // 根据价格范围过滤
  if (preferences.priceRange.average > 0) {
    const priceMin = Math.max(0, preferences.priceRange.average - 15)
    const priceMax = preferences.priceRange.average + 15
    query = query.where({
      price: _.gte(priceMin).and(_.lte(priceMax))
    })
  }
  
  // 排除已浏览的盲盒
  if (preferences.recentBoxIds.length > 0) {
    query = query.where({
      _id: _.nin(preferences.recentBoxIds)
    })
  }
  
  const boxes = await query
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
  
  return boxes.data
}