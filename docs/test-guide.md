# 单元测试指南

## 测试策略

微信云函数无法直接运行单元测试，但可以通过以下方式验证核心算法逻辑：

## 核心算法测试用例

### 1. 余弦相似度（cosineSimilarity）

```javascript
// 测试用例设计
const testCases = [
  {
    name: '完全相同的向量',
    vec1: { a: 1, b: 2 },
    vec2: { a: 1, b: 2 },
    expected: 1.0
  },
  {
    name: '正交向量',
    vec1: { a: 1, b: 0 },
    vec2: { a: 0, b: 1 },
    expected: 0.0
  },
  {
    name: '相反向量',
    vec1: { a: 1, b: 2 },
    vec2: { a: -1, b: -2 },
    expected: -1.0
  },
  {
    name: '部分重叠',
    vec1: { a: 1, b: 2, c: 3 },
    vec2: { a: 1, b: 2, d: 4 },
    expected: 0.5  // (1*1 + 2*2) / (sqrt(14) * sqrt(21))
  }
]
```

### 2. Haversine 距离计算（calculateDistance）

```javascript
// 测试用例设计
const testCases = [
  {
    name: '相同点',
    p1: { latitude: 31.2304, longitude: 121.4737 },
    p2: { latitude: 31.2304, longitude: 121.4737 },
    expectedMin: 0,
    expectedMax: 1  // 误差1米
  },
  {
    name: '已知距离（上海到北京约1068km）',
    p1: { latitude: 31.2304, longitude: 121.4737 }, // 上海
    p2: { latitude: 39.9042, longitude: 116.4074 }, // 北京
    expectedMin: 1060000,
    expectedMax: 1080000
  }
]
```

### 3. SVD 矩阵分解（performSGD）

```javascript
// 测试用例设计
const testCases = [
  {
    name: '分解后重构误差应小于原始误差',
    ratings: [
      { userIdx: 0, itemIdx: 0, rating: 5 },
      { userIdx: 0, itemIdx: 1, rating: 3 },
      { userIdx: 1, itemIdx: 0, rating: 4 }
    ],
    nUsers: 2,
    nItems: 2,
    k: 2,
    iterations: 50,
    maxReconstructError: 2.0  // 重构误差应小于2
  }
]
```

### 4. 匹配度评分（calculateMatchScore）

```javascript
// 测试用例设计
const testCases = [
  {
    name: '完全顺路（骑手在取货点和送货点之间）',
    riderLocation: { latitude: 31.2304, longitude: 121.4737 },
    pickupAddress: { latitude: 31.2310, longitude: 121.4740 },
    deliveryAddress: { latitude: 31.2320, longitude: 121.4750 },
    riderLoad: 0,
    orderCreateTime: Date.now() - 5 * 60 * 1000, // 5分钟前
    expectedMin: 0.7
  },
  {
    name: '严重绕路',
    riderLocation: { latitude: 31.2304, longitude: 121.4737 },
    pickupAddress: { latitude: 31.2400, longitude: 121.4800 },
    deliveryAddress: { latitude: 31.2500, longitude: 121.4900 },
    riderLoad: 3,
    orderCreateTime: Date.now() - 20 * 60 * 1000,
    expectedMax: 0.3
  },
  {
    name: '即将超时订单应获得更高分数',
    riderLocation: { latitude: 31.2304, longitude: 121.4737 },
    pickupAddress: { latitude: 31.2310, longitude: 121.4740 },
    deliveryAddress: { latitude: 31.2400, longitude: 121.4800 },
    riderLoad: 0,
    orderCreateTime: Date.now() - 25 * 60 * 1000,
    orderDeadline: Date.now() + 2 * 60 * 1000, // 2分钟后截止
    expectedMin: 0.5  // 应比普通订单分数更高
  }
]
```

### 5. 加权融合（fuseRecommendations）

```javascript
// 测试用例设计
const testCases = [
  {
    name: '相同来源应累加分数',
    ucf: [{ boxId: 'A', score: 1.0 }],
    icf: [{ boxId: 'A', score: 1.0 }],
    svd: [{ boxId: 'A', score: 1.0 }],
    weights: [0.3, 0.3, 0.4],
    expected: { boxId: 'A', score: 1.0 }
  },
  {
    name: '不同来源应独立计算',
    ucf: [{ boxId: 'A', score: 1.0 }],
    icf: [{ boxId: 'B', score: 1.0 }],
    svd: [],
    weights: [0.5, 0.5, 0],
    expected: { A_score: 0.5, B_score: 0.5 }
  }
]
```

## 测试执行方式

由于微信云函数运行在云端，可通过以下方式验证：

1. **本地模拟**：将核心算法函数提取为独立模块，在本地Node.js环境测试
2. **日志输出**：在云函数中添加详细日志，对比输入输出
3. **云函数测试**：使用微信开发者工具的云函数测试功能

## 覆盖率目标

| 模块 | 覆盖率目标 | 测试重点 |
|-----|----------|---------|
| cosineSimilarity | 100% | 边界条件、零向量 |
| calculateDistance | 90% | Haversine公式精度 |
| performSGD | 80% | 收敛性、维度k的影响 |
| calculateMatchScore | 85% | 各因素权重组合 |
| fuseRecommendations | 90% | 边界融合、空数据 |
