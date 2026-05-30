// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { title, desc, type, mode, price, campus, building, images, note } = event;
    const openid = cloud.getWXContext().OPENID;

    const newBox = {
      title: (title || '').trim(),
      desc: (desc || note || '').trim(),
      type: type || 'other',
      mode: mode || 'light',
      price: Math.round(Number(price || 0) * 100) / 100,
      campus: (campus || '').trim(),
      building: (building || '').trim(),
      images: Array.isArray(images) ? images.slice(0, 9) : [],
      openid,
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('boxes').add({ data: newBox });

    return {
      success: true,
      boxId: result._id,
      box: {
        ...newBox,
        _id: result._id
      }
    };
  } catch (error) {
    console.error('发布盲盒失败', error);
    return {
      success: false,
      error: error.message
    };
  }
};
