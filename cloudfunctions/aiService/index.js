/**
 * aiService
 */

const cloud = require('wx-server-sdk');
const LLMService = require('./services/llm-service');
const logger = require('./services/logger');
const CONFIG = require('./config/model-config');
const CHAT_PROMPT = require('./prompts/chat-prompt');
const RECOMMEND_PROMPT = require('./prompts/recommend-prompt');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 数据库
const db = cloud.database();

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

exports.recommend = async (event, context) => {
  const { scene = 'active', userHistory = [], userId = 'anonymous' } = event;

  logger.info('收到推荐请求', {
    userId,
    scene,
    historyLength: userHistory.length
  });

  const scenePrompt = RECOMMEND_PROMPT.scenes[scene];
  if (!scenePrompt) {
    return {
      success: false,
      error: `无效的推荐场景: ${scene}`
    };
  }

  try {
    const systemPrompt = RECOMMEND_PROMPT.systemPrompt + '\n\n' + scenePrompt;
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userHistory) }
    ];

    const result = await LLMService.chat(messages);

    if (!result.success) {
      logger.error('推荐调用失败', { error: result.error });
      return {
        success: false,
        error: '推荐服务暂时不可用'
      };
    }

    return {
      success: true,
      data: result.data,
      fields: RECOMMEND_PROMPT.fields
    };
  } catch (error) {
    logger.error('推荐服务异常', { error: error.message });
    return {
      success: false,
      error: '推荐服务暂时不可用'
    };
  }
};
