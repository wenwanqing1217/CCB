const { getUserBasedCF, getItemBasedCF, fuseRecommendations, getBoxesByScores } = require('../../recommendationService/algorithms')

describe('推荐算法测试', () => {
  describe('getUserBasedCF - 基于用户的协同过滤', () => {
    test('应返回推荐列表', async () => {
      const result = await getUserBasedCF('test-openid', 10)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeLessThanOrEqual(10)
    })

    test('应包含评分字段', async () => {
      const result = await getUserBasedCF('test-openid', 5)

      result.forEach(item => {
        expect(item).toHaveProperty('boxId')
        expect(item).toHaveProperty('score')
        expect(typeof item.score).toBe('number')
      })
    })
  })

  describe('getItemBasedCF - 基于物品的协同过滤', () => {
    test('应返回推荐列表', async () => {
      const result = await getItemBasedCF('test-openid', 10)

      expect(result).toBeInstanceOf(Array)
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
  })

  describe('getBoxesByScores - 分数映射到盲盒', () => {
    test('应返回带详细信息的盲盒列表', async () => {
      const scores = [
        { boxId: 'box1', score: 0.9 },
        { boxId: 'box2', score: 0.8 }
      ]

      const result = await getBoxesByScores(scores)

      expect(result).toBeInstanceOf(Array)
      expect(result.length).toBeLessThanOrEqual(scores.length)
    })
  })
})
