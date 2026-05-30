const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID;

    const result = await db.collection('merchant_applies')
      .where({
        openid: openid
      })
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (result.data.length > 0) {
      return result.data[0];
    }

    return null;
  } catch (error) {
    console.error('获取商家申请状态失败', error);
    return null;
  }
};
