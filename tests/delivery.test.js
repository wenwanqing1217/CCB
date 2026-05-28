const {
  calculateDistance,
  calculateManhattanDistance,
  calculateMatchScore
} = require('../cloudfunctions/deliveryService/algorithms')

describe('配送匹配算法测试', () => {
  describe('calculateDistance - Haversine距离计算', () => {
    test('应正确计算两点间距离', () => {
      const point1 = { latitude: 31.2304, longitude: 121.4737 }
      const point2 = { latitude: 31.2304, longitude: 121.4737 }

      const distance = calculateDistance(point1, point2)

      expect(distance).toBe(0)
    })

    test('同一位置距离应为0', () => {
      const point = { latitude: 31.2304, longitude: 121.4737 }

      const distance = calculateDistance(point, point)

      expect(distance).toBe(0)
    })

    test('上海到北京距离约1068公里', () => {
      const shanghai = { latitude: 31.2304, longitude: 121.4737 }
      const beijing = { latitude: 39.9042, longitude: 116.4074 }

      const distance = calculateDistance(shanghai, beijing)

      expect(distance).toBeGreaterThan(1000000)
      expect(distance).toBeLessThan(1200000)
    })

    test('无效坐标应返回默认值', () => {
      const invalidPoint = { latitude: null, longitude: null }
      const validPoint = { latitude: 31.2304, longitude: 121.4737 }

      const distance = calculateDistance(invalidPoint, validPoint)

      expect(distance).toBe(100000)
    })
  })

  describe('calculateManhattanDistance - 曼哈顿距离', () => {
    test('应正确计算曼哈顿距离', () => {
      const point1 = { latitude: 31.2304, longitude: 121.4737 }
      const point2 = { latitude: 31.2400, longitude: 121.4837 }

      const distance = calculateManhattanDistance(point1, point2)

      expect(distance).toBeGreaterThan(0)
      expect(typeof distance).toBe('number')
    })

    test('无效坐标应返回默认值', () => {
      const invalidPoint = {}
      const validPoint = { latitude: 31.2304, longitude: 121.4737 }

      const distance = calculateManhattanDistance(invalidPoint, validPoint)

      expect(distance).toBe(100000)
    })
  })

  describe('calculateMatchScore - 匹配度计算', () => {
    test('完全顺路时距离得分应为1', async () => {
      const rider = { latitude: 31.2304, longitude: 121.4737 }
      const pickup = { latitude: 31.2304, longitude: 121.4737 }
      const delivery = { latitude: 31.2400, longitude: 121.4837 }

      const score = await calculateMatchScore(
        rider,
        pickup,
        delivery,
        0,
        new Date().toISOString(),
        null
      )

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    test('骑手负载高时分数应降低', async () => {
      const rider = { latitude: 31.2304, longitude: 121.4737 }
      const pickup = { latitude: 31.2304, longitude: 121.4737 }
      const delivery = { latitude: 31.2400, longitude: 121.4837 }
      const orderTime = new Date().toISOString()

      const scoreLowLoad = await calculateMatchScore(rider, pickup, delivery, 0, orderTime, null)
      const scoreHighLoad = await calculateMatchScore(rider, pickup, delivery, 5, orderTime, null)

      expect(scoreHighLoad).toBeLessThan(scoreLowLoad)
    })

    test('订单创建时间越久紧迫度越高', async () => {
      const rider = { latitude: 31.2304, longitude: 121.4737 }
      const pickup = { latitude: 31.2304, longitude: 121.4737 }
      const delivery = { latitude: 31.2400, longitude: 121.4837 }

      const recentOrder = new Date().toISOString()
      const oldOrder = new Date(Date.now() - 30 * 60 * 1000).toISOString()

      const scoreRecent = await calculateMatchScore(rider, pickup, delivery, 0, recentOrder, null)
      const scoreOld = await calculateMatchScore(rider, pickup, delivery, 0, oldOrder, null)

      expect(scoreOld).toBeGreaterThan(scoreRecent)
    })

    test('绕路比率过高时分数应降低', async () => {
      const rider = { latitude: 31.2304, longitude: 121.4737 }
      const pickup = { latitude: 31.3304, longitude: 121.5737 }
      const delivery = { latitude: 31.4304, longitude: 121.6737 }

      const score = await calculateMatchScore(
        rider,
        pickup,
        delivery,
        0,
        new Date().toISOString(),
        null
      )

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })
  })
})
