/**
 * 通知服务云函数
 * 负责消息推送、通知查询、已读标记等操作
 *
 * 对应论文4.3章节 - 数据库设计
 * 通知集合结构（4.3.5）：
 * {
 *   _id: String,           // 通知ID，系统自动生成
 *   openid: String,        // 用户openid
 *   title: String,         // 通知标题
 *   content: String,       // 通知内容
 *   type: String,          // 通知类型：system/order/delivery
 *   relatedId: String,     // 关联ID（订单ID等）
 *   read: Boolean,         // 是否已读
 *   createdAt: Date        // 创建时间
 * }
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 云函数入口函数
 * @param {Object} event - 事件参数
 * @param {string} event.action - 操作类型（sendNotification/getNotifications/markAsRead）
 * @param {Object} event.data - 操作数据
 * @param {Object} context - 上下文参数
 * @returns {Object} - 操作结果
 */
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

/**
 * 发送通知
 * @param {Object} data - 通知数据
 * @param {string} data.openid - 用户openid
 * @param {string} data.title - 通知标题
 * @param {string} data.content - 通知内容
 * @param {string} data.type - 通知类型
 * @param {string} data.relatedId - 关联ID
 * @returns {Object} - 发送结果
 */
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

/**
 * 获取通知列表
 * @param {Object} data - 查询参数
 * @param {string} data.openid - 用户openid
 * @param {number} data.limit - 返回数量
 * @param {number} data.offset - 偏移量
 * @returns {Object} - 通知列表
 */
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

/**
 * 标记通知为已读
 * @param {Object} data - 更新参数
 * @param {string} data.notificationId - 通知ID
 * @returns {Object} - 更新结果
 */
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
