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
        return { success: false, message: '鏈煡鎿嶄綔: ' + action };
    }
  } catch (error) {
    console.error('鐩茬洅鏈嶅姟浜戝嚱鏁版墽琛岄敊璇?', error);
    return { success: false, message: '鏈嶅姟鍣ㄩ敊璇? ' + error.message };
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
    console.error('鍙戝竷鐩茬洅澶辫触:', error);
    return { success: false, message: '鍙戝竷澶辫触: ' + error.message };
  }
}


function validatePublishInput({ title, price, openid, images }) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return '鏍囬涓嶈兘涓虹┖';
  }
  if (title.trim().length > 50) {
    return '鏍囬涓嶈兘瓒呰繃50涓瓧绗';
  }
  if (!price || isNaN(Number(price)) || Number(price) < 0) {
    return '浠锋牸蹇呴』鏄ぇ浜庣瓑浜?鐨勬暟瀛';
  }
  if (Number(price) > 99999) {
    return '浠锋牸涓嶈兘瓒呰繃99999';
  }
  if (!openid || typeof openid !== 'string') {
    return '鐢ㄦ埛淇℃伅鏃犳晥';
  }
  if (images && !Array.isArray(images)) {
    return '鍥剧墖鏍煎紡鏃犳晥';
  }
  if (images && images.length > 9) {
    return '鍥剧墖鏈€澶氫笂浼?寮';
  }
  return null;
}


async function handleList(data) {
  const { page = 1, limit = 10, type, campus } = data;
  
  try {
    let query = boxesCollection.where({ status: 'available' });
    
    if (type) {
      query = query.where({ type });
    }
    
    if (campus) {
      query = query.where({ campus });
    }
    
    const total = await query.count();
    
    const boxes = await query
      .orderBy('createdAt', 'desc')        .skip((page - 1) * limit)            .limit(limit)                        .get();
    
    return {
      success: true,
      boxes: boxes.data,
      total: total.total,
      page,
      limit
    };
  } catch (error) {
    console.error('鑾峰彇鐩茬洅鍒楄〃澶辫触:', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
  }
}


async function handleDetail(data) {
  const { boxId } = data;
  
  try {
    const box = await boxesCollection.doc(boxId).get();
    
    if (!box.data) {
      return { success: false, message: '鐩茬洅涓嶅瓨鍦' };
    }
    
    return {
      success: true,
      box: box.data
    };
  } catch (error) {
    console.error('鑾峰彇鐩茬洅璇︽儏澶辫触:', error);
    return { success: false, message: '鑾峰彇澶辫触: ' + error.message };
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
    console.error('鑾峰彇棣栭〉鏁版嵁澶辫触:', error);
    return {
      success: false,
      boxes: [
        {
          _id: 'demo1',
          title: '涓洯鍏瘬涔︽湰鏂囧叿鐩茬洅',
          desc: '鍖呭惈鑰冪爺璧勬枡銆佺瑪璁版湰銆佺瀛楃瑪绛夊涔犵敤鍝',
          type: 'secondhand',
          mode: 'light',
          price: 5.2,
          campus: '涓洯鍏瘬',
          building: '302',
          fromDorm: '涓洯鍏瘬',
          sales: 12,
          isCharity: false,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stationery%20blind%20box&image_size=square']
        },
        {
          _id: 'demo2',
          title: '鏍″洯鏂囧垱鎵嬩綔鐩茬洅',
          desc: '鎵嬬粯璐寸焊+寰界珷+姝︾敓闄㈤檺瀹氭槑淇＄墖',
          type: 'original',
          mode: 'dark',
          price: 9.9,
          campus: '鑻忓洯灞',
          building: '201',
          fromDorm: '鑻忓洯灞',
          sales: 8,
          isCharity: true,
          images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=campus%20cultural%20creative%20blind%20box&image_size=square']
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

