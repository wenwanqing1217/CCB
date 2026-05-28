/**
 * 错误码定义
 * 遵循阿里规约：X00Y00Z00 格式
 *
 * 结构：X=系统码 Y=模块码 Z=具体错误码
 */

const ErrorCodes = {
  // ========== 系统级错误 (1xx) ==========
  SYSTEM: {
    INTERNAL_ERROR: { code: 1000001, message: '系统内部错误' },
    SERVICE_UNAVAILABLE: { code: 1000002, message: '服务暂不可用' },
    TIMEOUT: { code: 1000003, message: '请求超时' },
    PARAM_INVALID: { code: 1000004, message: '参数无效' },
    DATABASE_ERROR: { code: 1000005, message: '数据库错误' },
    REDIS_ERROR: { code: 1000006, message: '缓存服务错误' }
  },

  // ========== 认证授权错误 (2xx) ==========
  AUTH: {
    NOT_LOGGED_IN: { code: 2000001, message: '用户未登录' },
    TOKEN_EXPIRED: { code: 2000002, message: '登录已过期' },
    TOKEN_INVALID: { code: 2000003, message: '无效的登录凭证' },
    PERMISSION_DENIED: { code: 2000004, message: '无权限访问' },
    USER_BANNED: { code: 2000005, message: '用户已被禁用' }
  },

  // ========== 盲盒模块错误 (3xx) ==========
  BOX: {
    NOT_FOUND: { code: 3000001, message: '盲盒不存在' },
    ALREADY_SOLD: { code: 3000002, message: '盲盒已售出' },
    NOT_YOURS: { code: 3000003, message: '无权操作此盲盒' },
    STATUS_INVALID: { code: 3000004, message: '盲盒状态不允许此操作' },
    TITLE_TOO_LONG: { code: 3000005, message: '标题不能超过50个字符' },
    PRICE_INVALID: { code: 3000006, message: '价格必须是0-99999之间的数字' },
    IMAGES_TOO_MANY: { code: 3000007, message: '图片最多上传9张' },
    CATEGORY_INVALID: { code: 3000008, message: '无效的分类' }
  },

  // ========== 订单模块错误 (4xx) ==========
  ORDER: {
    NOT_FOUND: { code: 4000001, message: '订单不存在' },
    CANNOT_CANCEL: { code: 4000002, message: '当前状态无法取消订单' },
    CANNOT_PAY: { code: 4000003, message: '订单状态不允许支付' },
    SELLER_BUY_OWN: { code: 4000004, message: '不能购买自己的盲盒' },
    PRICE_CHANGED: { code: 4000005, message: '价格已变更，请刷新后重试' },
    BOX_NO_LONGER_AVAILABLE: { code: 4000006, message: '盲盒已售出或已下架' },
    ADDRESS_INCOMPLETE: { code: 4000007, message: '配送地址不完整' },
    CONTACT_INCOMPLETE: { code: 4000008, message: '联系方式不完整' },
    STATUS_TRANSITION_INVALID: { code: 4000009, message: '订单状态流转不允许' }
  },

  // ========== 配送模块错误 (5xx) ==========
  DELIVERY: {
    NOT_FOUND: { code: 5000001, message: '配送单不存在' },
    ALREADY_GRABBED: { code: 5000002, message: '订单已被其他骑手抢单' },
    RIDER_CANNOT_GRAB_OWN: { code: 5000003, message: '不能配送自己的订单' },
    ORDER_NOT_PENDING: { code: 5000004, message: '订单状态不是待配送' },
    RIDER_OFFLINE: { code: 5000005, message: '骑手已下线' },
    RIDER_SUSPENDED: { code: 5000006, message: '骑手账号已被暂停' },
    LOCATION_NOT_FOUND: { code: 5000007, message: '无法获取骑手位置' }
  },

  // ========== 用户模块错误 (6xx) ==========
  USER: {
    NOT_FOUND: { code: 6000001, message: '用户不存在' },
    PHONE_ALREADY_BIND: { code: 6000002, message: '手机号已被绑定' },
    CERTIFICATION_PENDING: { code: 6000003, message: '认证待审核' },
    CERTIFICATION_REJECTED: { code: 6000004, message: '认证被拒绝' },
    ROLE_NOT_ALLOWED: { code: 6000005, message: '用户角色不允许此操作' },
    DORM_INVALID: { code: 6000006, message: '无效的宿舍信息' }
  },

  // ========== 社区模块错误 (7xx) ==========
  COMMUNITY: {
    POST_NOT_FOUND: { code: 7000001, message: '动态不存在' },
    CONTENT_TOO_LONG: { code: 7000002, message: '内容不能超过500字' },
    ALREADY_LIKED: { code: 7000003, message: '已经点赞过' },
    NOT_LIKED_YET: { code: 7000004, message: '还未点赞' },
    REPORTED_TOO_MUCH: { code: 7000005, message: '举报过于频繁' }
  },

  // ========== 通用业务错误 (8xx) ==========
  COMMON: {
    RATE_LIMIT_EXCEEDED: { code: 8000001, message: '请求过于频繁' },
    DATA_NOT_FOUND: { code: 8000002, message: '数据不存在' },
    DUPLICATE_OPERATION: { code: 8000003, message: '请勿重复操作' },
    OPERATION_TOO_FAST: { code: 8000004, message: '操作过于频繁' },
    FILE_TOO_LARGE: { code: 8000005, message: '文件过大' },
    FILE_TYPE_NOT_ALLOWED: { code: 8000006, message: '文件类型不允许' }
  }
}

/**
 * 业务异常类
 */
class BusinessError extends Error {
  constructor(errorInfo, details = null) {
    super(errorInfo.message)
    this.code = errorInfo.code
    this.message = errorInfo.message
    this.details = details
    this.name = 'BusinessError'
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      }
    }
  }
}

/**
 * 创建业务异常
 */
function bizError(errorKey, details = null) {
  const errorInfo = getErrorByKey(errorKey)
  return new BusinessError(errorInfo, details)
}

/**
 * 根据错误键获取错误信息
 * @param {string} key - 错误键，格式 '模块.错误名'
 * @returns {Object} 错误信息对象
 */
function getErrorByKey(key) {
  const [module, errorName] = key.split('.')

  if (!module || !errorName) {
    return ErrorCodes.SYSTEM.PARAM_INVALID
  }

  const moduleErrors = ErrorCodes[module.toUpperCase()]
  if (!moduleErrors) {
    return ErrorCodes.SYSTEM.PARAM_INVALID
  }

  const error = moduleErrors[errorName.toUpperCase()]
  if (!error) {
    return ErrorCodes.SYSTEM.PARAM_INVALID
  }

  return error
}

/**
 * 统一错误处理函数
 */
function handleError(error, version = 'v1') {
  console.error('Error:', error)

  if (error instanceof BusinessError) {
    return error.toJSON()
  }

  // 未知错误
  if (version === 'v2') {
    return {
      success: false,
      error: {
        code: ErrorCodes.SYSTEM.INTERNAL_ERROR.code,
        message: '系统内部错误',
        requestId: generateRequestId()
      }
    }
  }

  return {
    success: false,
    message: '系统错误，请稍后重试'
  }
}

/**
 * 生成请求ID（用于链路追踪）
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 校验函数集合
 */
const Validators = {
  isNonEmptyString(value, fieldName) {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw bizError('SYSTEM.PARAM_INVALID', [{ field: fieldName, message: `${fieldName}不能为空` }])
    }
  },

  isPositiveNumber(value, fieldName) {
    if (!value || isNaN(Number(value)) || Number(value) < 0) {
      throw bizError('SYSTEM.PARAM_INVALID', [{ field: fieldName, message: `${fieldName}必须是大于等于0的数字` }])
    }
  },

  isInRange(value, fieldName, min, max) {
    const num = Number(value)
    if (isNaN(num) || num < min || num > max) {
      throw bizError('SYSTEM.PARAM_INVALID', [{ field: fieldName, message: `${fieldName}必须在${min}-${max}之间` }])
    }
  },

  isOpenid(value, fieldName = 'openid') {
    if (!value || typeof value !== 'string' || value.length < 20) {
      throw bizError('SYSTEM.PARAM_INVALID', [{ field: fieldName, message: '无效的用户标识' }])
    }
  },

  isArray(value, fieldName) {
    if (!Array.isArray(value)) {
      throw bizError('SYSTEM.PARAM_INVALID', [{ field: fieldName, message: `${fieldName}必须是数组` }])
    }
  },

  maxLength(value, fieldName, max) {
    if (value && typeof value === 'string' && value.length > max) {
      throw bizError('SYSTEM.PARAM_INVALID', [{ field: fieldName, message: `${fieldName}不能超过${max}个字符` }])
    }
  }
}

module.exports = {
  ErrorCodes,
  BusinessError,
  bizError,
  getErrorByKey,
  handleError,
  generateRequestId,
  Validators
}
