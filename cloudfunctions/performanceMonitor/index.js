const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 上报性能数据
exports.reportPerformanceData = async (performanceData) => {
  try {
    // 计算性能指标
    const metrics = calculateMetrics(performanceData)
    
    // 保存到数据库
    const result = await db.collection('performance_data').add({
      data: {
        ...performanceData,
        metrics,
        timestamp: new Date(),
        openid: cloud.getWXContext().OPENID
      }
    })
    
    console.log('性能数据保存成功', result)
    return { success: true, metrics }
  } catch (error) {
    console.error('性能数据保存失败', error)
    return { error: error.message }
  }
}

// 计算性能指标
function calculateMetrics(performanceData) {
  const metrics = {
    averagePageLoadTime: 0,
    averageApiCallTime: 0,
    errorCount: performanceData.errors.length,
    memoryUsage: 0,
    averageFps: 0
  }
  
  // 计算平均页面加载时间
  const pageLoadTimes = Object.values(performanceData.pageLoad).map(item => item.duration)
  if (pageLoadTimes.length > 0) {
    metrics.averagePageLoadTime = pageLoadTimes.reduce((sum, time) => sum + time, 0) / pageLoadTimes.length
  }
  
  // 计算平均API调用时间
  const apiCallTimes = []
  Object.values(performanceData.apiCalls).forEach(calls => {
    calls.forEach(call => apiCallTimes.push(call.duration))
  })
  if (apiCallTimes.length > 0) {
    metrics.averageApiCallTime = apiCallTimes.reduce((sum, time) => sum + time, 0) / apiCallTimes.length
  }
  
  // 计算平均内存使用
  if (performanceData.memory.length > 0) {
    const memoryValues = performanceData.memory.map(item => item.memory)
    metrics.memoryUsage = memoryValues.reduce((sum, memory) => sum + memory, 0) / memoryValues.length
  }
  
  // 计算平均FPS
  if (performanceData.fps.length > 0) {
    const fpsValues = performanceData.fps.map(item => item.fps)
    metrics.averageFps = fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length
  }
  
  return metrics
}

// 获取性能报告
exports.getPerformanceReport = async (days = 7) => {
  try {
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - days)
    
    const result = await db.collection('performance_data')
      .where({
        timestamp: {
          $gte: startTime
        }
      })
      .get()
    
    return { success: true, data: result.data }
  } catch (error) {
    console.error('获取性能报告失败', error)
    return { error: error.message }
  }
}

exports.main = async (event, context) => {
  try {
    const { action, performanceData, days } = event
    
    switch (action) {
      case 'report':
        return await exports.reportPerformanceData(performanceData)
      case 'getReport':
        return await exports.getPerformanceReport(days)
      default:
        return { error: '未知的操作类型' }
    }
  } catch (error) {
    console.error('性能监控服务错误', error)
    return { error: '服务暂时不可用，请稍后重试' }
  }
}