const { ALL_DORMS, MAIN_DORMS, getLevel, getDemoDormHeat, getDemoHotBoxes, getDemoOrders } = require('../cloudfunctions/common/dorms');

describe('宿舍数据模块测试', () => {
  describe('ALL_DORMS - 宿舍数据', () => {
    test('应包含宿舍名称数组', () => {
      expect(Array.isArray(ALL_DORMS)).toBe(true);
      expect(ALL_DORMS.length).toBeGreaterThan(0);
    });

    test('每个宿舍应为字符串', () => {
      ALL_DORMS.forEach(dorm => {
        expect(typeof dorm).toBe('string');
        expect(dorm.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MAIN_DORMS - 主要宿舍', () => {
    test('应包含主要宿舍', () => {
      expect(Array.isArray(MAIN_DORMS)).toBe(true);
      expect(MAIN_DORMS.length).toBeGreaterThan(0);
    });
  });

  describe('getLevel - 热力等级计算', () => {
    test('count或maxCount为0应返回cold', () => {
      expect(getLevel(0, 100)).toBe('cold');
      expect(getLevel(50, 0)).toBe('cold');
      expect(getLevel(0, 0)).toBe('cold');
    });

    test('高比例应返回hot', () => {
      expect(getLevel(80, 100)).toBe('hot');
    });

    test('中等比例应返回其他等级', () => {
      const result = getLevel(30, 100);
      expect(result).toMatch(/^(cold|warm|hot|normal)$/);
    });
  });

  describe('getDemoDormHeat - 演示热力数据', () => {
    test('应返回数组', () => {
      const data = getDemoDormHeat();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('getDemoHotBoxes - 演示热盒数据', () => {
    test('应返回盲盒数组', () => {
      const boxes = getDemoHotBoxes();
      expect(Array.isArray(boxes)).toBe(true);
      expect(boxes.length).toBeGreaterThan(0);
      boxes.forEach(box => {
        expect(box.title).toBeDefined();
      });
    });
  });

  describe('getDemoOrders - 演示订单数据', () => {
    test('应返回订单数组', () => {
      const orders = getDemoOrders();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
    });

    test('每个订单应有必要字段', () => {
      const orders = getDemoOrders();
      orders.forEach(order => {
        expect(order._id).toBeDefined();
        expect(order.box_title).toBeDefined();
        expect(order.price).toBeDefined();
      });
    });
  });
});
