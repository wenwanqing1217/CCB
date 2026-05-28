// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { status } = event
    const openid = cloud.getWXContext().OPENID
    
    // 构建查询条件 - 查询当前用户的所有订单（作为买家）
    let query = db.collection('orders').where({
      buyer_id: openid
    })
    
    // 状态筛选
    if (status && status !== 'all') {
      query = query.where({ status: status })
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
          .catch(() => null)
        
        return {
          _id: order._id,
          images: box ? box.images || [] : [],
          title: box ? box.title || '未知商品' : '未知商品',
          price: order.price || 0,
          deliveryFee: order.delivery_fee || 0,
          totalPrice: (order.price || 0) + (order.delivery_fee || 0),
          count: order.count || 1,
          from_dorm: order.from_dorm || '',
          to_dorm: order.to_dorm || '',
          status: order.status || 'pending',
          statusText: getStatusText(order.status),
          paid: order.paid || false,
          createTime: formatTime(order.create_time),
          tags: box ? box.tags || [] : [],
          rider: order.rider || null
        }
      })
    )
    
    return ordersWithBoxInfo
  } catch (error) {
    console.error('获取订单列表失败', error)
    return []
  }
}

function getStatusText(status) {
  const statusMap = {
    'pending': '待发货',
    'delivering': '配送中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || '待处理'
}

function formatTime(timestamp) {
  if (!timestamp) return '未知时间'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}