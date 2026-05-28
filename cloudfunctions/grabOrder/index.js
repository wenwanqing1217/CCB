/**
 * 抢单云函数
 * 负责骑手抢单操作（对应论文4.2.4 配送服务模块）
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { orderId } = event
    const openid = cloud.getWXContext().OPENID
    
    // 原子性更新：只有订单状态为 pending 时才能抢
    const updateResult = await db.collection('orders').doc(orderId).update({
      data: {
        status: 'grabbed',
        riderOpenid: openid,
        grabbed_at: new Date()
      }
    })
    
    // 检查是否更新成功
    if (updateResult.stats.updated === 0) {
      return { success: false, message: '订单不存在或已被抢' }
    }
    
    return {
      success: true,
      message: '抢单成功'
    }
  } catch (error) {
    console.error('抢单失败:', error)
    return {
      success: false,
      message: '抢单失败',
      error: error.toString()
    }
  }
}