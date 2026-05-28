// 获取可抢订单云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { filter } = event
    
    // 构建查询条件
    let query = db.collection('orders').where({
      status: 'pending', // 待抢单状态
      isDeleted: false
    })
    
    // 根据筛选条件过滤
    if (filter && filter !== 'all') {
      query = query.where({ type: filter })
    }
    
    // 按创建时间倒序排列
    const orders = await query.orderBy('created_at', 'desc').get()
    
    return orders.data
  } catch (error) {
    console.error('获取抢单数据失败:', error)
    return []
  }
}