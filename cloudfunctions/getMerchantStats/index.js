// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID;
    
    // 获取总销量
    const totalSales = await db.collection('orders')
      .where({
        seller_id: openid,
        delivery_status: 'completed'
      })
      .count()
      .then(res => res.total);
    
    // 获取总收入
    const orders = await db.collection('orders')
      .where({
        seller_id: openid,
        delivery_status: 'completed'
      })
      .get()
      .then(res => res.data);
    
    let totalIncome = 0;
    for (const order of orders) {
      const box = await db.collection('boxes')
        .doc(order.box_id)
        .get()
        .then(res => res.data);
      if (box) {
        totalIncome += box.price || 0;
      }
    }
    
    // 获取在售盲盒数量
    const activeBoxes = await db.collection('boxes')
      .where({
        _openid: openid,
        status: 'active'
      })
      .count();

    return {
      totalSales,
      totalIncome,
      activeBoxes: activeBoxes.total
    };
  } catch (error) {
    console.error('Failed to get merchant stats:', error);
    return { totalSales: 0, totalIncome: 0, activeBoxes: 0 };
  }
};
