/**
 * grabOrder - 抢单云函数
 * 
 * 使用原子操作确保并发安全，防止超卖
 * 同一个订单只会被一个骑手抢到
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const { bizError, Validators, ErrorCodes, handleError } = require('../common/errors.js');

exports.main = async (event, context) => {
  try {
    const { orderId } = event;
    const openid = cloud.getWXContext().OPENID;
    
    // 输入校验
    Validators.isNonEmptyString(orderId, 'orderId');
    Validators.isNonEmptyString(openid, 'openid');
    
    // 查询订单是否存在
    const order = await db.collection('orders').doc(orderId).get();
    if (!order.data) {
      throw bizError('ORDER.NOT_FOUND');
    }
    
    // 检查订单状态
    if (order.data.status !== 'pending') {
      throw bizError('DELIVERY.ORDER_NOT_PENDING');
    }
    
    // 检查不能抢自己的单
    if (order.data.sellerOpenid === openid) {
      throw bizError('DELIVERY.RIDER_CANNOT_GRAB_OWN');
    }
    
    // 原子性更新：只有订单状态仍为 pending 时才能抢成功
    // 这是防止并发超卖的关键——使用 where + update 组合
    const updateResult = await db.collection('orders')
      .where({
        _id: orderId,
        status: 'pending'
      })
      .update({
        data: {
          status: 'grabbed',
          riderOpenid: openid,
          grabbedAt: db.serverDate()
        }
      });
    
    if (updateResult.stats.updated === 0) {
      throw bizError('DELIVERY.ALREADY_GRABBED');
    }
    
    // 更新骑手状态
    await db.collection('riders').where({
      _openid: openid
    }).update({
      data: {
        currentOrders: _.inc(1),
        lastGrabTime: db.serverDate()
      }
    });
    
    // 创建配送记录
    await db.collection('deliveries').add({
      data: {
        orderId: orderId,
        riderOpenid: openid,
        status: 'grabbed',
        pickupAddress: order.data.pickupAddress || '',
        deliveryAddress: order.data.deliveryAddress || '',
        grabbedAt: db.serverDate(),
        createdAt: db.serverDate()
      }
    });
    
    // 发送通知给卖家
    try {
      await db.collection('notifications').add({
        data: {
          receiverOpenid: order.data.sellerOpenid,
          type: 'order_grabbed',
          title: '订单已被接单',
          content: '您的订单已被骑手接单，正在配送中',
          orderId: orderId,
          isRead: false,
          createdAt: db.serverDate()
        }
      });
    } catch (notifyErr) {
      // 通知失败不影响主流程
      console.warn('发送通知失败:', notifyErr);
    }
    
    return {
      success: true,
      message: '抢单成功'
    };
  } catch (error) {
    console.error('grabOrder 错误:', error);
    if (error.code) {
      return error.toJSON ? error.toJSON() : { 
        success: false, 
        message: error.message,
        error: error
      };
    }
    return handleError(error);
  }
};
