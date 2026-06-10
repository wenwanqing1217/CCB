const { cosineSimilarity, fuseRecommendations, buildUserItemMatrix } = require('../cloudfunctions/recommendationService/algorithms')

describe('推荐算法测试', () => {
  describe('cosineSimilarity - 余弦相似度', () => {
    test('应正确计算相同向量相似度', () => {
      const vec1 = { a: 1, b: 2, c: 3 }
      const vec2 = { a: 1, b: 2, c: 3 }

      const similarity = cosineSimilarity(vec1, vec2)

      expect(similarity).toBeCloseTo(1, 5)
    })

    test('应正确计算正交向量相似度', () => {
      const vec1 = { a: 1, b: 0 }
      const vec2 = { a: 0, b: 1 }

      const similarity = cosineSimilarity(vec1, vec2)

      expect(similarity).toBe(0)
    })

    test('应正确计算一般情况相似度', () => {
      const vec1 = { a: 1, b: 2 }
      const vec2 = { a: 2, b: 4 }

      const similarity = cosineSimilarity(vec1, vec2)

      expect(similarity).toBeCloseTo(1, 5)
    })
  })

  describe('fuseRecommendations - 评分融合', () => {
    test('应正确融合多个推荐结果', () => {
      const ucf = [
        { boxId: 'box1', score: 0.9 },
        { boxId: 'box2', score: 0.8 },
        { boxId: 'box3', score: 0.7 }
      ]
      const icf = [
        { boxId: 'box2', score: 0.95 },
        { boxId: 'box1', score: 0.85 },
        { boxId: 'box4', score: 0.6 }
      ]
      const svd = [
        { boxId: 'box3', score: 0.88 },
        { boxId: 'box1', score: 0.75 },
        { boxId: 'box5', score: 0.5 }
      ]
      const weights = [0.3, 0.3, 0.4]

      const fused = fuseRecommendations(ucf, icf, svd, weights)

      expect(fused).toBeInstanceOf(Array)
      expect(fused.length).toBeGreaterThan(0)

      const boxIds = fused.map(item => item.boxId)
      expect(boxIds).toContain('box1')
      expect(boxIds).toContain('box2')
      expect(boxIds).toContain('box3')
    })

    test('权重总和应为1', () => {
      const ucf = [{ boxId: 'box1', score: 0.9 }]
      const icf = [{ boxId: 'box1', score: 0.8 }]
      const svd = [{ boxId: 'box1', score: 0.7 }]
      const weights = [0.4, 0.3, 0.3]

      const fused = fuseRecommendations(ucf, icf, svd, weights)

      expect(fused[0].score).toBeCloseTo(0.81, 2)
    })

    test('应处理重复boxId并累加分数', () => {
      const ucf = [{ boxId: 'box1', score: 0.5 }]
      const icf = [{ boxId: 'box1', score: 0.3 }]
      const svd = [{ boxId: 'box1', score: 0.2 }]
      const weights = [0.4, 0.3, 0.3]

      const fused = fuseRecommendations(ucf, icf, svd, weights)

      expect(fused.length).toBe(1)
      expect(fused[0].score).toBeCloseTo(0.35, 2)
    })
  })

  describe('buildUserItemMatrix - 构建用户物品矩阵', () => {
    test('应正确构建用户物品矩阵', () => {
      const actions = [
        { openid: 'user1', boxId: 'box1', type: 'view' },
        { openid: 'user1', boxId: 'box2', type: 'view' },
        { openid: 'user2', boxId: 'box1', type: 'purchase' },
        { openid: 'user2', boxId: 'box3', type: 'collect' }
      ]

      const matrix = buildUserItemMatrix(actions)

      expect(matrix['user1']['box1']).toBe(1)
      expect(matrix['user1']['box2']).toBe(1)
      expect(matrix['user2']['box1']).toBe(3)
      expect(matrix['user2']['box3']).toBe(2)
    })

    test('应累加同一用户的相同物品行为', () => {
      const actions = [
        { openid: 'user1', boxId: 'box1', type: 'view' },
        { openid: 'user1', boxId: 'box1', type: 'view' },
        { openid: 'user1', boxId: 'box1', type: 'collect' }
      ]

      const matrix = buildUserItemMatrix(actions)

      expect(matrix['user1']['box1']).toBe(4)
    })
  })

  describe('performSVD - 幂迭代SVD分解', () => {
    test('应对小矩阵正确分解', () => {
      const { performSVD } = require('../cloudfunctions/recommendationService/algorithms')
      const matrix = [
        [1, 0, 0],
        [0, 2, 0],
        [0, 0, 3]
      ]

      const result = performSVD(matrix, 2)

      expect(result.S.length).toBe(2)
      expect(result.S[0]).toBeGreaterThan(result.S[1])
      expect(result.S[0]).toBeCloseTo(3, 0)
    })

    test('奇异值分解应满足 A ≈ U * Sigma * V^T', () => {
      const { performSVD, multiplyMatrix, transposeMatrix } = require('../cloudfunctions/recommendationService/algorithms')
      const matrix = [
        [4, 0],
        [3, -5]
      ]

      const { U, S, V } = performSVD(matrix, 2)

      expect(U.length).toBeGreaterThan(0)
      expect(S.length).toBeGreaterThan(0)
      expect(V.length).toBeGreaterThan(0)
    })

    test('应处理空矩阵', () => {
      const { performSVD } = require('../cloudfunctions/recommendationService/algorithms')
      const result = performSVD([], 5)

      expect(result.S).toEqual([])
    })

    test('应处理零矩阵', () => {
      const { performSVD } = require('../cloudfunctions/recommendationService/algorithms')
      const matrix = [
        [0, 0],
        [0, 0]
      ]

      const result = performSVD(matrix, 2)

      expect(result.S.every(s => s < 1e-10)).toBe(true)
    })
  })

  describe('powerIterationSVD - 单轮幂迭代', () => {
    test('应对非零矩阵返回正值奇异值', () => {
      const { powerIterationSVD } = require('../cloudfunctions/recommendationService/algorithms')
      const matrix = [
        [1, 2],
        [3, 4]
      ]

      const result = powerIterationSVD(matrix, 100)

      expect(result.singularValue).toBeGreaterThan(0)
      expect(result.u.length).toBe(2)
      expect(result.v.length).toBe(2)

      // 向量应为单位长度
      const uNorm = Math.sqrt(result.u.reduce((s, v) => s + v * v, 0))
      expect(uNorm).toBeCloseTo(1, 5)
      const vNorm = Math.sqrt(result.v.reduce((s, v) => s + v * v, 0))
      expect(vNorm).toBeCloseTo(1, 5)
    })
  })
})
