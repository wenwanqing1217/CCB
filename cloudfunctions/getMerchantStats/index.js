const cloud = require('wx-server-sdk');
const _ = cloud.database().command;

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID;

    // 获取已完成订单总数和总收入（price 已在订单中，无需再查盲盒表）
    const completedOrders = await db.collection('orders')
      .where({
        sellerOpenid: openid,
        status: 'completed'
      })
      .get()
      .then(res => res.data);

    const totalSales = completedOrders.length;
    const totalIncome = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

    // 获取在售盲盒数量
    const activeBoxes = await db.collection('boxes')
      .where({
        _openid: openid,
        status: 'available'
      })
      .count()
      .then(res => res.total);

    return {
      totalSales,
      totalIncome,
      activeBoxes
    };
  } catch (error) {
    console.error('Failed to get merchant stats:', error);
    return { totalSales: 0, totalIncome: 0, activeBoxes: 0 };
  }
};
