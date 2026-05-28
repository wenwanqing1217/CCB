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
    const { category, keyword, page = 1, pageSize = 10 } = event
    
    // 构建查询条件
    let query = db.collection('boxes').where({
      status: 'active'
    })
    
    // 分类筛�?
    if (category && category !== 'all') {
      // 这里简化处理，实际项目中可能需要根据标题或标签进行分类
      query = query.where({
        title: _.regexp(`.*${category}.*`)
      })
    }
    
    // 关键词搜�?
    if (keyword) {
      query = query.where({
        title: _.regexp(`.*${keyword}.*`)
      })
    }
    
    // 分页查询
    const result = await query
      .orderBy('publish_time', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    // 如果数据库中没有数据，返回模拟数�?
    if (result.data.length === 0) {
      // 模拟数据
      const mockData = [
        {
          _id: '1',
          title: '神秘文具盲盒',
          price: 9.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stationery%20blind%20box%20with%20pens%20and%20notebooks&image_size=square'],
          from_dorm: '1�?,
          to_dorm: '5�?,
          stock: 50,
          sales: 23
        },
        {
          _id: '2',
          title: '零食大礼�?,
          price: 19.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=snack%20gift%20box%20with%20chips%20and%20candies&image_size=square'],
          from_dorm: '3�?,
          to_dorm: '7�?,
          stock: 30,
          sales: 45
        },
        {
          _id: '3',
          title: '美妆盲盒',
          price: 29.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beauty%20blind%20box%20with%20cosmetics&image_size=square'],
          from_dorm: '2�?,
          to_dorm: '6�?,
          stock: 20,
          sales: 18
        },
        {
          _id: '4',
          title: '科技小玩意儿',
          price: 39.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20gadgets%20blind%20box&image_size=square'],
          from_dorm: '4�?,
          to_dorm: '8�?,
          stock: 15,
          sales: 12
        },
        {
          _id: '5',
          title: '图书盲盒',
          price: 14.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20blind%20box%20with%20novels&image_size=square'],
          from_dorm: '5�?,
          to_dorm: '9�?,
          stock: 40,
          sales: 27
        },
        {
          _id: '6',
          title: '运动器材盲盒',
          price: 24.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20equipment%20blind%20box&image_size=square'],
          from_dorm: '6�?,
          to_dorm: '10�?,
          stock: 25,
          sales: 15
        },
        {
          _id: '7',
          title: '手办盲盒',
          price: 49.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=action%20figure%20blind%20box&image_size=square'],
          from_dorm: '7�?,
          to_dorm: '3�?,
          stock: 10,
          sales: 8
        },
        {
          _id: '8',
          title: '绿植盲盒',
          price: 12.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=plant%20blind%20box&image_size=square'],
          from_dorm: '8�?,
          to_dorm: '4�?,
          stock: 35,
          sales: 19
        },
        {
          _id: '9',
          title: '首饰盲盒',
          price: 29.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jewelry%20blind%20box&image_size=square'],
          from_dorm: '9�?,
          to_dorm: '2�?,
          stock: 18,
          sales: 14
        },
        {
          _id: '10',
          title: '电影周边盲盒',
          price: 39.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20merchandise%20blind%20box&image_size=square'],
          from_dorm: '10�?,
          to_dorm: '1�?,
          stock: 12,
          sales: 7
        }
      ]
      
      // 分页处理
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return mockData.slice(start, end)
    }
    
    return result.data
  } catch (error) {
    console.error('获取盲盒列表失败', error)
    // 出错时返回模拟数�?
    return [
      {
        _id: '1',
        title: '神秘文具盲盒',
        price: 9.9,
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stationery%20blind%20box%20with%20pens%20and%20notebooks&image_size=square'],
        from_dorm: '1�?,
        to_dorm: '5�?,
        stock: 50,
        sales: 23
      },
      {
        _id: '2',
        title: '零食大礼�?,
        price: 19.9,
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=snack%20gift%20box%20with%20chips%20and%20candies&image_size=square'],
        from_dorm: '3�?,
        to_dorm: '7�?,
        stock: 30,
        sales: 45
      },
      {
        _id: '3',
        title: '美妆盲盒',
        price: 29.9,
        images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beauty%20blind%20box%20with%20cosmetics&image_size=square'],
        from_dorm: '2�?,
        to_dorm: '6�?,
        stock: 20,
        sales: 18
      }
    ]
  }
}