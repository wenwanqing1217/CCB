// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

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
    const result = await db.collection('boxes')
      .where({
        status: 'active'
      })
      .orderBy('publish_time', 'desc')
      .limit(6)
      .get()
    
    if (result.data.length === 0) {
      return getDemoHotBoxes()
    }
    
    return result.data
  } catch (error) {
    console.error('获取热门盲盒失败', error)
    return getDemoHotBoxes().slice(0, 3)
  }
}
