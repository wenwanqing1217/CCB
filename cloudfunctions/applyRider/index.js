/**
 * applyRider - 骑手申请云函数
 * 
 * 校验申请人信息，防止重复申请，记录完整的申请流程
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const { bizError, Validators } = require('../common/errors.js');

exports.main = async (event, context) => {
  const { userId, name, phone, dorm, address, idFront, idBack } = event;
  
  try {
    // 输入校验
    Validators.isNonEmptyString(userId, 'userId');
    Validators.isNonEmptyString(name, 'name');
    Validators.isNonEmptyString(phone, 'phone');
    Validators.isNonEmptyString(dorm, 'dorm');
    
    // 手机号格式校验（中国大陆手机号）
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw bizError('SYSTEM.PARAM_INVALID', [
        { field: 'phone', message: '手机号格式不正确' }
      ]);
    }
    
    const openid = cloud.getWXContext().OPENID;
    
    // 检查是否已有待审核或已通过的申请
    const existingApply = await db.collection('riderApplies')
      .where({
        _openid: openid,
        status: _.in(['pending', 'approved'])
      })
      .get();
    
    if (existingApply.data.length > 0) {
      const existing = existingApply.data[0];
      if (existing.status === 'approved') {
        return {
          success: false,
          message: '您已经是骑手，无需重复申请'
        };
      }
      return {
        success: false,
        message: '您已提交过申请，请等待审核'
      };
    }
    
    // 提交申请
    await db.collection('riderApplies').add({
      data: {
        userId,
        name,
        phone,
        dorm,
        address: address || '',
        idFront: idFront || '',
        idBack: idBack || '',
        status: 'pending',
        _openid: openid,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    
    return {
      success: true,
      message: '申请提交成功，请等待审核'
    };
  } catch (error) {
    console.error('骑手申请失败:', error);
    if (error.code) {
      return error.toJSON ? error.toJSON() : { 
        success: false, 
        message: error.message 
      };
    }
    return {
      success: false,
      message: '申请失败，请重试'
    };
  }
};
