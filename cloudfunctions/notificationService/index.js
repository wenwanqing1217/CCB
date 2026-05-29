/**
 * notificationService
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { action, data } = event;

    switch (action) {
      case 'sendNotification':
        return await sendNotification(data);
      case 'getNotifications':
        return await getNotifications(data);
      case 'markAsRead':
        return await markAsRead(data);
      default:
        return {
          success: false,
          message: '无效的操作'
        };
    }
  } catch (error) {
    console.error('通知服务错误:', error);
    return {
      success: false,
      message: '通知服务错误'
    };
  }
};

async function sendNotification(data) {
  const { openid, title, content, type, relatedId } = data;

  if (!openid || !title || !content) {
    return {
      success: false,
      message: '参数错误'
    };
  }

  const notification = await db.collection('notifications').add({
    openid: openid,
    title: title,
    content: content,
    type: type || 'system',
    relatedId: relatedId,
    read: false,
    createdAt: new Date()
  });

  try {
    // TODO: 推送模板消息（需要配置模板）
  } catch (e) {
    console.error('模板消息推送失败:', e);
  }

  return {
    success: true,
    message: '发送成功',
    data: {
      notificationId: notification.id
    }
  };
}

async function getNotifications(data) {
  const { openid, limit = 20, offset = 0 } = data;

  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    };
  }

  const notifications = await db.collection('notifications')
    .where({ openid })
    .orderBy('createdAt', 'desc')
    .skip(offset)
    .limit(limit)
    .get();

  const unreadCount = await db.collection('notifications')
    .where({ openid, read: false })
    .count();

  return {
    success: true,
    data: {
      list: notifications.data,
      total: unreadCount.total
    }
  };
}

async function markAsRead(data) {
  const { notificationId } = data;

  if (!notificationId) {
    return {
      success: false,
      message: '通知ID不能为空'
    };
  }

  await db.collection('notifications').doc(notificationId).update({
    data: {
      read: true
    }
  });

  return {
    success: true,
    message: '标记成功'
  };
}
