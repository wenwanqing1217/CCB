# 快速开始

## 环境准备

```bash
# 进入测试目录
cd tests

# 安装依赖
pip install -r requirements.txt

# 复制配置文件
cp .env.example .env

# 修改.env中的服务地址（可选，使用默认即可）
```

## 运行测试

### 1. 运行用户服务测试

```bash
pytest test_user/test_login.py -v
```

### 2. 运行AI专项评测（重点推荐）

```bash
python ai_evaluator.py
```

这个脚本会自动运行：
- 基础功能测试
- 回答质量评估
- 性能测试（并发、响应时间）
- 多轮对话测试
- 生成评测报告

### 3. 运行所有测试

```bash
pytest -v
```

### 4. 生成HTML测试报告

```bash
pytest test_user/test_login.py --html=report.html
```

## 面试展示要点

### 如果你想展示"测试能力"：

1. 打开 `docs/测试用例.md` - 展示50+测试用例
2. 运行 `python tests/ai_evaluator.py` - 现场演示AI评测
3. 打开生成的评测报告 - 展示专业的评估体系

### 如果你想展示"自动化测试"：

1. 打开 `tests/` 目录 - 展示架构清晰的测试框架
2. 运行 `pytest tests/test_user/test_login.py -v` - 演示自动化用例运行
3. 展示接口封装层（`api/`目录）- 展示代码设计能力

### 重点话术：

> "我在项目中加入了完整的测试体系，包含50+测试用例，覆盖了用户、订单、盲盒、AI等模块。特别是针对AI服务，我做了专项评测，包括回答质量、性能、多轮对话等维度，还可以生成完整的评测报告。"
