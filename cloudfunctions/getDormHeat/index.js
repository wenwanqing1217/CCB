const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 宿舍热度缓存（数据每小时更新即可）
let _dormHeatCache = null;
let _dormHeatCacheTime = 0;
const DORM_HEAT_CACHE_TTL = 2 * 60 * 1000; // 2分钟

function getDormHeatFromCache() {
  if (_dormHeatCache && Date.now() - _dormHeatCacheTime < DORM_HEAT_CACHE_TTL) {
    return _dormHeatCache;
  }
  return null;
}

function setDormHeatCache(data) {
  _dormHeatCache = data;
  _dormHeatCacheTime = Date.now();
}

const MAIN_DORMS = [
  '中园公寓', '中南公寓', '新柏居', '苏园居', '知行1栋', '敏学1栋',
  '松柏居', '三友园', '四季园', '清水居', '新松居', '洪山园1栋'
];

const DEFAULT_DORMS = MAIN_DORMS.slice(0, 8);
const VALID_DORMS_SET = new Set(MAIN_DORMS);

function getLevel(count, maxCount) {
  if (!count || !maxCount) {
    return 'cold';
  }
  const ratio = count / maxCount;
  if (ratio >= 0.75) {
    return 'hot';
  }
  if (ratio >= 0.5) {
    return 'warm';
  }
  if (ratio >= 0.25) {
    return 'normal';
  }
  return 'cold';
}

function getDemoDormHeat() {
  const raw = [
    { dorm: '中园公寓', count: 86 },
    { dorm: '苏园居', count: 72 },
    { dorm: '中南公寓', count: 65 },
    { dorm: '知行1栋', count: 58 },
    { dorm: '新柏居', count: 51 },
    { dorm: '三友园', count: 47 },
    { dorm: '敏学1栋', count: 43 },
    { dorm: '松柏居', count: 38 }
  ];
  const maxCount = raw[0].count;
  return raw.map(item => ({
    ...item,
    level: getLevel(item.count, maxCount),
    percent: Math.round((item.count / maxCount) * 100)
  }));
}

function normalizeDorm(name) {
  if (!name || typeof name !== 'string') {
    return null;
  }
  const trimmed = name.trim();
  return VALID_DORMS_SET.has(trimmed) ? trimmed : null;
}

async function fetchRecentActivity(hours = 24) {
  try {
    const since = Date.now() - hours * 60 * 60 * 1000;
    
    const ordersPromise = db.collection('orders')
      .where({
        create_time: _.gte(new Date(since)),
        status: _.nin(['cancelled', 'deleted'])
      })
      .field({ from_dorm: 1, to_dorm: 1, box_id: 1, boxInfo: 1, address: 1 })
      .limit(200)
      .get();

    const boxesPromise = db.collection('boxes')
      .where({
        publish_time: _.gte(new Date(since)),
        isDeleted: false,
        status: 'available'
      })
      .field({ from_dorm: 1, sales: 1 })
      .limit(100)
      .get();

    const [ordersRes, boxesRes] = await Promise.all([ordersPromise, boxesPromise]);
    return { orders: ordersRes.data, boxes: boxesRes.data };
  } catch (error) {
    console.error('获取活动数据失败:', error);
    return { orders: [], boxes: [] };
  }
}

function aggregateActivity(orders, boxes) {
  const counts = {};
  
  orders.forEach(order => {
    const from = normalizeDorm(order.from_dorm || 
      (order.boxInfo && order.boxInfo.from_dorm) || 
      (order.address && order.address.from_dorm));
    const to = normalizeDorm(order.to_dorm || 
      (order.boxInfo && order.boxInfo.to_dorm) || 
      (order.address && order.address.to_dorm));
    
    if (from) {
      counts[from] = (counts[from] || 0) + 1;
    }
    if (to && to !== from) {
      counts[to] = (counts[to] || 0) + 1;
    }
  });

  boxes.forEach(box => {
    const dorm = normalizeDorm(box.from_dorm);
    if (dorm) {
      const sales = Number(box.sales) || 0;
      counts[dorm] = (counts[dorm] || 0) + (sales > 0 ? sales : 1);
    }
  });

  return counts;
}

function buildRanking(counts) {
  const ranked = DEFAULT_DORMS.map(dorm => ({
    dorm,
    count: counts[dorm] || 0
  }));

  ranked.sort((a, b) => b.count - a.count);
  
  const top = ranked.slice(0, 8);
  const maxCount = top[0]?.count || 0;

  return top.map(item => ({
    ...item,
    level: getLevel(item.count, maxCount),
    percent: maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
  }));
}

exports.main = async (event) => {
  try {
    console.time('getDormHeat');
    
    // 检查缓存
    const cached = getDormHeatFromCache();
    if (cached) {
      console.timeEnd('getDormHeat');
      return cached;
    }
    
    const { orders, boxes } = await fetchRecentActivity(24);
    
    if (orders.length === 0 && boxes.length === 0) {
      console.timeEnd('getDormHeat');
      return {
        success: true,
        data: getDemoDormHeat(),
        meta: {
          version: 3,
          windowHours: 24,
          orderTotal: 0,
          boxTotal: 0,
          activityTotal: 0,
          isDemo: true,
          updatedAt: Date.now()
        }
      };
    }

    const counts = aggregateActivity(orders, boxes);
    const dormHeat = buildRanking(counts);
    const activityTotal = Object.values(counts).reduce((sum, n) => sum + n, 0);

    console.timeEnd('getDormHeat');
    const result = {
      success: true,
      data: dormHeat,
      meta: {
        version: 3,
        windowHours: 24,
        orderTotal: orders.length,
        boxTotal: boxes.length,
        activityTotal,
        isDemo: false,
        updatedAt: Date.now()
      }
    };
    setDormHeatCache(result);
    return result;
  } catch (error) {
    console.error('获取宿舍热度失败:', error);
    return {
      success: false,
      error: error.message,
      data: getDemoDormHeat(),
      meta: { isDemo: true, version: 3 }
    };
  }
};