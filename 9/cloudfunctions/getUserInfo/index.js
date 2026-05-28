
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()


exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    
    // 查询用户信息
    const user = await db.collection('users')
      .where({ openid })
      .get()
      .then(res => res.data[0])
    
    if (user) {
      return user
    } else {
      // 如果用户不存在，创建默认用户
      const newUser = {
        openid,
        nickname: "新用户",
        avatar: '',
        role: 'student',
        dorm: '',
        love_score: 0,
        status: 'active'
      }
      
      await db.collection('users')
        .add({ data: newUser })
      
      return newUser
    }
  } catch (error) {
    console.error("获取用户信息失败", error)
    return {
      role: 'student',
      dorm: '',
      love_score: 0
    }
  }
}