const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const openid = cloud.getWXContext().OPENID
    const { merchantType, category, shopName, shopDesc, contactName, contactPhone, businessLicense, shopImages, idFront, idBack } = event

    const existingApply = await db.collection('merchant_applies')
      .where({
        _openid: openid,
        status: db.command.in(['pending', 'approved'])
      })
      .get()

    if (existingApply.data.length > 0) {
      return {
        success: false,
        message: '鎮ㄥ凡鏈夊緟瀹℃牳鎴栧凡閫氳繃鐨勭敵璇?
      }
    }

    const now = Date.now()
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
      applyTime: new Date(now).toLocaleString('zh-CN'),
      createTime: now,
      _openid: openid
    }

    if (merchantType === 'formal' && businessLicense) {
      applyData.businessLicense = businessLicense
    }

    const result = await db.collection('merchant_applies')
      .add({
        data: applyData
      })

    return {
      success: true,
      applyId: result._id
    }
  } catch (error) {
    console.error('鍟嗗鍏ラ┗鐢宠澶辫触', error)
    return {
      success: false,
      error: error.message
    }
  }
}
