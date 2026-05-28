/**
 * 配送服务云函数
 * 负责配送抢单、状态更新、订单查询、顺路推荐等操作
 * 
 * 对应论文4.3章节 - 数据库设计
 * 配送集合结构（4.3.4）：
 * {
 *   _id: String,           // 配送ID，系统自动生成
 *   orderId: String,       // 订单ID（关联订单集合）
 *   riderOpenid: String,   // 骑手openid（关联用户集合）
 *   riderInfo: Object,     // 骑手信息
 *   status: String,        // 配送状态：pending/delivering/completed
 *   route: Array,          // 配送路线坐标
 *   createdAt: Date,       // 创建时间
 *   updatedAt: Date        // 更新时间
 * }
 */
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const deliveriesCollection = db.collection('deliveries') // 对应论文4.3.4 配送集合
const ordersCollection = db.collection('orders')
const ridersCollection = db.collection('riders')

// 权重系数配置
const WEIGHTS = {
  distance: 0.5,    // 距离权重
  time: 0.3,        // 时间权重
  routeQuality: 0.2 // 路线质量权重
}

// 最大允许配送时间（分钟）
const MAX_DELIVERY_TIME = 30

exports.main = async (event, context) => {
  const { action, data } = event
  try {
    switch (action) {
      case 'grab': return await handleGrabOrder(data)
      case 'updateStatus': return await handleUpdateStatus(data)
      case 'getRiderOrders': return await handleGetRiderOrders(data)
      case 'getPendingOrders': return await handleGetPendingOrders(data)
      case 'getRecommendedOrders': return await handleGetRecommendedOrders(data)
      case 'updateRiderLocation': return await handleUpdateRiderLocation(data)
      case 'setOnlineStatus': return await handleSetOnlineStatus(data)
      case 'updateLocation': return await handleUpdateLocation(data)
      case 'getTodayStats': return await handleGetTodayStats(data)
      case 'getWeeklyStats': return await handleGetWeeklyStats(data)
      case 'getMonthlyStats': return await handleGetMonthlyStats(data)
      case 'getRiders': return await handleGetRiders(data)
      case 'getActiveDeliveries': return await handleGetActiveDeliveries(data)
      case 'getDeliveryStats': return await handleGetDeliveryStats(data)
      case 'getDelivery': return await handleGetDelivery(data)
      case 'suspendRider': return await handleSuspendRider(data)
      case 'resumeRider': return await handleResumeRider(data)
      default: return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('deliveryService 错误:', error)
    return { success: false, message: '服务器错误' }
  }
}

// 处理抢单（对应论文4.2.4 配送服务模块）
// 使用原子性更新防止并发超卖
async function handleGrabOrder(data) {
  const { orderId, riderOpenid, riderInfo } = data
  try {
    // 原子性更新：只有订单状态为 pending 时才能抢
    const updateResult = await ordersCollection.doc(orderId).update({
      data: {
        status: 'grabbed',
        riderOpenid: riderOpenid,
        riderInfo: riderInfo,
        updatedAt: new Date()
      }
    })
    
    // 检查是否更新成功（affectedDocs 为 0 表示订单不是 pending 状态）
    if (updateResult.stats.updated === 0) {
      return { success: false, message: '订单不存在或已被抢' }
    }
    
    // 创建配送记录
    const newDelivery = {
      orderId,
      riderOpenid,
      riderInfo,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await deliveriesCollection.add({ data: newDelivery })
    
    return { success: true, message: '抢单成功' }
  } catch (error) {
    console.error('抢单失败:', error)
    return { success: false, message: '抢单失败: ' + error.message }
  }
}

// 处理更新配送状态
async function handleUpdateStatus(data) {
  const { deliveryId, status } = data
  try {
    const delivery = await deliveriesCollection.doc(deliveryId).get()
    if (!delivery.data) {
      return { success: false, message: '配送记录不存在' }
    }
    await deliveriesCollection.doc(deliveryId).update({
      data: { status, updatedAt: new Date() }
    })
    await ordersCollection.doc(delivery.data.orderId).update({
      data: { status, updatedAt: new Date() }
    })
    return { success: true, message: '配送状态更新成功' }
  } catch (error) {
    console.error('更新配送状态失败:', error)
    return { success: false, message: '更新失败: ' + error.message }
  }
}

// 获取配送员的订单列表
async function handleGetRiderOrders(data) {
  const { riderOpenid, page = 1, limit = 10 } = data
  try {
    const total = await deliveriesCollection.where({ riderOpenid }).count()
    const deliveries = await deliveriesCollection
      .where({ riderOpenid })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get()
    const deliveriesWithOrder = await Promise.all(
      deliveries.data.map(async (delivery) => {
        const order = await ordersCollection.doc(delivery.orderId).get()
        return { ...delivery, order: order.data }
      })
    )
    return { success: true, deliveries: deliveriesWithOrder, total: total.total, page, limit }
  } catch (error) {
    console.error('获取配送员订单列表失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 获取待抢单列表
async function handleGetPendingOrders(data) {
  const { page = 1, limit = 10 } = data
  try {
    const total = await ordersCollection.where({ status: 'pending' }).count()
    const orders = await ordersCollection
      .where({ status: 'pending' })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get()
    return { success: true, orders: orders.data, total: total.total, page, limit }
  } catch (error) {
    console.error('获取待抢单列表失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 获取顺路推荐订单（动态顺路匹配算法实现）
async function handleGetRecommendedOrders(data) {
  const { riderOpenid, location, limit = 10 } = data
  
  if (!riderOpenid || !location) {
    return { success: false, message: '骑手ID和位置信息不能为空' }
  }
  
  try {
    // 获取骑手信息和当前负载
    const riderResult = await ridersCollection.where({ openid: riderOpenid }).get()
    if (riderResult.data.length === 0) {
      return { success: false, message: '骑手不存在' }
    }
    
    const rider = riderResult.data[0]
    const riderLoad = await getRiderCurrentLoad(riderOpenid)
    
    // 获取待抢订单
    const pendingOrders = await ordersCollection
      .where({ status: 'pending' })
      .get()
    
    // 计算每个订单的匹配度
    const ordersWithMatchScore = await Promise.all(
      pendingOrders.data.map(async (order) => {
        const matchScore = await calculateMatchScore(
          location,
          order.pickupAddress,
          order.deliveryAddress,
          riderLoad,
          order.createdAt
        )
        return { ...order, matchScore }
      })
    )
    
    // 按匹配度排序，返回top N
    ordersWithMatchScore.sort((a, b) => b.matchScore - a.matchScore)
    
    return {
      success: true,
      orders: ordersWithMatchScore.slice(0, limit),
      riderLoad
    }
  } catch (error) {
    console.error('获取顺路推荐订单失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 更新骑手位置
async function handleUpdateRiderLocation(data) {
  const { riderOpenid, location, accuracy } = data
  
  if (!riderOpenid || !location) {
    return { success: false, message: '骑手ID和位置信息不能为空' }
  }
  
  try {
    await ridersCollection.where({ openid: riderOpenid }).update({
      data: {
        location,
        accuracy,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      }
    })
    
    return { success: true, message: '位置更新成功' }
  } catch (error) {
    console.error('更新骑手位置失败:', error)
    return { success: false, message: '更新失败: ' + error.message }
  }
}

// 计算骑手当前负载
async function getRiderCurrentLoad(riderOpenid) {
  const ongoingDeliveries = await deliveriesCollection
    .where({ riderOpenid, status: _.in(['pending', 'delivering']) })
    .count()
  
  return ongoingDeliveries.total
}

// 计算匹配度（动态顺路匹配算法核心）
async function calculateMatchScore(riderLocation, pickupAddress, deliveryAddress, riderLoad, orderCreateTime) {
  // 计算距离
  const d1 = calculateManhattanDistance(riderLocation, pickupAddress)
  const d2 = calculateManhattanDistance(pickupAddress, deliveryAddress)
  const d3 = calculateManhattanDistance(riderLocation, deliveryAddress)
  
  // 距离匹配度
  const distanceMatch = d3 > 0 ? 1 - (d1 + d2 - d3) / d3 : 0
  
  // 计算时间因素
  const timeSinceCreated = (new Date() - new Date(orderCreateTime)) / (1000 * 60) // 分钟
  const timeMatch = Math.max(0, 1 - timeSinceCreated / MAX_DELIVERY_TIME)
  
  // 获取路线质量系数（模拟值，实际可从地图API获取）
  const routeQuality = await getRouteQuality(pickupAddress, deliveryAddress)
  
  // 计算综合匹配度
  const matchScore = 
    WEIGHTS.distance * Math.max(0, distanceMatch) +
    WEIGHTS.time * timeMatch +
    WEIGHTS.routeQuality * routeQuality
  
  // 考虑骑手负载（负载越高，匹配度越低）
  const loadFactor = Math.max(0.3, 1 - riderLoad * 0.15)
  
  return matchScore * loadFactor
}

// 计算曼哈顿距离
function calculateManhattanDistance(point1, point2) {
  if (!point1 || !point2 || !point1.latitude || !point2.latitude) {
    return 100000 // 返回一个较大值表示无法计算
  }
  // 将经纬度转换为近似距离（1度约等于111公里）
  const latDiff = Math.abs(point1.latitude - point2.latitude)
  const lngDiff = Math.abs(point1.longitude - point2.longitude)
  return (latDiff + lngDiff) * 111000 // 转换为米
}

// 获取路线质量系数
async function getRouteQuality(pickup, delivery) {
  // 模拟路线质量评估
  // 实际应用中可调用地图API获取实时路况
  const hour = new Date().getHours()
  
  // 高峰期（8-9点，11-13点，17-19点）路线质量较低
  if ((hour >= 8 && hour <= 9) || 
      (hour >= 11 && hour <= 13) || 
      (hour >= 17 && hour <= 19)) {
    return 0.7
  }
  
  // 其他时间路线质量较高
  return 0.9
}

// 设置骑手在线状态
async function handleSetOnlineStatus(data) {
  const { isOnline } = data
  const openid = cloud.getWXContext().OPENID
  
  try {
    await ridersCollection.where({ openid }).update({
      data: {
        isOnline,
        updatedAt: new Date()
      }
    })
    
    return { success: true, message: isOnline ? '已上线' : '已下线' }
  } catch (error) {
    console.error('设置在线状态失败:', error)
    return { success: false, message: '操作失败: ' + error.message }
  }
}

// 更新骑手位置（简化版）
async function handleUpdateLocation(data) {
  const { location } = data
  const openid = cloud.getWXContext().OPENID
  
  if (!location) {
    return { success: false, message: '位置信息不能为空' }
  }
  
  try {
    await ridersCollection.where({ openid }).update({
      data: {
        location,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      }
    })
    
    return { success: true, message: '位置更新成功' }
  } catch (error) {
    console.error('更新位置失败:', error)
    return { success: false, message: '更新失败: ' + error.message }
  }
}

// 获取骑手今日统计
async function handleGetTodayStats(data) {
  const openid = cloud.getWXContext().OPENID
  
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const riderResult = await ridersCollection.where({ openid }).get()
    if (riderResult.data.length === 0) {
      return { success: true, data: { orders: 0, completed: 0, earnings: 0, rating: 0 } }
    }
    
    const rider = riderResult.data[0]
    const riderId = rider._id
    
    const deliveries = await deliveriesCollection
      .where({ riderOpenid: openid, createdAt: _.gte(today) })
      .get()
    
    const completedCount = deliveries.data.filter(d => d.status === 'completed').length
    const earnings = completedCount * 9 // 假设每单9元配送费
    
    return {
      success: true,
      data: {
        orders: deliveries.data.length,
        completed: completedCount,
        earnings,
        rating: rider.rating || 0
      }
    }
  } catch (error) {
    console.error('获取今日统计失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 获取骑手周统计
async function handleGetWeeklyStats(data) {
  const openid = cloud.getWXContext().OPENID
  
  try {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1)
    monday.setHours(0, 0, 0, 0)
    
    const deliveries = await deliveriesCollection
      .where({ riderOpenid: openid, createdAt: _.gte(monday) })
      .get()
    
    const weeklyData = [0, 0, 0, 0, 0, 0, 0]
    
    deliveries.data.forEach(delivery => {
      const day = new Date(delivery.createdAt).getDay() || 7
      weeklyData[day - 1]++
    })
    
    return {
      success: true,
      data: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        data: weeklyData
      }
    }
  } catch (error) {
    console.error('获取周统计失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 获取骑手月统计
async function handleGetMonthlyStats(data) {
  const openid = cloud.getWXContext().OPENID
  
  try {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const riderResult = await ridersCollection.where({ openid }).get()
    if (riderResult.data.length === 0) {
      return { success: true, data: { totalOrders: 0, totalEarnings: 0, avgRating: 0, activeDays: 0 } }
    }
    
    const rider = riderResult.data[0]
    
    const deliveries = await deliveriesCollection
      .where({ riderOpenid: openid, createdAt: _.gte(firstDay) })
      .get()
    
    const completedDeliveries = deliveries.data.filter(d => d.status === 'completed')
    const activeDays = [...new Set(deliveries.data.map(d => {
      const date = new Date(d.createdAt)
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }))].length
    
    return {
      success: true,
      data: {
        totalOrders: deliveries.data.length,
        totalEarnings: completedDeliveries.length * 9,
        avgRating: rider.rating || 0,
        activeDays
      }
    }
  } catch (error) {
    console.error('获取月统计失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 获取骑手列表
async function handleGetRiders(data) {
  const { status = 'all' } = data
  
  try {
    let query = ridersCollection
    
    if (status === 'online') {
      query = query.where({ isOnline: true })
    } else if (status === 'offline') {
      query = query.where({ isOnline: false })
    }
    
    const riders = await query.get()
    
    const ridersWithStats = await Promise.all(
      riders.data.map(async rider => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const deliveries = await deliveriesCollection
          .where({ riderOpenid: rider.openid, createdAt: _.gte(today) })
          .get()
        
        const totalDeliveries = await deliveriesCollection
          .where({ riderOpenid: rider.openid, status: 'completed' })
          .count()
        
        return {
          ...rider,
          todayOrders: deliveries.data.length,
          totalOrders: totalDeliveries.total,
          status: rider.isOnline ? 'online' : 'offline',
          statusText: rider.isOnline ? '在线' : '离线'
        }
      })
    )
    
    return { success: true, data: ridersWithStats }
  } catch (error) {
    console.error('获取骑手列表失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 获取活跃配送列表
async function handleGetActiveDeliveries(data) {
  try {
    const deliveries = await deliveriesCollection
      .where({ status: _.in(['pending', 'picked', 'delivering']) })
      .orderBy('createdAt', 'desc')
      .get()
    
    const deliveriesWithOrder = await Promise.all(
      deliveries.data.map(async delivery => {
        const order = await ordersCollection.doc(delivery.orderId).get()
        const rider = await ridersCollection.where({ openid: delivery.riderOpenid }).get()
        
        const now = new Date()
        const updateTime = new Date(delivery.updatedAt || delivery.createdAt)
        const diffMinutes = Math.floor((now - updateTime) / (1000 * 60))
        
        let updateText = '刚刚'
        if (diffMinutes < 60) {
          updateText = `${diffMinutes}分钟前`
        } else if (diffMinutes < 1440) {
          updateText = `${Math.floor(diffMinutes / 60)}小时前`
        } else {
          updateText = `${Math.floor(diffMinutes / 1440)}天前`
        }
        
        return {
          ...delivery,
          order: order.data,
          riderInfo: rider.data[0] || {},
          updateTime: updateText,
          progress: delivery.status === 'pending' ? 10 : delivery.status === 'picked' ? 30 : 60,
          estimatedTime: delivery.status === 'pending' ? '约20分钟' : '约10分钟'
        }
      })
    )
    
    return { success: true, data: deliveriesWithOrder }
  } catch (error) {
    console.error('获取活跃配送列表失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 获取配送统计
async function handleGetDeliveryStats(data) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [total, pending, delivering, completed] = await Promise.all([
      deliveriesCollection.where({ createdAt: _.gte(today) }).count(),
      deliveriesCollection.where({ createdAt: _.gte(today), status: 'pending' }).count(),
      deliveriesCollection.where({ createdAt: _.gte(today), status: 'delivering' }).count(),
      deliveriesCollection.where({ createdAt: _.gte(today), status: 'completed' }).count()
    ])
    
    return {
      success: true,
      data: {
        total: total.total,
        pending: pending.total,
        delivering: delivering.total,
        completed: completed.total
      }
    }
  } catch (error) {
    console.error('获取配送统计失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 获取单个配送记录
async function handleGetDelivery(data) {
  const { orderId } = data
  
  try {
    const delivery = await deliveriesCollection
      .where({ orderId })
      .get()
    
    if (delivery.data.length === 0) {
      return { success: false, message: '配送记录不存在' }
    }
    
    return { success: true, data: delivery.data[0] }
  } catch (error) {
    console.error('获取配送记录失败:', error)
    return { success: false, message: '获取失败: ' + error.message }
  }
}

// 暂停骑手服务
async function handleSuspendRider(data) {
  const { riderId } = data
  
  try {
    await ridersCollection.doc(riderId).update({
      data: {
        status: 'suspended',
        isOnline: false,
        updatedAt: new Date()
      }
    })
    
    return { success: true, message: '骑手已暂停' }
  } catch (error) {
    console.error('暂停骑手失败:', error)
    return { success: false, message: '操作失败: ' + error.message }
  }
}

// 恢复骑手服务
async function handleResumeRider(data) {
  const { riderId } = data
  
  try {
    await ridersCollection.doc(riderId).update({
      data: {
        status: 'active',
        updatedAt: new Date()
      }
    })
    
    return { success: true, message: '骑手已恢复' }
  } catch (error) {
    console.error('恢复骑手失败:', error)
    return { success: false, message: '操作失败: ' + error.message }
  }
}

// 数据库操作符
const _ = db.command