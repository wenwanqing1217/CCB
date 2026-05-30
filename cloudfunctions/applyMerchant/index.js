const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID;
    const { merchantType, category, shopName, shopDesc, contactName, contactPhone, businessLicense, shopImages, idFront, idBack } = event;

    const existingApply = await db.collection('merchant_applies')
      .where({
        openid: openid,
        status: db.command.in(['pending', 'approved'])
      })
      .get();

    if (existingApply.data.length > 0) {
      return {
        success: false,
        message: '你已有待审核或已通过的申请'
      };
    }

    const now = Date.now();
    const applyData = {
      merchantType,
      category,
      shopName,
      shopDesc,
      contactName,
      contactPhone,
      shopImages,
      idFront,
      idBack,
      status: 'pending',
      openid: openid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (merchantType === 'formal' && businessLicense) {
      applyData.businessLicense = businessLicense;
    }

    const result = await db.collection('merchant_applies')
      .add({
        data: applyData
      });

    return {
      success: true,
      applyId: result._id
    };
  } catch (error) {
    console.error('商家申请创建失败', error);
    return {
      success: false,
      error: error.message
    };
  }
};
