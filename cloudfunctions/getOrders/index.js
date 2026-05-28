// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { type, status } = event
    const openid = cloud.getWXContext().OPENID
    
    // 构建查询条件
    let query = db.collection('orders')
    
    // 类型筛选
    if (type === 'buy') {
      query = query.where({ buyer_id: openid })
    } else if (type === 'sell') {
      query = query.where({ seller_id: openid })
    } else {
      // 全部订单
      query = query.where({
        _or: [
          { buyer_id: openid },
          { seller_id: openid }
        ]
      })
    }
    
    // 状态筛选
    if (status && status !== 'all') {
      query = query.where({ delivery_status: status })
    }
    
    // 查询订单
    const orders = await query
      .orderBy('create_time', 'desc')
      .get()
      .then(res => res.data)
    
    // 为每个订单添加盲盒信息
    const ordersWithBoxInfo = await Promise.all(
      orders.map(async order => {
        const box = await db.collection('boxes')
          .doc(order.box_id)
          .get()
          .then(res => res.data)
        return {
          ...order,
          box_info: box
        }
      })
    )
    
    return ordersWithBoxInfo
  } catch (error) {
    console.error('获取订单列表失败', error)
    return []
  }
}
