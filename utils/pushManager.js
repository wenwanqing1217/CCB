// 推送管理工具

// 订阅消息模板ID
const TEMPLATE_IDS = {
  ORDER_STATUS: '你的订单状态模板ID', // 需要在微信公众平台配置
  NEW_ORDER: '你的新订单模板ID', // 需要在微信公众平台配置
  LOGISTICS_UPDATE: '你的物流更新模板ID' // 需要在微信公众平台配置
}

// 订阅消息
const subscribeMessage = async (templateId) => {
  try {
    const res = await wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        console.log('订阅消息成功', res)
      },
      fail: (error) => {
        console.error('订阅消息失败', error)
      }
    })
    return res
  } catch (error) {
    console.error('订阅消息异常', error)
    return { [templateId]: 'reject' }
  }
}

// 订阅订单状态消息
export const subscribeOrderStatus = async () => {
  return await subscribeMessage(TEMPLATE_IDS.ORDER_STATUS)
}

// 订阅新订单消息（骑手）
export const subscribeNewOrder = async () => {
  return await subscribeMessage(TEMPLATE_IDS.NEW_ORDER)
}

// 订阅物流更新消息
export const subscribeLogisticsUpdate = async () => {
  return await subscribeMessage(TEMPLATE_IDS.LOGISTICS_UPDATE)
}

// 发送本地通知
export const sendLocalNotification = (title, content, data = {}) => {
  wx.showLocalNotification({
    title,
    content,
    data,
    success: (res) => {
      console.log('发送本地通知成功', res)
    },
    fail: (error) => {
      console.error('发送本地通知失败', error)
    }
  })
}

// 发送订单状态通知
export const sendOrderStatusNotification = async (orderId, status) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'pushService',
      data: {
        action: 'sendOrderStatusNotification',
        data: {
          orderId,
          status,
          openid: wx.getStorageSync('openid')
        }
      }
    })
    return res.result
  } catch (error) {
    console.error('发送订单状态通知失败', error)
    return { error: error.message }
  }
}

// 发送新订单通知给骑手
export const sendNewOrderNotification = async (orderId, riderOpenids) => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'pushService',
      data: {
        action: 'sendNewOrderNotification',
        data: {
          orderId,
          riderOpenids
        }
      }
    })
    return res.result
  } catch (error) {
    console.error('发送新订单通知失败', error)
    return { error: error.message }
  }
}

// 检查订阅状态
export const checkSubscribeStatus = () => {
  // 这里可以通过云函数查询用户的订阅状态
  // 暂时返回默认值
  return {
    orderStatus: true,
    newOrder: true,
    logisticsUpdate: true
  }
}

export default {
  subscribeOrderStatus,
  subscribeNewOrder,
  subscribeLogisticsUpdate,
  sendLocalNotification,
  sendOrderStatusNotification,
  sendNewOrderNotification,
  checkSubscribeStatus
}