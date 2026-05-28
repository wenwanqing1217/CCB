// 云函数入口文�?
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函�?
exports.main = async (event, context) => {
  try {
    const result = await db.collection('donations')
      .count()
    
    return result.total
  } catch (error) {
    console.error('获取帮助人数失败', error)
    return 0
  }
}