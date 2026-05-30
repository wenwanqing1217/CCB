const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 3000,
  apiCallTime: 1000,
  fpsLow: 30,
  errorRateCritical: 0.1
};

const SLOW_QUERY_THRESHOLD = 500;

exports.main = async (event, context) => {
  try {
    const { action, performanceData, days, hours } = event;

    switch (action) {
      case 'report':
        return await reportPerformanceData(performanceData);
      case 'getReport':
        return await getPerformanceReport(days);
      case 'healthCheck':
        return await healthCheck();
      case 'getAlerts':
        return await getAlerts(days || 1);
      case 'getSlowQueries':
        return await getSlowQueries(hours || 24);
      default:
        return { success: false, error: '未知的操作类型' };
    }
  } catch (error) {
    console.error('性能监控服务错误', error);
    return { success: false, error: '服务暂时不可用，请稍后重试' };
  }
};

async function reportPerformanceData(performanceData) {
  try {
    const metrics = calculateMetrics(performanceData);
    const alerts = detectAlerts(metrics, performanceData);

    await db.collection('performance_data').add({
      data: {
        ...performanceData,
        metrics,
        alerts,
        timestamp: new Date(),
        openid: cloud.getWXContext().OPENID
      }
    });

    console.log('性能数据保存成功', { metrics, alerts });
    return { success: true, metrics, alerts };
  } catch (error) {
    console.error('性能数据保存失败', error);
    return { success: false, error: error.message };
  }
}

function calculateMetrics(performanceData) {
  const metrics = {
    averagePageLoadTime: 0,
    averageApiCallTime: 0,
    errorCount: performanceData.errors?.length || 0,
    memoryUsage: 0,
    averageFps: 0,
    slowQueryCount: 0,
    apiCallCount: 0,
    errorRate: 0
  };

  const pageLoadTimes = Object.values(performanceData.pageLoad || {})
    .map(item => item.duration)
    .filter(Boolean);

  if (pageLoadTimes.length > 0) {
    metrics.averagePageLoadTime = pageLoadTimes.reduce((sum, t) => sum + t, 0) / pageLoadTimes.length;
  }

  const apiCallTimes = [];
  const slowQueries = [];
  Object.values(performanceData.apiCalls || {}).forEach(calls => {
    if (Array.isArray(calls)) {
      calls.forEach(call => {
        apiCallTimes.push(call.duration);
        if (call.duration > SLOW_QUERY_THRESHOLD) {
          slowQueries.push(call);
        }
      });
    }
  });

  if (apiCallTimes.length > 0) {
    metrics.averageApiCallTime = apiCallTimes.reduce((sum, t) => sum + t, 0) / apiCallTimes.length;
    metrics.apiCallCount = apiCallTimes.length;
  }

  if (slowQueries.length > 0) {
    metrics.slowQueryCount = slowQueries.length;
  }

  if (performanceData.memory?.length > 0) {
    const memoryValues = performanceData.memory.map(item => item.memory);
    metrics.memoryUsage = memoryValues.reduce((sum, m) => sum + m, 0) / memoryValues.length;
  }

  if (performanceData.fps?.length > 0) {
    const fpsValues = performanceData.fps.map(item => item.fps);
    metrics.averageFps = fpsValues.reduce((sum, f) => sum + f, 0) / fpsValues.length;
    metrics.lowFpsCount = fpsValues.filter(f => f < PERFORMANCE_THRESHOLDS.fpsLow).length;
  }

  const totalOperations = pageLoadTimes.length + apiCallTimes.length;
  if (totalOperations > 0) {
    metrics.errorRate = metrics.errorCount / totalOperations;
  }

  return metrics;
}

function detectAlerts(metrics, performanceData) {
  const alerts = [];

  if (metrics.averagePageLoadTime > PERFORMANCE_THRESHOLDS.pageLoadTime) {
    alerts.push({
      level: 'warning',
      type: 'SLOW_PAGE_LOAD',
      message: `平均页面加载时间 ${Math.round(metrics.averagePageLoadTime)}ms 超过阈值 ${PERFORMANCE_THRESHOLDS.pageLoadTime}ms`,
      value: metrics.averagePageLoadTime
    });
  }

  if (metrics.averageApiCallTime > PERFORMANCE_THRESHOLDS.apiCallTime) {
    alerts.push({
      level: 'warning',
      type: 'SLOW_API_CALL',
      message: `平均API调用时间 ${Math.round(metrics.averageApiCallTime)}ms 超过阈值 ${PERFORMANCE_THRESHOLDS.apiCallTime}ms`,
      value: metrics.averageApiCallTime
    });
  }

  if (metrics.errorRate > PERFORMANCE_THRESHOLDS.errorRateCritical) {
    alerts.push({
      level: 'critical',
      type: 'HIGH_ERROR_RATE',
      message: `错误率 ${(metrics.errorRate * 100).toFixed(2)}% 超过阈值 ${(PERFORMANCE_THRESHOLDS.errorRateCritical * 100)}%`,
      value: metrics.errorRate
    });
  }

  if (metrics.averageFps > 0 && metrics.averageFps < PERFORMANCE_THRESHOLDS.fpsLow) {
    alerts.push({
      level: 'info',
      type: 'LOW_FPS',
      message: `平均FPS ${metrics.averageFps.toFixed(1)} 低于阈值 ${PERFORMANCE_THRESHOLDS.fpsLow}`,
      value: metrics.averageFps
    });
  }

  return alerts;
}

async function getPerformanceReport(days = 7) {
  try {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    const result = await db.collection('performance_data')
      .where({
        timestamp: {
          $gte: startTime
        }
      })
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    const aggregatedMetrics = aggregateMetrics(result.data);

    return {
      success: true,
      data: {
        records: result.data,
        aggregated: aggregatedMetrics,
        period: { start: startTime, end: new Date(), days }
      }
    };
  } catch (error) {
    console.error('获取性能报告失败', error);
    return { success: false, error: error.message };
  }
}

function aggregateMetrics(records) {
  if (!records || records.length === 0) {
    return null;
  }

  const metrics = records.reduce((acc, record) => {
    const m = record.metrics || {};
    return {
      totalPageLoadTime: (acc.totalPageLoadTime || 0) + (m.averagePageLoadTime || 0),
      totalApiCallTime: (acc.totalApiCallTime || 0) + (m.averageApiCallTime || 0),
      totalErrors: (acc.totalErrors || 0) + (m.errorCount || 0),
      totalMemory: (acc.totalMemory || 0) + (m.memoryUsage || 0),
      totalFps: (acc.totalFps || 0) + (m.averageFps || 0),
      recordCount: (acc.recordCount || 0) + 1
    };
  }, {});

  return {
    averagePageLoadTime: metrics.totalPageLoadTime / metrics.recordCount,
    averageApiCallTime: metrics.totalApiCallTime / metrics.recordCount,
    averageErrorRate: metrics.totalErrors / metrics.recordCount,
    averageMemoryUsage: metrics.totalMemory / metrics.recordCount,
    averageFps: metrics.totalFps / metrics.recordCount,
    totalRecords: metrics.recordCount
  };
}

async function healthCheck() {
  try {
    const checks = {
      database: await checkDatabase(),
      timestamp: new Date()
    };

    const isHealthy = Object.values(checks).every(check =>
      typeof check === 'object' ? check.healthy !== false : true
    );

    return {
      success: true,
      status: isHealthy ? 'healthy' : 'degraded',
      checks
    };
  } catch (error) {
    return {
      success: false,
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkDatabase() {
  try {
    await db.collection('performance_data').count();
    return { healthy: true, message: '数据库连接正常' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}

async function getAlerts(days = 1) {
  try {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    const result = await db.collection('performance_data')
      .where({
        timestamp: { $gte: startTime },
        'alerts.0': { $exists: true }
      })
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const allAlerts = [];
    result.data.forEach(record => {
      if (record.alerts) {
        record.alerts.forEach(alert => {
          allAlerts.push({
            ...alert,
            timestamp: record.timestamp,
            openid: record.openid
          });
        });
      }
    });

    return {
      success: true,
      data: {
        alerts: allAlerts,
        count: allAlerts.length,
        period: { start: startTime, end: new Date() }
      }
    };
  } catch (error) {
    console.error('获取告警信息失败', error);
    return { success: false, error: error.message };
  }
}

async function getSlowQueries(hours = 24) {
  try {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const result = await db.collection('performance_data')
      .where({
        timestamp: { $gte: startTime }
      })
      .limit(100)
      .get();

    const slowQueries = [];
    result.data.forEach(record => {
      Object.entries(record.apiCalls || {}).forEach(([apiName, calls]) => {
        if (Array.isArray(calls)) {
          calls.forEach(call => {
            if (call.duration > SLOW_QUERY_THRESHOLD) {
              slowQueries.push({
                apiName,
                duration: call.duration,
                timestamp: record.timestamp,
                success: call.success
              });
            }
          });
        }
      });
    });

    slowQueries.sort((a, b) => b.duration - a.duration);

    return {
      success: true,
      data: {
        slowQueries: slowQueries.slice(0, 50),
        count: slowQueries.length,
        threshold: SLOW_QUERY_THRESHOLD,
        period: { start: startTime, end: new Date() }
      }
    };
  } catch (error) {
    console.error('获取慢查询失败', error);
    return { success: false, error: error.message };
  }
}
