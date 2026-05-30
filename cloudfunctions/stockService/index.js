const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, params } = event;
  const openid = cloud.getWXContext().OPENID;

  try {
    switch (action) {
      case 'deduct':
        return await deductStock(params, openid);
      case 'restore':
        return await restoreStock(params, openid);
      case 'query':
        return await queryStock(params, openid);
      case 'sync':
        return await syncStock(params, openid);
      case 'warning':
        return await getStockWarning();
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    console.error('库存控制失败:', error);
    return { success: false, error: error.message };
  }
};

async function deductStock({ boxId, quantity = 1 }, openid) {
  const { stock } = await db.collection('boxes').doc(boxId).get();
  if (!stock) {
    return { success: false, error: '盲盒不存在' };
  }

  if (stock < quantity) {
    return { success: false, error: '库存不足', currentStock: stock };
  }

  const updateResult = await db.collection('boxes').where({
    _id: boxId,
    stock: _.gte(quantity)
  }).update({
    data: { stock: _.inc(-quantity) }
  });

  if (updateResult.stats.updated === 0) {
    return { success: false, error: '库存不足或已被其他请求占用' };
  }

  await db.collection('stock_logs').add({
    data: {
      boxId,
      type: 'deduct',
      quantity,
      beforeStock: stock,
      afterStock: stock - quantity,
      operator: openid,
      createTime: Date.now()
    }
  });

  return { success: true, currentStock: stock - quantity };
}

async function restoreStock({ boxId, quantity = 1, orderId }, openid) {
  const box = await db.collection('boxes').doc(boxId).get();
  if (!box.data) {
    return { success: false, error: '盲盒不存在' };
  }

  const beforeStock = box.data.stock || 0;

  await db.collection('boxes').doc(boxId).update({
    data: { stock: _.inc(quantity) }
  });

  await db.collection('stock_logs').add({
    data: {
      boxId,
      orderId,
      type: 'restore',
      quantity,
      beforeStock,
      afterStock: beforeStock + quantity,
      operator: openid,
      createTime: Date.now()
    }
  });

  return { success: true, currentStock: beforeStock + quantity };
}

async function queryStock({ boxId }) {
  const box = await db.collection('boxes').doc(boxId).get();
  if (!box.data) {
    return { success: false, error: '盲盒不存在' };
  }
  return {
    success: true,
    stock: box.data.stock || 0,
    warningThreshold: box.data.warningThreshold || 5
  };
}

async function syncStock({ boxId, actualStock }, openid) {
  const box = await db.collection('boxes').doc(boxId).get();
  if (!box.data) {
    return { success: false, error: '盲盒不存在' };
  }

  const beforeStock = box.data.stock || 0;

  await db.collection('boxes').doc(boxId).update({
    data: { stock: actualStock }
  });

  await db.collection('stock_logs').add({
    data: {
      boxId,
      type: 'sync',
      quantity: actualStock - beforeStock,
      beforeStock,
      afterStock: actualStock,
      operator: openid,
      createTime: Date.now()
    }
  });

  return { success: true, beforeStock, currentStock: actualStock };
}

async function getStockWarning() {
  const result = await db.collection('boxes')
    .where({ stock: _.lte(5), status: 'available' })
    .field({ _id: true, name: true, stock: true, image: true })
    .get();
  return { success: true, warningList: result.data || [] };
}