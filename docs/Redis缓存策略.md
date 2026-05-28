# Redis 缓存策略设计

## 概述

本项目使用 Redis 作为缓存层，用于提升查询性能、减轻数据库压力、实现分布式锁等功能。

---

## 缓存架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   小程序    │────▶│  Redis Cache │────▶│   MongoDB   │
│   Client   │     │             │     │   Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │   RocketMQ  │
                    │   消息队列   │
                    └─────────────┘
```

---

## 缓存 Key 设计

### 命名规范

```
{module}:{entity}:{identifier}:{field}

示例：
- boxes:list:campus_main:type_digital:page_1    // 盲盒列表缓存
- user:info:openid_xxx                           // 用户信息缓存
- order:detail:order_id_xxx                      // 订单详情缓存
```

### 模块前缀

| 前缀 | 用途 |
|-----|------|
| `boxes:*` | 盲盒相关缓存 |
| `user:*` | 用户相关缓存 |
| `order:*` | 订单相关缓存 |
| `delivery:*` | 配送相关缓存 |
| `feed:*` | 社区动态缓存 |
| `stats:*` | 统计计数缓存 |
| `lock:*` | 分布式锁 |
| `rate:*` | 限流计数 |

---

## 缓存策略

### 1. 盲盒列表缓存

```javascript
// Key: boxes:list:{campus}:{type}:{page}
// TTL: 5分钟
// 失效：盲盒发布/下架时删除

const cacheKey = `boxes:list:${campus}:${type}:${page}`
const cached = await redis.get(cacheKey)
if (cached) {
  return JSON.parse(cached)
}

const boxes = await db.collection('boxes').where({...}).get()
await redis.setex(cacheKey, 300, JSON.stringify(boxes))

// 写入时删除缓存
async function invalidateBoxesCache(campus, type) {
  const pattern = `boxes:list:${campus || '*'}:${type || '*'}:*`
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
```

### 2. 热门盲盒缓存

```javascript
// Key: boxes:hot:{campus}:{limit}
// TTL: 10分钟
// 更新：定时任务更新

const cacheKey = `boxes:hot:${campus}:${limit}`
await redis.setex(cacheKey, 600, JSON.stringify(hotBoxes))
```

### 3. 用户信息缓存

```javascript
// Key: user:info:{openid}
// TTL: 30分钟
// 失效：用户信息变更时删除

const cacheKey = `user:info:${openid}`
const userCache = await redis.get(cacheKey)
if (userCache) {
  return JSON.parse(userCache)
}

const user = await db.collection('users').where({ openid }).get()
await redis.setex(cacheKey, 1800, JSON.stringify(user))
```

### 4. 订单缓存（短期）

```javascript
// Key: order:detail:{orderId}
// TTL: 5分钟
// 失效：订单状态变更时删除

const cacheKey = `order:detail:${orderId}`
await redis.setex(cacheKey, 300, JSON.stringify(order))
```

### 5. 统计计数缓存

```javascript
// Key: stats:boxes:total
// TTL: 无（定时更新）
// 用于：首页统计数据

await redis.set('stats:boxes:total', totalCount)
// 定时任务每5分钟更新
```

### 6. 分布式锁

```javascript
// 用于：库存扣减、订单创建等并发控制

async function acquireLock(key, ttl = 5000) {
  const lockKey = `lock:${key}`
  const token = uuid.v4()

  const acquired = await redis.set(lockKey, token, 'PX', ttl, 'NX')
  if (acquired) {
    return token
  }
  return null
}

async function releaseLock(key, token) {
  const lockKey = `lock:${key}`
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `
  await redis.eval(script, 1, lockKey, token)
}

// 使用示例
async function createOrder(orderData) {
  const lockToken = await acquireLock(`order:${boxId}`)
  if (!lockToken) {
    throw new Error('系统繁忙，请重试')
  }

  try {
    // 检查库存
    const box = await db.collection('boxes').doc(boxId).get()
    if (box.status !== 'available') {
      throw new Error('盲盒已售出')
    }

    // 创建订单
    const order = await db.collection('orders').add(orderData)

    // 更新库存状态
    await db.collection('boxes').doc(boxId).update({ status: 'sold' })

    return order
  } finally {
    await releaseLock(`order:${boxId}`, lockToken)
  }
}
```

### 7. 限流缓存

```javascript
// 用于：接口限流、防止刷单

async function checkRateLimit(openid, action, maxRequests = 10, windowSeconds = 60) {
  const key = `rate:${action}:${openid}`

  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }

  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
    resetAt: await redis.ttl(key)
  }
}

// 使用示例
async function publishBox(req, res) {
  const { allowed, remaining } = await checkRateLimit(openid, 'publish', 5, 3600)
  if (!allowed) {
    return res.error('发布过于频繁，请稍后再试')
  }

  // 继续发布逻辑...
}
```

---

## 缓存失效策略

### 1. Cache Aside（旁路缓存）

```
读：先读缓存，缓存不存在则读数据库，然后更新缓存
写：先更新数据库，然后删除缓存（不是更新）
```

```javascript
// 读
async function getUser(openid) {
  const cacheKey = `user:info:${openid}`
  let user = await redis.get(cacheKey)

  if (!user) {
    user = await db.collection('users').where({ openid }).get()
    await redis.setex(cacheKey, 1800, JSON.stringify(user))
  }

  return user
}

// 写
async function updateUser(openid, data) {
  await db.collection('users').where({ openid }).update(data)
  await redis.del(`user:info:${openid}`)
}
```

### 2. 延迟双删

```javascript
// 用于：数据一致性要求高的场景

async function updateUserWithDelay(openid, data) {
  // 1. 先删除缓存
  await redis.del(`user:info:${openid}`)

  // 2. 更新数据库
  await db.collection('users').where({ openid }).update(data)

  // 3. 延迟再删除（等待可能正在读取的请求完成）
  setTimeout(async () => {
    await redis.del(`user:info:${openid}`)
  }, 500)
}
```

---

## 缓存配置

### Redis 连接配置

```javascript
const redis = require('ioredis')

const client = new redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
})

client.on('error', (err) => {
  console.error('Redis连接错误:', err)
})

client.on('connect', () => {
  console.log('Redis连接成功')
})
```

### 连接池配置

```javascript
const RedisPool = {
  max: 20,
  min: 5,
  acquire: async function() {
    return await client.connect()
  },
  destroy: async function(conn) {
    await conn.quit()
  }
}
```

---

## 最佳实践

### 1. 缓存预热

```javascript
// 系统启动时加载热点数据

async function warmUpCache() {
  console.log('开始缓存预热...')

  // 预热热门盲盒
  const hotBoxes = await db.collection('boxes')
    .where({ status: 'available' })
    .orderBy('sales', 'desc')
    .limit(100)
    .get()

  for (const campus of ['main', 'south', 'north']) {
    await redis.setex(
      `boxes:hot:${campus}:20`,
      600,
      JSON.stringify(hotBoxes)
    )
  }

  // 预热统计数据
  const stats = {
    totalBoxes: await db.collection('boxes').count(),
    totalOrders: await db.collection('orders').count(),
    totalUsers: await db.collection('users').count()
  }
  await redis.set('stats:overview', JSON.stringify(stats))

  console.log('缓存预热完成')
}
```

### 2. 缓存监控

```javascript
// 定期检查缓存命中率

async function monitorCacheHitRate() {
  const info = await client.info('stats')
  const keyspace = await client.info('keyspace')

  const hitRate = calculateHitRate(info)
  const keysCount = await client.dbsize()

  console.log({
    hitRate,
    keysCount,
    memoryUsed: await client.info('memory').then(m => m.used_memory_human)
  })

  // 命中率低于50%时告警
  if (hitRate < 0.5) {
    await sendAlert('缓存命中率过低')
  }
}
```

### 3. 缓存容量管理

```javascript
// 设置最大内存和淘汰策略

await client.config('SET', 'maxmemory', '256mb')
await client.config('SET', 'maxmemory-policy', 'allkeys-lru')

// LRU策略：当内存不足时，删除最近最少使用的key
```

---

## 注意事项

1. **缓存一致性**：优先使用 Cache Aside + 延迟双删
2. **缓存雪崩**：给缓存 TTL 添加随机偏移量
3. **缓存穿透**：对不存在的数据也缓存（NULL 或空对象）
4. **缓存击穿**：使用分布式锁保护热点数据的并发读取
5. **容量规划**：预估数据量，设置合理的 maxmemory
