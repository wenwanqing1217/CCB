# 贡献指南

## 开发环境

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 填入配置
```

### 3. 开发模式

```bash
# 启动开发服务器
npm run dev

# 监听代码变化并格式化
npm run watch
```

## 代码规范

### 格式化

```bash
# 格式化所有代码
npm run format

# 检查格式化
npm run format:check
```

### Lint

```bash
# 检查代码规范
npm run lint

# 自动修复可修复的问题
npm run lint:fix
```

### 提交代码

项目使用 husky + lint-staged，提交前会自动检查。

```bash
git add .
git commit -m "feat: 添加新功能"
git push
```

## Git 提交规范

遵循 Angular Commit Message Format：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档变更 |
| style | 代码格式（不影响功能） |
| refactor | 重构（不是新功能或修复） |
| test | 测试相关 |
| chore | 构建/工具变更 |

### 示例

```
feat(cloudfunctions): 添加混合推荐算法

- 实现 UCF + ICF + SVD 三种推荐融合
- 添加动态权重调整
- 优化查询性能

Closes #123
```

## 云函数开发

### 创建新云函数

1. 在 `cloudfunctions/` 下创建目录
2. 添加 `index.js` 和 `package.json`
3. 安装依赖：`npm install`

### 云函数规范

```javascript
exports.main = async (event, context) => {
  // event: 小程序端传入的参数
  // context: 运行环境信息

  try {
    // 业务逻辑
    return { success: true, data: {} }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, message: error.message }
  }
}
```

## 测试

```bash
# 运行所有测试
npm test

# 监听变化重跑
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 分支管理

- `main`: 主分支，生产环境
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支
- `refactor/*`: 重构分支

### 工作流程

1. 从 `develop` 创建分支
2. 开发并测试
3. 提交 PR 到 `develop`
4. 合并后删除分支

## 常见问题

### ESLint 报错

```bash
# 自动修复
npm run lint:fix
```

### husky 提交失败

检查是否还有未修复的 ESLint 问题，或跳过检查：

```bash
git commit -m "message" --no-verify
```

### 云函数部署失败

1. 检查 Secrets 配置
2. 确认云函数包大小 < 10MB
3. 检查依赖是否在 package.json 中
