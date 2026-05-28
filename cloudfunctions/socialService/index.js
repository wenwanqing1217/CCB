const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

// 社交服务云函数
exports.main = async (event, context) => {
  const { action, ...data } = event;
  const openid = cloud.getWXContext().OPENID;

  try {
    switch (action) {
      case 'addFriend':
        return await addFriend(openid, data.targetUserId);
      case 'acceptFriend':
        return await acceptFriend(openid, data.requestId);
      case 'rejectFriend':
        return await rejectFriend(openid, data.requestId);
      case 'getFriends':
        return await getFriends(openid);
      case 'getFriendRequests':
        return await getFriendRequests(openid);
      case 'removeFriend':
        return await removeFriend(openid, data.friendId);
      case 'createTeam':
        return await createTeam(openid, data);
      case 'joinTeam':
        return await joinTeam(openid, data.teamId);
      case 'leaveTeam':
        return await leaveTeam(openid, data.teamId);
      case 'getTeams':
        return await getTeams(openid);
      case 'dissolveTeam':
        return await dissolveTeam(openid, data.teamId);
      case 'sendGift':
        return await sendGift(openid, data);
      default:
        return { success: false, message: '未知操作' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// 添加好友
async function addFriend(userId, targetUserId) {
  // 检查是否已是好友
  const existingFriend = await db.collection('friends')
    .where({
      $or: [
        { userId, friendId: targetUserId },
        { userId: targetUserId, friendId: userId }
      ]
    }).get();

  if (existingFriend.data.length > 0) {
    return { success: false, message: '已是好友' };
  }

  // 检查是否有未处理的请求
  const existingRequest = await db.collection('friendRequests')
    .where({
      $or: [
        { fromUserId: userId, toUserId: targetUserId },
        { fromUserId: targetUserId, toUserId: userId }
      ]
    }).get();

  if (existingRequest.data.length > 0) {
    return { success: false, message: '已有未处理的好友请求' };
  }

  // 创建好友请求
  await db.collection('friendRequests').add({
    data: {
      fromUserId: userId,
      toUserId: targetUserId,
      status: 'pending',
      createTime: new Date()
    }
  });

  return { success: true, message: '好友请求已发送' };
}

// 接受好友请求
async function acceptFriend(userId, requestId) {
  const request = await db.collection('friendRequests').doc(requestId).get();
  
  if (!request.data || request.data.toUserId !== userId) {
    return { success: false, message: '无效的请求' };
  }

  if (request.data.status !== 'pending') {
    return { success: false, message: '请求已处理' };
  }

  const { fromUserId } = request.data;

  // 创建双向好友关系
  await Promise.all([
    db.collection('friends').add({
      data: {
        userId,
        friendId: fromUserId,
        createTime: new Date()
      }
    }),
    db.collection('friends').add({
      data: {
        userId: fromUserId,
        friendId: userId,
        createTime: new Date()
      }
    }),
    db.collection('friendRequests').doc(requestId).update({
      data: { status: 'accepted' }
    })
  ]);

  return { success: true, message: '好友添加成功' };
}

// 拒绝好友请求
async function rejectFriend(userId, requestId) {
  const request = await db.collection('friendRequests').doc(requestId).get();
  
  if (!request.data || request.data.toUserId !== userId) {
    return { success: false, message: '无效的请求' };
  }

  await db.collection('friendRequests').doc(requestId).update({
    data: { status: 'rejected' }
  });

  return { success: true, message: '已拒绝好友请求' };
}

// 获取好友列表
async function getFriends(userId) {
  const friends = await db.collection('friends').where({ userId }).get();
  const friendIds = friends.data.map(f => f.friendId);

  if (friendIds.length === 0) {
    return { success: true, data: [] };
  }

  // 获取好友详细信息
  const users = await db.collection('users')
    .where({ _id: db.command.in(friendIds) })
    .field({ nickname: true, avatar: true, coins: true })
    .get();

  return { success: true, data: users.data };
}

// 获取好友请求
async function getFriendRequests(userId) {
  const requests = await db.collection('friendRequests')
    .where({ toUserId: userId, status: 'pending' })
    .get();

  const fromUserIds = requests.data.map(r => r.fromUserId);
  const users = await db.collection('users')
    .where({ _id: db.command.in(fromUserIds) })
    .field({ nickname: true, avatar: true })
    .get();

  const result = requests.data.map(req => {
    const user = users.data.find(u => u._id === req.fromUserId);
    return {
      ...req,
      fromUser: user
    };
  });

  return { success: true, data: result };
}

// 删除好友
async function removeFriend(userId, friendId) {
  await Promise.all([
    db.collection('friends').where({ userId, friendId }).remove(),
    db.collection('friends').where({ userId: friendId, friendId: userId }).remove()
  ]);

  return { success: true, message: '已删除好友' };
}

// 创建组队
async function createTeam(userId, data) {
  const { boxIds, teamName = '盲盒组队' } = data;

  if (!boxIds || boxIds.length === 0) {
    return { success: false, message: '请选择盲盒' };
  }

  const team = await db.collection('teams').add({
    data: {
      name: teamName,
      creatorId: userId,
      memberIds: [userId],
      boxIds,
      status: 'active',
      createTime: new Date(),
      drawTime: null
    }
  });

  return { success: true, data: team, message: '组队创建成功' };
}

// 加入组队
async function joinTeam(userId, teamId) {
  const team = await db.collection('teams').doc(teamId).get();
  
  if (!team.data) {
    return { success: false, message: '组队不存在' };
  }

  if (team.data.status !== 'active') {
    return { success: false, message: '组队已结束' };
  }

  if (team.data.memberIds.includes(userId)) {
    return { success: false, message: '已在组队中' };
  }

  await db.collection('teams').doc(teamId).update({
    data: {
      memberIds: [...team.data.memberIds, userId]
    }
  });

  return { success: true, message: '加入组队成功' };
}

// 离开组队
async function leaveTeam(userId, teamId) {
  const team = await db.collection('teams').doc(teamId).get();
  
  if (!team.data) {
    return { success: false, message: '组队不存在' };
  }

  if (!team.data.memberIds.includes(userId)) {
    return { success: false, message: '不在该组队中' };
  }

  // 如果是创建者离开，解散组队
  if (team.data.creatorId === userId) {
    return await dissolveTeam(userId, teamId);
  }

  const newMembers = team.data.memberIds.filter(id => id !== userId);
  
  await db.collection('teams').doc(teamId).update({
    data: {
      memberIds: newMembers
    }
  });

  return { success: true, message: '已离开组队' };
}

// 获取组队列表
async function getTeams(userId) {
  const teams = await db.collection('teams')
    .where({ memberIds: db.command.in([userId]), status: 'active' })
    .get();

  // 获取组队成员信息
  const result = await Promise.all(teams.data.map(async team => {
    const members = await db.collection('users')
      .where({ _id: db.command.in(team.memberIds) })
      .field({ nickname: true, avatar: true })
      .get();
    
    return {
      ...team,
      members: members.data
    };
  }));

  return { success: true, data: result };
}

// 解散组队
async function dissolveTeam(userId, teamId) {
  const team = await db.collection('teams').doc(teamId).get();
  
  if (!team.data) {
    return { success: false, message: '组队不存在' };
  }

  if (team.data.creatorId !== userId) {
    return { success: false, message: '只有创建者可以解散组队' };
  }

  await db.collection('teams').doc(teamId).update({
    data: { status: 'dissolved' }
  });

  return { success: true, message: '组队已解散' };
}

// 赠送礼物
async function sendGift(userId, data) {
  const { targetUserId, giftType, message = '' } = data;

  // 检查积分是否足够
  const user = await db.collection('users').doc(userId).get();
  
  if (!user.data || user.data.coins < 10) {
    return { success: false, message: '积分不足' };
  }

  // 扣除积分
  await db.collection('users').doc(userId).update({
    data: { coins: db.command.inc(-10) }
  });

  // 增加对方积分
  await db.collection('users').doc(targetUserId).update({
    data: { coins: db.command.inc(5) }
  });

  // 记录礼物
  await db.collection('gifts').add({
    data: {
      fromUserId: userId,
      toUserId: targetUserId,
      giftType,
      message,
      createTime: new Date()
    }
  });

  return { success: true, message: '礼物赠送成功' };
}