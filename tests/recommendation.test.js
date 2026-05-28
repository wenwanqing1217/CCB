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
})
