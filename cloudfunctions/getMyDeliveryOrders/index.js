const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();

exports.main = async (event, context) => {
  const { riderId } = event;
  
  try {
    const result = await db.collection('orders')
      .where({ 
        type: 'delivery', 
        riderId,
        status: db.command.neq('pending')
      })
      .orderBy('createTime', 'desc')
      .get();
    
    return {
      success: true,
      data: result.data.map(item => ({
        ...item,
        acceptTime: item.acceptTime ? formatTime(item.acceptTime) : '',
        finishTime: item.finishTime ? formatTime(item.finishTime) : ''
      }))
    };
  } catch (error) {
    console.error('获取骑手订单失败:', error);
    return {
      success: false,
      message: '获取订单失败'
    };
  }
};

function formatTime(date) {
  const d = new Date(date);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}