// 用户体验优化工具

/**
 * 加载状态管理
 */
export const loadingStates = {
  /**
   * 显示加载弹窗
   * @param {string} title - 加载提示文字
   */
  showLoading(title = '加载中...') {
    wx.showLoading({
      title,
      mask: true
    });
  },

  /**
   * 隐藏加载弹窗
   */
  hideLoading() {
    wx.hideLoading();
  },

  /**
   * 显示Toast提示
   * @param {string} title - 提示文字
   * @param {string} icon - 图标类型
   * @param {number} duration - 显示时长
   */
  showToast(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title,
      icon,
      duration
    });
  },

  /**
   * 显示成功提示
   * @param {string} title - 提示文字
   */
  showSuccess(title) {
    this.showToast(title, 'success');
  },

  /**
   * 显示错误提示
   * @param {string} title - 提示文字
   */
  showError(title) {
    this.showToast(title, 'error');
  },

  /**
   * 显示确认对话框
   * @param {object} options - 选项
   * @returns {Promise<boolean>} - 用户是否确认
   */
  async showModal(options = {}) {
    const {
      title = '提示',
      content = '',
      confirmText = '确定',
      cancelText = '取消',
      confirmColor = '#576B95'
    } = options;

    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        confirmText,
        cancelText,
        confirmColor,
        success: (res) => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  },

  /**
   * 显示操作菜单
   * @param {object} options - 选项
   * @returns {Promise<number>} - 用户选择的索引
   */
  async showActionSheet(options = {}) {
    const {
      itemList = [],
      itemColor = '#000000',
      cancelText = '取消'
    } = options;

    return new Promise((resolve) => {
      wx.showActionSheet({
        itemList,
        itemColor,
        cancelText,
        success: (res) => {
          resolve(res.tapIndex);
        },
        fail: () => {
          resolve(-1);
        }
      });
    });
  }
};

/**
 * 动画效果工具
 */
export const animations = {
  /**
   * 脉冲动画
   * @param {string} selector - 选择器
   * @param {number} duration - 持续时间（毫秒）
   */
  pulse(selector, duration = 1500) {
    const animation = wx.createAnimation({
      duration,
      timingFunction: 'ease-in-out',
      delay: 0,
      transformOrigin: 'center center'
    });

    animation.opacity(0.5).step({ duration: duration / 2 });
    animation.opacity(1).step({ duration: duration / 2 });

    return animation.export();
  },

  /**
   * 缩放动画
   * @param {number} scale - 缩放比例
   * @param {number} duration - 持续时间（毫秒）
   */
  scale(scale = 1.1, duration = 300) {
    const animation = wx.createAnimation({
      duration,
      timingFunction: 'ease-out'
    });

    animation.scale(scale).step();

    return animation.export();
  },

  /**
   * 淡入动画
   * @param {number} duration - 持续时间（毫秒）
   */
  fadeIn(duration = 300) {
    const animation = wx.createAnimation({
      duration,
      timingFunction: 'ease-out'
    });

    animation.opacity(1).step();

    return animation.export();
  },

  /**
   * 淡出动画
   * @param {number} duration - 持续时间（毫秒）
   */
  fadeOut(duration = 300) {
    const animation = wx.createAnimation({
      duration,
      timingFunction: 'ease-in'
    });

    animation.opacity(0).step();

    return animation.export();
  },

  /**
   * 滑动入场动画
   * @param {string} direction - 方向（top/bottom/left/right）
   * @param {number} distance - 滑动距离
   * @param {number} duration - 持续时间（毫秒）
   */
  slideIn(direction = 'bottom', distance = 50, duration = 300) {
    const animation = wx.createAnimation({
      duration,
      timingFunction: 'ease-out'
    });

    const fromStyle = {};
    switch (direction) {
      case 'top':
        fromStyle.translateY = -distance;
        break;
      case 'bottom':
        fromStyle.translateY = distance;
        break;
      case 'left':
        fromStyle.translateX = -distance;
        break;
      case 'right':
        fromStyle.translateX = distance;
        break;
    }

    animation.opacity(1).translateX(0).translateY(0).step();
    const fromAnimation = wx.createAnimation({
      duration: 0
    });
    fromAnimation.opacity(0).setTranslate(fromStyle).step();

    return { from: fromAnimation.export(), to: animation.export() };
  },

  /**
   * 弹跳动画
   * @param {number} duration - 持续时间（毫秒）
   */
  bounce(duration = 500) {
    const animation = wx.createAnimation({
      duration,
      timingFunction: 'ease-out'
    });

    animation.scale(1.2).step({ duration: duration / 3 });
    animation.scale(0.9).step({ duration: duration / 3 });
    animation.scale(1).step({ duration: duration / 3 });

    return animation.export();
  },

  /**
   * 摇摆动画
   * @param {number} duration - 持续时间（毫秒）
   */
  shake(duration = 500) {
    const animation = wx.createAnimation({
      duration,
      timingFunction: 'ease-in-out'
    });

    animation.translateX(-10).step({ duration: duration / 4 });
    animation.translateX(10).step({ duration: duration / 4 });
    animation.translateX(-10).step({ duration: duration / 4 });
    animation.translateX(0).step({ duration: duration / 4 });

    return animation.export();
  },

  /**
   * 旋转动画
   * @param {number} angle - 旋转角度
   * @param {number} duration - 持续时间（毫秒）
   */
  rotate(angle = 360, duration = 1000) {
    const animation = wx.createAnimation({
      duration,
      timingFunction: 'linear'
    });

    animation.rotate(angle).step();

    return animation.export();
  },

  /**
   * 盲盒开启动画
   * @param {number} duration - 持续时间（毫秒）
   */
  openBox(duration = 1000) {
    const steps = duration / 4;

    const animation = wx.createAnimation({
      duration: 0
    });

    // 抖动效果
    animation.translateX(-5).step({ duration: steps / 3 });
    animation.translateX(5).step({ duration: steps / 3 });
    animation.translateX(-5).step({ duration: steps / 3 });

    // 放大效果
    animation.scale(1.3).step({ duration: steps });

    // 旋转开启
    animation.rotateX(-180).step({ duration: steps * 2 });

    // 恢复正常
    animation.scale(1).step({ duration: steps });

    return animation.export();
  },

  /**
   * 积分增长动画
   * @param {number} start - 起始值
   * @param {number} end - 结束值
   * @param {number} duration - 持续时间（毫秒）
   * @returns {Promise<number>} - 当前值
   */
  async countUp(start, end, duration = 1000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const diff = end - start;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + diff * easeOut);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve(end);
        }
      };

      animate();
    });
  }
};

/**
 * 页面导航工具
 */
export const navigation = {
  /**
   * 跳转到页面
   * @param {string} url - 页面路径
   * @param {object} params - 参数
   */
  navigateTo(url, params = {}) {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const fullUrl = query ? `${url}?${query}` : url;
    
    wx.navigateTo({ url: fullUrl });
  },

  /**
   * 重定向到页面
   * @param {string} url - 页面路径
   * @param {object} params - 参数
   */
  redirectTo(url, params = {}) {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    const fullUrl = query ? `${url}?${query}` : url;
    
    wx.redirectTo({ url: fullUrl });
  },

  /**
   * 返回到上一页
   * @param {number} delta - 返回页数
   */
  goBack(delta = 1) {
    wx.navigateBack({ delta });
  },

  /**
   * 切换Tab页
   * @param {string} url - 页面路径
   */
  switchTab(url) {
    wx.switchTab({ url });
  },

  /**
   * 重新加载页面
   */
  reload() {
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      currentPage.onLoad(currentPage.options);
    }
  },

  /**
   * 获取页面参数
   * @returns {object} - 参数对象
   */
  getParams() {
    const pages = getCurrentPages();
    if (pages.length > 0) {
      return pages[pages.length - 1].options || {};
    }
    return {};
  },

  /**
   * 解析URL参数
   * @param {string} url - URL字符串
   * @returns {object} - 参数对象
   */
  parseUrlParams(url) {
    const params = {};
    const queryString = url.split('?')[1];
    
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[key] = decodeURIComponent(value || '');
      });
    }
    
    return params;
  }
};

/**
 * 表单验证工具
 */
export const formValidator = {
  /**
   * 验证手机号
   * @param {string} phone - 手机号
   * @returns {boolean} - 是否有效
   */
  isPhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  /**
   * 验证邮箱
   * @param {string} email - 邮箱
   * @returns {boolean} - 是否有效
   */
  isEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * 验证身份证号
   * @param {string} idCard - 身份证号
   * @returns {boolean} - 是否有效
   */
  isIdCard(idCard) {
    return /^\d{17}[\dXx]$/.test(idCard);
  },

  /**
   * 验证密码强度
   * @param {string} password - 密码
   * @returns {number} - 强度等级（0-3）
   */
  passwordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) {
      strength++;
    }
    if (/[a-z]/.test(password)) {
      strength++;
    }
    if (/[A-Z]/.test(password)) {
      strength++;
    }
    if (/[0-9]/.test(password)) {
      strength++;
    }
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength++;
    }

    return Math.min(strength, 3);
  },

  /**
   * 验证必填字段
   * @param {any} value - 字段值
   * @returns {boolean} - 是否为空
   */
  isRequired(value) {
    return value !== undefined && value !== null && value !== '';
  },

  /**
   * 验证最小长度
   * @param {string} value - 字段值
   * @param {number} min - 最小长度
   * @returns {boolean} - 是否满足
   */
  minLength(value, min) {
    return String(value).length >= min;
  },

  /**
   * 验证最大长度
   * @param {string} value - 字段值
   * @param {number} max - 最大长度
   * @returns {boolean} - 是否满足
   */
  maxLength(value, max) {
    return String(value).length <= max;
  },

  /**
   * 验证数值范围
   * @param {number} value - 数值
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {boolean} - 是否满足
   */
  inRange(value, min, max) {
    return value >= min && value <= max;
  },

  /**
   * 验证数组长度
   * @param {array} value - 数组
   * @param {number} min - 最小长度
   * @param {number} max - 最大长度
   * @returns {boolean} - 是否满足
   */
  arrayLength(value, min, max) {
    return value.length >= min && value.length <= max;
  }
};

/**
 * 键盘工具
 */
export const keyboard = {
  /**
   * 隐藏键盘
   */
  hide() {
    wx.hideKeyboard();
  },

  /**
   * 显示键盘
   * @param {object} options - 选项
   */
  show(options = {}) {
    wx.showKeyboard(options);
  },

  /**
   * 聚焦输入框
   * @param {string} selector - 选择器
   */
  focus(selector) {
    wx.createSelectorQuery().select(selector).focus();
  }
};

/**
 * 分享工具
 */
export const share = {
  /**
   * 设置分享信息
   * @param {object} options - 分享选项
   */
  setShare(options = {}) {
    const {
      title = '校园盲盒即时配送平台',
      path = '/pages/index/index',
      imageUrl = '',
      success = () => {},
      fail = () => {}
    } = options;

    wx.onShareAppMessage(() => ({
      title,
      path,
      imageUrl,
      success,
      fail
    }));

    wx.onShareTimeline(() => ({
      title,
      imageUrl
    }));
  },

  /**
   * 主动分享
   * @param {object} options - 分享选项
   */
  shareAppMessage(options = {}) {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
};