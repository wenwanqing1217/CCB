# API 版本控制设计

## 概述

API 版本控制确保系统迭代过程中接口的向后兼容，让客户端和服务端可以独立演进。

---

## 版本策略

### 策略选择：URL Path 方式（推荐）

```
✓ 明确直观，易于调试
✓ 便于 API 文档和路由管理
✗ 需要客户端配合更新 URL

# 示例
https://api.example.com/v1/boxes
https://api.example.com/v2/boxes
```

### 备选策略

| 策略 | 示例 | 适用场景 |
|-----|------|---------|
| Header | `API-Version: v2` | 内部微服务 |
| Query | `?version=2` | 临时兼容 |

---

## 版本号规则

### 语义化版本（SemVer）

```
主版本.次版本.修订号
  │       │       │
  │       │       └── 日常修复（Bugfix）
  │       └── 新功能（向下兼容）
  └────────── 破坏性变更（不兼容）
```

### 版本生命周期

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│   v1    │────▶│   v2    │────▶│   v3    │
│  维护中  │     │  维护中  │     │  当前   │
└─────────┘     └─────────┘     └─────────┘
     │               │               │
     ▼               ▼               ▼
  6个月后弃用    6个月后弃用      持续维护
```

### 弃用策略

```javascript
// 云函数响应头添加弃用警告
response.set({
  'X-API-Deprecated': 'true',
  'X-API-Deprecated-At': '2024-06-01',
  'X-API-Sunset': '2024-12-01',
  'X-API-Suggest-Version': 'v2'
})
```

---

## 微信云函数版本实现

### 1. 云函数命名规范

```
{module}.v{version}

示例：
- boxes.getList_v1
- boxes.getList_v2
- order.create_v1
- order.create_v2
```

### 2. 入口分发器

```javascript
// 云函数入口：boxes/index.js

const VERSIONS = {
  'v1': require('./handlers/v1/boxesHandler'),
  'v2': require('./handlers/v2/boxesHandler')
}

const DEFAULT_VERSION = 'v1'
const CURRENT_VERSION = 'v2'  // 始终指向最新稳定版本

exports.main = async (event, context) => {
  const version = event.version || CURRENT_VERSION
  const handler = VERSIONS[version] || VERSIONS[DEFAULT_VERSION]

  // 记录 API 调用
  await logApiCall({
    version,
    action: event.action,
    openid: cloud.getWXContext().OPENID,
    timestamp: new Date()
  })

  try {
    return await handler.main(event, context)
  } catch (error) {
    return handleError(error, version)
  }
}

function handleError(error, version) {
  console.error(`[${version}] Error:`, error)

  // v1 返回旧格式错误，v2 返回新格式错误
  if (version === 'v1') {
    return {
      success: false,
      error: error.message
    }
  }

  return {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      requestId: context.requestId
    }
  }
}
```

### 3. V1 处理器（兼容旧版）

```javascript
// handlers/v1/boxesHandler.js

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'list':
      return await getBoxesList(data)
    case 'detail':
      return await getBoxDetail(data)
    case 'publish':
      return await publishBox(data)
    default:
      return { success: false, error: 'Unknown action' }
  }
}

// V1 返回格式（兼容旧版）
async function getBoxDetail(data) {
  const box = await db.collection('boxes').doc(data.boxId).get()

  return {
    success: true,
    data: {
      id: box._id,
      title: box.title,
      price: box.price,
      // V1 没有 imageUrl 字段
      images: box.images
    }
  }
}
```

### 4. V2 处理器（新版）

```javascript
// handlers/v2/boxesHandler.js

exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'list':
      return await getBoxesList(data)
    case 'detail':
      return await getBoxDetail(data)
    case 'publish':
      return await publishBox(data)
    default:
      return {
        success: false,
        error: { code: 'INVALID_ACTION', message: 'Unknown action' }
      }
  }
}

// V2 返回格式（新格式）
async function getBoxDetail(data) {
  const box = await db.collection('boxes').doc(data.boxId).get()

  return {
    success: true,
    data: {
      id: box._id,
      title: box.title,
      price: box.price,
      images: box.images,
      // V2 新增字段
      imageUrl: box.images?.[0] || '',
      seller: {
        id: box.openid,
        nickname: box.sellerNickname,
        avatar: box.sellerAvatar
      },
      tags: box.tags || [],
      createdAt: box.createdAt
    },
    meta: {
      version: 'v2',
      timestamp: Date.now()
    }
  }
}
```

---

## 响应格式规范

### 统一响应结构

```javascript
// 成功响应
{
  success: true,
  data: { ... },
  meta: {
    version: 'v2',
    timestamp: 1704067200000,
    page: 1,
    pageSize: 20
  }
}

// 错误响应
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: '标题不能为空',
    details: [
      { field: 'title', message: '标题不能为空' }
    ],
    requestId: 'req_xxx'
  }
}
```

### HTTP 状态码映射

| 状态码 | 含义 | 使用场景 |
|-------|------|---------|
| 200 | OK | 成功响应 |
| 400 | Bad Request | 参数错误 |
| 401 | Unauthorized | 未登录 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 429 | Too Many Requests | 限流 |
| 500 | Internal Error | 服务器错误 |

---

## 向后兼容策略

### 1. 字段添加（兼容）

```javascript
// 服务端可以添加新字段，客户端忽略未知字段
// V1 客户端无法识别 V2 新增字段时，直接忽略
```

### 2. 字段废弃（渐进式）

```javascript
// V2 标记废弃字段
{
  title: 'xxx',
  _deprecated: {
    field: 'title',
    suggest: 'titleText',
    sunset: '2024-12-01'
  }
}
```

### 3. 字段重命名

```javascript
// V3 同时返回新旧字段，逐步废弃旧字段
{
  imageUrl: 'xxx',           // V3 新名
  image: 'xxx'                // V2 旧名，V4 将移除
}
```

---

## 客户端适配

### 1. 版本协商

```javascript
// 小程序端
const cloud = require('wx-server-sdk')

// 自动使用最新版本
const version = 'v2'  // 可配置

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 调用示例
wx.cloud.callFunction({
  name: 'boxes',
  data: {
    version,  // 传入版本号
    action: 'list',
    data: { page: 1 }
  }
})
```

### 2. 版本检测与提示

```javascript
// 检测服务端返回的版本信息
wx.cloud.callFunction({
  name: 'system',
  data: { action: 'checkVersion' }
}).then(res => {
  const { latestVersion, needUpdate } = res.data

  if (needUpdate) {
    wx.showModal({
      title: '版本更新',
      content: `发现新版本 v${latestVersion}，是否立即更新？`,
      success: (confirm) => {
        if (confirm) {
          // 引导用户更新小程序
        }
      }
    })
  }
})
```

---

## 版本测试策略

### 1. 单元测试

```javascript
// test/boxes.v2.test.js

describe('Boxes API V2', () => {
  test('list should return new format', async () => {
    const res = await boxesHandler.main({
      version: 'v2',
      action: 'list',
      data: {}
    })

    expect(res.data).toHaveProperty('meta.version', 'v2')
    expect(res.data).toHaveProperty('data[0].seller')
  })

  test('v2 should be backward compatible with v1', async () => {
    // 验证 V2 包含 V1 的所有字段
    const v1Res = await boxesHandler.main({ version: 'v1', action: 'detail', data: { boxId: 'xxx' } })
    const v2Res = await boxesHandler.main({ version: 'v2', action: 'detail', data: { boxId: 'xxx' } })

    // V2 应该包含 V1 的所有业务字段
    expect(v2Res.data.id).toBe(v1Res.data.id)
    expect(v2Res.data.title).toBe(v1Res.data.title)
    expect(v2Res.data.price).toBe(v1Res.data.price)
  })
})
```

### 2. 集成测试矩阵

| 客户端版本 | 服务端版本 | 预期结果 |
|-----------|-----------|---------|
| V1 | V1 | ✓ 正常 |
| V1 | V2 | ✓ 兼容（使用 V1 格式） |
| V2 | V1 | ✗ 不支持（需升级） |
| V2 | V2 | ✓ 正常 |

---

## 文档管理

### OpenAPI 规范

```yaml
openapi: 3.0.0
info:
  title: 校园盲盒 API
  version: 2.0.0

paths:
  /v1/boxes:
    get:
      summary: 获取盲盒列表 (v1)
      deprecated: true
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BoxesResponseV1'

  /v2/boxes:
    get:
      summary: 获取盲盒列表 (v2)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BoxesResponseV2'
```

---

## 迁移指南

### V1 → V2 迁移步骤

1. **服务端部署 V2**，保持 V1 可用
2. **客户端灰度升级**：先让 10% 用户使用 V2
3. **监控错误率**：V2 错误率应低于 V1
4. **全量升级**：确认稳定后全量推送
5. **V1 标记废弃**：添加 `deprecated` 响应头
6. **V1 下线**：6个月后停止支持
