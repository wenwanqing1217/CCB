/**
 * 订单服务云函数
 * 负责订单创建、状态更新、列表查询等操作
 * 
 * 对应论文4.3章节 - 数据库设计
 * 订单集合结构（4.3.3）：
 * {
 *   _id: String,           // 订单ID，系统自动生成
 *   boxId: String,         // 盲盒ID（关联盲盒集合）
 *   buyerId: String,       // 买家ID（关联用户集合）
 *   sellerId: String,      // 卖家ID（关联用户集合）
 *   riderId: String,       // 骑手ID（关联用户集合，可为空）
 *   price: Number,         // 盲盒价格
 *   deliveryFee: Number,   // 配送费
 *   status: String,        // 订单状态
 *   address: Object,       // 配送地址信息
 *   createdAt: Date,       // 创建时间
 *   updatedAt: Date        // 更新时间
 * }
 * 
 * 订单状态流转（论文4.2.3）：
 * - pending: 待抢单（用户下单并支付成功后）
 * - grabbed: 已抢单（骑手抢单成功）
 * - delivering: 配送中（骑手点击"开始配送"）
 * - completed: 已完成（骑手确认送达）
 */

// 云函数入口文件
const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 获取数据库实例
const db = cloud.database();

// 获取订单集合引用（对应论文4.3.3 订单集合）
const ordersCollection = db.collection('orders');

// 获取盲盒集合引用（用于订单创建时验证盲盒状态）
const boxesCollection = db.collection('boxes');

/**
 * 云函数入口函数
 * @param {Object} event - 事件参数
 * @param {string} event.action - 操作类型（create/updateStatus/list/detail）
 * @param {Object} event.data - 操作数据
 * @param {Object} context - 上下文参数
 * @returns {Object} - 操作结果
 */
exports.main = async (event, context) => {
  const { action, data } = event;

  try {
    switch (action) {
      case 'create':
        console.log('执行创建订单操作');
        return await handleCreateOrder(data);
      case 'updateStatus':
        console.log('执行更新订单状态操作');
        return await handleUpdateStatus(data);
      case 'list':
        console.log('执行订单列表查询操作');
        return await handleListOrders(data);
      case 'detail':
        console.log('执行订单详情查询操作');
        return await handleOrderDetail(data);
      default:
        console.log('未知操作类型:', action);
        return { success: false, message: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('订单服务云函数执行错误:', error);
    return { success: false, message: '服务器错误: ' + error.message };
  }
};

/**
 * 处理创建订单
 * 对应论文4.3.3 订单集合 - 创建订单功能
 * @param {Object} data - 订单数据
 * @param {string} data.boxId - 盲盒ID
 * @param {string} data.buyerOpenid - 买家openid
 * @param {string} data.sellerOpenid - 卖家openid
 * @param {number} data.price - 盲盒价格
 * @param {string} data.paymentMethod - 支付方式
 * @param {Object} data.address - 配送地址
 * @param {Object} data.contact - 联系方式
 * @returns {Object} - 创建结果
 */
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
      return { success: false, message: '盲盒不存在或已被购买' };
    }

    if (buyerOpenid === sellerOpenid) {
      return { success: false, message: '不能购买自己的盲盒' };
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
    console.error('创建订单失败:', error);
    return { success: false, message: '创建订单失败' };
  }
}

/**
 * 校验订单参数
 * @param {Object} params - 待校验参数
 * @returns {string|null} - 错误信息或null
 */
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

/**
 * 处理更新订单状态
 * 对应论文4.3.3 订单集合 - 订单状态流转功能
 * @param {Object} data - 更新数据
 * @param {string} data.orderId - 订单ID
 * @param {string} data.status - 新状态（pending/grabbed/delivering/completed）
 * @param {string} data.riderOpenid - 骑手openid（抢单时传入）
 * @returns {Object} - 更新结果
 */
async function handleUpdateStatus(data) {
  const { orderId, status, riderOpenid } = data;
  
  try {
    // 查询订单是否存在
    const order = await ordersCollection.doc(orderId).get();
    if (!order.data) {
      return { success: false, message: '订单不存在' };
    }
    
    const oldOrder = order.data;
    
    // 更新订单状态（对应论文4.2.3订单状态流转）
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    // 如果是抢单操作，记录骑手ID
    if (status === 'grabbed' && riderOpenid) {
      updateData.riderOpenid = riderOpenid;
    }
    
    await ordersCollection.doc(orderId).update({ data: updateData });
    
    // 发送订单状态变更通知
    await sendOrderStatusNotification(orderId, status, oldOrder);
    
    return {
      success: true,
      message: '订单状态更新成功'
    };
  } catch (error) {
    console.error('更新订单状态失败:', error);
    return { success: false, message: '更新失败: ' + error.message };
  }
}

/**
 * 发送订单状态变更通知
 * @param {string} orderId - 订单ID
 * @param {string} status - 新状态
 * @param {Object} order - 订单信息
 */
async function sendOrderStatusNotification(orderId, status, order) {
  try {
    const statusTextMap = {
      pending: '待抢单',
      grabbed: '已抢单',
      delivering: '配送中',
      completed: '已完成',
      cancelled: '已取消'
    };
    
    const statusText = statusTextMap[status] || status;
    const title = '订单状态更新';
    const content = `您的订单已${statusText}`;
    
    // 发送给买家
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
    
    // 发送给卖家
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
    
    console.log('订单状态通知发送成功');
  } catch (error) {
    console.error('发送订单状态通知失败:', error);
  }
}

/**
 * 处理订单列表查询
 * 对应论文4.3.3 订单集合 - 查询订单列表功能
 * @param {Object} data - 查询参数
 * @param {string} data.openid - 用户openid
 * @param {string} data.role - 角色（buyer/seller）
 * @param {number} data.page - 页码（默认1）
 * @param {number} data.limit - 每页数量（默认10）
 * @returns {Object} - 订单列表
 */
async function handleListOrders(data) {
  const { openid, role, page = 1, limit = 10 } = data;
  
  try {
    let query;
    
    // 根据角色构建查询条件
    if (role === 'buyer') {
      query = ordersCollection.where({ buyerOpenid: openid });
    } else if (role === 'seller') {
      query = ordersCollection.where({ sellerOpenid: openid });
    } else {
      return { success: false, message: '角色无效' };
    }
    
    // 获取订单总数
    const total = await query.count();
    
    // 分页查询订单列表
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
    console.error('获取订单列表失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

/**
 * 处理订单详情查询
 * 对应论文4.3.3 订单集合 - 查询订单详情功能
 * @param {Object} data - 查询参数
 * @param {string} data.orderId - 订单ID
 * @returns {Object} - 订单详情
 */
async function handleOrderDetail(data) {
  const { orderId } = data;
  
  try {
    // 根据ID查询订单详情
    const order = await ordersCollection.doc(orderId).get();
    
    if (!order.data) {
      return { success: false, message: '订单不存在' };
    }
    
    return {
      success: true,
      order: order.data
    };
  } catch (error) {
    console.error('获取订单详情失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}