# Changelog

## [2.0.0] - 2024-06-09

### Added
- 盲盒广场（love.js）接入云函数 getBlindBoxes，从云数据库实时拉取数据
- 盲盒详情（box-detail.js）接入云函数 getBoxDetail
- 下单页（order-confirm.js）接入云函数 createOrder，提交真实订单
- 分类标签改为动态渲染（12个分类从数据源生成）
- 加载中状态（spinner动画）
- 空状态提示（"暂无盲盒～"）
- 云函数加载失败友好 Toast 提示
- 54 个单元测试覆盖（算法/错误码/宿舍数据）
- MIT LICENSE 文件

### Fixed
- 修复 17 个云函数 rrorHandler is not defined 运行时崩溃 Bug
- 修复 alidator.js const 赋值给常量导致的 TypeError
- 修复 64 个 ESLint errors（cloudfunctions + utils 清零）
- 修复前端页面 30 个 ESLint errors（pages 清零）
- 统一全局背景色为 #020208
- 清理冗余 CSS 注释

### Changed
- CI/CD 测试计数更新为 54
- 所有云函数 error 日志改为 console.error
- 下拉刷新从模拟改为调云函数
