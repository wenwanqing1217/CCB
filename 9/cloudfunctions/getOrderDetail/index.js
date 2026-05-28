// 获取订单详情云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { id } = event
    
    if (!id) {
      return {
        success: false,
        message: '订单ID不能为空'
      }
    }
    
    // 查询订单详情
    const order = await db.collection('orders').doc(id).get()
    
    if (!order.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }
    
    // 构建物流时间轴数据
    const logisticsTimeline = [
      {
        status: '骑手已取货',
        desc: '骑手已取到您的盲盒，正在配送中',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      },
      {
        status: '骑手到达取货点',
        desc: '骑手已到达取货地点',
        time: new Date(Date.now() - 5 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      },
      {
        status: '骑手接单',
        desc: '骑手已接单，预计15分钟送达',
        time: new Date(Date.now() - 10 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      },
      {
        status: '订单分配骑手',
        desc: '系统已为您分配骑手',
        time: new Date(Date.now() - 12 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      },
      {
        status: '订单创建成功',
        desc: '您的盲盒订单已创建，等待骑手接单',
        time: new Date(Date.now() - 15 * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
    ]
    
    return {
      success: true,
      data: {
        order: order.data,
        logisticsTimeline: logisticsTimeline
      }
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return {
      success: false,
      message: '获取订单详情失败'
    }
  }
}