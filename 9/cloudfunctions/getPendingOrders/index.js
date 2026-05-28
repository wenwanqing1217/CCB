// 获取待抢订单云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 查询待抢单状态的订单
    const orders = await db.collection('orders').where({
      status: 'pending', // 待抢单状态
      isDeleted: false
    }).orderBy('created_at', 'desc').get()
    
    return orders.data
  } catch (error) {
    console.error('获取待抢订单失败:', error)
    return []
  }
}
