// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { title, price, images, from_dorm, to_dorm, note } = event;
    const openid = cloud.getWXContext().OPENID;
    
    // 计算过期时间（7天）和捐赠时间（15天）
    const now = Date.now();
    const expire_time = now + 7 * 24 * 60 * 60 * 1000;
    const donate_time = now + 15 * 24 * 60 * 60 * 1000;
    
    // 发布盲盒
    const result = await db.collection('boxes')
      .add({
        data: {
          title,
          price,
          images,
          status: 'active',
          publish_time: now,
          expire_time,
          donate_time,
          from_dorm,
          to_dorm,
          note,
          _openid: openid
        }
      });
    
    return {
      success: true,
      boxId: result._id
    };
  } catch (error) {
    console.error('发布盲盒失败', error);
    return {
      success: false,
      error: error.message
    };
  }
};
