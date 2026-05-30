/**
 * orderService
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const ordersCollection = db.collection('orders');

const boxesCollection = db.collection('boxes');
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;

  try {
    switch (action) {
      case 'create':
        return await handleCreateOrder(data);
      case 'updateStatus':
        return await handleUpdateStatus(data);
      case 'list':
        return await handleListOrders(data);
      case 'detail':
        return await handleOrderDetail(data);
      default:
        return { success: false, message: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('订单服务云函数执行错误', error);
    return { success: false, message: '服务器错误: ' + error.message };
  }
};


async function handleCreateOrder(data) {
  const {
    boxId,
    buyerOpenid,
    sellerOpenid,
    price,
    paymentMethod,
    address,
    contact
  } = data;

  const validationError = validateOrderInput({ boxId, buyerOpenid, sellerOpenid, price, address, contact });
  if (validationError) {
    return { success: false, message: validationError };
  }

  if (buyerOpenid === sellerOpenid) {
    return { success: false, message: '不能购买自己的盲盒' };
  }

  try {
    // 原子操作：先锁定盲盒状态，防止并发超卖
    const updateResult = await boxesCollection.where({
      _id: boxId,
      status: 'available'
    }).update({
      data: {
        status: 'sold',
        updatedAt: new Date()
      }
    });

    if (updateResult.stats.updated === 0) {
      return { success: false, message: '盲盒不存在或已被购买' };
    }

    // 锁定成功后获取盲盒详情
    const box = await boxesCollection.doc(boxId).get();

    const newOrder = {
      boxId,
      boxInfo: box.data,
      buyerOpenid,
      sellerOpenid,
      price: Math.round(Number(price) * 100) / 100,
      paymentMethod: paymentMethod || 'wechat',
      address,
      contact,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await ordersCollection.add(newOrder);

    return {
      success: true,
      order: {
        ...newOrder,
        _id: result._id
      }
    };
  } catch (error) {
    console.error('创建订单失败:', error);
    return { success: false, message: '创建订单失败' };
  }
}


function validateOrderInput({ boxId, buyerOpenid, sellerOpenid, price, address, contact }) {
  if (!boxId || typeof boxId !== 'string') {
    return '盲盒信息无效';
  }
  if (!buyerOpenid || typeof buyerOpenid !== 'string') {
    return '买家信息无效';
  }
  if (!sellerOpenid || typeof sellerOpenid !== 'string') {
    return '卖家信息无效';
  }
  if (!price || isNaN(Number(price)) || Number(price) < 0) {
    return '价格无效';
  }
  if (!address || typeof address !== 'object') {
    return '配送地址无效';
  }
  if (!contact || typeof contact !== 'object') {
    return '联系方式无效';
  }
  if (!contact.phone && !contact.name) {
    return '联系方式不完整';
  }
  return null;
}


async function handleUpdateStatus(data) {
  const { orderId, status, riderOpenid } = data;
  
  try {
    const order = await ordersCollection.doc(orderId).get();
    if (!order.data) {
      return { success: false, message: '订单不存在' };
    }
    
    const oldOrder = order.data;
    
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'grabbed' && riderOpenid) {
      updateData.riderOpenid = riderOpenid;
    }
    
    await ordersCollection.doc(orderId).update({ data: updateData });
    
    await sendOrderStatusNotification(orderId, status, oldOrder);
    
    return {
      success: true,
      message: '订单状态更新成功'
    };
  } catch (error) {
    console.error('更新订单状态失败', error);
    return { success: false, message: '更新失败: ' + error.message };
  }
}


async function sendOrderStatusNotification(orderId, status, order) {
  try {
    const statusTextMap = {
      pending: '寰呮姠鍗',
      grabbed: '宸叉姠鍗',
      delivering: '閰嶉€佷腑',
      completed: '宸插畬鎴',
      cancelled: '宸插彇娑'
    };
    
    const statusText = statusTextMap[status] || status;
    const title = '璁㈠崟鐘舵€佹洿鏂';
    const content = '鎮ㄧ殑璁㈠崟宸?{statusText}';
    
    if (order.buyerOpenid) {
      await cloud.callFunction({
        name: 'notificationService',
        data: {
          action: 'sendNotification',
          data: {
            openid: order.buyerOpenid,
            title,
            content,
            type: 'order',
            relatedId: orderId
          }
        }
      });
    }
    
    if (order.sellerOpenid) {
      await cloud.callFunction({
        name: 'notificationService',
        data: {
          action: 'sendNotification',
          data: {
            openid: order.sellerOpenid,
            title,
            content,
            type: 'order',
            relatedId: orderId
          }
        }
      });
    }
    
  } catch (error) {
    console.error('鍙戦€佽鍗曠姸鎬侀€氱煡澶辫触:', error);
  }
}


async function handleListOrders(data) {
  const { openid, role, page = 1, limit = 10 } = data;
  
  try {
    let query;
    
    if (role === 'buyer') {
      query = ordersCollection.where({ buyerOpenid: openid });
    } else if (role === 'seller') {
      query = ordersCollection.where({ sellerOpenid: openid });
    } else {
      return { success: false, message: '瑙掕壊鏃犳晥' };
    }
    
    const total = await query.count();
    
    const orders = await query
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
      .get();
    
    return {
      success: true,
      orders: orders.data,
      total: total.total,
      page,
      limit
    };
  } catch (error) {
    console.error('鑾峰彇璁㈠崟鍒楄〃澶辫触:', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}


async function handleOrderDetail(data) {
  const { orderId } = data;
  
  try {
    const order = await ordersCollection.doc(orderId).get();
    
    if (!order.data) {
      return { success: false, message: '璁㈠崟涓嶅瓨鍦' };
    }
    
    return {
      success: true,
      order: order.data
    };
  } catch (error) {
    console.error('鑾峰彇璁㈠崟璇︽儏澶辫触:', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}
