/**
 * deliveryService
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
      default: return { success: false, message: '鏈煡鎿嶄綔' };
    }
  } catch (error) {
    console.error('deliveryService 閿欒:', error);
    if (error.code) {
      return error.toJSON ? error.toJSON() : { success: false, message: error.message };
    }
    return { success: false, message: '鏈嶅姟鍣ㄩ敊璇' };
  }
};


function validateGrabInput({ orderId, riderOpenid, riderInfo }) {
  Validators.isNonEmptyString(orderId, 'orderId');
  Validators.isOpenid(riderOpenid, 'riderOpenid');
  if (!riderInfo || typeof riderInfo !== 'object') {
    throw bizError('SYSTEM.PARAM_INVALID', [{ field: 'riderInfo', message: '楠戞墜淇℃伅鏃犳晥' }]);
  }
}


function validateUpdateStatusInput({ orderId, status, riderOpenid }) {
  Validators.isNonEmptyString(orderId, 'orderId');
  Validators.isNonEmptyString(status, 'status');
  Validators.isOpenid(riderOpenid, 'riderOpenid');

  const validStatuses = ['pending', 'grabbed', 'delivering', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw bizError('DELIVERY.STATUS_TRANSITION_INVALID');
  }
}

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

  return { success: true, message: '鎶㈠崟鎴愬姛' };
}

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

  return { success: true, message: '閰嶉€佺姸鎬佹洿鏂版垚鍔' };
}

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

async function handleGetRecommendedOrders(data) {
  const { riderOpenid, location, limit = 10 } = data;

  Validators.isOpenid(riderOpenid, 'riderOpenid');
  if (!location || !location.latitude || !location.longitude) {
    throw bizError('SYSTEM.PARAM_INVALID', [{ field: 'location', message: '浣嶇疆淇℃伅鏃犳晥' }]);
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

async function handleUpdateRiderLocation(data) {
  const { riderOpenid, location, accuracy } = data;
  
  if (!riderOpenid || !location) {
    return { success: false, message: '楠戞墜ID鍜屼綅缃俊鎭笉鑳戒负绌' };
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
    
    return { success: true, message: '浣嶇疆鏇存柊鎴愬姛' };
  } catch (error) {
    console.error('鏇存柊楠戞墜浣嶇疆澶辫触:', error);
    return { success: false, message: '鏇存柊澶辫触: ' + error.message };
  }
}

async function getRiderCurrentLoad(riderOpenid) {
  const ongoingDeliveries = await deliveriesCollection
    .where({ riderOpenid, status: _.in(['pending', 'delivering']) })
    .count();

  return ongoingDeliveries.total;
}


async function calculateMatchScore(riderLocation, pickupAddress, deliveryAddress, riderLoad, orderCreateTime, orderDeadline) {
  const d1 = calculateDistance(riderLocation, pickupAddress);
  const d2 = calculateDistance(pickupAddress, deliveryAddress);
  const directDist = calculateDistance(riderLocation, deliveryAddress);

  const detourRatio = directDist > 0 ? (d1 + d2) / directDist : Infinity;

  let distanceScore = 0;
  if (detourRatio <= 1.2) {
    distanceScore = 1 - (detourRatio - 1) * 2.5;   
  } else if (detourRatio <= 2.0) {
    distanceScore = 0.5 - (detourRatio - 1.2) * 0.375;   
  }
  distanceScore = Math.max(0, Math.min(1, distanceScore));

  const timeSinceCreated = (Date.now() - new Date(orderCreateTime).getTime()) / 60000;
  const timeUrgency = Math.min(1, timeSinceCreated / 15); 
  let deadlineScore = 1;
  if (orderDeadline) {
    const timeToDeadline = (new Date(orderDeadline).getTime() - Date.now()) / 60000;
    if (timeToDeadline < 5) {
      deadlineScore = 2.0;     
    } else if (timeToDeadline < 10) {
      deadlineScore = 1.5;
    }
  }

  const routeScore = await evaluateRouteQuality(pickupAddress, deliveryAddress);

  const loadFactor = Math.max(0.2, 1 - riderLoad * 0.18);

  const rawScore = (
    0.45 * distanceScore +
    0.25 * timeUrgency +
    0.15 * routeScore +
    0.15 * loadFactor
  ) * deadlineScore;

  const explorationBonus = (Math.random() - 0.5) * 0.1;

  return Math.max(0, Math.min(1, rawScore + explorationBonus));
}


function calculateDistance(point1, point2) {
  if (!point1 || !point2 || !point1.latitude || !point2.latitude) {
    return 100000;
  }

  const R = 6371000;   const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const deltaLng = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


function calculateManhattanDistance(point1, point2) {
  if (!point1 || !point2 || !point1.latitude || !point2.latitude) {
    return 100000;
  }
  const latDiff = Math.abs(point1.latitude - point2.latitude);
  const lngDiff = Math.abs(point1.longitude - point2.longitude);
  return (latDiff + lngDiff) * 111000;
}


async function evaluateRouteQuality(pickup, delivery) {
  const hour = new Date().getHours();
  let baseQuality = 0.9;

  if ((hour >= 8 && hour <= 9) || (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 19)) {
    baseQuality = 0.6;   
  } else if (hour >= 22 || hour <= 6) {
    baseQuality = 0.95;   
  }

  const routeDistance = calculateDistance(pickup, delivery);
  if (routeDistance < 200) {
    baseQuality *= 0.8;   
  } else if (routeDistance > 3000) {
    baseQuality *= 0.9;   
  }

  return baseQuality;
}


async function optimizeMultiOrderSelection(candidates, maxOrders = 3) {
  if (candidates.length <= maxOrders) {
    return candidates;
  }

  const sortedByScore = [...candidates].sort((a, b) => b.matchScore - a.matchScore);
  const greedySelected = sortedByScore.slice(0, maxOrders);

  let bestCombination = greedySelected;
  let bestTotalScore = calculateTotalScore(greedySelected);

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
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

  let nearestCluster = null;
  let nearestDist = Infinity;

  for (const cluster of clusters) {
    const dist = calculateDistance(riderLocation, cluster.center);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestCluster = cluster;
    }
  }

  return nearestCluster ? nearestCluster.orders : orders.slice(0, 5);
}

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
    
    return { success: true, message: isOnline ? '宸蹭笂绾' : '宸蹭笅绾' };
  } catch (error) {
    console.error('璁剧疆鍦ㄧ嚎鐘舵€佸け璐?', error);
    return { success: false, message: '鎿嶄綔澶辫触: ' + error.message };
  }
}

async function handleUpdateLocation(data) {
  const { location } = data;
  const openid = cloud.getWXContext().OPENID;
  
  if (!location) {
    return { success: false, message: '浣嶇疆淇℃伅涓嶈兘涓虹┖' };
  }
  
  try {
    await ridersCollection.where({ openid }).update({
      data: {
        location,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      }
    });
    
    return { success: true, message: '浣嶇疆鏇存柊鎴愬姛' };
  } catch (error) {
    console.error('鏇存柊浣嶇疆澶辫触:', error);
    return { success: false, message: '鏇存柊澶辫触: ' + error.message };
  }
}

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
    const earnings = completedCount * 9;     
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
    console.error('鑾峰彇浠婃棩缁熻澶辫触:', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}

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
        labels: ['鍛ㄤ竴', '鍛ㄤ簩', '鍛ㄤ笁', '鍛ㄥ洓', '鍛ㄤ簲', '鍛ㄥ叚', '鍛ㄦ棩'],
        data: weeklyData
      }
    };
  } catch (error) {
    console.error('鑾峰彇鍛ㄧ粺璁″け璐?', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}

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
    console.error('鑾峰彇鏈堢粺璁″け璐?', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}

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
          statusText: rider.isOnline ? '鍦ㄧ嚎' : '绂荤嚎'
        };
      })
    );
    
    return { success: true, data: ridersWithStats };
  } catch (error) {
    console.error('鑾峰彇楠戞墜鍒楄〃澶辫触:', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}

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
        
        let updateText = '鍒氬垰';
        if (diffMinutes < 60) {
          updateText = `${diffMinutes}鍒嗛挓鍓峘`;
        } else if (diffMinutes < 1440) {
          updateText = `${Math.floor(diffMinutes / 60)}灏忔椂鍓峘`;
        } else {
          updateText = `${Math.floor(diffMinutes / 1440)}澶╁墠`;
        }
        
        return {
          ...delivery,
          order: order.data,
          riderInfo: rider.data[0] || {},
          updateTime: updateText,
          progress: delivery.status === 'pending' ? 10 : delivery.status === 'picked' ? 30 : 60,
          estimatedTime: delivery.status === 'pending' ? '绾?0鍒嗛挓' : '绾?0鍒嗛挓'
        };
      })
    );
    
    return { success: true, data: deliveriesWithOrder };
  } catch (error) {
    console.error('鑾峰彇娲昏穬閰嶉€佸垪琛ㄥけ璐?', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}

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
    console.error('鑾峰彇閰嶉€佺粺璁″け璐?', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}

async function handleGetDelivery(data) {
  const { orderId } = data;
  
  try {
    const delivery = await deliveriesCollection
      .where({ orderId })
      .get();
    
    if (delivery.data.length === 0) {
      return { success: false, message: '閰嶉€佽褰曚笉瀛樺湪' };
    }
    
    return { success: true, data: delivery.data[0] };
  } catch (error) {
    console.error('鑾峰彇閰嶉€佽褰曞け璐?', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}

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
    
    return { success: true, message: '楠戞墜宸叉殏鍋' };
  } catch (error) {
    console.error('鏆傚仠楠戞墜澶辫触:', error);
    return { success: false, message: '鎿嶄綔澶辫触: ' + error.message };
  }
}

async function handleResumeRider(data) {
  const { riderId } = data;
  
  try {
    await ridersCollection.doc(riderId).update({
      data: {
        status: 'active',
        updatedAt: new Date()
      }
    });
    
    return { success: true, message: '楠戞墜宸叉仮澶' };
  } catch (error) {
    console.error('鎭㈠楠戞墜澶辫触:', error);
    return { success: false, message: '鎿嶄綔澶辫触: ' + error.message };
  }
}

