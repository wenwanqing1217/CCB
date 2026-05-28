// 获取盲盒列表云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { type, sort, page = 1 } = event
    
    // 构建查询条件
    let query = db.collection('boxes').where({
      status: 'active',
      isDeleted: false
    })
    
    // 根据类型过滤
    if (type && type !== 'all') {
      query = query.where({ type })
    }
    
    // 排序
    let sortedQuery = query
    if (sort === 'price') {
      sortedQuery = query.orderBy('price', 'asc')
    } else if (sort === 'sales') {
      sortedQuery = query.orderBy('sales', 'desc')
    } else {
      sortedQuery = query.orderBy('created_at', 'desc')
    }
    
    // 分页查询
    const result = await sortedQuery
      .skip((page - 1) * 10)
      .limit(10)
      .get()
    
    return result.data
  } catch (error) {
    console.error('获取盲盒数据失败:', error)
    // 返回模拟数据
    return [
      { _id: '1', title: '全新数码配件盲盒', price: 9.9, images: ['https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png@1280w_1l_2o_100sh.png'], fromDorm: '东区', sales: 23, type: 'secondhand', typeName: '二手数码盲盒', isHot: true },
      { _id: '2', title: '精美文具套装', price: 14.9, images: ['https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png'], fromDorm: '西区', sales: 45, type: 'creative', typeName: '创意盲盒' },
      { _id: '3', title: '时尚服饰盲盒', price: 19.9, images: ['https://img.zcool.cn/community/014c7a57e4a6fa0000018c1b4a2c3d.png@1280w_1l_2o_100sh.png'], fromDorm: '南区', sales: 12, type: 'fashion', typeName: '时尚盲盒' },
      { _id: '4', title: '图书盲盒', price: 12.9, images: ['https://img.zcool.cn/community/013c7a57e4a6fa0000018c1b8d3e4f.png@1280w_1l_2o_100sh.png'], fromDorm: '北区', sales: 34, type: 'book', typeName: '图书盲盒' }
    ]
  }
}
