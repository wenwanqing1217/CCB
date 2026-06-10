// 安全服务云函数
const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 限流配置
const RATE_LIMITS = {
  publish: { limit: 5, window: 24 * 60 * 60 * 1000 },      // 24小时最多发布5个盲盒
  grab: { limit: 10, window: 24 * 60 * 60 * 1000 },         // 24小时最多抢10单
  donate: { limit: 3, window: 24 * 60 * 60 * 1000 },        // 24小时最多捐赠3次
  comment: { limit: 20, window: 1 * 60 * 60 * 1000 },       // 1小时最多评论20条
  like: { limit: 50, window: 1 * 60 * 60 * 1000 },          // 1小时最多点赞50次
  login: { limit: 5, window: 15 * 60 * 1000 }               // 15分钟最多登录5次
};

// 敏感词列表
const SENSITIVE_WORDS = [
  // 违禁物品
  '违禁', '枪支', '弹药', '毒品', '鸦片', '海洛因', '冰毒',
  // 色情低俗
  '色情', '色情图片', '色情视频', 'AV', '黄色',
  // 暴力恐怖
  '暴力', '恐怖', '杀人', '抢劫', '绑架',
  // 赌博诈骗
  '赌博', '彩票', '诈骗', '传销', '非法集资',
  // 政治敏感
  '反动', '邪教', '分裂', '台独', '港独'
];

// 角色权限配置
const ROLE_PERMISSIONS = {
  user: ['view', 'buy', 'sell', 'comment', 'like', 'donate', 'exchange'],
  rider: ['view', 'buy', 'sell', 'comment', 'like', 'grab', 'deliver'],
  admin: ['view', 'buy', 'sell', 'comment', 'like', 'manage', 'audit', 'delete']
};

exports.main = async (event, context) => {
  try {
    const { action, data } = event;
    
    switch (action) {
      case 'checkUserBehavior':
        return await checkUserBehavior(data);
      case 'verifyPayment':
        return await verifyPayment(data);
      case 'checkContent':
        return await checkContent(data);
      case 'reportContent':
        return await reportContent(data);
      case 'validateInput':
        return await validateInput(data);
      case 'checkPermission':
        return await checkPermission(data);
      case 'validateDevice':
        return await validateDevice(data);
      case 'generateCSRFToken':
        return await generateCSRFToken(data);
      case 'verifyCSRFToken':
        return await verifyCSRFToken(data);
      default:
        return {
          success: false,
          message: '无效的操作'
        };
    }
  } catch (error) {
    console.error('安全服务错误:', error);
    return {
      success: false,
      message: '安全服务错误'
    };
  }
};

// 检查用户行为（防刷单、限流）
async function checkUserBehavior(data) {
  const { openid, actionType, timestamp, deviceId } = data;
  
  if (!openid || !actionType) {
    return { success: false, message: '参数错误' };
  }
  
  // 获取限流配置
  const limitConfig = RATE_LIMITS[actionType];
  if (!limitConfig) {
    return { success: true, message: '操作正常' };
  }
  
  const { limit, window } = limitConfig;
  
  // 检查用户最近的操作记录
  const recentActions = await db.collection('userActions')
    .where({
      openid: openid,
      actionType: actionType,
      createdAt: _.gte(new Date(Date.now() - window))
    })
    .count();
  
  if (recentActions.total >= limit) {
    // 记录异常行为
    await logSecurityEvent(openid, 'rate_limit', { actionType, count: recentActions.total });
    
    return {
      success: false,
      message: '操作过于频繁，请稍后再试',
      isBlocked: true,
      retryAfter: Math.ceil(window / 1000 / 60) // 分钟
    };
  }
  
  // 记录用户操作
  await db.collection('userActions').add({
    openid,
    actionType,
    deviceId,
    createdAt: new Date(),
    timestamp
  });
  
  return { success: true, message: '操作正常' };
}

// 验证支付（防支付篡改）
async function verifyPayment(data) {
  const { orderId, amount, signature, timestamp, nonce } = data;
  
  if (!orderId || !amount || !signature || !nonce) {
    return { success: false, message: '参数错误' };
  }
  
  // 查询订单信息
  const order = await db.collection('orders').doc(orderId).get();
  
  if (!order.data) {
    await logSecurityEvent('system', 'payment_fraud', { orderId, reason: '订单不存在' });
    return { success: false, message: '订单不存在' };
  }
  
  // 验证金额
  if (order.data.price !== amount) {
    await logSecurityEvent(order.data.buyerId, 'payment_fraud', { orderId, expected: order.data.price, received: amount });
    return { success: false, message: '金额不匹配' };
  }
  
  // 验证订单状态
  if (order.data.status !== 'pending') {
    return { success: false, message: '订单状态不正确' };
  }
  
  // 验证签名（HMAC-SHA256）
  const expectedSignature = generateHMACSignature(orderId, amount, timestamp, nonce);
  if (signature !== expectedSignature) {
    await logSecurityEvent(order.data.buyerId, 'signature_fraud', { orderId, signature, expectedSignature });
    return { success: false, message: '签名验证失败' };
  }
  
  return { success: true, message: '支付验证通过' };
}

// 生成HMAC签名
function generateHMACSignature(orderId, amount, timestamp, nonce) {
  const secretKey = process.env.PAYMENT_SECRET || 'campus-blindbox-payment-secret-2024';
  const data = `${orderId}|${amount}|${timestamp}|${nonce}`;
  return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
}

// 检查内容（防内容违规）
async function checkContent(data) {
  const { content, type, openid } = data;
  
  if (!content) {
    return { success: false, message: '内容不能为空' };
  }
  
  // 检查内容长度
  if (content.length > 2000) {
    return { success: false, message: '内容过长' };
  }
  
  // 检查是否为空内容
  if (!content.trim()) {
    return { success: false, message: '内容不能为空' };
  }
  
  // 敏感词过滤
  const matchedWords = SENSITIVE_WORDS.filter(word => content.includes(word));
  
  if (matchedWords.length > 0) {
    await logSecurityEvent(openid, 'sensitive_content', { content, matchedWords, type });
    return {
      success: false,
      message: '内容包含敏感信息',
      needsReview: true,
      matchedWords
    };
  }
  
  // 检查是否包含恶意脚本（XSS防护）
  const xssPatterns = [/<script/i, /javascript:/i, /onload=/i, /onclick=/i];
  const hasXSS = xssPatterns.some(pattern => pattern.test(content));
  
  if (hasXSS) {
    await logSecurityEvent(openid, 'xss_attack', { content, type });
    return {
      success: false,
      message: '内容包含不安全脚本',
      needsReview: true
    };
  }
  
  return { success: true, message: '内容检查通过' };
}

// 举报内容
async function reportContent(data) {
  const { contentId, reporterOpenid, reason, type, content } = data;
  
  if (!contentId || !reporterOpenid || !reason) {
    return { success: false, message: '参数错误' };
  }
  
  // 检查是否已经举报过
  const existingReport = await db.collection('reports')
    .where({ contentId, reporterOpenid })
    .get();
  
  if (existingReport.data.length > 0) {
    return { success: false, message: '您已经举报过该内容' };
  }
  
  // 记录举报
  await db.collection('reports').add({
    contentId,
    reporterOpenid,
    reason,
    type,
    content,
    status: 'pending',
    createdAt: new Date()
  });
  
  return { success: true, message: '举报成功' };
}

// 输入验证
async function validateInput(data) {
  const { field, value, rules } = data;
  
  if (!field || value === undefined || !rules) {
    return { success: false, message: '参数错误' };
  }
  
  const validation = {
    success: true,
    errors: []
  };
  
  rules.forEach(rule => {
    switch (rule.type) {
      case 'required':
        if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
          validation.success = false;
          validation.errors.push(`${field}不能为空`);
        }
        break;
        
      case 'minLength':
        if (String(value).length < rule.value) {
          validation.success = false;
          validation.errors.push(`${field}长度不能小于${rule.value}`);
        }
        break;
        
      case 'maxLength':
        if (String(value).length > rule.value) {
          validation.success = false;
          validation.errors.push(`${field}长度不能大于${rule.value}`);
        }
        break;
        
      case 'pattern': {
        const regex = new RegExp(rule.value);
        if (!regex.test(value)) {
          validation.success = false;
          validation.errors.push(`${field}格式不正确`);
        }
        break;
      }
        
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          validation.success = false;
          validation.errors.push('邮箱格式不正确');
        }
        break;
      }
        
      case 'phone': {
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(value)) {
          validation.success = false;
          validation.errors.push('手机号格式不正确');
        }
        break;
      }
        
      case 'number':
        if (isNaN(Number(value))) {
          validation.success = false;
          validation.errors.push(`${field}必须是数字`);
        }
        break;
        
      case 'min':
        if (Number(value) < rule.value) {
          validation.success = false;
          validation.errors.push(`${field}不能小于${rule.value}`);
        }
        break;
        
      case 'max':
        if (Number(value) > rule.value) {
          validation.success = false;
          validation.errors.push(`${field}不能大于${rule.value}`);
        }
        break;
    }
  });
  
  return validation;
}

// 检查权限
async function checkPermission(data) {
  const { openid, action, resourceId } = data;
  
  if (!openid || !action) {
    return { success: false, message: '参数错误' };
  }
  
  // 获取用户角色
  const userResult = await db.collection('users').where({ openid }).get();
  
  if (userResult.data.length === 0) {
    return { success: false, message: '用户不存在' };
  }
  
  const user = userResult.data[0];
  const role = user.role || 'user';
  
  // 检查角色权限
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  if (!permissions.includes(action)) {
    await logSecurityEvent(openid, 'permission_denied', { action, role, resourceId });
    return {
      success: false,
      message: '权限不足',
      requiredRole: Object.keys(ROLE_PERMISSIONS).find(r => ROLE_PERMISSIONS[r].includes(action))
    };
  }
  
  // 如果是资源级权限检查
  if (resourceId && ['update', 'delete', 'manage'].includes(action)) {
    // 检查资源归属
    const isOwner = await checkResourceOwnership(openid, resourceId, action);
    if (!isOwner && role !== 'admin') {
      await logSecurityEvent(openid, 'resource_access_denied', { action, resourceId });
      return { success: false, message: '无权操作该资源' };
    }
  }
  
  return { success: true, message: '权限检查通过', role };
}

// 检查资源归属
async function checkResourceOwnership(openid, resourceId, action) {
  try {
    // 根据操作类型检查不同的资源
    const collections = {
      update: ['boxes', 'orders', 'communities'],
      delete: ['boxes', 'orders', 'communities'],
      manage: ['users', 'riders']
    };
    
    const targetCollections = collections[action] || [];
    
    for (const coll of targetCollections) {
      const result = await db.collection(coll).doc(resourceId).get();
      if (result.data) {
        // 检查是否为所有者
        if (result.data.sellerId === openid || 
            result.data.buyerId === openid || 
            result.data.publisherId === openid ||
            result.data.openid === openid) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// 设备验证（防刷号）
async function validateDevice(data) {
  const { openid, deviceId, deviceInfo } = data;
  
  if (!openid || !deviceId) {
    return { success: false, message: '参数错误' };
  }
  
  // 获取用户的设备列表
  const userDevices = await db.collection('userDevices')
    .where({ openid })
    .get();
  
  // 检查设备数量限制（最多5个设备）
  if (userDevices.data.length >= 5) {
    // 检查是否是已注册设备
    const isRegistered = userDevices.data.some(d => d.deviceId === deviceId);
    
    if (!isRegistered) {
      await logSecurityEvent(openid, 'device_limit_exceeded', { deviceId, deviceCount: userDevices.data.length });
      return {
        success: false,
        message: '设备数量已达上限',
        needsVerification: true
      };
    }
  }
  
  // 更新或注册设备
  const existingDevice = userDevices.data.find(d => d.deviceId === deviceId);
  
  if (existingDevice) {
    await db.collection('userDevices').doc(existingDevice._id).update({
      data: { lastUsed: new Date(), deviceInfo, updatedAt: new Date() }
    });
  } else {
    await db.collection('userDevices').add({
      openid,
      deviceId,
      deviceInfo,
      createdAt: new Date(),
      lastUsed: new Date()
    });
  }
  
  return { success: true, message: '设备验证通过' };
}

// 生成CSRF令牌
async function generateCSRFToken(data) {
  const { openid } = data;
  
  if (!openid) {
    return { success: false, message: '参数错误' };
  }
  
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟过期
  
  // 存储令牌
  await db.collection('csrfTokens').add({
    openid,
    token,
    expiresAt,
    createdAt: new Date()
  });
  
  return { success: true, token, expiresAt };
}

// 验证CSRF令牌
async function verifyCSRFToken(data) {
  const { openid, token } = data;
  
  if (!openid || !token) {
    return { success: false, message: '参数错误' };
  }
  
  // 查询令牌
  const tokenResult = await db.collection('csrfTokens')
    .where({ openid, token, expiresAt: _.gte(new Date()) })
    .get();
  
  if (tokenResult.data.length === 0) {
    await logSecurityEvent(openid, 'csrf_failure', { token });
    return { success: false, message: '令牌无效或已过期' };
  }
  
  // 验证后删除令牌（一次性使用）
  await db.collection('csrfTokens').doc(tokenResult.data[0]._id).remove();
  
  return { success: true, message: '令牌验证通过' };
}

// 记录安全事件
async function logSecurityEvent(openid, eventType, details) {
  try {
    await db.collection('securityLogs').add({
      openid: openid || 'system',
      eventType,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      createdAt: new Date(),
      ip: '' // 可从context获取
    });
  } catch (error) {
    console.error('记录安全日志失败:', error);
  }
}