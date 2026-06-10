/**
 * 消息推送服务
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { toUser, title, content, type = 'normal', data = {} } = event;
  
  try {
    const notification = {
      _openid: toUser,
      title,
      content,
      type,
      data,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('notifications').add({ data: notification });

    return { success: true, message: '消息发送成功' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};