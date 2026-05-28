// 检查骑手状态云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    
    // 检查用户是否为骑手
    const user = await db.collection('users').where({
      _openid: openid,
      role: 'rider'
    }).get()
    
    return {
      success: true,
      isRider: user.data.length > 0
    }
  } catch (error) {
    console.error('检查骑手状态失败:', error)
    return {
      success: false,
      isRider: false,
      error: error.toString()
    }
  }
}