/**
 * 盲盒服务云函数
 * 负责盲盒发布、查询、详情获取等操作
 * 
 * 对应论文4.3章节 - 数据库设计
 * 盲盒集合结构（4.3.2）：
 * {
 *   _id: String,           // 盲盒ID，系统自动生成
 *   title: String,         // 盲盒标题
 *   images: Array,         // 图片URL列表（最多9张）
 *   price: Number,         // 盲盒价格
 *   category: String,      // 分类名称
 *   description: String,   // 商品描述
 *   sellerId: String,      // 卖家ID（关联用户集合）
 *   status: String,        // 状态：available/sold
 *   createdAt: Date,       // 创建时间
 *   updatedAt: Date        // 更新时间
 * }
 */

// 云函数入口文件
const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init();

// 获取数据库实例
const db = cloud.database();

// 获取盲盒集合引用（对应论文4.3.2 盲盒集合）
const boxesCollection = db.collection('boxes');

/**
 * 云函数入口函数
 * @param {Object} event - 事件参数
 * @param {string} event.action - 操作类型（publish/list/detail/home）
 * @param {Object} event.data - 操作数据
 * @param {Object} context - 上下文参数
 * @returns {Object} - 操作结果
 */
exports.main = async (event, context) => {
  const { action, data } = event;

  try {
    switch (action) {
      case 'publish':
        console.log('执行盲盒发布操作');
        return await handlePublish(data);
      case 'list':
        console.log('执行盲盒列表查询操作');
        return await handleList(data);
      case 'detail':
        console.log('执行盲盒详情查询操作');
        return await handleDetail(data);
      case 'home':
        console.log('执行首页数据获取操作');
        return await handleHome(data);
      default:
        console.log('未知操作类型:', action);
        return { success: false, message: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('盲盒服务云函数执行错误:', error);
    return { success: false, message: '服务器错误: ' + error.message };
  }
};

/**
 * 处理盲盒发布
 * 对应论文4.3.2 盲盒集合 - 发布盲盒功能
 * @param {Object} data - 盲盒数据
 * @param {string} data.title - 盲盒标题
 * @param {string} data.desc - 盲盒描述
 * @param {string} data.type - 盲盒类型（secondhand/original）
 * @param {string} data.mode - 盲盒模式（light/dark）
 * @param {number} data.price - 盲盒价格
 * @param {string} data.campus - 校区位置
 * @param {string} data.building - 楼栋信息
 * @param {Array} data.images - 图片URL列表
 * @param {string} data.openid - 卖家openid
 * @returns {Object} - 发布结果
 */
async function handlePublish(data) {
  const {
    title,
    desc,
    type,
    mode,
    price,
    campus,
    building,
    images,
    openid
  } = data;

  const validationError = validatePublishInput({ title, price, openid, images });
  if (validationError) {
    return { success: false, message: validationError };
  }

  try {
    const newBox = {
      title: title.trim(),
      desc: (desc || '').trim(),
      type: type || 'other',
      mode: mode || 'light',
      price: Math.round(Number(price) * 100) / 100,
      campus: (campus || '').trim(),
      building: (building || '').trim(),
      images: Array.isArray(images) ? images.slice(0, 9) : [],
      openid,
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await boxesCollection.add(newBox);

    return {
      success: true,
      box: {
        ...newBox,
        _id: result._id
      }
    };
  } catch (error) {
    console.error('发布盲盒失败:', error);
    return { success: false, message: '发布失败: ' + error.message };
  }
}

/**
 * 校验发布参数
 * @param {Object} params - 待校验参数
 * @returns {string|null} - 错误信息或null
 */
function validatePublishInput({ title, price, openid, images }) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return '标题不能为空';
  }
  if (title.trim().length > 50) {
    return '标题不能超过50个字符';
  }
  if (!price || isNaN(Number(price)) || Number(price) < 0) {
    return '价格必须是大于等于0的数字';
  }
  if (Number(price) > 99999) {
    return '价格不能超过99999';
  }
  if (!openid || typeof openid !== 'string') {
    return '用户信息无效';
  }
  if (images && !Array.isArray(images)) {
    return '图片格式无效';
  }
  if (images && images.length > 9) {
    return '图片最多上传9张';
  }
  return null;
}

/**
 * 处理盲盒列表查询
 * 对应论文4.3.2 盲盒集合 - 查询盲盒列表功能
 * @param {Object} data - 查询参数
 * @param {number} data.page - 页码（默认1）
 * @param {number} data.limit - 每页数量（默认10）
 * @param {string} data.type - 盲盒类型过滤
 * @param {string} data.campus - 校区过滤
 * @returns {Object} - 列表结果
 */
async function handleList(data) {
  const { page = 1, limit = 10, type, campus } = data;
  
  try {
    // 构建查询条件，只查询在售盲盒
    let query = boxesCollection.where({ status: 'available' });
    
    // 按类型过滤
    if (type) {
      query = query.where({ type });
    }
    
    // 按校区过滤
    if (campus) {
      query = query.where({ campus });
    }
    
    // 获取总数
    const total = await query.count();
    
    // 分页查询
    const boxes = await query
      .orderBy('createdAt', 'desc')  // 按创建时间倒序
      .skip((page - 1) * limit)      // 跳过前面的记录
      .limit(limit)                  // 限制每页数量
      .get();
    
    return {
      success: true,
      boxes: boxes.data,
      total: total.total,
      page,
      limit
    };
  } catch (error) {
    console.error('获取盲盒列表失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

/**
 * 处理盲盒详情查询
 * 对应论文4.3.2 盲盒集合 - 查询盲盒详情功能
 * @param {Object} data - 查询参数
 * @param {string} data.boxId - 盲盒ID
 * @returns {Object} - 盲盒详情
 */
async function handleDetail(data) {
  const { boxId } = data;
  
  try {
    // 根据ID查询盲盒详情
    const box = await boxesCollection.doc(boxId).get();
    
    if (!box.data) {
      return { success: false, message: '盲盒不存在' };
    }
    
    return {
      success: true,
      box: box.data
    };
  } catch (error) {
    console.error('获取盲盒详情失败:', error);
    return { success: false, message: '获取失败: ' + error.message };
  }
}

/**
 * 处理首页数据获取
 * 对应论文4.3.2 盲盒集合 - 首页展示功能
 * @param {Object} data - 查询参数
 * @returns {Object} - 首页数据（热门盲盒+统计信息）
 */
async function handleHome(data) {
  try {
    // 获取热门盲盒（最新发布的10个）
    const hotBoxes = await boxesCollection
      .where({ status: 'available' })
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    // 获取统计数据
    const stats = {
      todayBoxes: (await boxesCollection
        .where({
          status: 'available',
          createdAt: db.command.gte(new Date(new Date().setHours(0, 0, 0, 0)))
        })
        .count()).total,
      delivering: 3,  // 模拟数据：配送中订单数
      donateCount: 28 // 模拟数据：爱心捐赠数
    };
    
    return {
      success: true,
      boxes: hotBoxes.data,
      stats
    };
  } catch (error) {
    console.error('获取首页数据失败:', error);
    // 返回模拟数据作为降级方案
    return {
      success: false,
      boxes: [
        {
          _id: 'demo1',
          title: '中园公寓书本文具盲盒',
          desc: '包含考研资料、笔记本、签字笔等学习用品',
          type: 'secondhand',
          mode: 'light',
          price: 5.2,
          campus: '中园公寓',
          building: '302',
          isCharity: false
        },
        {
          _id: 'demo2',
          title: '校园文创手作盲盒',
          desc: '手绘贴纸+徽章+武生院限定明信片',
          type: 'original',
          mode: 'dark',
          price: 9.9,
          campus: '苏园居',
          building: '201',
          isCharity: true
        }
      ],
      stats: {
        todayBoxes: 12,
        delivering: 3,
        donateCount: 28
      }
    };
  }
}