// 图片懒加载工具类
class LazyLoad {
  constructor() {
    this.observers = [];
    this.observedElements = new Map();
    this.defaultOptions = {
      rootMargin: '0px 0px 100px 0px',
      thresholds: [0.1],
      observeAll: false
    };
    // 降级方案：分批加载队列
    this.fallbackQueue = [];
    this.fallbackProcessing = false;
    this.fallbackBatchSize = 2;
    this.fallbackInterval = 200;
    this.init();
  }

  init() {
    if (!('IntersectionObserver' in wx)) {
      console.warn('当前环境不支持 IntersectionObserver，将使用降级方案');
    }
  }

  /**
   * 创建观察者
   * @param {Object} options - 观察选项
   * @returns {IntersectionObserver|null}
   */
  createObserver(options = {}) {
    if (!('IntersectionObserver' in wx)) {
      return null;
    }
    
    const mergedOptions = { ...this.defaultOptions, ...options };
    const observer = wx.createIntersectionObserver(null, mergedOptions);
    this.observers.push(observer);
    return observer;
  }

  /**
   * 监听单个图片元素
   * @param {string} imageSelector - 图片选择器
   * @param {Function} callback - 回调函数
   * @param {Object} options - 观察选项
   */
  observeImage(imageSelector, callback, options = {}) {
    if (!('IntersectionObserver' in wx)) {
      // 降级方案：分批加入队列，避免同时加载所有图片
      this.fallbackQueue.push(() => callback({ intersectionRatio: 1 }));
      this.processFallbackQueue();
      return;
    }

    const observer = this.createObserver(options);
    if (!observer) {
      return;
    }

    observer.observe(imageSelector, (res) => {
      if (res.intersectionRatio > 0) {
        callback(res);
        this.unobserve(imageSelector, observer);
      }
    });

    // 记录已观察的元素
    this.observedElements.set(imageSelector, observer);
  }

  /**
   * 批量监听图片
   * @param {Array} images - 图片配置数组
   * @param {Function} callback - 回调函数
   * @param {Object} options - 观察选项
   */
  observeImages(images, callback, options = {}) {
    if (!('IntersectionObserver' in wx)) {
      // 降级方案：分批加入队列，避免同时加载所有图片
      images.forEach((image, index) => {
        this.fallbackQueue.push(() => callback(index, { intersectionRatio: 1 }));
      });
      this.processFallbackQueue();
      return;
    }

    const observer = this.createObserver({ ...options, observeAll: true });
    if (!observer) {
      return;
    }

    const selectors = images.map((_, index) => `.lazy-image-${index}`);
    
    selectors.forEach((selector, index) => {
      observer.observe(selector, (res) => {
        if (res.intersectionRatio > 0) {
          callback(index, res);
          // 从观察者中移除该元素
          observer.disconnect();
          // 重新创建观察者观察剩余元素
          this.observeImages(images.slice(index + 1), callback, options);
        }
      });
    });
  }

  /**
   * 取消观察单个元素
   * @param {string} selector - 选择器
   * @param {IntersectionObserver} observer - 观察者实例
   */
  unobserve(selector, observer) {
    if (observer) {
      try {
        observer.disconnect();
      } catch (e) {
        console.warn('取消观察失败:', e);
      }
    }
    this.observedElements.delete(selector);
    
    // 从观察者列表中移除
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * 批量取消观察
   * @param {Array} selectors - 选择器数组
   */
  unobserveAll(selectors = null) {
    if (selectors) {
      selectors.forEach(selector => {
        const observer = this.observedElements.get(selector);
        this.unobserve(selector, observer);
      });
    } else {
      // 取消所有观察
      this.observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (e) {
          console.warn('取消观察失败:', e);
        }
      });
      this.observers = [];
      this.observedElements.clear();
    }
  }

  /**
   * 处理降级加载队列（分批执行，避免同时加载过多图片）
   */
  processFallbackQueue() {
    if (this.fallbackProcessing || this.fallbackQueue.length === 0) {
      return;
    }
    this.fallbackProcessing = true;
    const batch = this.fallbackQueue.splice(0, this.fallbackBatchSize);
    batch.forEach(fn => fn());
    this.fallbackProcessing = false;
    if (this.fallbackQueue.length > 0) {
      setTimeout(() => this.processFallbackQueue(), this.fallbackInterval);
    }
  }

  /**
   * 销毁所有观察者
   */
  destroy() {
    this.unobserveAll();
    this.observers = [];
    this.observedElements.clear();
  }

  /**
   * 自动销毁（页面卸载时调用）
   * @param {Object} pageContext - 页面上下文
   */
  autoDestroy(pageContext) {
    if (pageContext && typeof pageContext.onUnload === 'function') {
      const originalOnUnload = pageContext.onUnload.bind(pageContext);
      pageContext.onUnload = function () {
        originalOnUnload();
        this.destroy();
      }.bind(this);
    }
  }

  /**
   * 获取观察状态
   * @returns {Object}
   */
  getStatus() {
    return {
      observerCount: this.observers.length,
      observedElementCount: this.observedElements.size,
      supported: 'IntersectionObserver' in wx
    };
  }

  /**
   * 预加载图片
   * @param {string} src - 图片URL
   * @returns {Promise}
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src,
        success: () => resolve(src),
        fail: (err) => {
          console.warn('图片预加载失败:', src, err);
          resolve(src); // 即使失败也返回，不影响流程
        }
      });
    });
  }

  /**
   * 批量预加载图片
   * @param {Array} srcs - 图片URL数组
   * @param {number} concurrent - 并发数量
   * @returns {Promise}
   */
  async preloadImages(srcs, concurrent = 3) {
    const results = [];
    for (let i = 0; i < srcs.length; i += concurrent) {
      const batch = srcs.slice(i, i + concurrent);
      const batchResults = await Promise.all(
        batch.map(src => this.preloadImage(src))
      );
      results.push(...batchResults);
    }
    return results;
  }
}

// 导出单例
module.exports = new LazyLoad();