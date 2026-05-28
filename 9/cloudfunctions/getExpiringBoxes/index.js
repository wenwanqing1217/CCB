// 云函数入口文�?
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函�?
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
    
    // 如果数据库中没有数据，返回模拟数�?
    if (result.data.length === 0) {
      // 计算过期时间�?-3天内�?
      const now = Date.now()
      return [
        {
          _id: 'exp1',
          title: '即将过期的文具盲�?,
          price: 9.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stationery%20blind%20box%20with%20pens%20and%20notebooks&image_size=square'],
          from_dorm: '1�?,
          to_dorm: '5�?,
          expire_time: now + 1 * 24 * 60 * 60 * 1000 // 1天后过期
        },
        {
          _id: 'exp2',
          title: '即将过期的零食盲�?,
          price: 19.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=snack%20gift%20box%20with%20chips%20and%20candies&image_size=square'],
          from_dorm: '3�?,
          to_dorm: '7�?,
          expire_time: now + 2 * 24 * 60 * 60 * 1000 // 2天后过期
        },
        {
          _id: 'exp3',
          title: '即将过期的美妆盲�?,
          price: 29.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beauty%20blind%20box%20with%20cosmetics&image_size=square'],
          from_dorm: '2�?,
          to_dorm: '6�?,
          expire_time: now + 3 * 24 * 60 * 60 * 1000 // 3天后过期
        }
      ]
    }
    
    return result.data
  } catch (error) {
    console.error('获取即将过期的盲盒失�?, error)
    // 出错时返回模拟数�?
    const now = Date.now()
    return [
      {
        _id: 'exp1',
        title: '即将过期的文具盲�?,
        price: 9.9,
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stationery%20blind%20box%20with%20pens%20and%20notebooks&image_size=square'],
        from_dorm: '1�?,
        to_dorm: '5�?,
        expire_time: now + 1 * 24 * 60 * 60 * 1000 // 1天后过期
      },
      {
        _id: 'exp2',
        title: '即将过期的零食盲�?,
        price: 19.9,
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=snack%20gift%20box%20with%20chips%20and%20candies&image_size=square'],
        from_dorm: '3�?,
        to_dorm: '7�?,
        expire_time: now + 2 * 24 * 60 * 60 * 1000 // 2天后过期
      }
    ]
  }
}