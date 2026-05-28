/**
 * 统一LLM调用服务
 * 封装所有大模型调用逻辑，方便后续换模型
 */

const CONFIG = require('../config/model-config');
const logger = require('./logger');

class LLMService {
  constructor() {
    this.config = CONFIG.model;
    this.timeout = CONFIG.timeout;
  }

  /**
   * 调用大模型API
   * @param {Array} messages - 消息数组 [{role, content}]
   * @param {Object} options - 可选参数 {temperature, maxTokens}
   * @returns {Promise<{success, data?, error?}>}
   */
  async chat(messages, options = {}) {
    const startTime = Date.now();

    try {
      // 构建请求体
      const requestBody = {
        model: this.config.model,
        messages: messages,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        top_p: this.config.topP,
      };

      logger.info('LLM请求开始', {
        model: this.config.model,
        messageCount: messages.length,
      });

      // 发起请求
      const response = await this.makeRequest(requestBody);

      // 解析响应
      const result = this.parseResponse(response);

      const costTime = Date.now() - startTime;
      logger.info('LLM请求成功', {
        costTime,
        responseLength: result.length,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const costTime = Date.now() - startTime;
      logger.error('LLM请求失败', {
        error: error.message,
        costTime,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 发起HTTP请求
   */
  async makeRequest(body) {
    const { cloud } = require('wx-server-sdk');
    cloud.init();

    // 注意：在云函数中使用 wx-server-sdk 的http请求
    // 如果豆包API不支持云函数内直接调用，需要使用其他方式
    // 这里提供两种方案：

    // 方案1：直接使用云开发HTTP请求（如果支持）
    try {
      const res = await cloud.openapi.requestSubscribeMessage({
        touser: 'test',
        templateId: 'test',
      });
      // 如果云开发支持，替换为实际请求
    } catch (e) {
      // 继续尝试其他方案
    }

    // 方案2：使用云函数中转（推荐）
    // 在实际部署时，可以在云函数中使用node-fetch或axios
    // 这里我们使用云开发环境可用的方式

    // 模拟实现，实际使用时请替换为真实API调用
    // const response = await fetch(this.config.endpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
    //   },
    //   body: JSON.stringify(body),
    // });
    // return await response.json();

    // 临时返回模拟数据，便于测试
    return {
      id: 'mock-' + Date.now(),
      choices: [{
        message: {
          role: 'assistant',
          content: '这是模拟回复，实际使用时需要配置真实的豆包API。',
        },
      }],
    };
  }

  /**
   * 解析API响应
   */
  parseResponse(response) {
    if (!response.choices || !response.choices[0]) {
      throw new Error('API响应格式错误');
    }

    return response.choices[0].message.content;
  }

  /**
   * 构建消息格式
   */
  buildMessages(systemPrompt, history, userQuestion) {
    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    // 添加历史对话（限制数量）
    const maxHistory = CONFIG.token.maxHistory;
    if (history && history.length > 0) {
      const recentHistory = history.slice(-maxHistory * 2);  // 保留最近N轮对话
      messages.push(...recentHistory);
    }

    // 添加当前问题
    messages.push({ role: 'user', content: userQuestion });

    return messages;
  }

  /**
   * 清理上下文（Token管控）
   */
  truncateContext(messages, maxLength = CONFIG.token.maxContextLength) {
    // 简单实现，实际应该计算token数
    // 这里简单保留最近的消息
    if (messages.length > 20) {
      return messages.slice(-20);
    }
    return messages;
  }
}

// 导出单例
module.exports = new LLMService();
