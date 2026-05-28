/**
 * 豆包大模型配置文件
 * 统一管理AI模型配置，方便后续换模型
 */

module.exports = {
  // 模型配置
  model: {
    provider: 'volcengine',  // 火山引擎
    model: 'doubao-pro-4k',  // 模型名称
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    // endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',  // VOLC Engine Base URL
    maxTokens: 500,  // 最大回复token数
    temperature: 0.7,  // 创造性参数（0-1）
    topP: 0.9,
  },

  // 超时配置
  timeout: {
    request: 10000,  // 请求超时（ms）
    retry: 3,  // 重试次数
  },

  // Token管控
  token: {
    maxHistory: 10,  // 最大历史消息对数
    maxContextLength: 4000,  // 最大上下文token数
  },

  // 缓存配置
  cache: {
    enabled: true,
    expire: 300,  // 缓存过期时间（秒）
  },

  // 日志配置
  log: {
    enabled: true,
    level: 'info',  // debug/info/warn/error
  }
};
