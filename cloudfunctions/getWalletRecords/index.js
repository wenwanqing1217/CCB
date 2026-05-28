const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();

exports.main = async () => {
  try {
    const openid = cloud.getWXContext().OPENID;
    const res = await db.collection('wallet_records')
      .where({ openid })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get();

    return { success: true, records: res.data || [] };
  } catch (error) {
    console.error('getWalletRecords 失败:', error);
    return { success: true, records: [] };
  }
};
