// 获取用户信息云函数（委托给userService）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 委托给userService处理
exports.main = async (event, context) => {
  const userService = require('../userService/index.js');
  return await userService.main({ ...event, action: 'getUserInfo' }, context);
};
