// 获取即将过期盲盒云函数（委托给boxService）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 委托给boxService处理
exports.main = async (event, context) => {
  const boxService = require('../boxService/index.js')
  return await boxService.main({ ...event, action: 'list' }, context)
}
