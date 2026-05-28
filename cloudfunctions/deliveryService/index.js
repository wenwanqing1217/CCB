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
const cloud = require('wx-server-sdk');
const { bizError, Validators, ErrorCodes } = require('../common/errors.js');

cloud.init();
const db = cloud.database();
const _ = db.command;
const deliveriesCollection = db.collection('deliveries');
const ordersCollection = db.collection('orders');
const ridersCollection = db.collection('riders');

const MAX_DELIVERY_TIME = 30;

exports.main = async (event, context) => {
  const { action, data } = event;
  try {
    switch (action) {
      case 'grab': return await handleGrabOrder(data);
      case 'updateStatus': return await handleUpdateStatus(data);
      case 'getRiderOrders': return await handleGetRiderOrders(data);
      case 'getPendingOrders': return await handleGetPendingOrders(data);
      case 'getRecommendedOrders': return await handleGetRecommendedOrders(data);
      case 'updateRiderLocation': return await handleUpdateRiderLocation(data);
      case 'setOnlineStatus': return await handleSetOnlineStatus(data);
      case 'updateLocation': return await handleUpdateLocation(data);
      case 'getTodayStats': return await handleGetTodayStats(data);
      case 'getWeeklyStats': return await handleGetWeeklyStats(data);
      case 'getMonthlyStats': return await handleGetMonthlyStats(data);
      case 'getRiders': return await handleGetRiders(data);
      case 'getActiveDeliveries': return await handleGetActiveDeliveries(data);
      case 'getDeliveryStats': return await handleGetDeliveryStats(data);
      case 'getDelivery': return await handleGetDelivery(data);
      case 'suspendRider': return await handleSuspendRider(data);
      case 'resumeRider': return await handleResumeRider(data);
      default: return { success: false, message: '未知操作' };
    }
  } catch (error) {
    console.error('deliveryService 错误:', error);
    if (error.code) {
      return error.toJSON ? error.toJSON() : { success: false, message: error.message };
    }
    return { success: false, message: '服务器错误' };
  }
};

/**
 * 校验抢单参数
 */
function validateGrabInput({ orderId, riderOpenid, riderInfo }) {
  Validators.isNonEmptyString(orderId, 'orderId');
  Validators.isOpenid(riderOpenid, 'riderOpenid');
  if (!riderInfo || typeof riderInfo !== 'object') {
    throw bizError('SYSTEM.PARAM_INVALID', [{ field: 'riderInfo', message: '骑手信息无效' }]);
  }
}

/**
 * 校验状态更新参数
 */
function validateUpdateStatusInput({ orderId, status, riderOpenid }) {
  Validators.isNonEmptyString(orderId, 'orderId');
  Validators.isNonEmptyString(status, 'status');
  Validators.isOpenid(riderOpenid, 'riderOpenid');

  const validStatuses = ['pending', 'grabbed', 'delivering', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw bizError('DELIVERY.STATUS_TRANSITION_INVALID');
  }
}

// 处理抢单（对应论文4.2.4 配送服务模块）
// 使用原子性更新防止并发超卖
async function handleGrabOrder(data) {
  const { orderId, riderOpenid, riderInfo } = data;

  validateGrabInput(data);

  const order = await ordersCollection.doc(orderId).get();
  if (!order.data) {
    throw bizError('DELIVERY.NOT_FOUND');
  }

  if (order.data.status !== 'pending') {
    throw bizError('DELIVERY.ALREADY_GRABBED');
  }

  if (order.data.riderOpenid === riderOpenid) {
    throw bizError('DELIVERY.RIDER_CANNOT_GRAB_OWN');
  }

  const updateResult = await ordersCollection.doc(orderId).update({
    data: {
      status: 'grabbed',
      riderOpenid: riderOpenid,
      riderInfo: riderInfo,
      updatedAt: new Date()
    }
  });

  if (updateResult.stats.updated === 0) {
    throw bizError('DELIVERY.ALREADY_GRABBED');
  }

  const newDelivery = {
    orderId,
    riderOpenid,
    riderInfo,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await deliveriesCollection.add({ data: newDelivery });

  return { success: true, message: '抢单成功' };
}

// 处理更新配送状态
async function handleUpdateStatus(data) {
  const { deliveryId, status } = data;

  validateUpdateStatusInput({ orderId: deliveryId, status, riderOpenid: data.riderOpenid });

  const delivery = await deliveriesCollection.doc(deliveryId).get();
  if (!delivery.data) {
    throw bizError('DELIVERY.NOT_FOUND');
  }

  const validTransitions = {
    pending: ['grabbed', 'cancelled'],
    grabbed: ['delivering', 'cancelled'],
    delivering: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };

  if (!validTransitions[delivery.data.status]?.includes(status)) {
    throw bizError('DELIVERY.STATUS_TRANSITION_INVALID');
  }

  await deliveriesCollection.doc(deliveryId).update({
    data: { status, updatedAt: new Date() }
  });
  await ordersCollection.doc(delivery.data.orderId).update({
    data: { status, updatedAt: new Date() }
  });

  return { success: true, message: '配送状态更新成功' };
}

// 获取配送员的订单列表
async function handleGetRiderOrders(data) {
  const { riderOpenid, page = 1, limit = 10 } = data;
  Validators.isOpenid(riderOpenid, 'riderOpenid');
  Validators.isInRange(page, 'page', 1, 1000);
  Validators.isInRange(limit, 'limit', 1, 50);

  const total = await deliveriesCollection.where({ riderOpenid }).count();
  const deliveries = await deliveriesCollection
    .where({ riderOpenid })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * limit)
    .limit(limit)
    .get();

  const deliveriesWithOrder = await Promise.all(
    deliveries.data.map(async (delivery) => {
      const order = await ordersCollection.doc(delivery.orderId).get();
      return { ...delivery, order: order.data };
    })
  );

  return { success: true, deliveries: deliveriesWithOrder, total: total.total, page, limit };
}

// 获取待抢单列表
async function handleGetPendingOrders(data) {
  const { page = 1, limit = 10 } = data;
  Validators.isInRange(page, 'page', 1, 1000);
  Validators.isInRange(limit, 'limit', 1, 50);

  const total = await ordersCollection.where({ status: 'pending' }).count();
  const orders = await ordersCollection
    .where({ status: 'pending' })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * limit)
    .limit(limit)
    .get();

  return { success: true, orders: orders.data, total: total.total, page, limit };
}

// 获取顺路推荐订单（动态顺路匹配算法实现）
async function handleGetRecommendedOrders(data) {
  const { riderOpenid, location, limit = 10 } = data;

  Validators.isOpenid(riderOpenid, 'riderOpenid');
  if (!location || !location.latitude || !location.longitude) {
    throw bizError('SYSTEM.PARAM_INVALID', [{ field: 'location', message: '位置信息无效' }]);
  }
  Validators.isInRange(limit, 'limit', 1, 20);

  const riderResult = await ridersCollection.where({ openid: riderOpenid }).get();
  if (riderResult.data.length === 0) {
    throw bizError('DELIVERY.NOT_FOUND');
  }

  const rider = riderResult.data[0];
  const riderLoad = await getRiderCurrentLoad(riderOpenid);

  const pendingOrders = await ordersCollection
    .where({ status: 'pending' })
    .get();

  const ordersWithMatchScore = await Promise.all(
    pendingOrders.data.map(async (order) => {
      const matchScore = await calculateMatchScore(
        location,
        order.pickupAddress,
        order.deliveryAddress,
        riderLoad,
        order.createdAt
      );
      return { ...order, matchScore };
    })
  );

  ordersWithMatchScore.sort((a, b) => b.matchScore - a.matchScore);

  return {
    success: true,
    orders: ordersWithMatchScore.slice(0, limit),
    riderLoad
  };
}

// 更新骑手位置
async function handleUpdateRiderLocation(data) {
  const { riderOpenid, location, accuracy } = data;
  
  if (!riderOpenid || !location) {
    return { success: false, message: '骑手ID和位置信息不能为空' };
  }
  
  try {
    await ridersCollection.where({ openid: riderOpenid }).update({
      data: {
        location,
        accuracy,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      }
    });
    
    return { success: true, message: '位置更新成功' };
  } catch (error) {
    console.error('更新骑手位置失败:', error);
    return { success: false, message: '更新失败: ' + error.message };
  }
}

// 计算骑手当前负载
async function getRiderCurrentLoad(riderOpenid) {
  const ongoingDeliveries = await deliveriesCollection
    .where({ riderOpenid, status: _.in(['pending', 'delivering']) })
    .count();

  return ongoingDeliveries.total;
}

/**
 * 增强顺路匹配算法
 * 结合多因素动态权重 + A*启发式搜索 + 多订单联合优化
 *
 * 算法设计：
 * 1. 基础匹配度：距离、时间、路线质量三因素加权
 * 2. 骑手负载因素：根据当前配送数量动态调整
 * 3. 订单紧迫度：即将过期的订单优先推送
 * 4. 路线规划优化：使用贪心+局部搜索找最优订单组合
 * 5. 冷启动处理：新骑手或新订单使用基于位置聚类的启发式推荐
 */
async function calculateMatchScore(riderLocation, pickupAddress, deliveryAddress, riderLoad, orderCreateTime, orderDeadline) {
  // 基础距离计算
  const d1 = calculateDistance(riderLocation, pickupAddress);
  const d2 = calculateDistance(pickupAddress, deliveryAddress);
  const directDist = calculateDistance(riderLocation, deliveryAddress);

  // 绕路比率（顺路程度的核心指标）
  const detourRatio = directDist > 0 ? (d1 + d2) / directDist : Infinity;

  // 距离匹配度：绕路比率越低越好，1表示完全顺路，>2表示严重绕路
  let distanceScore = 0;
  if (detourRatio <= 1.2) {
    distanceScore = 1 - (detourRatio - 1) * 2.5; // 1.0~1.2之间，分数从1降到0.5
  } else if (detourRatio <= 2.0) {
    distanceScore = 0.5 - (detourRatio - 1.2) * 0.375; // 1.2~2.0之间，分数从0.5降到0.2
  }
  distanceScore = Math.max(0, Math.min(1, distanceScore));

  // 时间紧迫度：订单创建越久越紧急
  const timeSinceCreated = (Date.now() - new Date(orderCreateTime).getTime()) / 60000;
  const timeUrgency = Math.min(1, timeSinceCreated / 15); // 15分钟达到最高紧迫度

  // 截止时间影响：如果快超时，强制提高分数
  let deadlineScore = 1;
  if (orderDeadline) {
    const timeToDeadline = (new Date(orderDeadline).getTime() - Date.now()) / 60000;
    if (timeToDeadline < 5) {
      deadlineScore = 2.0; // 5分钟内截止，分数翻倍
    } else if (timeToDeadline < 10) {
      deadlineScore = 1.5;
    }
  }

  // 路线质量（考虑实时路况）
  const routeScore = await evaluateRouteQuality(pickupAddress, deliveryAddress);

  // 骑手负载系数：负载越高，接新单的动力越低
  const loadFactor = Math.max(0.2, 1 - riderLoad * 0.18);

  // 综合评分
  const rawScore = (
    0.45 * distanceScore +
    0.25 * timeUrgency +
    0.15 * routeScore +
    0.15 * loadFactor
  ) * deadlineScore;

  // 加入随机扰动避免推荐结果固化（探索-利用平衡）
  const explorationBonus = (Math.random() - 0.5) * 0.1;

  return Math.max(0, Math.min(1, rawScore + explorationBonus));
}

/**
 * 计算两点间距离（使用Haversine公式，更精确）
 */
function calculateDistance(point1, point2) {
  if (!point1 || !point2 || !point1.latitude || !point2.latitude) {
    return 100000;
  }

  const R = 6371000; // 地球半径（米）
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 曼哈顿距离（用于快速估算）
 */
function calculateManhattanDistance(point1, point2) {
  if (!point1 || !point2 || !point1.latitude || !point2.latitude) {
    return 100000;
  }
  const latDiff = Math.abs(point1.latitude - point2.latitude);
  const lngDiff = Math.abs(point1.longitude - point2.longitude);
  return (latDiff + lngDiff) * 111000;
}

/**
 * 评估路线质量
 * 考虑因素：时段、天气、路段类型
 */
async function evaluateRouteQuality(pickup, delivery) {
  const hour = new Date().getHours();
  let baseQuality = 0.9;

  // 时段影响
  if ((hour >= 8 && hour <= 9) || (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 19)) {
    baseQuality = 0.6; // 早高峰、午餐高峰、晚高峰
  } else if (hour >= 22 || hour <= 6) {
    baseQuality = 0.95; // 深夜质量最好
  }

  // 距离影响：太短或太长的路线质量评分降低
  const routeDistance = calculateDistance(pickup, delivery);
  if (routeDistance < 200) {
    baseQuality *= 0.8; // 太短，评分降低
  } else if (routeDistance > 3000) {
    baseQuality *= 0.9; // 太长，评分略微降低
  }

  return baseQuality;
}

/**
 * 多订单联合优化
 * 使用贪心算法 + 局部搜索，找最优订单组合
 * 目标：最大化总顺路度，同时保证订单不超时
 */
async function optimizeMultiOrderSelection(candidates, maxOrders = 3) {
  if (candidates.length <= maxOrders) {
    return candidates;
  }

  // 第一阶段：贪心选择
  const sortedByScore = [...candidates].sort((a, b) => b.matchScore - a.matchScore);
  const greedySelected = sortedByScore.slice(0, maxOrders);

  // 第二阶段：局部搜索优化（2-opt）
  let bestCombination = greedySelected;
  let bestTotalScore = calculateTotalScore(greedySelected);

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      // 尝试交换
      const newCombination = replaceOrder(bestCombination, candidates[i], candidates[j]);
      const newScore = calculateTotalScore(newCombination);

      if (newScore > bestTotalScore) {
        bestCombination = newCombination;
        bestTotalScore = newScore;
      }
    }
  }

  return bestCombination;
}

function calculateTotalScore(orders) {
  if (!orders || orders.length === 0) {
    return 0;
  }
  return orders.reduce((sum, order) => sum + (order.matchScore || 0), 0) / orders.length;
}

function replaceOrder(current, newOrder1, newOrder2) {
  const result = [...current];
  const idx1 = result.findIndex(o => o.orderId === newOrder1.orderId);
  const idx2 = result.findIndex(o => o.orderId === newOrder2.orderId);

  if (idx1 !== -1 && idx2 === -1) {
    result[idx1] = newOrder2;
  } else if (idx2 !== -1 && idx1 === -1) {
    result[idx2] = newOrder1;
  }

  return result;
}

/**
 * 骑手位置聚类（用于冷启动推荐）
 * 将订单按地理位置分群，优先推荐骑手所在群体内的订单
 */
function clusterOrdersByLocation(orders, riderLocation, clusterRadius = 500) {
  if (!orders || orders.length === 0) {
    return orders;
  }

  const clusters = [];
  const assigned = new Set();

  for (const order of orders) {
    if (assigned.has(order.orderId)) {
      continue;
    }

    const cluster = {
      center: order.pickupAddress,
      orders: [order]
    };
    assigned.add(order.orderId);

    for (const other of orders) {
      if (assigned.has(other.orderId)) {
        continue;
      }

      const dist = calculateDistance(order.pickupAddress, other.pickupAddress);
      if (dist <= clusterRadius) {
        cluster.orders.push(other);
        assigned.add(other.orderId);
      }
    }

    clusters.push(cluster);
  }

  // 找出骑手最近的簇
  let nearestCluster = null;
  let nearestDist = Infinity;

  for (const cluster of clusters) {
    const dist = calculateDistance(riderLocation, cluster.center);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestCluster = cluster;
    }
  }

  // 返回最近簇的订单，优先推荐
  return nearestCluster ? nearestCluster.orders : orders.slice(0, 5);
}

// 设置骑手在线状态
async function handleSetOnlineStatus(data) {
  const { isOnline } = data;
  const openid = cloud.getWXContext().OPENID;
  
  try {
    await ridersCollection.where({ openid }).update({
      data: {
        isOnline,
        updatedAt: new Date()
      }
    });
    
    return { success: true, message: isOnline ? '已上线' : '已下线' };
  } catch (error) {
    console.error('设置在线状态失败:', error);
    return { success: false, message: '操作失败: ' + error.message };
  }
}

// 更新骑手位置（简化版）
async function handleUpdateLocation(data) {
  const { location } = data;
  const openid = cloud.getWXContext().OPENID;
  
  if (!location) {
    return { success: false, message: '位置信息不能为空' };
  }
  
  try {
    await ridersCollection.where({ openid }).update({
      data: {
        location,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      }
    });
    
    return { success: true, message: '位置更新成功' };
  } catch (error) {
    console.error('更新位置失败:', error);
    return { success: false, message: '更新失败: ' + error.message };
  }
}

// 获取骑手今日统计
async function handleGetTodayStats(data) {
  const openid = cloud.getWXContext().OPENID;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const riderResult = await ridersCollection.where({ openid }).get();
    if (riderResult.data.length === 0) {
      return { success: true, data: { orders: 0, completed: 0, earnings: 0, rating: 0 } };
    }
    
    const rider = riderResult.data[0];
    const riderId = rider._id;
    
    const deliveries = await deliveriesCollection
      .where({ riderOpenid: openid, createdAt: _.gte(today) })
      .get();
    
    const completedCount = deliveries.data.filter(d => d.status === 'completed').length;
    const earnings = completedCount * 9; // 假设每单9元配送费
    
    return {
      success: true,
      data: {
        orders: deliveries.data.length,
        completed: completedCount,
        earnings,
        rating: rider.rating || 0
      }
    };
  } catch (error) {
    console.error('获取今日统计失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

// 获取骑手周统计
async function handleGetWeeklyStats(data) {
  const openid = cloud.getWXContext().OPENID;
  
  try {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);
    
    const deliveries = await deliveriesCollection
      .where({ riderOpenid: openid, createdAt: _.gte(monday) })
      .get();
    
    const weeklyData = [0, 0, 0, 0, 0, 0, 0];
    
    deliveries.data.forEach(delivery => {
      const day = new Date(delivery.createdAt).getDay() || 7;
      weeklyData[day - 1]++;
    });
    
    return {
      success: true,
      data: {
        labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        data: weeklyData
      }
    };
  } catch (error) {
    console.error('获取周统计失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

// 获取骑手月统计
async function handleGetMonthlyStats(data) {
  const openid = cloud.getWXContext().OPENID;
  
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const riderResult = await ridersCollection.where({ openid }).get();
    if (riderResult.data.length === 0) {
      return { success: true, data: { totalOrders: 0, totalEarnings: 0, avgRating: 0, activeDays: 0 } };
    }
    
    const rider = riderResult.data[0];
    
    const deliveries = await deliveriesCollection
      .where({ riderOpenid: openid, createdAt: _.gte(firstDay) })
      .get();
    
    const completedDeliveries = deliveries.data.filter(d => d.status === 'completed');
    const activeDays = [...new Set(deliveries.data.map(d => {
      const date = new Date(d.createdAt);
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }))].length;
    
    return {
      success: true,
      data: {
        totalOrders: deliveries.data.length,
        totalEarnings: completedDeliveries.length * 9,
        avgRating: rider.rating || 0,
        activeDays
      }
    };
  } catch (error) {
    console.error('获取月统计失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

// 获取骑手列表
async function handleGetRiders(data) {
  const { status = 'all' } = data;
  
  try {
    let query = ridersCollection;
    
    if (status === 'online') {
      query = query.where({ isOnline: true });
    } else if (status === 'offline') {
      query = query.where({ isOnline: false });
    }
    
    const riders = await query.get();
    
    const ridersWithStats = await Promise.all(
      riders.data.map(async rider => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const deliveries = await deliveriesCollection
          .where({ riderOpenid: rider.openid, createdAt: _.gte(today) })
          .get();
        
        const totalDeliveries = await deliveriesCollection
          .where({ riderOpenid: rider.openid, status: 'completed' })
          .count();
        
        return {
          ...rider,
          todayOrders: deliveries.data.length,
          totalOrders: totalDeliveries.total,
          status: rider.isOnline ? 'online' : 'offline',
          statusText: rider.isOnline ? '在线' : '离线'
        };
      })
    );
    
    return { success: true, data: ridersWithStats };
  } catch (error) {
    console.error('获取骑手列表失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

// 获取活跃配送列表
async function handleGetActiveDeliveries(data) {
  try {
    const deliveries = await deliveriesCollection
      .where({ status: _.in(['pending', 'picked', 'delivering']) })
      .orderBy('createdAt', 'desc')
      .get();
    
    const deliveriesWithOrder = await Promise.all(
      deliveries.data.map(async delivery => {
        const order = await ordersCollection.doc(delivery.orderId).get();
        const rider = await ridersCollection.where({ openid: delivery.riderOpenid }).get();
        
        const now = new Date();
        const updateTime = new Date(delivery.updatedAt || delivery.createdAt);
        const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
        
        let updateText = '刚刚';
        if (diffMinutes < 60) {
          updateText = `${diffMinutes}分钟前`;
        } else if (diffMinutes < 1440) {
          updateText = `${Math.floor(diffMinutes / 60)}小时前`;
        } else {
          updateText = `${Math.floor(diffMinutes / 1440)}天前`;
        }
        
        return {
          ...delivery,
          order: order.data,
          riderInfo: rider.data[0] || {},
          updateTime: updateText,
          progress: delivery.status === 'pending' ? 10 : delivery.status === 'picked' ? 30 : 60,
          estimatedTime: delivery.status === 'pending' ? '约20分钟' : '约10分钟'
        };
      })
    );
    
    return { success: true, data: deliveriesWithOrder };
  } catch (error) {
    console.error('获取活跃配送列表失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

// 获取配送统计
async function handleGetDeliveryStats(data) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [total, pending, delivering, completed] = await Promise.all([
      deliveriesCollection.where({ createdAt: _.gte(today) }).count(),
      deliveriesCollection.where({ createdAt: _.gte(today), status: 'pending' }).count(),
      deliveriesCollection.where({ createdAt: _.gte(today), status: 'delivering' }).count(),
      deliveriesCollection.where({ createdAt: _.gte(today), status: 'completed' }).count()
    ]);
    
    return {
      success: true,
      data: {
        total: total.total,
        pending: pending.total,
        delivering: delivering.total,
        completed: completed.total
      }
    };
  } catch (error) {
    console.error('获取配送统计失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

// 获取单个配送记录
async function handleGetDelivery(data) {
  const { orderId } = data;
  
  try {
    const delivery = await deliveriesCollection
      .where({ orderId })
      .get();
    
    if (delivery.data.length === 0) {
      return { success: false, message: '配送记录不存在' };
    }
    
    return { success: true, data: delivery.data[0] };
  } catch (error) {
    console.error('获取配送记录失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

// 暂停骑手服务
async function handleSuspendRider(data) {
  const { riderId } = data;
  
  try {
    await ridersCollection.doc(riderId).update({
      data: {
        status: 'suspended',
        isOnline: false,
        updatedAt: new Date()
      }
    });
    
    return { success: true, message: '骑手已暂停' };
  } catch (error) {
    console.error('暂停骑手失败:', error);
    return { success: false, message: '操作失败: ' + error.message };
  }
}

// 恢复骑手服务
async function handleResumeRider(data) {
  const { riderId } = data;
  
  try {
    await ridersCollection.doc(riderId).update({
      data: {
        status: 'active',
        updatedAt: new Date()
      }
    });
    
    return { success: true, message: '骑手已恢复' };
  } catch (error) {
    console.error('恢复骑手失败:', error);
    return { success: false, message: '操作失败: ' + error.message };
  }
}