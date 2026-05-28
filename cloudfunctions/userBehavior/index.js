// 用户行为统计服务云函数
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { action, data } = event;
    
    switch (action) {
      case 'track':
        return await trackBehavior(data);
      case 'getStats':
        return await getBehaviorStats(data);
      case 'getUserActions':
        return await getUserActions(data);
      case 'getHotBoxes':
        return await getHotBoxes(data);
      default:
        return {
          success: false,
          message: '无效的操作'
        };
    }
  } catch (error) {
    console.error('用户行为统计服务错误:', error);
    return {
      success: false,
      message: '服务错误'
    };
  }
};

// 追踪用户行为
async function trackBehavior(data) {
  const { openid, actionType, boxId, category, price, extra } = data;
  
  if (!openid || !actionType) {
    return {
      success: false,
      message: '参数错误'
    };
  }
  
  // 创建行为记录
  const behavior = await db.collection('userActions').add({
    openid: openid,
    actionType: actionType, // view/browse/click/buy/share/favorite
    boxId: boxId,
    category: category,
    price: price,
    extra: extra || {},
    createdAt: new Date()
  });
  
  return {
    success: true,
    message: '行为记录成功'
  };
}

// 获取用户行为统计
async function getBehaviorStats(data) {
  const { openid } = data;
  
  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    };
  }
  
  // 统计用户各种行为数量
  const stats = await db.collection('userActions')
    .where({ openid: openid })
    .get();
  
  const actionCounts = {};
  stats.data.forEach(action => {
    actionCounts[action.actionType] = (actionCounts[action.actionType] || 0) + 1;
  });
  
  return {
    success: true,
    data: {
      totalActions: stats.data.length,
      actionCounts: actionCounts
    }
  };
}

// 获取用户行为列表
async function getUserActions(data) {
  const { openid, limit = 20, offset = 0 } = data;
  
  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    };
  }
  
  const actions = await db.collection('userActions')
    .where({ openid: openid })
    .orderBy('createdAt', 'desc')
    .skip(offset)
    .limit(limit)
    .get();
  
  return {
    success: true,
    data: actions.data
  };
}

// 获取热门盲盒（基于浏览量）
async function getHotBoxes(data) {
  const { limit = 10 } = data;
  
  // 统计每个盲盒的浏览次数
  const actions = await db.collection('userActions')
    .where({ actionType: 'view' })
    .get();
  
  const boxViewCounts = {};
  actions.data.forEach(action => {
    if (action.boxId) {
      boxViewCounts[action.boxId] = (boxViewCounts[action.boxId] || 0) + 1;
    }
  });
  
  // 获取热门盲盒详情
  const hotBoxIds = Object.keys(boxViewCounts)
    .sort((a, b) => boxViewCounts[b] - boxViewCounts[a])
    .slice(0, limit);
  
  if (hotBoxIds.length === 0) {
    // 如果没有浏览记录，返回最新发布的盲盒
    const latestBoxes = await db.collection('boxes')
      .where({ isDeleted: false, status: 'available' })
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return {
      success: true,
      data: latestBoxes.data.map(box => ({
        ...box,
        viewCount: 0
      }))
    };
  }
  
  const hotBoxes = await db.collection('boxes')
    .where({
      _id: _.in(hotBoxIds),
      isDeleted: false,
      status: 'available'
    })
    .get();
  
  return {
    success: true,
    data: hotBoxes.data.map(box => ({
      ...box,
      viewCount: boxViewCounts[box._id] || 0
    }))
  };
}