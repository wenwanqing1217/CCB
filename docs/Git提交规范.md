# Git 提交规范

## 一、提交格式

```
<type>(<scope>): <subject>
```

## 二、type 类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复bug |
| docs | 文档更新 |
| style | 代码格式调整（不影响功能） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具相关 |

## 三、示例

```bash
# 新功能
git commit -m "feat(推荐): 实现混合推荐算法"

# 修复bug
git commit -m "fix(抢单): 修复并发超卖问题"

# 文档
git commit -m "docs(readme): 更新项目说明"

# 重构
git commit -m "refactor(云函数): 拆分orderService模块"
```

## 四、分支规范

- main/master: 主分支，稳定版本
- develop: 开发分支
- feature/xxx: 功能分支
- fix/xxx: 修复分支
- hotfix/xxx: 紧急修复分支
