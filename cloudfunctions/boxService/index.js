/**
 * boxService
 */

const cloud = require('wx-server-sdk');

cloud.init();

const db = cloud.database();

const boxesCollection = db.collection('boxes');


exports.main = async (event, context) => {
  const { action, data } = event;

  try {
    switch (action) {
      case 'publish':
        return await handlePublish(data);
      case 'list':
        return await handleList(data);
      case 'detail':
        return await handleDetail(data);
      case 'home':
        return await handleHome(data);
      default:
        return { success: false, message: '未知操作: ' + action };
    }
  } catch (error) {
    console.error('盲盒服务云函数执行错误', error);
    return { success: false, message: '服务器错误: ' + error.message };
  }
};


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


async function handleList(data) {
  const { page = 1, limit = 10, type, campus } = data;

  try {
    // 合并条件：链式 where() 会覆盖，必须用 and()
    const conditions = [{ status: 'available' }];
    if (type) conditions.push({ type });
    if (campus) conditions.push({ campus });

    const query = boxesCollection.where(db.command.and(conditions));
    const total = await query.count();

    const boxes = await query
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * limit)
      .limit(limit)
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


async function handleDetail(data) {
  const { boxId } = data;
  
  try {
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


async function handleHome(data) {
  try {
    const hotBoxes = await boxesCollection
      .where({ status: 'available' })
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const processedBoxes = hotBoxes.data.map(box => ({
      ...box,
      fromDorm: box.campus || box.building || '',
      sales: box.sales || 0
    }));
    
    const stats = {
      todayBoxes: (await boxesCollection
        .where({
          status: 'available',
          createdAt: db.command.gte(new Date(new Date().setHours(0, 0, 0, 0)))
        })
        .count()).total,
      delivering: 3,        donateCount: 28     };
    
    return {
      success: true,
      boxes: processedBoxes,
      stats
    };
  } catch (error) {
    console.error('获取首页数据失败:', error);
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
          fromDorm: '中园公寓',
          sales: 12,
          isCharity: false,
          images: ['data:image/svg+xml,%253Csvg%2520xmlns%253D%2522http%253A%252F%252Fwww.w3.org%252F2000%252Fsvg%2522%2520width%253D%2522400%2522%2520height%253D%2522400%2522%253E%253Crect%2520width%253D%2522400%2522%2520height%253D%2522400%2522%2520fill%253D%2522%2523f3e8ff%2522%252F%253E%253Ctext%2520x%253D%2522200%2522%2520y%253D%2522220%2522%2520text-anchor%253D%2522middle%2522%2520font-size%253D%252260%2522%2520fill%253D%2522%2523c8a2ff%2522%253E%25E2%259C%25A8%253C%252Ftext%253E%253C%252Fsvg%253E']
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
          fromDorm: '苏园居',
          sales: 8,
          isCharity: true,
          images: ['data:image/svg+xml,%253Csvg%2520xmlns%253D%2522http%253A%252F%252Fwww.w3.org%252F2000%252Fsvg%2522%2520width%253D%2522400%2522%2520height%253D%2522400%2522%253E%253Crect%2520width%253D%2522400%2522%2520height%253D%2522400%2522%2520fill%253D%2522%2523f3e8ff%2522%252F%253E%253Ctext%2520x%253D%2522200%2522%2520y%253D%2522220%2522%2520text-anchor%253D%2522middle%2522%2520font-size%253D%252260%2522%2520fill%253D%2522%2523c8a2ff%2522%253E%25E2%259C%25A8%253C%252Ftext%253E%253C%252Fsvg%253E']
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
