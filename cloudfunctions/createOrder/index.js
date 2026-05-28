// 云函数入口文件
// ============================
// 【架构升级说明】
// 当前：云开发单体实现
// 目标：拆分为 order-service（Spring Boot） + RocketMQ
//
// 升级后的架构：
// 1. 客户端 → API网关 → order-service
// 2. order-service 写入 MySQL
// 3. order-service 发送消息到 RocketMQ Topic: ORDER_CREATED
// 4. message-service 消费消息，推送订阅消息
// 5. delivery-service 消费消息，查找附近骑手
// ============================
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { box_id, delivery_fee } = event
    const openid = cloud.getWXContext().OPENID
    
    // ============================
    // 【架构升级示例代码】
    // 升级后这里会：
    // 1. 先查 Redis 缓存获取盲盒信息
    // 2. 缓存未命中则查 box-service（gRPC 调用）
    // 3. 使用分布式锁防止并发创建同一订单
    // ============================
    
    // 获取盲盒信息
    const box = await db.collection('boxes')
      .doc(box_id)
      .get()
    
    if (!box.data) {
      return {
        success: false,
        error: '盲盒不存在'
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
          delivery_status: 'pending', // 待发货
          create_time: Date.now()
        }
      })
    
    // ============================
    // 【架构升级示例代码】
    // 升级后这里会：
    // 1. 不直接更新盲盒状态，而是通过消息队列异步处理
    // 2. 发送消息到 RocketMQ
    // 3. box-service 消费消息更新盲盒状态
    // 4. 使用本地消息表保证最终一致性
    // ============================
    
    // 更新盲盒状态
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