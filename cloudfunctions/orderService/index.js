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
        return { success: false, message: '鏈煡鎿嶄綔: ' + action };
    }
  } catch (error) {
    console.error('璁㈠崟鏈嶅姟浜戝嚱鏁版墽琛岄敊璇?', error);
    return { success: false, message: '鏈嶅姟鍣ㄩ敊璇? ' + error.message };
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

  try {
    const box = await boxesCollection.doc(boxId).get();
    if (!box.data || box.data.status !== 'available') {
      return { success: false, message: '鐩茬洅涓嶅瓨鍦ㄦ垨宸茶璐拱' };
    }

    if (buyerOpenid === sellerOpenid) {
      return { success: false, message: '涓嶈兘璐拱鑷繁鐨勭洸鐩' };
    }

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

    await boxesCollection.doc(boxId).update({
      data: {
        status: 'sold',
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      order: {
        ...newOrder,
        _id: result._id
      }
    };
  } catch (error) {
    console.error('鍒涘缓璁㈠崟澶辫触:', error);
    return { success: false, message: '鍒涘缓璁㈠崟澶辫触' };
  }
}


function validateOrderInput({ boxId, buyerOpenid, sellerOpenid, price, address, contact }) {
  if (!boxId || typeof boxId !== 'string') {
    return '鐩茬洅淇℃伅鏃犳晥';
  }
  if (!buyerOpenid || typeof buyerOpenid !== 'string') {
    return '涔板淇℃伅鏃犳晥';
  }
  if (!sellerOpenid || typeof sellerOpenid !== 'string') {
    return '鍗栧淇℃伅鏃犳晥';
  }
  if (!price || isNaN(Number(price)) || Number(price) < 0) {
    return '浠锋牸鏃犳晥';
  }
  if (!address || typeof address !== 'object') {
    return '閰嶉€佸湴鍧€鏃犳晥';
  }
  if (!contact || typeof contact !== 'object') {
    return '鑱旂郴鏂瑰紡鏃犳晥';
  }
  if (!contact.phone && !contact.name) {
    return '鑱旂郴鏂瑰紡涓嶅畬鏁';
  }
  return null;
}


async function handleUpdateStatus(data) {
  const { orderId, status, riderOpenid } = data;
  
  try {
    const order = await ordersCollection.doc(orderId).get();
    if (!order.data) {
      return { success: false, message: '璁㈠崟涓嶅瓨鍦' };
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
      message: '璁㈠崟鐘舵€佹洿鏂版垚鍔'
    };
  } catch (error) {
    console.error('鏇存柊璁㈠崟鐘舵€佸け璐?', error);
    return { success: false, message: '鏇存柊澶辫触: ' + error.message };
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
