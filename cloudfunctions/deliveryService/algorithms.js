/**
 * 配送匹配算法模块
 * 包含距离计算、匹配度评分等核心算法
 */

function calculateDistance(point1, point2) {
  if (!point1 || !point2 || !point1.latitude || !point2.latitude) {
    return 100000;
  }

  const R = 6371000;
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

function calculateTotalScore(orders) {
  return orders.reduce((sum, order) => sum + (order.matchScore || 0), 0);
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

module.exports = {
  calculateDistance,
  calculateManhattanDistance,
  calculateMatchScore,
  evaluateRouteQuality,
  calculateTotalScore
};
