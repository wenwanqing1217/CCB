// 分享服务云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { action, data } = event
    
    switch (action) {
      case 'createShare':
        return await createShare(data)
      case 'recordShare':
        return await recordShare(data)
      case 'getShareRewards':
        return await getShareRewards(data)
      case 'getShareStatistics':
        return await getShareStatistics(data)
      default:
        return {
          success: false,
          message: '无效的操作'
        }
    }
  } catch (error) {
    console.error('分享服务错误:', error)
    return {
      success: false,
      message: '分享服务错误'
    }
  }
}

// 创建分享记录
async function createShare(data) {
  const { openid, boxId, shareType } = data
  
  if (!openid || !boxId) {
    return {
      success: false,
      message: '参数错误'
    }
  }
  
  const share = await db.collection('shares').add({
    openid: openid,
    boxId: boxId,
    shareType: shareType || 'wechat',
    shareCount: 0,
    clickCount: 0,
    createdAt: new Date()
  })
  
  return {
    success: true,
    shareId: share._id
  }
}

// 记录分享行为
async function recordShare(data) {
  const { openid, boxId, shareType, sourceOpenid } = data
  
  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    }
  }
  
  // 创建分享记录
  const share = await db.collection('shares').add({
    openid: openid,
    boxId: boxId,
    shareType: shareType || 'wechat',
    sourceOpenid: sourceOpenid,
    createdAt: new Date()
  })
  
  // 如果是通过分享链接进入，给分享者增加积分
  if (sourceOpenid && sourceOpenid !== openid) {
    await addShareReward(sourceOpenid)
  }
  
  return {
    success: true,
    shareId: share._id
  }
}

// 添加分享奖励
async function addShareReward(openid) {
  try {
    // 获取当前用户积分
    const user = await db.collection('users').where({ openid: openid }).get()
    
    if (user.data.length > 0) {
      const currentCoins = user.data[0].blindBoxCoins || 0
      
      // 增加分享积分（每次分享奖励2积分）
      await db.collection('users').where({ openid: openid }).update({
        data: {
          blindBoxCoins: currentCoins + 2,
          updatedAt: new Date()
        }
      })
      
      // 记录积分变化日志
      await db.collection('coinLogs').add({
        openid: openid,
        type: 'share_reward',
        amount: 2,
        description: '分享盲盒获得积分',
        createdAt: new Date()
      })
    }
  } catch (error) {
    console.error('添加分享奖励失败:', error)
  }
}

// 获取分享奖励信息
async function getShareRewards(data) {
  const { openid } = data
  
  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    }
  }
  
  // 获取用户积分
  const user = await db.collection('users').where({ openid: openid }).get()
  
  if (user.data.length === 0) {
    return {
      success: true,
      data: {
        coins: 0,
        shareCount: 0,
        totalRewards: 0
      }
    }
  }
  
  // 获取分享次数
  const shares = await db.collection('shares').where({ openid: openid }).count()
  
  return {
    success: true,
    data: {
      coins: user.data[0].blindBoxCoins || 0,
      shareCount: shares.total,
      totalRewards: shares.total * 2
    }
  }
}

// 获取分享统计
async function getShareStatistics(data) {
  const { openid } = data
  
  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    }
  }
  
  // 获取用户分享记录
  const shares = await db.collection('shares')
    .where({ openid: openid })
    .orderBy('createdAt', 'desc')
    .get()
  
  return {
    success: true,
    data: {
      shareCount: shares.data.length,
      shares: shares.data
    }
  }
}