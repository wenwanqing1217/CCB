/**
 * 提示工具模块
 * 统一处理 Toast、Modal、Loading 等提示
 */

/**
 * 成功提示
 * @param {string} title - 提示文字
 * @param {number} duration - 持续时间(ms)
 */
function success(title, duration = 1500) {
  wx.showToast({
    title,
    icon: 'success',
    duration
  });
}

/**
 * 错误提示
 * @param {string} title - 提示文字
 * @param {number} duration - 持续时间(ms)
 */
function error(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'error',
    duration
  });
}

/**
 * 普通提示
 * @param {string} title - 提示文字
 * @param {number} duration - 持续时间(ms)
 */
function info(title, duration = 1500) {
  wx.showToast({
    title,
    icon: 'none',
    duration
  });
}

/**
 * 加载提示
 * @param {string} title - 提示文字
 */
function loading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 确认对话框
 * @param {string} content - 内容
 * @param {string} title - 标题
 * @returns {Promise}
 */
function confirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
}

/**
 * 网络错误提示
 * @param {string} message - 错误消息
 */
function networkError(message = '网络错误，请检查网络连接') {
  error(message);
}

/**
 * 服务器错误提示
 */
function serverError() {
  error('服务器繁忙，请稍后重试');
}

module.exports = {
  success,
  error,
  info,
  loading,
  hideLoading,
  confirm,
  networkError,
  serverError
};
