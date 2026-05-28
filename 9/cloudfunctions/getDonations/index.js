// 云函数入口文�?
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函�?
exports.main = async (event, context) => {
  try {
    const donations = await db.collection('donations')
      .orderBy('create_time', 'desc')
      .get()
      .then(res => res.data)
    
    // 为每个捐赠记录添加盲盒信�?
    const donationsWithBoxInfo = await Promise.all(
      donations.map(async donation => {
        const box = await db.collection('boxes')
          .doc(donation.box_id)
          .get()
          .then(res => res.data)
        return {
          ...donation,
          box_info: box
        }
      })
    )
    
    return donationsWithBoxInfo
  } catch (error) {
    console.error('获取捐赠记录失败', error)
    return []
  }
}