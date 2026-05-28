// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

function getDemoExpiringBoxes() {
  const now = Date.now()
  return [
    {
      _id: 'exp1',
      title: '即将过期的文具盲盒',
      price: 9.9,
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stationery%20blind%20box%20with%20pens%20and%20notebooks&image_size=square'],
      from_dorm: '中园公寓',
      to_dorm: '苏园居',
      expire_time: now + 1 * 24 * 60 * 60 * 1000
    },
    {
      _id: 'exp2',
      title: '即将过期的零食盲盒',
      price: 19.9,
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=snack%20gift%20box%20with%20chips%20and%20candies&image_size=square'],
      from_dorm: '中南公寓',
      to_dorm: '知行1栋',
      expire_time: now + 2 * 24 * 60 * 60 * 1000
    },
    {
      _id: 'exp3',
      title: '即将过期的美妆盲盒',
      price: 29.9,
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beauty%20blind%20box%20with%20cosmetics&image_size=square'],
      from_dorm: '新柏居',
      to_dorm: '敏学1栋',
      expire_time: now + 3 * 24 * 60 * 60 * 1000
    }
  ]
}

exports.main = async (event, context) => {
  try {
    const now = Date.now()
    const threeDaysLater = now + 3 * 24 * 60 * 60 * 1000
    
    const result = await db.collection('boxes')
      .where({
        status: 'active',
        expire_time: _.gt(now),
        expire_time: _.lt(threeDaysLater)
      })
      .orderBy('expire_time', 'asc')
      .get()
    
    if (result.data.length === 0) {
      return getDemoExpiringBoxes()
    }
    
    return result.data
  } catch (error) {
    console.error('获取即将过期的盲盒失败', error)
    return getDemoExpiringBoxes().slice(0, 2)
  }
}
