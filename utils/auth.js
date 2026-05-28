/**
 * 认证工具模块
 * 统一处理登录、登出、权限检查等功能
 */

const app = getApp();

/**
 * 检查用户是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  const userInfo = wx.getStorageSync('userInfo');
  return !!userInfo;
}

/**
 * 获取当前用户信息
 * @returns {object|null}
 */
function getCurrentUser() {
  return wx.getStorageSync('userInfo') || null;
}

/**
 * 一键登录
 * @returns {Promise}
 */
function login() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        
        // 保存到本地
        wx.setStorageSync('userInfo', userInfo);
        app.globalData.userInfo = userInfo;
        
        // 调用云函数
        wx.cloud.callFunction({
          name: 'userService',
          data: {
            action: 'login',
            data: { userInfo, code: '' }
          },
          success: (loginRes) => {
            if (loginRes.result && loginRes.result.success) {
              wx.showToast({ title: '登录成功', icon: 'success' });
              resolve({ success: true, user: loginRes.result.user });
            } else {
              // 云函数返回异常，但本地已保存，视为成功
              wx.showToast({ title: '登录成功', icon: 'success' });
              resolve({ success: true, user: userInfo });
            }
          },
          fail: () => {
            // 云函数失败，但本地已保存，视为成功
            wx.showToast({ title: '登录成功', icon: 'success' });
            resolve({ success: true, user: userInfo });
          }
        });
      },
      fail: (err) => {
        wx.showToast({ title: '登录失败', icon: 'none' });
        reject({ success: false, error: err });
      }
    });
  });
}

/**
 * 登出
 */
function logout() {
  wx.removeStorageSync('userInfo');
  app.globalData.userInfo = null;
  wx.showToast({ title: '已退出登录', icon: 'success' });
}

/**
 * 检查登录状态，未登录则跳转到登录页
 * @param {boolean} needRedirect - 是否需要自动跳转
 * @returns {boolean}
 */
function checkLogin(needRedirect = false) {
  if (!isLoggedIn()) {
    if (needRedirect) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/profile/profile' });
          }
        }
      });
    }
    return false;
  }
  return true;
}

/**
 * 需要登录的装饰器
 * @param {Function} fn 
 * @returns {Function}
 */
function requireLogin(fn) {
  return function (...args) {
    if (!isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再操作',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/profile/profile' });
          }
        }
      });
      return;
    }
    return fn.apply(this, args);
  };
}

module.exports = {
  isLoggedIn,
  getCurrentUser,
  login,
  logout,
  checkLogin,
  requireLogin
};
