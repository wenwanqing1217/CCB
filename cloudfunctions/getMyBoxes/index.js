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
    
    // 构建查询条件
    const where = { openid };
    
    // 根据前端传入的status筛选
    if (event.status && event.status !== 'all') {
      // 前端 status: 'active' | 'sold' | 'offline' | 'pending'
      where.status = event.status;
    }
    
    // 获取我的盲盒
    const result = await db.collection('boxes')
      .where(where)
      .orderBy('createdAt', 'desc')
      .get();
    
    return result.data;
  } catch (error) {
    console.error('获取我的盲盒失败', error);
    return [];
  }
};
