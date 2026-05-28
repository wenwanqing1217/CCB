// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    
    // 获取我的盲盒
    const result = await db.collection('boxes')
      .where({
        _openid: openid
      })
      .orderBy('publish_time', 'desc')
      .get()
    
    return result.data
  } catch (error) {
    console.error('获取我的盲盒失败', error)
    return []
  }
}
