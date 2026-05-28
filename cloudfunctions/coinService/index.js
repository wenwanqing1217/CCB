// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()
const usersCollection = db.collection('users')
const coinLogsCollection = db.collection('coinLogs')

// 积分获取配置
const COIN_CONFIG = {
  SIGN_IN: 1,                     // 每日签到
  FIRST_TRADE: 5,                 // 首次交易
  SHARE: 2,                       // 分享
  INVITE: 10,                     // 邀请好友
  DONATE: 5                       // 捐赠
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('coinService 收到请求:', event)
  const { action, data } = event

  try {
    switch (action) {
      case 'signIn':
        return await handleSignIn(data)
      case 'share':
        return await handleShare(data)
      case 'invite':
        return await handleInvite(data)
      case 'firstTrade':
        return await handleFirstTrade(data)
      case 'donate':
        return await handleDonate(data)
      case 'consume':
        return await handleConsume(data)
      case 'getCoinLog':
        return await handleGetCoinLog(data)
      default:
        return { success: false, message: '未知操作: ' + action }
    }
  } catch (error) {
    console.error('coinService 错误:', error)
    return { success: false, message: '服务器错误: ' + error.message }
  }
}

// 每日签到
async function handleSignIn(data) {
  const { openid } = data
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 检查今日是否已签到
  const todayLog = await coinLogsCollection.where({
    openid,
    type: 'signIn',
    createdAt: db.command.gte(today)
  }).get()
  
  if (todayLog.data.length > 0) {
    return { success: false, message: '今日已签到' }
  }
  
  // 增加积分
  await usersCollection.where({ openid }).update({
    data: {
      blindBoxCoins: db.command.inc(COIN_CONFIG.SIGN_IN),
      updatedAt: new Date()
    }
  })
  
  // 记录日志
  await coinLogsCollection.add({
    data: {
      openid,
      type: 'signIn',
      amount: COIN_CONFIG.SIGN_IN,
      balance: await getCurrentCoins(openid),
      description: '每日签到',
      createdAt: new Date()
    }
  })
  
  return { success: true, message: '签到成功，获得' + COIN_CONFIG.SIGN_IN + '积分', coins: COIN_CONFIG.SIGN_IN }
}

// 分享商品
async function handleShare(data) {
  const { openid } = data
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 检查今日分享次数（每日限3次）
  const todayShares = await coinLogsCollection.where({
    openid,
    type: 'share',
    createdAt: db.command.gte(today)
  }).count()
  
  if (todayShares.total >= 3) {
    return { success: false, message: '今日分享次数已达上限' }
  }
  
  // 增加积分
  await usersCollection.where({ openid }).update({
    data: {
      blindBoxCoins: db.command.inc(COIN_CONFIG.SHARE),
      updatedAt: new Date()
    }
  })
  
  // 记录日志
  await coinLogsCollection.add({
    data: {
      openid,
      type: 'share',
      amount: COIN_CONFIG.SHARE,
      balance: await getCurrentCoins(openid),
      description: '分享商品',
      createdAt: new Date()
    }
  })
  
  return { success: true, message: '分享成功，获得' + COIN_CONFIG.SHARE + '积分', coins: COIN_CONFIG.SHARE }
}

// 邀请好友
async function handleInvite(data) {
  const { openid, inviteeOpenid } = data
  
  // 检查是否已邀请过该用户
  const existingInvite = await coinLogsCollection.where({
    openid,
    type: 'invite',
    extraData: inviteeOpenid
  }).get()
  
  if (existingInvite.data.length > 0) {
    return { success: false, message: '已邀请过该好友' }
  }
  
  // 增加积分
  await usersCollection.where({ openid }).update({
    data: {
      blindBoxCoins: db.command.inc(COIN_CONFIG.INVITE),
      updatedAt: new Date()
    }
  })
  
  // 记录日志
  await coinLogsCollection.add({
    data: {
      openid,
      type: 'invite',
      amount: COIN_CONFIG.INVITE,
      balance: await getCurrentCoins(openid),
      description: '邀请好友注册',
      extraData: inviteeOpenid,
      createdAt: new Date()
    }
  })
  
  return { success: true, message: '邀请成功，获得' + COIN_CONFIG.INVITE + '积分', coins: COIN_CONFIG.INVITE }
}

// 首次交易奖励
async function handleFirstTrade(data) {
  const { openid } = data
  
  // 检查是否已获得首次交易奖励
  const firstTradeLog = await coinLogsCollection.where({
    openid,
    type: 'firstTrade'
  }).get()
  
  if (firstTradeLog.data.length > 0) {
    return { success: false, message: '已获得首次交易奖励' }
  }
  
  // 增加积分
  await usersCollection.where({ openid }).update({
    data: {
      blindBoxCoins: db.command.inc(COIN_CONFIG.FIRST_TRADE),
      updatedAt: new Date()
    }
  })
  
  // 记录日志
  await coinLogsCollection.add({
    data: {
      openid,
      type: 'firstTrade',
      amount: COIN_CONFIG.FIRST_TRADE,
      balance: await getCurrentCoins(openid),
      description: '完成首次交易',
      createdAt: new Date()
    }
  })
  
  return { success: true, message: '获得首次交易奖励，获得' + COIN_CONFIG.FIRST_TRADE + '积分', coins: COIN_CONFIG.FIRST_TRADE }
}

// 捐赠奖励
async function handleDonate(data) {
  const { openid } = data
  
  // 增加积分
  await usersCollection.where({ openid }).update({
    data: {
      blindBoxCoins: db.command.inc(COIN_CONFIG.DONATE),
      updatedAt: new Date()
    }
  })
  
  // 记录日志
  await coinLogsCollection.add({
    data: {
      openid,
      type: 'donate',
      amount: COIN_CONFIG.DONATE,
      balance: await getCurrentCoins(openid),
      description: '参与公益捐赠',
      createdAt: new Date()
    }
  })
  
  return { success: true, message: '捐赠成功，获得' + COIN_CONFIG.DONATE + '积分', coins: COIN_CONFIG.DONATE }
}

// 消耗积分（摇一摇）
async function handleConsume(data) {
  const { openid, amount = 10 } = data
  
  // 获取当前积分
  const user = await usersCollection.where({ openid }).get()
  
  if (user.data.length === 0) {
    return { success: false, message: '用户不存在' }
  }
  
  const currentCoins = user.data[0].blindBoxCoins || 0
  
  if (currentCoins < amount) {
    return { success: false, message: '积分不足' }
  }
  
  // 扣除积分
  await usersCollection.where({ openid }).update({
    data: {
      blindBoxCoins: db.command.inc(-amount),
      updatedAt: new Date()
    }
  })
  
  // 记录日志
  await coinLogsCollection.add({
    data: {
      openid,
      type: 'consume',
      amount: -amount,
      balance: await getCurrentCoins(openid),
      description: '摇一摇消耗',
      createdAt: new Date()
    }
  })
  
  return { success: true, message: '扣除' + amount + '积分', coins: -amount }
}

// 获取积分记录
async function handleGetCoinLog(data) {
  const { openid, page = 0, size = 20 } = data
  
  const logs = await coinLogsCollection.where({ openid })
    .orderBy('createdAt', 'desc')
    .skip(page * size)
    .limit(size)
    .get()
  
  return { success: true, logs: logs.data }
}

// 获取当前积分
async function getCurrentCoins(openid) {
  const user = await usersCollection.where({ openid }).get()
  return user.data.length > 0 ? (user.data[0].blindBoxCoins || 0) : 0
}