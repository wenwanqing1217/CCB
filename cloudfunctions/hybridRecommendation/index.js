const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 混合推荐算法：内容推荐(60%) + 协同过滤(40%)
exports.main = async (event, context) => {
  const { userId, count = 10 } = event
  
  try {
    // 1. 获取基于内容的推荐
    const contentRecs = await getContentBasedRecommendations(userId, count)
    
    // 2. 获取基于协同过滤的推荐
    const collaborativeRecs = await getCollaborativeRecommendations(userId, count)
    
    // 3. 混合加权合并
    const hybridRecs = mergeRecommendations(contentRecs, collaborativeRecs, 0.6, 0.4)
    
    // 4. 去重并取前count个
    const result = deduplicateRecommendations(hybridRecs).slice(0, count)
    
    return {
      success: true,
      data: result,
      message: '混合推荐成功'
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    }
  }
}

// 基于内容的推荐
async function getContentBasedRecommendations(userId, count) {
  // 获取用户兴趣画像
  const userProfile = await getUserInterestProfile(userId)
  
  if (!userProfile || Object.keys(userProfile).length === 0) {
    // 新用户返回热门盲盒
    return await getHotBoxes(count)
  }
  
  // 查询盲盒并计算相似度
  const boxes = await db.collection('boxes').get()
  
  const scoredBoxes = boxes.data.map(box => {
    const similarity = calculateCosineSimilarity(box, userProfile)
    return { ...box, score: similarity * 0.6 }
  })
  
  return scoredBoxes.sort((a, b) => b.score - a.score).slice(0, count)
}

// 获取用户兴趣画像
async function getUserInterestProfile(userId) {
  const profile = await db.collection('userProfiles').doc(userId).get().catch(() => null)
  return profile?.data || {}
}

// 计算余弦相似度
function calculateCosineSimilarity(box, profile) {
  const boxVector = getBoxFeatureVector(box)
  const profileVector = getProfileVector(profile)
  
  let dotProduct = 0
  let boxNorm = 0
  let profileNorm = 0
  
  const keys = new Set([...Object.keys(boxVector), ...Object.keys(profileVector)])
  
  for (const key of keys) {
    const b = boxVector[key] || 0
    const p = profileVector[key] || 0
    dotProduct += b * p
    boxNorm += b * b
    profileNorm += p * p
  }
  
  if (boxNorm === 0 || profileNorm === 0) return 0
  return dotProduct / (Math.sqrt(boxNorm) * Math.sqrt(profileNorm))
}

// 获取盲盒特征向量
function getBoxFeatureVector(box) {
  const features = {}
  if (box.category) features[`category_${box.category}`] = 1
  if (box.rarity) features[`rarity_${box.rarity}`] = getRarityWeight(box.rarity)
  if (box.price) features['price'] = normalizePrice(box.price)
  return features
}

// 获取稀有度权重
function getRarityWeight(rarity) {
  const weights = { SSR: 4, SR: 3, R: 2, N: 1 }
  return weights[rarity] || 1
}

// 价格归一化
function normalizePrice(price) {
  return Math.min(price / 100, 1)
}

// 获取用户画像向量
function getProfileVector(profile) {
  const vector = {}
  if (profile.preferredCategories) {
    profile.preferredCategories.forEach(cat => {
      vector[`category_${cat}`] = 1
    })
  }
  if (profile.preferredRarity) {
    profile.preferredRarity.forEach(r => {
      vector[`rarity_${r}`] = getRarityWeight(r)
    })
  }
  return vector
}

// 获取热门盲盒
async function getHotBoxes(count) {
  return (await db.collection('boxes')
    .orderBy('viewCount', 'desc')
    .limit(count)
    .get()).data.map(box => ({ ...box, score: 0.5 }))
}

// 基于协同过滤的推荐
async function getCollaborativeRecommendations(userId, count) {
  // 获取用户的购买/浏览记录
  const userRecords = await getUserBehaviorRecords(userId)
  
  if (userRecords.length === 0) {
    return []
  }
  
  // 找到相似用户
  const similarUsers = await findSimilarUsers(userId, userRecords)
  
  if (similarUsers.length === 0) {
    return []
  }
  
  // 获取相似用户喜欢的盲盒
  const recommendations = await getRecommendationsFromSimilarUsers(similarUsers, userId)
  
  return recommendations.map(box => ({ ...box, score: box.score * 0.4 })).slice(0, count)
}

// 获取用户行为记录
async function getUserBehaviorRecords(userId) {
  const [purchases, views] = await Promise.all([
    db.collection('orders').where({ userId }).get(),
    db.collection('userViews').where({ userId }).get()
  ])
  
  return [...purchases.data, ...views.data]
}

// 找到相似用户
async function findSimilarUsers(userId, userRecords) {
  const boxIds = [...new Set(userRecords.map(r => r.boxId))]
  
  if (boxIds.length === 0) return []
  
  // 查询购买过相同盲盒的用户
  const similarOrders = await db.collection('orders')
    .where({ boxId: db.command.in(boxIds) })
    .where({ userId: db.command.neq(userId) })
    .get()
  
  // 统计相似度
  const similarityMap = {}
  similarOrders.data.forEach(order => {
    const otherUserId = order.userId
    if (!similarityMap[otherUserId]) {
      similarityMap[otherUserId] = 0
    }
    similarityMap[otherUserId]++
  })
  
  // 按相似度排序
  return Object.entries(similarityMap)
    .map(([uid, score]) => ({ userId: uid, similarity: score / boxIds.length }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
}

// 从相似用户获取推荐
async function getRecommendationsFromSimilarUsers(similarUsers, excludeUserId) {
  const userIds = similarUsers.map(u => u.userId)
  
  const orders = await db.collection('orders')
    .where({ userId: db.command.in(userIds) })
    .get()
  
  // 排除用户已购买的盲盒
  const excludeBoxIds = (await db.collection('orders').where({ userId: excludeUserId }).get())
    .data.map(o => o.boxId)
  
  // 统计推荐分数
  const recommendationMap = {}
  orders.data.forEach(order => {
    const boxId = order.boxId
    if (excludeBoxIds.includes(boxId)) return
    
    const userSimilarity = similarUsers.find(u => u.userId === order.userId)?.similarity || 0
    if (!recommendationMap[boxId]) {
      recommendationMap[boxId] = { count: 0, totalSimilarity: 0 }
    }
    recommendationMap[boxId].count++
    recommendationMap[boxId].totalSimilarity += userSimilarity
  })
  
  // 查询盲盒详情
  const boxIds = Object.keys(recommendationMap)
  const boxes = await db.collection('boxes')
    .where({ _id: db.command.in(boxIds) })
    .get()
  
  return boxes.data.map(box => {
    const rec = recommendationMap[box._id]
    const score = rec.totalSimilarity / rec.count
    return { ...box, score }
  }).sort((a, b) => b.score - a.score)
}

// 合并推荐结果
function mergeRecommendations(list1, list2, weight1, weight2) {
  const merged = {}
  
  list1.forEach(item => {
    merged[item._id] = { ...item, finalScore: item.score * weight1 }
  })
  
  list2.forEach(item => {
    if (merged[item._id]) {
      merged[item._id].finalScore += item.score * weight2
    } else {
      merged[item._id] = { ...item, finalScore: item.score * weight2 }
    }
  })
  
  return Object.values(merged).sort((a, b) => b.finalScore - a.finalScore)
}

// 去重
function deduplicateRecommendations(list) {
  const seen = new Set()
  return list.filter(item => {
    if (seen.has(item._id)) return false
    seen.add(item._id)
    return true
  })
}