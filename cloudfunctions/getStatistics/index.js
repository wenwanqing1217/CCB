/**
 * 数据统计服务
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { type = 'overview', timeRange = '7d' } = event;
  
  try {
    const stats = {};
    
    if (type === 'overview' || type === 'users') {
      const userCount = await db.collection('users').count();
      stats.userCount = userCount.total;
      
      const newUsers = await db.collection('users')
        .where({ createdAt: db.command.gte(this.getDateRange(timeRange)) })
        .count();
      stats.newUsers = newUsers.total;
    }
    
    if (type === 'overview' || type === 'orders') {
      const orderCount = await db.collection('orders').count();
      stats.orderCount = orderCount.total;
      
      const completedOrders = await db.collection('orders')
        .where({ status: 'completed' })
        .count();
      stats.completedOrders = completedOrders.total;
    }
    
    if (type === 'overview' || type === 'boxes') {
      const boxCount = await db.collection('boxes').count();
      stats.boxCount = boxCount.total;
      
      const soldBoxes = await db.collection('orders')
        .where({ type: 'box', status: 'completed' })
        .count();
      stats.soldBoxes = soldBoxes.total;
    }
    
    if (type === 'overview' || type === 'riders') {
      const riderCount = await db.collection('riders')
        .where({ status: 'approved' })
        .count();
      stats.riderCount = riderCount.total;
    }
    
    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

exports.getDateRange = (range) => {
  const now = new Date();
  switch (range) {
    case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
};