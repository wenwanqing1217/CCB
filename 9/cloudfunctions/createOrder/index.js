// 云函数入口文�?
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函�?
exports.main = async (event, context) => {
  try {
    const { box_id, delivery_fee } = event
    const openid = cloud.getWXContext().OPENID
    
    // 获取盲盒信息
    const box = await db.collection('boxes')
      .doc(box_id)
      .get()
    
    if (!box.data) {
      return {
        success: false,
        error: '盲盒不存�?
      }
    }
    
    // 创建订单
    const result = await db.collection('orders')
      .add({
        data: {
          box_id,
          buyer_id: openid,
          seller_id: box.data._openid,
          delivery_fee,
          delivery_status: 'pending', // 待发�?
          create_time: Date.now()
        }
      })
    
    // 更新盲盒状�?
    await db.collection('boxes')
      .doc(box_id)
      .update({
        data: {
          status: 'sold'
        }
      })
    
    return {
      success: true,
      orderId: result._id
    }
  } catch (error) {
    console.error('创建订单失败', error)
    return {
      success: false,
      error: error.message
    }
  }
}