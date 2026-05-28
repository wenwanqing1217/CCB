// 更新订单状态云函数（委托给orderService）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 委托给orderService处理
exports.main = async (event, context) => {
  const orderService = require('../orderService/index.js');
  return await orderService.main({ ...event, action: 'updateStatus' }, context);
};
