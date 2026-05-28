# 校园盲盒平台 - 自动化测试

> 使用 Python + pytest + requests 实现接口自动化测试
> 包含：接口测试、AI专项测试、并发测试

---

## 目录结构

```
tests/
├── README.md                # 本文件
├── QUICKSTART.md            # 快速开始指南
├── requirements.txt         # 依赖包
├── config.py                # 测试配置
├── .env.example             # 环境变量示例
├── ai_evaluator.py          # AI专项评测脚本（重点推荐）
│
├── api/                     # 接口封装层
│   ├── user_service.py      # 用户服务接口
│   ├── box_service.py       # 盲盒服务接口
│   ├── order_service.py     # 订单服务接口
│   └── ai_service.py        # AI服务接口
│
├── test_user/               # 用户服务测试
│   └── test_login.py
│
├── test_box/                # 盲盒服务测试
├── test_order/              # 订单服务测试
├── test_ai/                 # AI服务测试
│
└── test_concurrent/         # 并发测试（重点）
    └── test_concurrent.py   # 抢单、下单并发测试
```

---

## 快速运行

### 1. AI专项评测（推荐优先尝试）

```bash
cd tests
python ai_evaluator.py
```

这个脚本会自动运行：
- 基础功能测试
- 回答质量评估
- 性能压测（并发请求）
- 多轮对话测试
- 生成完整的评测报告

### 2. 并发测试

```bash
cd tests
python test_concurrent/test_concurrent.py
```

测试场景：
- 多骑手同时抢单（只有1人成功）
- 多用户同时下单（库存精确扣减）
- 防超卖测试

### 3. 接口自动化测试

```bash
cd tests
pytest test_user/test_login.py -v
```

---

## 面试展示要点

### 必展示文件/功能：

1. **docs/测试用例.md** - 50+ 详细测试用例
2. **tests/ai_evaluator.py** - AI专项评测脚本
3. **tests/test_concurrent/** - 并发测试（抢单/下单）
4. **tests/QUICKSTART.md** - 快速开始指南

### 推荐话术：

> "我在项目中加入了完整的测试体系，针对AI服务做了专项评测，包括回答质量、性能压测、并发测试等。针对盲盒平台的核心业务，我特别做了多骑手抢单和多用户下单的并发测试，验证防超卖和并发安全机制。"
