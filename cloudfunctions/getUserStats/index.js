/**
 * getUserStats - 获取用户统计数据
 * 合并个人主页所需的所有统计信息
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext();
    const openid = OPENID;

    // 并行获取所有数据
    const [
      userRes,
      publishCount,
      soldCount,
      boughtCount,
      riderRes,
      merchantRes,
      unreadRes
    ] = await Promise.all([
      db.collection('users').where({ openid }).get(),
      db.collection('boxes').where({ openid }).count(),
      db.collection('orders').where({ sellerOpenid: openid, status: 'completed' }).count(),
      db.collection('orders').where({ buyerOpenid: openid }).count(),
      db.collection('rider_applies').where({ openid, status: 'approved' }).get(),
      db.collection('merchant_applies').where({ openid, status: 'approved' }).get(),
      db.collection('notifications').where({ openid, isRead: false }).count()
    ]);

    const user = userRes.data[0] || {};
    const score = user.lovePoints || user.score || 0;
    const blindBoxCoins = user.blindBoxCoins || 0;
    const walletBalance = user.walletBalance || 0;
    const certStatus = user.certStatus || 'none';
    const isRider = riderRes.data.length > 0;
    const isMerchant = merchantRes.data.length > 0;
    const riderLevel = user.riderLevel || 1;
    const todayEarnings = user.todayEarnings || 0;
    // 仅管理员角色允许 admin
    const isAdmin = user.role === 'admin';

    const certStatusTextMap = {
      'none': '未认证',
      'pending': '审核中',
      'verified': '已认证',
      'rejected': '认证失败'
    };

    return {
      stats: {
        publish: publishCount.total,
        sold: soldCount.total,
        bought: boughtCount.total,
        score
      },
      isRider,
      isMerchant,
      isAdmin,
      certStatus,
      certStatusText: certStatusTextMap[certStatus] || '未认证',
      riderLevel,
      todayEarnings,
      walletBalance,
      blindBoxCoins,
      unreadCount: unreadRes.total,
      success: true
    };
  } catch (error) {
    console.error('获取用户统计失败', error);
    // 降级返回基本数据
    return {
      stats: { publish: 0, sold: 0, bought: 0, score: 0 },
      isRider: false,
      isMerchant: false,
      isAdmin: false,
      certStatus: 'none',
      certStatusText: '未认证',
      riderLevel: 1,
      todayEarnings: 0,
      walletBalance: 0,
      blindBoxCoins: 0,
      unreadCount: 0,
      success: true
    };
  }
};
