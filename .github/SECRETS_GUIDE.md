# GitHub Secrets 配置指南

## 必填 Secrets

部署微信云函数需要配置以下 Secrets：

### 1. WECHAT_APPID
- **说明**：微信小程序 AppID
- **获取方式**：微信公众平台 -> 开发管理 -> 开发设置
- **示例**：`wx1234567890abcdef`

### 2. TCB_SECRET_ID
- **说明**：腾讯云 SecretId
- **获取方式**：腾讯云控制台 -> 访问管理 -> API密钥管理
- **权限**：需要云函数读写权限

### 3. TCB_SECRET_KEY
- **说明**：腾讯云 SecretKey
- **获取方式**：与 SecretId 同一页面
- **注意**：不要泄露给他人

### 4. TCB_ENV_ID
- **说明**：云开发环境 ID
- **获取方式**：微信云开发控制台 -> 环境 -> 环境设置
- **示例**：`cloud-xxxxx`

## 可选 Secrets

### 5. DINGTALK_WEBHOOK (钉钉通知)
- **说明**：钉钉机器人 WebHook 地址
- **用途**：CI/CD 完成后发送通知

### 6. SLACK_WEBHOOK (Slack通知)
- **说明**：Slack Incoming WebHook 地址
- **用途**：CI/CD 完成后发送通知

## 配置步骤

1. 进入 GitHub 仓库 -> Settings -> Secrets and variables -> Actions
2. 点击 "New repository secret"
3. 填写 Name 和 Secret 值
4. 确保 CI/CD 流水线能正常读取

## 本地测试

Secrets 无法在本地使用，但可以：

1. 创建 `.env.local` 文件（已在 .gitignore 中，不会被提交）
2. 复制 `.env.example` 内容
3. 填入本地测试值
