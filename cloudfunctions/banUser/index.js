const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

async function getUserRole(openid) {
  try {
    const user = await db.collection('users')
      .where({ openid })
      .get()
      .then(res => res.data[0]);
    
    return user ? user.role : 'student';
  } catch (error) {
    console.error('获取用户角色失败', error);
    return 'student';
  }
}

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext();
    const { userId } = event;

    const userRole = await getUserRole(OPENID);
    
    if (userRole !== 'admin') {
      return {
        success: false,
        error: '权限不足，仅管理员可访问'
      };
    }

    await db.collection('users')
      .doc(userId)
      .update({
        data: {
          status: 'banned'
        }
      });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('封禁用户失败', error);
    return {
      success: false,
      error: error.message
    };
  }
};
