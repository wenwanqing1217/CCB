// 错误上报云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 记录错误信息到数据库
    await db.collection('error_logs').add({
      data: {
        error: event.error,
        timestamp: event.timestamp,
        path: event.path,
        openid: cloud.getWXContext().OPENID,
        created_at: new Date()
      }
    })
    
    return {
      success: true,
      message: '错误上报成功'
    }
  } catch (error) {
    console.error('错误上报云函数失败:', error)
    return {
      success: false,
      message: '错误上报失败',
      error: error.toString()
    }
  }
}