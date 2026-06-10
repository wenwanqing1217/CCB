/**
 * 云函数通用初始化模块
 * 提供统一的云开发初始化和工具函数
 */

const cloud = require('wx-server-sdk');

/**
 * 初始化云开发环境
 */
function initCloud() {
  if (!cloud.getEnv()) {
    cloud.init({
      env: cloud.DYNAMIC_CURRENT_ENV,
      throwOnNotFound: false
    });
  }
  return cloud;
}

/**
 * 获取数据库实例
 */
function getDB() {
  initCloud();
  return cloud.database();
}

/**
 * 获取命令操作符
 */
function getCommand() {
  initCloud();
  return cloud.database().command;
}

/**
 * 获取当前用户OpenID
 */
function getOpenid() {
  try {
    const wxContext = cloud.getWXContext();
    return wxContext.OPENID;
  } catch (err) {
    console.error('获取OpenID失败:', err);
    return null;
  }
}

/**
 * 获取当前用户UnionID
 */
function getUnionid() {
  try {
    const wxContext = cloud.getWXContext();
    return wxContext.UNIONID;
  } catch (err) {
    console.error('获取UnionID失败:', err);
    return null;
  }
}

/**
 * 获取微信上下文
 */
function getWXContext() {
  try {
    return cloud.getWXContext();
  } catch (err) {
    console.error('获取微信上下文失败:', err);
    return null;
  }
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 格式化时间
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString();
}

/**
 * 获取服务器时间
 */
function getServerDate() {
  return cloud.database().serverDate();
}

/**
 * 分页查询
 */
async function paginate(query, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  
  const countResult = await query.count();
  const total = countResult.total;
  const totalPages = Math.ceil(total / pageSize);
  
  const list = await query.skip(skip).limit(pageSize).get();
  
  return {
    list: list.data,
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages
  };
}

/**
 * 错误处理包装
 */
function wrapHandler(main) {
  return async (event, context) => {
    initCloud();
    
    try {
      const result = await main(event, context);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('云函数执行错误:', error);
      return {
        success: false,
        message: error.message || '服务器内部错误',
        error: error.toString()
      };
    }
  };
}

module.exports = {
  cloud,
  initCloud,
  getDB,
  getCommand,
  getOpenid,
  getUnionid,
  getWXContext,
  generateId,
  formatDate,
  getServerDate,
  paginate,
  wrapHandler
};
