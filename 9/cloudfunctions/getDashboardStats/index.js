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

    const userRole = await getUserRole(OPENID)
    
    if (userRole !== 'admin' && userRole !== 'merchant') {
      return {
        success: false,
        error: '权限不足，仅管理员或商家可访问'
      }
    }

    const totalUsers = await db.collection('users')
      .count()
      .then(res => res.total)
    
    const totalBoxes = await db.collection('boxes')
      .count()
      .then(res => res.total)
    
    const totalOrders = await db.collection('orders')
      .count()
      .then(res => res.total)
    
    const totalDonations = await db.collection('donations')
      .count()
      .then(res => res.total)
    
    return {
      success: true,
      data: {
        totalUsers,
        totalBoxes,
        totalOrders,
        totalDonations
      }
    }
  } catch (error) {
    console.error('获取数据大屏统计失败', error)
    return {
      success: false,
      error: error.message
    }
  }
}
