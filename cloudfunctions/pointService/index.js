/**
 * 积分商城服务
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { action, userId, points, goodsId } = event;
  
  try {
    switch (action) {
      case 'getBalance': {
        const user = await db.collection('users').doc(userId).get();
        return { success: true, data: user.data.points || 0 };
      }
      
      case 'addPoints': {
        await db.collection('users').doc(userId).update({
          data: { points: db.command.inc(points) }
        });
        await this.recordTransaction(userId, 'earn', points, '积分奖励');
        return { success: true, message: '积分增加成功' };
      }
      
      case 'spendPoints': {
        const user = await db.collection('users').doc(userId).get();
        if ((user.data.points || 0) < points) {
          return { success: false, error: '积分不足' };
        }
        await db.collection('users').doc(userId).update({
          data: { points: db.command.inc(-points) }
        });
        await this.recordTransaction(userId, 'spend', points, '积分消费');
        return { success: true, message: '积分消费成功' };
      }
      
      case 'exchangeGoods': {
        const goods = await db.collection('pointGoods').doc(goodsId).get();
        if (!goods.data) {
          return { success: false, error: '商品不存在' };
        }
        return this.spendPoints({ userId, points: goods.data.points });
      }
      
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

exports.recordTransaction = async (userId, type, amount, description) => {
  await db.collection('pointTransactions').add({
    data: {
      userId,
      type,
      amount,
      description,
      createdAt: new Date()
    }
  });
};