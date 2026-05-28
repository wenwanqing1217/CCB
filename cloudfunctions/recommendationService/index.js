// 推荐服务云函数
// 核心算法：基于用户的协同过滤 + 矩阵分解（SVD）推荐
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { action, data } = event;

    switch (action) {
      case 'getRecommendations':
        return await getRecommendations(data);
      case 'getGuessYouLike':
        return await getGuessYouLike(data);
      case 'getHotRecommendations':
        return await getHotRecommendations(data);
      case 'hybridRecommend':
        return await hybridRecommend(data);
      default:
        return {
          success: false,
          message: '无效的操作'
        };
    }
  } catch (error) {
    console.error('推荐服务错误:', error);
    return {
      success: false,
      message: '推荐服务错误'
    };
  }
};

/**
 * 混合推荐算法
 * 结合三种推荐策略：
 * 1. 基于用户的协同过滤（UCF）- 找到相似用户喜欢的物品
 * 2. 基于物品的协同过滤（ICF）- 找到相似于用户历史喜好的物品
 * 3. 矩阵分解（SVD） - 降维后计算潜在因子相似度
 */
async function hybridRecommend(data) {
  const { openid, limit = 10 } = data;

  if (!openid) {
    return {
      success: false,
      message: '用户ID不能为空'
    };
  }

  // 并行执行三种推荐策略
  const [ucfResult, icfResult, svdResult] = await Promise.all([
    getUserBasedCF(openid, limit * 2),
    getItemBasedCF(openid, limit * 2),
    getSVDRecommend(openid, limit * 2)
  ]);

  // 加权融合（UCF:ICF:SVD = 0.3:0.3:0.4）
  const fusedScores = fuseRecommendations(ucfResult, icfResult, svdResult, [0.3, 0.3, 0.4]);

  // 获取推荐物品详情
  const recommendedBoxes = await getBoxesByScores(fusedScores.slice(0, limit));

  return {
    success: true,
    data: recommendedBoxes,
    meta: {
      ucfCount: ucfResult.length,
      icfCount: icfResult.length,
      svdCount: svdResult.length,
      algorithm: 'hybrid_cf_svd'
    }
  };
}

/**
 * 基于用户的协同过滤（UCF）
 * 原理：找到与目标用户行为相似的用户群体，推荐这些用户喜欢的物品
 * 步骤：
 * 1. 构建用户-物品评分矩阵
 * 2. 计算用户之间的余弦相似度
 * 3. 找到最相似的K个用户
 * 4. 推荐这些用户喜欢但目标用户未接触的物品
 */
async function getUserBasedCF(openid, limit) {
  // 1. 获取目标用户的历史行为
  const userActions = await db.collection('userActions')
    .where({ openid })
    .get();

  const userHistory = new Set(userActions.data.map(a => a.boxId));

  // 2. 获取所有用户的历史行为（采样，避免计算量过大）
  const allActions = await db.collection('userActions')
    .limit(1000)
    .get();

  // 3. 构建用户-物品交互矩阵（用浏览次数作为隐式评分）
  const userItemMatrix = buildUserItemMatrix(allActions.data);

  // 4. 获取目标用户向量
  const targetUserVector = userItemMatrix[openid] || {};

  if (Object.keys(targetUserVector).length === 0) {
    return [];
  }

  // 5. 计算与所有用户的相似度（余弦相似度）
  const similarities = [];
  for (const [userId, itemVector] of Object.entries(userItemMatrix)) {
    if (userId === openid) {
      continue;
    }

    const sim = cosineSimilarity(targetUserVector, itemVector);
    if (sim > 0.1) { // 阈值过滤
      similarities.push({ userId, similarity: sim, items: itemVector });
    }
  }

  // 6. 按相似度排序，取Top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topKUsers = similarities.slice(0, 20);

  // 7. 生成推荐列表（基于相似用户的喜好）
  const candidateScores = {};
  for (const { userId, similarity, items } of topKUsers) {
    for (const [boxId, score] of Object.entries(items)) {
      if (!userHistory.has(boxId)) {
        candidateScores[boxId] = (candidateScores[boxId] || 0) + similarity * score;
      }
    }
  }

  return Object.entries(candidateScores)
    .map(([boxId, score]) => ({ boxId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 基于物品的协同过滤（ICF）
 * 原理：基于用户历史喜好的物品，找到相似的物品推荐
 * 使用修正余弦相似度，考虑用户的评分偏好
 */
async function getItemBasedCF(openid, limit) {
  // 1. 获取目标用户的正向行为（收藏、购买）
  const userActions = await db.collection('userActions')
    .where({
      openid,
      type: _.in(['collect', 'purchase', 'view'])
    })
    .get();

  const likedBoxes = userActions.data.map(a => a.boxId).filter(Boolean);

  if (likedBoxes.length === 0) {
    return [];
  }

  // 2. 获取用户喜欢的物品详情
  const likedBoxDetails = await Promise.all(
    likedBoxes.map(boxId =>
      db.collection('boxes').doc(boxId).get().catch(() => null)
    )
  );

  const validLikedBoxes = likedBoxDetails.filter(b => b && b.data);
  if (validLikedBoxes.length === 0) {
    return [];
  }

  // 3. 获取所有物品
  const allBoxes = await db.collection('boxes')
    .where({ status: 'available', isDeleted: false })
    .limit(100)
    .get();

  // 4. 构建物品特征向量（分类 + 价格区间 + 标签）
  const itemFeatures = buildItemFeatures(allBoxes.data);
  const likedFeatures = buildItemFeatures(validLikedBoxes.map(b => b.data));

  // 5. 计算相似度
  const candidateScores = {};
  for (const [boxId, features] of Object.entries(itemFeatures)) {
    if (likedBoxes.includes(boxId)) {
      continue;
    }

    let maxSimilarity = 0;
    for (const [, likedFeature] of Object.entries(likedFeatures)) {
      const sim = cosineSimilarity(features, likedFeature);
      maxSimilarity = Math.max(maxSimilarity, sim);
    }

    if (maxSimilarity > 0.2) {
      candidateScores[boxId] = maxSimilarity;
    }
  }

  return Object.entries(candidateScores)
    .map(([boxId, score]) => ({ boxId, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * SVD矩阵分解推荐
 * 原理：将用户-物品评分矩阵分解为用户隐向量和物品隐向量
 * 通过隐向量计算用户对物品的评分
 *
 * 简化实现（微信云函数无法使用numpy等库）：
 * 1. 使用梯度下降法进行矩阵分解
 * 2. 随机初始化隐向量
 * 3. 迭代优化使重构误差最小
 */
async function getSVDRecommend(openid, limit) {
  const actions = await db.collection('userActions')
    .where({ type: _.in(['view', 'collect', 'purchase']) })
    .limit(500)
    .get();

  if (actions.data.length < 10) {
    return [];
  }

  // 构建评分矩阵
  const { userIds, boxIds, ratings } = buildRatingMatrix(actions.data);

  const userIndex = userIds.indexOf(openid);
  if (userIndex === -1) {
    return [];
  }

  // SVD分解（使用随机梯度下降）
  const k = 5; // 隐向量维度
  const { userFactors, itemFactors } = performSGD(ratings, userIds.length, boxIds.length, k, 20);

  // 计算目标用户对所有物品的预测评分
  const userVector = userFactors[userIndex];
  const predictions = [];

  for (let itemIdx = 0; itemIdx < boxIds.length; itemIdx++) {
    const itemVector = itemFactors[itemIdx];
    const prediction = dotProduct(userVector, itemVector);
    predictions.push({ boxId: boxIds[itemIdx], score: Math.max(0, prediction) });
  }

  return predictions.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 构建用户-物品评分矩阵
 */
function buildRatingMatrix(actions) {
  const userIds = [...new Set(actions.map(a => a.openid))];
  const boxIds = [...new Set(actions.map(a => a.boxId))];

  const ratings = [];
  for (const action of actions) {
    const userIdx = userIds.indexOf(action.openid);
    const boxIdx = boxIds.indexOf(action.boxId);
    const rating = getImplicitRating(action.type);
    ratings.push({ userIdx, itemIdx: boxIdx, rating });
  }

  return { userIds, boxIds, ratings };
}

/**
 * 获取隐式评分
 */
function getImplicitRating(actionType) {
  const ratingMap = {
    'purchase': 5,
    'collect': 4,
    'view': 1
  };
  return ratingMap[actionType] || 1;
}

/**
 * 随机梯度下降SVD分解
 */
function performSGD(ratings, nUsers, nItems, k, iterations) {
  const learningRate = 0.01;
  const regularization = 0.02;

  // 随机初始化隐向量
  const userFactors = Array(nUsers).fill(null).map(() =>
    Array(k).fill(null).map(() => Math.random() * 0.1)
  );
  const itemFactors = Array(nItems).fill(null).map(() =>
    Array(k).fill(null).map(() => Math.random() * 0.1)
  );

  // SGD迭代
  for (let iter = 0; iter < iterations; iter++) {
    for (const { userIdx, itemIdx, rating } of ratings) {
      // 预测值
      let prediction = 0;
      for (let f = 0; f < k; f++) {
        prediction += userFactors[userIdx][f] * itemFactors[itemIdx][f];
      }

      // 误差
      const error = rating - prediction;

      // 更新隐向量
      for (let f = 0; f < k; f++) {
        const u = userFactors[userIdx][f];
        const i = itemFactors[itemIdx][f];
        userFactors[userIdx][f] += learningRate * (error * i - regularization * u);
        itemFactors[itemIdx][f] += learningRate * (error * u - regularization * i);
      }
    }
  }

  return { userFactors, itemFactors };
}

/**
 * 构建用户-物品交互矩阵
 */
function buildUserItemMatrix(actions) {
  const matrix = {};

  for (const action of actions) {
    const { openid, boxId, type } = action;
    if (!openid || !boxId) {
      continue;
    }

    if (!matrix[openid]) {
      matrix[openid] = {};
    }

    const score = getImplicitRating(type);
    matrix[openid][boxId] = (matrix[openid][boxId] || 0) + score;
  }

  return matrix;
}

/**
 * 构建物品特征向量
 */
function buildItemFeatures(boxes) {
  const features = {};

  const categoryMap = { '数码': 0, '文具': 1, '服饰': 2, '图书': 3, '食品': 4, '其他': 5 };
  const priceBucket = (price) => Math.floor(price / 10); // 每10元一个桶

  for (const box of boxes) {
    const categoryOneHot = Array(6).fill(0);
    if (box.category && categoryMap[box.category] !== undefined) {
      categoryOneHot[categoryMap[box.category]] = 1;
    }

    const priceFeature = priceBucket(box.price || 0) / 10; // 归一化

    features[box._id] = [
      ...categoryOneHot,
      priceFeature,
      (box.sales || 0) / 100, // 归一化销量
      (box.score || 0) / 5 // 归一化评分
    ];
  }

  return features;
}

/**
 * 余弦相似度
 */
function cosineSimilarity(vec1, vec2) {
  const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2).filter(k => !isNaN(parseFloat(vec2[k])))]);
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const key of keys) {
    const v1 = typeof vec1 === 'object' ? (vec1[key] || 0) : (vec1[key] || 0);
    const v2 = typeof vec2 === 'object' ? (vec2[key] || 0) : (vec2[key] || 0);

    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * 点积
 */
function dotProduct(vec1, vec2) {
  return vec1.reduce((sum, val, idx) => sum + val * (vec2[idx] || 0), 0);
}

/**
 * 加权融合多种推荐结果
 */
function fuseRecommendations(ucf, icf, svd, weights) {
  const scoreMap = {};

  for (const { boxId, score } of ucf) {
    scoreMap[boxId] = (scoreMap[boxId] || 0) + score * weights[0];
  }

  for (const { boxId, score } of icf) {
    scoreMap[boxId] = (scoreMap[boxId] || 0) + score * weights[1];
  }

  for (const { boxId, score } of svd) {
    scoreMap[boxId] = (scoreMap[boxId] || 0) + score * weights[2];
  }

  return Object.entries(scoreMap)
    .map(([boxId, score]) => ({ boxId, score }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 根据评分获取物品详情
 */
async function getBoxesByScores(scores) {
  const boxIds = scores.map(s => s.boxId);

  if (boxIds.length === 0) {
    return [];
  }

  const boxes = await db.collection('boxes')
    .where({
      _id: _.in(boxIds),
      status: 'available',
      isDeleted: false
    })
    .get();

  // 保持评分排序
  const boxMap = new Map(boxes.data.map(b => [b._id, b]));
  return boxIds.map(id => boxMap.get(id)).filter(Boolean);
}

// ==================== 以下为原有方法 ====================

async function getRecommendations(data) {
  return await hybridRecommend(data);
}

async function getGuessYouLike(data) {
  const { openid, limit = 8 } = data;

  try {
    const hybridResult = await hybridRecommend({ openid, limit });
    if (hybridResult.success && hybridResult.data.length > 0) {
      return hybridResult;
    }
  } catch (e) {
    console.error('混合推荐失败，降级到基础推荐');
  }

  // 降级：基于分类偏好
  let query = db.collection('boxes').where({
    isDeleted: false,
    status: 'available'
  });

  if (openid) {
    const userActions = await db.collection('userActions')
      .where({ openid })
      .limit(10)
      .get();

    const categories = [...new Set(userActions.data.map(a => a.category).filter(Boolean))];
    if (categories.length > 0) {
      query = query.where({ category: _.in(categories) });
    }
  }

  const boxes = await query.orderBy('createdAt', 'desc').limit(limit).get();

  return {
    success: true,
    data: boxes.data
  };
}

async function getHotRecommendations(data) {
  const { limit = 10 } = data;

  const boxes = await db.collection('boxes')
    .where({ isDeleted: false, status: 'available' })
    .orderBy('sales', 'desc')
    .limit(limit)
    .get();

  return {
    success: true,
    data: boxes.data
  };
}
