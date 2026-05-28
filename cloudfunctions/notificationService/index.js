// 通知服务云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { action, data } = event
    
    switch (action) {
      case 'sendNotification':
        return await sendNotification(data)
      case 'getNotifications':
        return await getNotifications(data)
      case 'markAsRead':
        return await markAsRead(data)
      default:
        return {
          success: false,
          message: '无效的操作'
        }
    }
  } catch (error) {
    console.error('通知服务错误:', error)
    return {
      success: false,
      message: '通知服务错误'
    }
  }
}

// 发送通知
async function sendNotification(data) {
  const { openid, title, content, type, relatedId } = data
  
  if (!openid || !title || !content) {
    return {
      success: false,
      message: '参数错误'
    }
  }
  
  // 创建通知
  const notification = await db.collection('notifications').add({
    openid: openid,
    title: title,
    content: content,
    type: type || 'system',
    relatedId: relatedId,
    read: false,
    createdAt: new Date()
  })
  
  // 推送模板消息（需要配置模板）
  try {
    await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId: 'your-template-id', // 需要在小程序后台配置
      page: relatedId ? `/pages/box-detail/box-detail?id=${relatedId}` : '/pages/index/index',
      data: {
        thing1: {
          value: title
        },
        thing2: {
          value: content
        }
      }
    })
  } catch (err) {
    console.error('推送模板消息失败:', err)
    // 推送失败不影响通知创建
  }
  
  return {
    success: true,
    message: '通知发送成功'
  }
}

// 获取通知列表
async function getNotifications(data) {
  const { openid, limit = 20, offset = 0 } = data
  
  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    }
  }
  
  const notifications = await db.collection('notifications')
    .where({ openid: openid })
    .orderBy('createdAt', 'desc')
    .skip(offset)
    .limit(limit)
    .get()
  
  return {
    success: true,
    data: notifications.data
  }
}

// 标记通知为已读
async function markAsRead(data) {
  const { notificationId, openid } = data
  
  if (!notificationId || !openid) {
    return {
      success: false,
      message: '参数错误'
    }
  }
  
  await db.collection('notifications')
    .doc(notificationId)
    .where({ openid: openid })
    .update({
      read: true
    })
  
  return {
    success: true,
    message: '通知已标记为已读'
  }
}