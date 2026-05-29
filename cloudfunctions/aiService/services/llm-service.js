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
        top_p: this.config.topP
      };

      logger.info('LLM请求开始', {
        model: this.config.model,
        messageCount: messages.length
      });

      // 发起请求
      const response = await this.makeRequest(requestBody);

      // 解析响应
      const result = this.parseResponse(response);

      const costTime = Date.now() - startTime;
      logger.info('LLM请求成功', {
        costTime,
        responseLength: result.length
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      const costTime = Date.now() - startTime;
      logger.error('LLM请求失败', {
        error: error.message,
        costTime
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 发起HTTP请求
   */
  async makeRequest(body) {
    const SECRET_KEY = process.env.DOUBAO_API_KEY;

    if (!SECRET_KEY) {
      logger.warn('DOUBAO_API_KEY 未配置，使用模拟模式');
      return this.getMockResponse(body);
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * 模拟响应（开发测试用）
   */
  getMockResponse(body) {
    const lastMessage = body.messages[body.messages.length - 1]?.content || '';
    let mockContent = '这是模拟回复，当前在开发测试模式。\n\n';

    if (lastMessage.includes('coldStart')) {
      mockContent += '推荐热门盲盒：\n1. 惊喜福袋 - ¥99\n2. 限定款盲盒 - ¥199';
    } else if (lastMessage.includes('reEngage') || lastMessage.includes('召回')) {
      mockContent += '我们注意到你很久没来了！\n🛍️ 平台正在做促销活动，欢迎回来看看~';
    } else if (lastMessage.includes('盲盒') || lastMessage.includes('配送')) {
      mockContent += '盲盒下单后一般1-3个工作日送达，校园内由骑手配送~';
    } else {
      mockContent += `你刚才问的是：${lastMessage.slice(0, 50)}...\n我目前是模拟回复模式，正式使用请配置 DOUBAO_API_KEY。`;
    }

    return {
      id: 'mock-' + Date.now(),
      choices: [{
        message: {
          role: 'assistant',
          content: mockContent
        }
      }]
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
      { role: 'system', content: systemPrompt }
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
