/**
 * AI智能搜索服务
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { keyword, type = 'all', page = 0, size = 10 } = event;
  
  try {
    const results = [];
    
    if (type === 'all' || type === 'box') {
      const boxes = await db.collection('boxes')
        .where({
          _openid: db.command.exists(true),
          title: db.RegExp({ regexp: keyword, options: 'i' })
        })
        .skip(page * size)
        .limit(size)
        .get();
      results.push(...boxes.data.map(item => ({ ...item, type: 'box' })));
    }
    
    if (type === 'all' || type === 'order') {
      const orders = await db.collection('orders')
        .where({
          _openid: db.command.exists(true),
          orderNo: db.RegExp({ regexp: keyword, options: 'i' })
        })
        .skip(page * size)
        .limit(size)
        .get();
      results.push(...orders.data.map(item => ({ ...item, type: 'order' })));
    }
    
    if (type === 'all' || type === 'user') {
      const users = await db.collection('users')
        .where({
          nickName: db.RegExp({ regexp: keyword, options: 'i' })
        })
        .skip(page * size)
        .limit(size)
        .get();
      results.push(...users.data.map(item => ({ ...item, type: 'user' })));
    }
    
    return {
      success: true,
      data: results,
      total: results.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};