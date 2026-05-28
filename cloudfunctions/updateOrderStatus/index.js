// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { orderId, status } = event
    
    // 更新订单状态
    await db.collection('orders')
      .doc(orderId)
      .update({
        data: {
          delivery_status: status
        }
      })
    
    return {
      success: true
    }
  } catch (error) {
    console.error('更新订单状态失败', error)
    return {
      success: false,
      error: error.message
    }
  }
}
