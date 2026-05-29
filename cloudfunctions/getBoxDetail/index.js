/**
 * getBoxDetail - 获取盲盒详情云函数
 * 
 * 增加浏览次数，支持关联数据联合查询
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const { bizError, Validators, handleError } = require('../common/errors.js');

exports.main = async (event, context) => {
  try {
    const { boxId } = event;
    
    // 输入校验
    Validators.isNonEmptyString(boxId, 'boxId');
    
    // 查询盲盒
    const result = await db.collection('boxes')
      .doc(boxId)
      .get();
    
    if (!result.data) {
      throw bizError('BOX.NOT_FOUND');
    }
    
    const box = result.data;
    
    // 增加浏览次数（异步，不阻塞返回）
    db.collection('boxes').doc(boxId).update({
      data: {
        viewCount: _.inc(1)
      }
    }).catch(err => console.warn('增加浏览计数失败:', err));
    
    // 获取卖家信息
    let sellerInfo = null;
    if (box.sellerOpenid) {
      try {
        const sellerRes = await db.collection('users')
          .where({ _openid: box.sellerOpenid })
          .get();
        if (sellerRes.data.length > 0) {
          const seller = sellerRes.data[0];
          sellerInfo = {
            nickname: seller.nickname || '匿名用户',
            avatar: seller.avatar || '',
            rating: seller.rating || 5.0
          };
        }
      } catch (err) {
        console.warn('获取卖家信息失败:', err);
      }
    }
    
    return {
      success: true,
      data: {
        ...box,
        sellerInfo
      }
    };
  } catch (error) {
    console.error('获取盲盒详情失败', error);
    if (error.code) {
      return error.toJSON ? error.toJSON() : { 
        success: false, 
        message: error.message 
      };
    }
    return handleError(error);
  }
};
