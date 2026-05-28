const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, name, phone, dorm, address, idFront, idBack } = event
  
  try {
    await db.collection('riderApplies').add({
      data: {
        userId,
        name,
        phone,
        dorm,
        address,
        idFront,
        idBack,
        status: 'pending',
        createTime: new Date()
      }
    })
    
    return {
      success: true,
      message: '申请提交成功，请等待审核'
    }
  } catch (error) {
    console.error('骑手申请失败:', error)
    return {
      success: false,
      message: '申请失败，请重试'
    }
  }
}