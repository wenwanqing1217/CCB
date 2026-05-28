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
    
    // 检查订单（对应论文4.3.3 订单集合）
    const order = await db.collection('orders').doc(orderId).get()
    if (!order.data || order.data.status !== 'pending') {
      return { success: false, message: '订单不存在或已被抢' }
    }
    
    // 检查用户是否为骑手（对应论文4.3.1 用户集合）
    const user = await db.collection('users').where({
      _openid: openid, role: 'rider'
    }).get()
    
    if (user.data.length === 0) {
      return {
        success: false,
        message: '您不是骑手，无法抢单'
      }
    }
    
    // 更新订单状态为已抢单
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'grabbed',
        riderOpenid: openid,
        grabbed_at: new Date()
      }
    })
    
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