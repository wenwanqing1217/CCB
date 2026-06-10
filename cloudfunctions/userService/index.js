/**
 * 用户服务云函数
 * 负责用户登录、信息查询和更新操作
 * 
 * 对应论文4.3章节 - 数据库设计
 * 用户集合结构：
 * {
 *   _id: String,           // 用户ID，系统自动生成
 *   _openid: String,       // 微信openid，唯一标识用户
 *   nickName: String,      // 用户昵称
 *   avatarUrl: String,     // 用户头像URL
 *   phone: String,         // 手机号码（脱敏存储）
 *   dormitory: String,     // 宿舍信息
 *   role: String,          // 用户角色：user/rider/admin
 *   coins: Number,         // 盲盒积分数量
 *   lovePoints: Number,    // 爱心值
 *   createdAt: Date,       // 创建时间
 *   updatedAt: Date        // 更新时间
 * }
 */

// 云函数入口文件
const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init();

// 获取数据库实例
const db = cloud.database();

// 获取用户集合引用（对应论文4.3.1 用户集合）
const usersCollection = db.collection('users');
const certificationAppliesCollection = db.collection('certification_applies');

/**
 * 云函数入口函数
 * @param {Object} event - 事件参数
 * @param {string} event.action - 操作类型
 * @param {Object} event.data - 操作数据
 * @param {Object} context - 上下文参数
 * @returns {Object} - 操作结果
 */
exports.main = async (event, context) => {
  console.log('用户服务云函数收到请求:', event);
  const { action, data } = event;

  try {
    switch (action) {
      case 'login': {
        console.log('执行用户登录操作');
        const loginResult = await handleLogin(data);
        console.log('登录操作完成:', loginResult);
        return loginResult;
      }
      case 'updateCampusInfo':
        console.log('执行更新校园信息操作');
        return await handleUpdateCampusInfo(data);
      case 'getUserInfo':
        console.log('执行获取用户信息操作');
        return await handleGetUserInfo(data);
      case 'submitCertification':
        console.log('执行提交学生认证操作');
        return await handleSubmitCertification(data);
      default:
        console.log('未知操作类型:', action);
        return { success: false, message: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('用户服务云函数执行错误:', error);
    return { success: false, message: '服务器错误: ' + error.message };
  }
};

/**
 * 处理微信登录
 * 对应论文4.3.1 用户集合 - 登录注册功能
 * @param {Object} data - 登录数据
 * @param {Object} data.userInfo - 用户信息（nickName, avatarUrl）
 * @param {string} data.code - 微信登录临时凭证
 * @returns {Object} - 登录结果
 */
async function handleLogin(data) {
  const { userInfo, code } = data;
  
  try {
    // 调用微信接口获取用户openid（唯一标识）
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    console.log('获取用户openid:', openid);
    
    // 查询用户是否已存在（通过openid唯一标识）
    const existingUser = await usersCollection.where({ openid }).get();
    
    if (existingUser.data.length > 0) {
      // 用户已存在，更新用户信息
      const user = existingUser.data[0];
      console.log('用户已存在，更新信息:', user._id);
      
      await usersCollection.doc(user._id).update({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          updatedAt: new Date()  // 更新时间戳
        }
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
      // 新用户，创建用户记录
      console.log('新用户，创建用户记录');
      
      const newUser = {
        openid,                                  // 微信openid
        nickName: userInfo.nickName,             // 用户昵称
        avatarUrl: userInfo.avatarUrl,           // 用户头像
        role: 'student',                         // 默认角色：学生
        campusInfo: { college: '', dorm: '' },   // 校园信息
        blindBoxCoins: 10,                       // 新用户赠送10盲盒积分
        lovePoints: 0,                           // 爱心值初始为0
        verifyStatus: 'unverified',              // 认证状态：未认证
        createdAt: new Date(),                   // 创建时间
        updatedAt: new Date()                    // 更新时间
      };
      
      const result = await usersCollection.add(newUser);
      console.log('新用户创建成功:', result._id);
      
      return {
        success: true,
        user: {
          ...newUser,
          _id: result._id
        }
      };
    }
  } catch (error) {
    console.error('登录处理失败:', error);
    return { success: false, message: '登录失败: ' + error.message };
  }
}

/**
 * 处理更新校园信息
 * 对应论文4.3.1 用户集合 - 更新用户信息功能
 * @param {Object} data - 更新数据
 * @param {string} data.openid - 用户openid
 * @param {string} data.college - 学院信息
 * @param {string} data.dorm - 宿舍信息
 * @returns {Object} - 更新结果
 */
async function handleUpdateCampusInfo(data) {
  const { openid, college, dorm } = data;
  
  try {
    // 查询用户是否存在
    const user = await usersCollection.where({ openid }).get();
    
    if (user.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }
    
    // 更新用户校园信息
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
      message: '校园信息更新成功'
    };
  } catch (error) {
    console.error('更新校园信息失败:', error);
    return { success: false, message: '更新失败: ' + error.message };
  }
}

/**
 * 获取用户信息
 * 对应论文4.3.1 用户集合 - 查询用户信息功能
 * @param {Object} data - 查询数据
 * @param {string} data.openid - 用户openid
 * @returns {Object} - 用户信息
 */
async function handleGetUserInfo(data) {
  const { openid } = data;
  
  try {
    // 查询用户信息
    const user = await usersCollection.where({ openid }).get();
    
    if (user.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }
    
    return {
      success: true,
      user: user.data[0]
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

/**
 * 提交学生认证申请
 */
async function handleSubmitCertification(data) {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { realName, school, studentId, phone, studentCard } = data || {};

  if (!realName || !studentId || !phone) {
    return { success: false, message: '请填写完整认证信息' };
  }

  try {
    const userRes = await usersCollection.where({ openid }).get();
    if (userRes.data.length === 0) {
      return { success: false, message: '用户不存在，请先登录' };
    }

    const user = userRes.data[0];
    const pending = await certificationAppliesCollection.where({
      openid,
      status: 'pending'
    }).get();

    if (pending.data.length > 0) {
      return { success: false, message: '已有待审核的认证申请' };
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

    return { success: true, message: '认证申请已提交' };
  } catch (error) {
    console.error('提交认证失败:', error);
    return { success: false, message: '提交失败: ' + error.message };
  }
}