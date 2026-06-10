/**
 * 推荐算法模块
 * 包含协同过滤、矩阵分解、评分融合等核心算法
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

function dotProduct(vec1, vec2) {
  return vec1.reduce((sum, val, idx) => sum + val * (vec2[idx] || 0), 0);
}

function normalizeVector(vec) {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return norm === 0 ? vec : vec.map(val => val / norm);
}

function buildUserItemMatrix(actions) {
  const matrix = {};
  for (const action of actions) {
    if (!matrix[action.openid]) {
      matrix[action.openid] = {};
    }
    const currentScore = matrix[action.openid][action.boxId] || 0;
    const actionScore = action.type === 'purchase' ? 3 : action.type === 'collect' ? 2 : 1;
    matrix[action.openid][action.boxId] = currentScore + actionScore;
  }
  return matrix;
}

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

function calculateSVD(matrix, k = 10) {
  const users = Object.keys(matrix);
  const items = new Set();
  for (const user of users) {
    for (const item of Object.keys(matrix[user])) {
      items.add(item);
    }
  }
  const itemList = Array.from(items);

  const userItemMatrix = users.map(u =>
    itemList.map(i => matrix[u]?.[i] || 0)
  );

  const svdResult = performSVD(userItemMatrix, k);

  return { users, items: itemList, matrix: svdResult };
}

function performSVD(matrix, k) {
  const m = matrix.length;
  const n = matrix[0]?.length || 0;
  if (m === 0 || n === 0) {
    return { U: [], S: [], V: [] };
  }

  const actualK = Math.min(k, Math.min(m, n));
  const U = [];
  const S = [];
  const V = [];

  // 幂迭代法（Power Iteration）截断SVD
  // 每次迭代提取一个奇异值/奇异向量对
  let residual = matrix.map(row => [...row]);

  for (let i = 0; i < actualK; i++) {
    const { singularValue, u, v } = powerIterationSVD(residual, 50);
    if (singularValue < 1e-10) break;

    S.push(singularValue);
    U.push(u);
    V.push(v);

    // 减去已提取的奇异分量（收缩）
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        residual[r][c] -= singularValue * u[r] * v[c];
      }
    }
  }

  return {
    U: U.length > 0 ? transposeMatrix([U, U[0].length > 0 ? U : []]) : [],
    S,
    V: V.length > 0 ? transposeMatrix([V, V[0].length > 0 ? V : []]) : []
  };
}

function powerIterationSVD(matrix, maxIter) {
  const m = matrix.length;
  const n = matrix[0]?.length || 0;

  // 随机初始化右奇异向量
  let v = Array.from({ length: n }, () => Math.random() * 2 - 1);
  let u = Array.from({ length: m }, () => 0);
  let prevV = v.map(() => 0);
  let iter = 0;

  while (iter < maxIter) {
    prevV = [...v];

    // u = A * v (左奇异向量)
    for (let i = 0; i < m; i++) {
      u[i] = matrix[i].reduce((sum, val, j) => sum + val * v[j], 0);
    }

    // 归一化 u
    const uNorm = Math.sqrt(u.reduce((sum, val) => sum + val * val, 0));
    if (uNorm < 1e-15) break;
    for (let i = 0; i < m; i++) u[i] /= uNorm;

    // v = A^T * u (右奇异向量)
    for (let j = 0; j < n; j++) {
      v[j] = u.reduce((sum, val, i) => sum + val * matrix[i][j], 0);
    }

    // 归一化 v
    const vNorm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    if (vNorm < 1e-15) break;
    for (let j = 0; j < n; j++) v[j] /= vNorm;

    // 检查收敛
    const diff = v.reduce((sum, val, idx) => sum + Math.abs(val - prevV[idx]), 0);
    if (diff < 1e-10) break;
    iter++;
  }

  // 计算奇异值: sigma = u^T * A * v
  let singularValue = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      singularValue += u[i] * matrix[i][j] * v[j];
    }
  }

  return { singularValue: Math.abs(singularValue), u, v };
}

function transposeMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  return Array.from({ length: cols }, (_, j) =>
    Array.from({ length: rows }, (_, i) => matrix[i][j])
  );
}

function multiplyMatrix(A, B) {
  const rowsA = A.length;
  const colsA = A[0]?.length || 0;
  const colsB = B[0]?.length || 0;

  const result = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += (A[i][k] || 0) * (B[k][j] || 0);
      }
      result[i][j] = sum;
    }
  }
  return result;
}

module.exports = {
  cosineSimilarity,
  dotProduct,
  normalizeVector,
  buildUserItemMatrix,
  fuseRecommendations,
  calculateSVD,
  performSVD,
  multiplyMatrix,
  transposeMatrix,
  powerIterationSVD
};
