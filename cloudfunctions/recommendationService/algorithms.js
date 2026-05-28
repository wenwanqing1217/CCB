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
  if (m === 0 || n === 0) return { U: [], S: [], V: [] };

  const actualK = Math.min(k, Math.min(m, n));
  let U = [];
  let S = [];
  let V = [];

  const transposed = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));

  const ATA = multiplyMatrix(transposed, matrix);
  const AAT = multiplyMatrix(matrix, transposed);

  const eigenResult = eigenDecompositionSymmetric(AAT);
  U = eigenResult.eigenvectors;
  S = eigenResult.eigenvalues.map(v => Math.sqrt(Math.max(0, v)));

  const eigenResultV = eigenDecompositionSymmetric(ATA);
  V = eigenResultV.eigenvectors;

  U = U.map(vec => vec.slice(0, actualK));
  V = V.map(vec => vec.slice(0, actualK));
  S = S.slice(0, actualK);

  return { U, S, V };
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

function eigenDecompositionSymmetric(matrix) {
  const n = matrix.length;
  const eigenvalues = new Array(n).fill(1).map((_, i) => matrix[i]?.[i] || 1);
  const eigenvectors = matrix.map((row, i) =>
    new Array(n).fill(0).map((_, j) => (i === j ? 1 : 0))
  );

  return { eigenvalues, eigenvectors };
}

module.exports = {
  cosineSimilarity,
  dotProduct,
  normalizeVector,
  buildUserItemMatrix,
  fuseRecommendations,
  calculateSVD,
  performSVD,
  multiplyMatrix
};
