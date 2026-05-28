// 获取可抢订单云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

function getDemoOrders() {
  const now = Date.now()
  return [
    {
      _id: 'demo_order_1',
      box_title: '惊喜文具盲盒',
      price: 19.9,
      delivery_fee: 5,
      from_dorm: '中园公寓',
      to_dorm: '苏园居',
      status: 'pending',
      create_time: now - 1800000,
      distance: 0.8
    },
    {
      _id: 'demo_order_2',
      box_title: '时尚饰品盲盒',
      price: 29.9,
      delivery_fee: 6,
      from_dorm: '中南公寓',
      to_dorm: '知行1栋',
      status: 'pending',
      create_time: now - 3600000,
      distance: 1.2
    },
    {
      _id: 'demo_order_3',
      box_title: '数码配件盲盒',
      price: 39.9,
      delivery_fee: 8,
      from_dorm: '新柏居',
      to_dorm: '敏学1栋',
      status: 'pending',
      create_time: now - 5400000,
      distance: 0.6
    }
  ]
}

exports.main = async (event, context) => {
  try {
    const { filter } = event
    
    let query = db.collection('orders').where({
      status: 'pending',
      isDeleted: false
    })
    
    if (filter && filter !== 'all') {
      query = query.where({ type: filter })
    }
    
    const orders = await query.orderBy('created_at', 'desc').get()
    
    if (orders.data.length === 0) {
      return getDemoOrders()
    }
    
    return orders.data
  } catch (error) {
    console.error('获取抢单数据失败:', error)
    return getDemoOrders()
  }
}