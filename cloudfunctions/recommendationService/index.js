const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 内存缓存：推荐结果不频繁变化，缓存可大幅减少计算
const cache = {
  hot: { data: null, time: 0 },
  guessYouLike: {},
};
const CACHE_TTL = {
  HOT: 5 * 60 * 1000,        // 热门推荐缓存5分钟
  GUESS: 3 * 60 * 1000,      // 猜你喜欢缓存3分钟
};

function getFromCache(cacheObj, key, ttl) {
  const entry = cacheObj[key];
  if (entry && Date.now() - entry.time < ttl) {
    return entry.data;
  }
  return null;
}

function setCache(cacheObj, key, data) {
  cacheObj[key] = { data, time: Date.now() };
}

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
        return { success: false, message: '无效的操作' };
    }
  } catch (error) {
    console.error('推荐服务错误:', error);
    return { success: false, message: '推荐服务错误' };
  }
};

async function hybridRecommend(data) {
  const { openid, limit = 10 } = data;

  if (!openid) {
    return await getHotRecommendations({ limit });
  }

  try {
    const [cfResult, hotResult] = await Promise.all([
      getItemBasedCF(openid, limit * 2),
      getHotRecommendations({ limit: limit * 2 })
    ]);

    const fusedScores = fuseRecommendations(cfResult, hotResult, [0.6, 0.4]);
    const recommendedBoxes = await getBoxesByScores(fusedScores.slice(0, limit));

    if (recommendedBoxes.length > 0) {
      return {
        success: true,
        data: recommendedBoxes,
        meta: { algorithm: 'hybrid_cf_hot' }
      };
    }
  } catch (e) {
    console.error('混合推荐失败:', e);
  }

  return await getHotRecommendations({ limit });
}

async function getUserBasedCF(openid, limit) {
  try {
    const userActions = await db.collection('userActions')
      .where({ openid })
      .limit(50)
      .get();

    if (userActions.data.length === 0) {
      return [];
    }

    const userHistory = new Set(userActions.data.map(a => a.boxId).filter(Boolean));
    if (userHistory.size === 0) {
      return [];
    }

    const allActions = await db.collection('userActions')
      .limit(200)
      .get();

    const userItemMatrix = buildUserItemMatrix(allActions.data);
    const targetUserVector = userItemMatrix[openid];
    if (!targetUserVector || Object.keys(targetUserVector).length === 0) {
      return [];
    }

    const similarities = [];
    for (const [userId, itemVector] of Object.entries(userItemMatrix)) {
      if (userId === openid) {
        continue;
      }
      const sim = cosineSimilarity(targetUserVector, itemVector);
      if (sim > 0.1) {
        similarities.push({ userId, similarity: sim, items: itemVector });
      }
    }

    similarities.sort((a, b) => b.similarity - a.similarity);
    const topKUsers = similarities.slice(0, 15);

    const candidateScores = {};
    for (const { similarity, items } of topKUsers) {
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
  } catch (e) {
    console.error('UCF推荐失败:', e);
    return [];
  }
}

async function getItemBasedCF(openid, limit) {
  try {
    const userActions = await db.collection('userActions')
      .where({
        openid,
        type: _.in(['collect', 'purchase', 'view'])
      })
      .limit(15)
      .get();

    const likedBoxes = [...new Set(userActions.data.map(a => a.boxId).filter(Boolean))];
    if (likedBoxes.length === 0) {
      return [];
    }

    const likedBoxDetails = await db.collection('boxes')
      .where({ _id: _.in(likedBoxes.slice(0, 10)) })
      .get();

    const validLikedBoxes = likedBoxDetails.data;
    if (validLikedBoxes.length === 0) {
      return [];
    }

    const categories = [...new Set(validLikedBoxes.map(b => b.category).filter(Boolean))];
    if (categories.length === 0) {
      return [];
    }

    const allBoxes = await db.collection('boxes')
      .where({
        status: 'available',
        isDeleted: false,
        category: _.in(categories),
        _id: _.nin(likedBoxes)
      })
      .limit(30)
      .get();

    const candidateScores = {};
    for (const box of allBoxes.data) {
      let maxSim = 0;
      for (const liked of validLikedBoxes) {
        const sim = calculateBoxSimilarity(box, liked);
        maxSim = Math.max(maxSim, sim);
      }
      if (maxSim > 0.1) {
        candidateScores[box._id] = maxSim;
      }
    }

    return Object.entries(candidateScores)
      .map(([boxId, score]) => ({ boxId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (e) {
    console.error('ICF推荐失败:', e);
    return [];
  }
}

function calculateBoxSimilarity(box1, box2) {
  let score = 0;
  let total = 0;

  if (box1.category && box2.category && box1.category === box2.category) {
    score += 2;
  }
  total += 2;

  if (box1.price && box2.price) {
    const priceDiff = Math.abs(box1.price - box2.price);
    if (priceDiff < 20) {
      score += 1;
    }
    total += 1;
  }

  if (box1.sales && box2.sales) {
    const salesDiff = Math.abs(box1.sales - box2.sales);
    if (salesDiff < 100) {
      score += 0.5;
    }
    total += 0.5;
  }

  return total > 0 ? score / total : 0;
}

function fuseRecommendations(cfResult, hotResult, weights) {
  const scoreMap = {};

  for (const { boxId, score } of cfResult) {
    scoreMap[boxId] = (scoreMap[boxId] || 0) + score * weights[0];
  }

  for (const { boxId, score = 1 } of hotResult.map((b, i) => ({ boxId: b._id, score: (hotResult.length - i) / hotResult.length }))) {
    scoreMap[boxId] = (scoreMap[boxId] || 0) + score * weights[1];
  }

  return Object.entries(scoreMap)
    .map(([boxId, score]) => ({ boxId, score }))
    .sort((a, b) => b.score - a.score);
}

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

  const boxMap = new Map(boxes.data.map(b => [b._id, b]));
  return boxIds.map(id => boxMap.get(id)).filter(Boolean);
}

async function getRecommendations(data) {
  return await hybridRecommend(data);
}

async function getGuessYouLike(data) {
  const { openid, limit = 8 } = data;

  // 检查缓存
  const cacheKey = openid || 'anonymous';
  const cached = getFromCache(cache.guessYouLike, cacheKey, CACHE_TTL.GUESS);
  if (cached) {
    return cached;
  }

  // 快速路径：无用户或用户无历史行为时，直接返回热门推荐
  if (!openid) {
    const hotResult = await getHotRecommendations({ limit });
    setCache(cache.guessYouLike, cacheKey, hotResult);
    return hotResult;
  }

  try {
    // 先检查用户是否有行为记录，避免无历史用户也走完整CF
    const actionCount = await db.collection('userActions')
      .where({ openid })
      .count();

    if (actionCount.total === 0) {
      const hotResult = await getHotRecommendations({ limit });
      setCache(cache.guessYouLike, cacheKey, hotResult);
      return hotResult;
    }

    const hybridResult = await hybridRecommend({ openid, limit });
    if (hybridResult.success && hybridResult.data.length > 0) {
      setCache(cache.guessYouLike, cacheKey, hybridResult);
      return hybridResult;
    }
  } catch (e) {
    console.error('混合推荐失败，降级到热门推荐:', e);
  }

  return await getHotRecommendations({ limit });
}

async function getHotRecommendations(data) {
  const { limit = 10 } = data;

  // 热门推荐使用缓存
  const cached = getFromCache(cache.hot, 'default', CACHE_TTL.HOT);
  if (cached) {
    // 如果缓存数据足够返回前limit条
    if (cached.data.length >= limit) {
      return { success: true, data: cached.data.slice(0, limit) };
    }
  }

  const boxes = await db.collection('boxes')
    .where({ isDeleted: false, status: 'available' })
    .orderBy('sales', 'desc')
    .limit(limit)
    .get();

  const result = { success: true, data: boxes.data };
  setCache(cache.hot, 'default', result);
  return result;
}

function buildUserItemMatrix(actions) {
  const matrix = {};
  const ratingMap = { 'purchase': 5, 'collect': 4, 'view': 1 };

  for (const action of actions) {
    const { openid, boxId, type } = action;
    if (!openid || !boxId) {
      continue;
    }

    if (!matrix[openid]) {
      matrix[openid] = {};
    }
    const score = ratingMap[type] || 1;
    matrix[openid][boxId] = (matrix[openid][boxId] || 0) + score;
  }

  return matrix;
}

function cosineSimilarity(vec1, vec2) {
  const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  let dotProduct = 0, norm1 = 0, norm2 = 0;

  for (const key of keys) {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dotProduct += v1 * v2;
    norm1 += v1 * v1;
    norm2 += v2 * v2;
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}