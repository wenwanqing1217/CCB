const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()

exports.main = async (event, context) => {
  const { status = 'all' } = event
  
  try {
    let query = db.collection('orders').where({ type: 'delivery' })
    
    if (status !== 'all') {
      query = query.where({ status })
    }
    
    const result = await query.orderBy('createTime', 'desc').get()
    
    return {
      success: true,
      data: result.data.map(item => ({
        ...item,
        statusText: getStatusText(item.status),
        typeText: '配送订单'
      }))
    }
  } catch (error) {
    console.error('获取配送订单失败:', error)
    return {
      success: false,
      message: '获取订单失败'
    }
  }
}

function getStatusText(status) {
  const statusMap = {
    pending: '待接单',
    accepted: '已接单',
    picked: '已取货',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}