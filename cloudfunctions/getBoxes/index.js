// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

function getDemoHotBoxes() {
  const pairs = [
    ['中园公寓', '苏园居'],
    ['中南公寓', '知行1栋'],
    ['新柏居', '敏学1栋'],
    ['三友园', '松柏居'],
    ['清水居', '四季园'],
    ['苏园居', '洪山园1栋']
  ]
  const titles = ['神秘文具盲盒', '零食大礼包', '美妆盲盒', '科技小玩意儿', '图书盲盒', '运动器材盲盒']
  const prices = [9.9, 19.9, 29.9, 39.9, 14.9, 24.9]
  const sales = [23, 45, 18, 12, 27, 15]

  return pairs.map(([from, to], i) => ({
    _id: String(i + 1),
    title: titles[i],
    price: prices[i],
    images: [`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blind%20box%20${i}&image_size=square`],
    from_dorm: from,
    to_dorm: to,
    stock: 30,
    sales: sales[i]
  }))
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { category, keyword, page = 1, pageSize = 10 } = event
    
    // 构建查询条件
    let query = db.collection('boxes').where({
      status: 'active'
    })
    
    // 分类筛选
    if (category && category !== 'all') {
      // 这里简化处理，实际项目中可能需要根据标题或标签进行分类
      query = query.where({
        title: _.regexp(`.*${category}.*`)
      })
    }
    
    // 关键词搜索
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
    
    // 如果数据库中没有数据，返回模拟数据
    if (result.data.length === 0) {
      const mockData = getDemoHotBoxes().concat([
        {
          _id: '7',
          title: '手办盲盒',
          price: 49.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=action%20figure%20blind%20box&image_size=square'],
          from_dorm: '洪山园1栋',
          to_dorm: '新松居',
          stock: 10,
          sales: 8
        },
        {
          _id: '8',
          title: '绿植盲盒',
          price: 12.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=plant%20blind%20box&image_size=square'],
          from_dorm: '四季园',
          to_dorm: '清水居',
          stock: 35,
          sales: 19
        },
        {
          _id: '9',
          title: '首饰盲盒',
          price: 29.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jewelry%20blind%20box&image_size=square'],
          from_dorm: '鄱阳居',
          to_dorm: '钱塘居',
          stock: 18,
          sales: 14
        },
        {
          _id: '10',
          title: '电影周边盲盒',
          price: 39.9,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20merchandise%20blind%20box&image_size=square'],
          from_dorm: '江汉居',
          to_dorm: '中园公寓',
          stock: 12,
          sales: 7
        }
      ])
      
      const start = (page - 1) * pageSize
      const end = start + pageSize
      return mockData.slice(start, end)
    }
    
    return result.data
  } catch (error) {
    console.error('获取盲盒列表失败', error)
    // 出错时返回模拟数据
    return getDemoHotBoxes().slice(0, 3)
  }
}
