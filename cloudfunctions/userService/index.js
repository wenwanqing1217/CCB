/**
 * userService
 */

const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();

const usersCollection = db.collection('users');
const certificationAppliesCollection = db.collection('certification_applies');


exports.main = async (event, context) => {
  const { action, data } = event;

  try {
    switch (action) {
      case 'login': {
        const loginResult = await handleLogin(data);
        return loginResult;
      }
      case 'updateCampusInfo':
        return await handleUpdateCampusInfo(data);
      case 'getUserInfo':
        return await handleGetUserInfo(data);
      case 'submitCertification':
        return await handleSubmitCertification(data);
      default:
        return { success: false, message: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('用户服务云函数执行错误', error);
    return { success: false, message: '服务器错误: ' + error.message };
  }
};


async function handleLogin(data) {
  const { userInfo, code } = data;
  
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const existingUser = await usersCollection.where({ openid }).get();
    
    if (existingUser.data.length > 0) {
      const user = existingUser.data[0];
      await usersCollection.doc(user._id).update({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          updatedAt: new Date()          }
      });
      
      return {
        success: true,
        user: {
          _id: user._id,
          openid: user.openid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          campusInfo: user.campusInfo || { college: '', dorm: '' },
          blindBoxCoins: user.blindBoxCoins || 0,
          lovePoints: user.lovePoints || 0,
          role: user.role || 'student',
          updatedAt: new Date()
        }
      };
    } else {
      const newUser = {
        openid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        role: 'student',
        campusInfo: { college: '', dorm: '' },
        blindBoxCoins: 10,
        lovePoints: 0,
        verifyStatus: 'unverified',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.add(newUser);
      return {
        success: true,
        user: {
          ...newUser,
          _id: result._id
        }
      };
    }
  } catch (error) {
    console.error('鐧诲綍澶勭悊澶辫触:', error);
    return { success: false, message: '鐧诲綍澶辫触: ' + error.message };
  }
}


async function handleUpdateCampusInfo(data) {
  const { openid, college, dorm } = data;
  
  try {
    const user = await usersCollection.where({ openid }).get();
    
    if (user.data.length === 0) {
      return { success: false, message: '鐢ㄦ埛涓嶅瓨鍦' };
    }
    
    await usersCollection.doc(user.data[0]._id).update({
      data: {
        campusInfo: {
          college,
          dorm
        },
        updatedAt: new Date()
      }
    });
    
    return {
      success: true,
      message: '鏍″洯淇℃伅鏇存柊鎴愬姛'
    };
  } catch (error) {
    console.error('鏇存柊鏍″洯淇℃伅澶辫触:', error);
    return { success: false, message: '鏇存柊澶辫触: ' + error.message };
  }
}


async function handleGetUserInfo(data) {
  const { openid } = data;
  
  try {
    const user = await usersCollection.where({ openid }).get();
    
    if (user.data.length === 0) {
      return { success: false, message: '鐢ㄦ埛涓嶅瓨鍦' };
    }
    
    return {
      success: true,
      user: user.data[0]
    };
  } catch (error) {
    console.error('鑾峰彇鐢ㄦ埛淇℃伅澶辫触:', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}


async function handleSubmitCertification(data) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { realName, school, studentId, phone, studentCard } = data || {};

  if (!realName || !studentId || !phone) {
    return { success: false, message: '璇峰～鍐欏畬鏁磋璇佷俊鎭' };
  }

  try {
    const userRes = await usersCollection.where({ openid }).get();
    if (userRes.data.length === 0) {
      return { success: false, message: '鐢ㄦ埛涓嶅瓨鍦紝璇峰厛鐧诲綍' };
    }

    const user = userRes.data[0];
    const pending = await certificationAppliesCollection.where({
      openid,
      status: 'pending'
    }).get();

    if (pending.data.length > 0) {
      return { success: false, message: '宸叉湁寰呭鏍哥殑璁よ瘉鐢宠' };
    }

    await certificationAppliesCollection.add({
      data: {
        openid,
        realName,
        school: school || '',
        studentId,
        phone,
        studentCard: studentCard || '',
        status: 'pending',
        createdAt: new Date()
      }
    });

    await usersCollection.doc(user._id).update({
      data: {
        verifyStatus: 'pending',
        updatedAt: new Date()
      }
    });

    return { success: true, message: '璁よ瘉鐢宠宸叉彁浜' };
  } catch (error) {
    console.error('鎻愪氦璁よ瘉澶辫触:', error);
    return { success: false, message: '鎻愪氦澶辫触: ' + error.message };
  }
}
