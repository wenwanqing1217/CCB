/**
 * AI智能助手云函数
 *
 * 功能：
 * 1. 统一对接豆包大模型
 * 2. 支持多轮对话
 * 3. Token管控（上下文长度限制）
 * 4. 调用日志记录
 * 5. 异常容错处理
 *
 * 配置：
 * - 豆包API密钥放在环境变量中
 * - Prompt统一管理在prompts/目录
 */

const cloud = require('wx-server-sdk');
const LLMService = require('./services/llm-service');
const logger = require('./services/logger');
const CONFIG = require('./config/model-config');
const CHAT_PROMPT = require('./prompts/chat-prompt');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 数据库
const db = cloud.database();

/**
 * 云函数入口
 */
exports.main = async (event, context) => {
  const { question, history = [], userId = 'anonymous' } = event;

  logger.info('收到AI请求', {
    userId,
    questionLength: question?.length || 0,
    historyLength: history?.length || 0
  });

  // 参数校验
  if (!question || typeof question !== 'string') {
    return {
      success: false,
      error: '问题不能为空'
    };
  }

  try {
    // 构建消息格式
    const messages = LLMService.buildMessages(
      CHAT_PROMPT.systemPrompt,
      history,
      question
    );

    // 调用大模型
    const result = await LLMService.chat(messages);

    if (!result.success) {
      logger.error('AI调用失败', { error: result.error });
      return {
        success: false,
        error: CHAT_PROMPT.fallbacks.error
      };
    }

    // 记录对话日志
    await logUserInteraction(userId, question, result.data);

    return {
      success: true,
      data: result.data,
      suggestions: CHAT_PROMPT.suggestions
    };
  } catch (error) {
    logger.error('AI服务异常', { error: error.message });
    return {
      success: false,
      error: CHAT_PROMPT.fallbacks.error
    };
  }
};

/**
 * 记录用户交互日志
 */
async function logUserInteraction(userId, question, answer) {
  try {
    await db.collection('ai_chat_logs').add({
      data: {
        userId,
        question,
        answer,
        timestamp: db.serverDate(),
        model: CONFIG.model.model
      }
    });
  } catch (error) {
    logger.error('记录对话日志失败', { error: error.message });
  }
}
