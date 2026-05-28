// 云函数入口文�?
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函�?
exports.main = async (event, context) => {
  try {
    const { boxId } = event
    
    const result = await db.collection('boxes')
      .doc(boxId)
      .get()
    
    return result.data
  } catch (error) {
    console.error('获取盲盒详情失败', error)
    return {}
  }
}