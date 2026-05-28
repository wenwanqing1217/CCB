const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

async function getUserRole(openid) {
  try {
    const user = await db.collection('users')
      .where({ openid })
      .get()
      .then(res => res.data[0])
    
    return user ? user.role : 'student'
  } catch (error) {
    console.error('获取用户角色失败', error)
    return 'student'
  }
}

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const { applyId, approved, rejectReason } = event

    const userRole = await getUserRole(OPENID)
    
    if (userRole !== 'admin') {
      return {
        success: false,
        error: '权限不足，仅管理员可访问'
      }
    }

    const apply = await db.collection('merchant_applies')
      .doc(applyId)
      .get()

    if (!apply.data) {
      return {
        success: false,
        error: '申请不存在'
      }
    }

    const status = approved ? 'approved' : 'rejected'

    await db.collection('merchant_applies')
      .doc(applyId)
      .update({
        data: {
          status,
          rejectReason: approved ? '' : rejectReason,
          reviewTime: Date.now()
        }
      })

    if (approved) {
      await db.collection('users')
        .where({
          _openid: apply.data._openid
        })
        .update({
          data: {
            role: 'merchant',
            merchantInfo: {
              shopName: apply.data.shopName,
              category: apply.data.category,
              shopDesc: apply.data.shopDesc,
              approvedTime: Date.now()
            }
          }
        })
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('审核商家申请失败', error)
    return {
      success: false,
      error: error.message
    }
  }
}
