const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 发送模板消息
exports.sendTemplateMessage = async (event) => {
  try {
    const { touser, template_id, page, data, emphasis_keyword } = event;
    
    const result = await cloud.openapi.subscribeMessage.send({
      touser,
      template_id,
      page,
      data,
      emphasis_keyword
    });
    
    return result;
  } catch (error) {
    console.error('发送模板消息失败', error);
    return { error: error.message };
  }
};

// 发送订单状态通知
exports.sendOrderStatusNotification = async (orderId, status, openid) => {
  try {
    const statusTextMap = {
      'pending': '待接单',
      'accepted': '已接单',
      'picked': '已取货',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    
    const statusText = statusTextMap[status] || status;
    
    const template_id = '你的订单状态模板ID'; // 需要在微信公众平台配置
    
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      template_id,
      page: `pages/order-detail/order-detail?id=${orderId}`,
      data: {
        thing1: {
          value: `订单 ${orderId}`
        },
        phrase2: {
          value: statusText
        },
        time3: {
          value: new Date().toLocaleString('zh-CN')
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('发送订单状态通知失败', error);
    return { error: error.message };
  }
};

// 发送新订单通知给骑手
exports.sendNewOrderNotification = async (orderId, riderOpenids) => {
  try {
    const template_id = '你的新订单模板ID'; // 需要在微信公众平台配置
    
    for (const openid of riderOpenids) {
      await cloud.openapi.subscribeMessage.send({
        touser: openid,
        template_id,
        page: 'pages/rider/rider',
        data: {
          thing1: {
            value: `新订单 ${orderId}`
          },
          time2: {
            value: new Date().toLocaleString('zh-CN')
          },
          phrase3: {
            value: '待接单'
          }
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('发送新订单通知失败', error);
    return { error: error.message };
  }
};

exports.main = async (event, context) => {
  try {
    const { action, data } = event;
    
    switch (action) {
      case 'sendTemplateMessage':
        return await exports.sendTemplateMessage(data);
      case 'sendOrderStatusNotification':
        return await exports.sendOrderStatusNotification(data.orderId, data.status, data.openid);
      case 'sendNewOrderNotification':
        return await exports.sendNewOrderNotification(data.orderId, data.riderOpenids);
      default:
        return { error: '未知的操作类型' };
    }
  } catch (error) {
    console.error('推送服务错误', error);
    return { error: '服务暂时不可用，请稍后重试' };
  }
};