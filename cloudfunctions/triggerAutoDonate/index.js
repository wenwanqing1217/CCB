// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 计算15天前的时间戳
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000
    
    // 查询需要自动捐赠的盲盒
    const boxesToDonate = await db.collection('boxes')
      .where({
        status: 'active',
        publish_time: _.lt(fifteenDaysAgo)
      })
      .get()
    
    // 处理自动捐赠
    for (const box of boxesToDonate.data) {
      // 更新盲盒状态
      await db.collection('boxes')
        .doc(box._id)
        .update({
          data: {
            status: 'donated_pending'
          }
        })
      
      // 添加到捐赠记录
      await db.collection('donations')
        .add({
          data: {
            box_id: box._id,
            donor_id: box._openid,
            receiver_id: null, // 待分配
            feedback_img: '',
            feedback_text: '',
            create_time: Date.now()
          }
        })
    }
    
    return {
      success: true,
      donatedCount: boxesToDonate.data.length
    }
  } catch (error) {
    console.error('自动捐赠失败', error)
    return {
      success: false,
      error: error.message
    }
  }
}
