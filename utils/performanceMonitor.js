// 性能监控工具
// 支持页面加载、API调用、渲染性能、内存使用、FPS、用户行为等多维度监控

class PerformanceMonitor {
  constructor() {
    this.performanceData = {
      pageLoad: {},
      apiCalls: {},
      memory: [],
      fps: [],
      errors: [],
      userActions: [],
      render: [],
      network: [],
      storage: []
    };
    this.pageStartTime = 0;
    this.apiStartTime = {};
    this.renderStartTime = 0;
    this.fpsMonitor = null;
    this.isProduction = typeof __wxConfig !== 'undefined' && __wxConfig.envVersion === 'release';
    
    // 配置项
    this.config = {
      sampleRate: 0.1,           // 采样率
      slowApiThreshold: 500,     // 慢API阈值(ms)
      slowPageThreshold: 2000,   // 慢页面阈值(ms)
      fpsWarningThreshold: 30,   // FPS警告阈值
      memoryWarningThreshold: 500, // 内存警告阈值(MB)
      maxErrorsPerSession: 10,   // 每会话最大错误数
      batchReportSize: 10,       // 批量上报大小
      reportInterval: 30000,     // 定期上报间隔(ms)
      retryCount: 3,             // 上报重试次数
      retryDelay: 1000           // 重试延迟(ms)
    };
    
    // 上报队列
    this.reportQueue = [];
    
    // 初始化监控
    this.init();
  }

  // 初始化
  init() {
    // 暂时禁用全局错误监听，避免递归和刷屏
    // this.setupGlobalErrorHandler()
    
    // 监听页面生命周期
    this.setupPageLifecycle();
    
    // 启动定期上报
    this.startPeriodicReport();
    
    // 启动FPS监控
    this.startFpsMonitor();
    
    // 定期采集内存信息
    this.startMemoryCollection();
  }

  // 设置全局错误处理器
  setupGlobalErrorHandler() {
    // 保存原始 error 方法
    const originalError = console.error.bind(console);
    const originalWarn = console.warn.bind(console);
    const self = this;
    
    // 重写 console.error
    console.error = (...args) => {
      originalError(...args);
      // 使用 setTimeout 避免递归
      setTimeout(() => {
        self.recordError(args[0], 'console_error');
      }, 0);
    };
    
    // 重写 console.warn
    console.warn = (...args) => {
      originalWarn(...args);
    };
    
    // 监听Promise拒绝
    const originalReject = Promise.prototype.then;
    Promise.prototype.then = function (onFulfilled, onRejected) {
      return originalReject.call(this, onFulfilled, function (reason) {
        self.recordError(reason, 'promise_reject');
        if (onRejected) {
          return onRejected(reason);
        }
        throw reason;
      });
    };
  }

  // 设置页面生命周期监听
  setupPageLifecycle() {
    // 重写Page方法，自动监控页面加载
    /* eslint-disable no-global-assign */
    const originalPage = Page;
    Page = function (options) {
      const onLoad = options.onLoad;
      const onShow = options.onShow;
      const onHide = options.onHide;
      const onUnload = options.onUnload;
      
      options.onLoad = function (...args) {
        performanceMonitor.startPageLoad(this.route);
        if (onLoad) {
          onLoad.apply(this, args);
        }
      };
      
      options.onShow = function (...args) {
        performanceMonitor.recordUserAction('page_show', { page: this.route });
        if (onShow) {
          onShow.apply(this, args);
        }
      };
      
      options.onHide = function (...args) {
        performanceMonitor.endPageLoad(this.route);
        if (onHide) {
          onHide.apply(this, args);
        }
      };
      
      options.onUnload = function (...args) {
        performanceMonitor.endPageLoad(this.route);
        if (onUnload) {
          onUnload.apply(this, args);
        }
      };
      
      return originalPage(options);
    };
  }

  // 开始页面加载监控
  startPageLoad(pageName) {
    this.pageStartTime = Date.now();
    this.performanceData.pageLoad[pageName] = {
      startTime: this.pageStartTime,
      endTime: 0,
      duration: 0,
      timestamp: new Date().toISOString(),
      path: pageName
    };
    
    // 记录页面加载开始时间（用于TTI计算）
    this.pageLoadStartTime = Date.now();
  }

  // 结束页面加载监控
  endPageLoad(pageName) {
    if (this.performanceData.pageLoad[pageName]) {
      const endTime = Date.now();
      const duration = endTime - this.performanceData.pageLoad[pageName].startTime;
      this.performanceData.pageLoad[pageName].endTime = endTime;
      this.performanceData.pageLoad[pageName].duration = duration;
      
      // 分析页面加载性能
      const performanceLevel = this.analyzePerformanceLevel(duration);
      this.performanceData.pageLoad[pageName].performanceLevel = performanceLevel;
      
      // 只在慢页面时打印日志
      if (duration > this.config.slowPageThreshold) {
        console.log(`页面 ${pageName} 加载时间: ${duration}ms, 性能等级: ${performanceLevel}`);
      }
      
      // 如果是慢页面，立即上报
      if (duration > this.config.slowPageThreshold) {
        this.queueReport({
          type: 'slow_page',
          pageName,
          duration,
          performanceLevel,
          timestamp: new Date().toISOString()
        });
      }
      
      // 自动上报页面加载性能
      if (this.isProduction) {
        this.reportPagePerformance(pageName, duration, performanceLevel);
      }
    }
  }

  // 开始API调用监控
  startApiCall(apiName) {
    this.apiStartTime[apiName] = {
      startTime: Date.now(),
      requestTime: new Date().toISOString()
    };
    if (!this.performanceData.apiCalls[apiName]) {
      this.performanceData.apiCalls[apiName] = {
        total: 0,
        success: 0,
        failure: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        calls: []
      };
    }
  }

  // 结束API调用监控
  endApiCall(apiName, success = true, errorType = '', responseSize = 0) {
    if (this.apiStartTime[apiName]) {
      const endTime = Date.now();
      const duration = endTime - this.apiStartTime[apiName].startTime;
      
      const apiData = {
        startTime: this.apiStartTime[apiName].startTime,
        endTime,
        duration,
        success,
        errorType,
        responseSize,
        timestamp: new Date().toISOString(),
        requestTime: this.apiStartTime[apiName].requestTime
      };
      
      // 更新统计数据
      const stats = this.performanceData.apiCalls[apiName];
      stats.total++;
      if (success) {
        stats.success++;
      } else {
        stats.failure++;
      }
      stats.avgDuration = (stats.avgDuration * (stats.total - 1) + duration) / stats.total;
      stats.maxDuration = Math.max(stats.maxDuration, duration);
      stats.minDuration = Math.min(stats.minDuration, duration);
      stats.calls.push(apiData);
      
      // 只保留最近100条调用记录
      if (stats.calls.length > 100) {
        stats.calls = stats.calls.slice(-100);
      }
      
      // 只在慢 API 时打印日志
      if (duration > this.config.slowApiThreshold) {
        console.log(`API ${apiName} 调用时间: ${duration}ms, 成功: ${success}`);
      }
      
      // 分析API性能
      const performanceLevel = this.analyzePerformanceLevel(duration);
      apiData.performanceLevel = performanceLevel;
      
      // 如果是慢API，立即上报
      if (duration > this.config.slowApiThreshold) {
        this.queueReport({
          type: 'slow_api',
          apiName,
          duration,
          success,
          errorType,
          performanceLevel,
          timestamp: new Date().toISOString()
        });
      }
      
      // 自动上报API性能
      if (this.isProduction) {
        this.reportApiPerformance(apiName, duration, success, errorType, performanceLevel);
      }
      
      delete this.apiStartTime[apiName];
    }
  }

  // 开始渲染监控
  startRender() {
    this.renderStartTime = Date.now();
  }

  // 结束渲染监控
  endRender(componentName) {
    if (this.renderStartTime) {
      const endTime = Date.now();
      const duration = endTime - this.renderStartTime;
      
      this.performanceData.render.push({
        componentName,
        duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`组件 ${componentName} 渲染时间: ${duration}ms`);
      this.renderStartTime = 0;
    }
  }

  // 采集内存使用情况
  collectMemoryInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      const memoryData = {
        timestamp: new Date().toISOString(),
        memory: systemInfo.memory || 0,
        platform: systemInfo.platform,
        version: systemInfo.version,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight,
        devicePixelRatio: systemInfo.devicePixelRatio,
        brand: systemInfo.brand,
        model: systemInfo.model,
        SDKVersion: systemInfo.SDKVersion
      };
      
      this.performanceData.memory.push(memoryData);
      
      // 如果内存超过警告阈值，立即上报
      if (memoryData.memory > this.config.memoryWarningThreshold) {
        this.queueReport({
          type: 'memory_warning',
          ...memoryData
        });
      }
      
      // 只保留最近20条记录
      if (this.performanceData.memory.length > 20) {
        this.performanceData.memory = this.performanceData.memory.slice(-20);
      }
    } catch (error) {
      // 静默处理采集失败
    }
  }

  // 启动内存采集
  startMemoryCollection() {
    setInterval(() => {
      this.collectMemoryInfo();
    }, 30000);
    
    // 立即采集一次
    this.collectMemoryInfo();
  }

  // 采集FPS
  startFpsMonitor() {
    if (this.fpsMonitor) {
      clearInterval(this.fpsMonitor);
    }
    
    let lastTime = Date.now();
    let frameCount = 0;

    this.fpsMonitor = setInterval(() => {
      frameCount++;
      const currentTime = Date.now();
      if (currentTime - lastTime >= 5000) {  // 改为 5 秒采集一次
        const fps = Math.round(frameCount / 5);  // 5 秒内的平均 FPS
        const fpsData = {
          timestamp: new Date().toISOString(),
          fps
        };
        
        this.performanceData.fps.push(fpsData);
        
        // 分析FPS性能
        const performanceLevel = this.analyzeFpsLevel(fps);
        fpsData.performanceLevel = performanceLevel;
        
        // 只在 FPS 低于阈值时才打印日志
        if (fps < this.config.fpsWarningThreshold) {
          console.log(`FPS: ${fps}, 性能等级: ${performanceLevel}`);
        }
        
        // 如果FPS低于警告阈值，立即上报
        if (fps < this.config.fpsWarningThreshold) {
          this.queueReport({
            type: 'fps_warning',
            fps,
            performanceLevel,
            timestamp: new Date().toISOString()
          });
        }
        
        // 自动上报FPS性能（采样）
        if (this.isProduction && Math.random() < this.config.sampleRate) {
          this.reportFpsPerformance(fps, performanceLevel);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
    }, 100);

    return this.fpsMonitor;
  }

  // 停止FPS监控
  stopFpsMonitor() {
    if (this.fpsMonitor) {
      clearInterval(this.fpsMonitor);
      this.fpsMonitor = null;
    }
  }

  // 采集网络状态
  collectNetworkStatus() {
    try {
      wx.getNetworkType({
        success: (res) => {
          const networkData = {
            timestamp: new Date().toISOString(),
            networkType: res.networkType,
            isConnected: res.networkType !== 'none'
          };
          
          this.performanceData.network.push(networkData);
          
          // 只保留最近20条记录
          if (this.performanceData.network.length > 20) {
            this.performanceData.network = this.performanceData.network.slice(-20);
          }
        },
        fail: (error) => {
          console.error('采集网络状态失败:', error);
        }
      });
    } catch (error) {
      console.error('采集网络状态失败:', error);
    }
  }

  // 采集存储使用情况
  collectStorageInfo() {
    try {
      const info = wx.getStorageInfoSync();
      const storageData = {
        timestamp: new Date().toISOString(),
        keys: info.keys.length,
        currentSize: info.currentSize,
        limitSize: info.limitSize,
        usagePercent: (info.currentSize / info.limitSize * 100).toFixed(2)
      };
      
      this.performanceData.storage.push(storageData);
      
      // 如果存储使用超过80%，立即上报
      if (storageData.currentSize / storageData.limitSize > 0.8) {
        this.queueReport({
          type: 'storage_warning',
          ...storageData
        });
      }
      
      // 只保留最近10条记录
      if (this.performanceData.storage.length > 10) {
        this.performanceData.storage = this.performanceData.storage.slice(-10);
      }
    } catch (error) {
      console.error('采集存储信息失败:', error);
    }
  }

  // 记录用户行为
  recordUserAction(action, details = {}) {
    const actionData = {
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      timestamp: new Date().toISOString(),
      page: this.getCurrentPage()
    };
    
    this.performanceData.userActions.push(actionData);
    
    // 只保留最近50条记录
    if (this.performanceData.userActions.length > 50) {
      this.performanceData.userActions = this.performanceData.userActions.slice(-50);
    }
    
    // 自动上报用户行为（采样率）
    if (this.isProduction && Math.random() < this.config.sampleRate) {
      this.queueReport({
        type: 'user_action',
        ...actionData
      });
    }
  }

  // 记录错误
  recordError(error, context = '') {
    // 防止递归调用
    if (this._isRecordingError) {
      return;
    }
    this._isRecordingError = true;
    
    // 如果已经达到最大错误数，跳过
    if (this.performanceData.errors.length >= this.config.maxErrorsPerSession) {
      this._isRecordingError = false;
      return;
    }
    
    // 安全序列化错误对象
    const serializeError = (err) => {
      if (!err) {
        return 'Unknown Error';
      }
      if (typeof err === 'string') {
        return err;
      }
      if (err.message) {
        return err.message;
      }
      if (err.errMsg) {
        return err.errMsg;
      }
      if (typeof err === 'object') {
        return JSON.stringify(err);
      }
      return String(err);
    };
    
    const errorData = {
      timestamp: new Date().toISOString(),
      error: serializeError(error),
      stack: error.stack || '',
      context: String(context),
      url: this.getCurrentPage(),
      type: this.getErrorType(error),
      code: error.code || '',
      line: this.extractLineNumber(error.stack)
    };
    
    this.performanceData.errors.push(errorData);
    
    // 使用原生 console.error 避免递归
    console.error('记录错误:', errorData.error, errorData.context);
    
    // 自动上报错误
    if (this.isProduction) {
      this.queueReport({
        type: 'error',
        ...errorData
      });
    }
    
    this._isRecordingError = false;
  }

  // 获取错误类型
  getErrorType(error) {
    if (error instanceof TypeError) {
      return 'TypeError';
    }
    if (error instanceof RangeError) {
      return 'RangeError';
    }
    if (error instanceof ReferenceError) {
      return 'ReferenceError';
    }
    if (error instanceof SyntaxError) {
      return 'SyntaxError';
    }
    if (error && error.errMsg) {
      return 'WxApiError';
    }
    return 'UnknownError';
  }

  // 从堆栈中提取行号
  extractLineNumber(stack) {
    if (!stack) {
      return '';
    }
    const match = stack.match(/:(\d+):(\d+)/);
    return match ? match[1] : '';
  }

  // 获取当前页面
  getCurrentPage() {
    try {
      const pages = getCurrentPages();
      return pages.length ? pages[pages.length - 1].route : 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  // 分析性能等级
  analyzePerformanceLevel(duration) {
    if (duration < 100) {
      return 'excellent';
    }
    if (duration < 300) {
      return 'good';
    }
    if (duration < 500) {
      return 'normal';
    }
    if (duration < 1000) {
      return 'poor';
    }
    return 'bad';
  }

  // 分析FPS等级
  analyzeFpsLevel(fps) {
    if (fps >= 55) {
      return 'excellent';
    }
    if (fps >= 45) {
      return 'good';
    }
    if (fps >= 30) {
      return 'normal';
    }
    if (fps >= 20) {
      return 'poor';
    }
    return 'bad';
  }

  // 添加到上报队列
  queueReport(data) {
    this.reportQueue.push(data);
    
    // 如果队列达到批量上报大小，立即上报
    if (this.reportQueue.length >= this.config.batchReportSize) {
      this.flushReportQueue();
    }
  }

  // 刷新上报队列
  async flushReportQueue() {
    if (this.reportQueue.length === 0) {
      return;
    }
    
    const queue = [...this.reportQueue];
    this.reportQueue = [];
    
    try {
      await this.reportBatch(queue);
    } catch (error) {
      console.error('批量上报失败:', error);
      // 将失败的报告放回队列前端
      this.reportQueue = [...queue, ...this.reportQueue];
    }
  }

  // 批量上报
  async reportBatch(events) {
    if (!this.isProduction) {
      // 开发环境静默跳过
      return;
    }
    
    await this.retryRequest(() => 
      wx.cloud.callFunction({
        name: 'performanceMonitor',
        data: {
          action: 'reportBatch',
          events,
          timestamp: new Date().toISOString()
        }
      })
    );
  }

  // 带重试的请求
  async retryRequest(requestFn, retries = 0) {
    try {
      return await requestFn();
    } catch (error) {
      if (retries < this.config.retryCount) {
        await this.delay(this.config.retryDelay * (retries + 1));
        return await this.retryRequest(requestFn, retries + 1);
      }
      throw error;
    }
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 启动定期上报
  startPeriodicReport() {
    setInterval(() => {
      if (this.isProduction) {
        this.flushReportQueue();
        this.reportPerformanceSummary();
      }
    }, this.config.reportInterval);
  }

  // 上报性能摘要
  async reportPerformanceSummary() {
    try {
      const summary = this.generatePerformanceSummary();
      if (summary) {
        await wx.cloud.callFunction({
          name: 'performanceMonitor',
          data: {
            action: 'reportSummary',
            summary,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('上报性能摘要失败:', error);
    }
  }

  // 生成性能摘要
  generatePerformanceSummary() {
    const apiStats = {};
    
    Object.keys(this.performanceData.apiCalls).forEach(apiName => {
      const stats = this.performanceData.apiCalls[apiName];
      apiStats[apiName] = {
        total: stats.total,
        success: stats.success,
        failure: stats.failure,
        avgDuration: stats.avgDuration,
        maxDuration: stats.maxDuration
      };
    });
    
    return {
      pageLoadCount: Object.keys(this.performanceData.pageLoad).length,
      apiCallStats: apiStats,
      errorCount: this.performanceData.errors.length,
      fpsAvg: this.performanceData.fps.length > 0 
        ? this.performanceData.fps.reduce((sum, f) => sum + f.fps, 0) / this.performanceData.fps.length
        : 0,
      memoryAvg: this.performanceData.memory.length > 0
        ? this.performanceData.memory.reduce((sum, m) => sum + m.memory, 0) / this.performanceData.memory.length
        : 0
    };
  }

  // 上报页面性能
  async reportPagePerformance(pageName, duration, performanceLevel) {
    try {
      await wx.cloud.callFunction({
        name: 'performanceMonitor',
        data: {
          action: 'reportPage',
          pageName,
          duration,
          performanceLevel,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('上报页面性能失败:', error);
    }
  }

  // 上报API性能
  async reportApiPerformance(apiName, duration, success, errorType, performanceLevel) {
    try {
      await wx.cloud.callFunction({
        name: 'performanceMonitor',
        data: {
          action: 'reportApi',
          apiName,
          duration,
          success,
          errorType,
          performanceLevel,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('上报API性能失败:', error);
    }
  }

  // 上报FPS性能
  async reportFpsPerformance(fps, performanceLevel) {
    try {
      await wx.cloud.callFunction({
        name: 'performanceMonitor',
        data: {
          action: 'reportFps',
          fps,
          performanceLevel,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('上报FPS性能失败:', error);
    }
  }

  // 上报用户行为
  async reportUserAction(action, details) {
    try {
      await wx.cloud.callFunction({
        name: 'performanceMonitor',
        data: {
          action: 'reportUserAction',
          actionName: action,
          details,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('上报用户行为失败:', error);
    }
  }

  // 上报错误
  async reportError(errorData) {
    try {
      await wx.cloud.callFunction({
        name: 'reportError',
        data: {
          ...errorData,
          source: 'performance_monitor'
        }
      });
    } catch (error) {
      console.error('上报错误失败:', error);
    }
  }

  // 获取性能数据
  getPerformanceData() {
    return JSON.parse(JSON.stringify(this.performanceData));
  }

  // 重置性能数据
  resetPerformanceData() {
    this.performanceData = {
      pageLoad: {},
      apiCalls: {},
      memory: [],
      fps: [],
      errors: [],
      userActions: [],
      render: [],
      network: [],
      storage: []
    };
    this.reportQueue = [];
  }

  // 上报性能数据到云函数
  async reportPerformanceData() {
    try {
      // 检查云开发是否可用
      if (!wx.cloud) {
        console.warn('云开发未初始化，跳过性能数据上报');
        return { success: false, message: '云开发未初始化' };
      }
      
      const data = this.getPerformanceData();
      
      // 在开发环境中直接返回成功，跳过云函数调用
      if (!this.isProduction) {
        console.log('开发环境，跳过性能数据上报');
        return { success: true, message: '开发环境跳过' };
      }
      
      // 生产环境上报数据
      const res = await wx.cloud.callFunction({
        name: 'performanceMonitor',
        data: {
          action: 'report',
          performanceData: data
        }
      });
      
      console.log('性能数据上报成功', res.result);
      
      // 上报后重置数据
      this.resetPerformanceData();
      
      return res.result;
    } catch (error) {
      console.error('性能数据上报失败', error);
      // 不影响主流程，返回成功状态
      return { success: true, message: '性能数据上报失败，但不影响使用' };
    }
  }
}

// 导出单例
const performanceMonitor = new PerformanceMonitor();
module.exports = performanceMonitor;
module.exports.PerformanceMonitor = PerformanceMonitor;