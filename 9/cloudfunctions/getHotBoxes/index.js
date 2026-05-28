// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 模拟数据
const mockHotBoxes = [
  {
    _id: '1',
    title: '神秘文具盲盒',
    price: 9.9,
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stationery%20blind%20box%20with%20pens%20and%20notebooks&image_size=square'],
    from_dorm: '1栋',
    to_dorm: '5栋',
    stock: 50,
    sales: 23
  },
  {
    _id: '2',
    title: '零食大礼包',
    price: 19.9,
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=snack%20gift%20box%20with%20chips%20and%20candies&image_size=square'],
    from_dorm: '3栋',
    to_dorm: '7栋',
    stock: 30,
    sales: 45
  },
  {
    _id: '3',
    title: '美妆盲盒',
    price: 29.9,
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beauty%20blind%20box%20with%20cosmetics&image_size=square'],
    from_dorm: '2栋',
    to_dorm: '6栋',
    stock: 20,
    sales: 18
  },
  {
    _id: '4',
    title: '科技小玩意儿',
    price: 39.9,
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20gadgets%20blind%20box&image_size=square'],
    from_dorm: '4栋',
    to_dorm: '8栋',
    stock: 15,
    sales: 12
  },
  {
    _id: '5',
    title: '图书盲盒',
    price: 14.9,
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20blind%20box%20with%20novels&image_size=square'],
    from_dorm: '5栋',
    to_dorm: '9栋',
    stock: 40,
    sales: 27
  },
  {
    _id: '6',
    title: '运动器材盲盒',
    price: 24.9,
    images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20equipment%20blind%20box&image_size=square'],
    from_dorm: '6栋',
    to_dorm: '10栋',
    stock: 25,
    sales: 15
  }
]

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const result = await db.collection('boxes')
      .where({
        status: 'active'
      })
      .orderBy('publish_time', 'desc')
      .limit(6)
      .get()
    
    // 如果数据库中没有数据，返回模拟数据
    if (result.data.length === 0) {
      return mockHotBoxes
    }
    
    return result.data
  } catch (error) {
    console.error('获取热门盲盒失败', error)
    // 出错时返回模拟数据
    return mockHotBoxes.slice(0, 3)
  }
}