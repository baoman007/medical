const axios = require('axios');
const logger = require('../utils/logger');

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

/**
 * 调用DeepSeek API进行对话
 */
async function chatWithDeepSeek(messages, options = {}) {
  try {
    logger.info(`调用DeepSeek模型: ${DEEPSEEK_MODEL}`);

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: DEEPSEEK_MODEL,
        messages: messages.map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : msg.role,
          content: msg.content
        })),
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
        max_tokens: options.max_tokens || 2000,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 60000 // 60秒超时
      }
    );

    logger.info(`DeepSeek模型响应成功`);

    return {
      success: true,
      content: response.data.choices[0].message.content,
      model: DEEPSEEK_MODEL
    };
  } catch (error) {
    if (error.response) {
      logger.error(`DeepSeek API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      throw new Error(`DeepSeek API调用失败 (${error.response.status}): ${error.response.data?.error?.message || error.message}`);
    } else if (error.request) {
      logger.error(`DeepSeek API无响应: ${error.message}`);
      throw new Error(`DeepSeek API无响应，请检查网络连接`);
    } else {
      logger.error(`DeepSeek调用失败: ${error.message}`);
      throw new Error(`DeepSeek调用失败: ${error.message}`);
    }
  }
}

/**
 * 生成医疗对话的系统提示词
 */
function getMedicalSystemPrompt() {
  return `你是一位专业的智慧医疗AI助手。请遵循以下原则：

1. 【重要声明】所有建议均为AI辅助，不构成医疗诊断，不能替代专业医生

2. 可以做的事：
   - 智能导诊与分诊建议
   - 健康咨询与症状科普
   - 用药提醒与注意事项
   - 检查报告解读（辅助，不诊断）
   - 慢病管理建议

3. 绝对不能做的事：
   - 不下诊断结论
   - 不开处方
   - 不替代医生
   - 不做治疗方案推荐
   - 不处理急症（如胸痛、呼吸困难、大出血等，需立即提示就医）

4. 回答格式：
   先给出科普性解释，然后说明可能的相关科室，最后给出就诊建议。

5. 紧急情况识别：
   - 胸痛、心悸、晕厥、昏迷、大出血、严重呼吸困难、剧烈头痛、抽搐等
   - 必须立即提示拨打120或前往急诊

请以专业、友好、谨慎的态度回答用户问题。`;
}

/**
 * 分析用户症状并生成结构化建议
 */
async function analyzeSymptom(userInput) {
  const systemPrompt = getMedicalSystemPrompt();

  const messages = [
    {
      role: 'system',
      content: systemPrompt + '\n\n请分析用户症状，并按以下格式返回：\n\n【症状分析】\n...\n\n【可能原因】\n...\n\n【推荐科室】\n...\n\n【紧急程度】（一般/较紧急/紧急/视情况）\n...\n\n【就诊建议】\n...\n\n【温馨提示】\n本回复仅供参考，不构成医疗建议。请以医生诊断为准。'
    },
    {
      role: 'user',
      content: userInput
    }
  ];

  try {
    const result = await chatWithDeepSeek(messages, { temperature: 0.6 });
    return parseMedicalResponse(result.content);
  } catch (error) {
    logger.error('症状分析失败:', error);
    return {
      answer: '抱歉，系统暂时无法处理您的请求。如需帮助，请咨询专业医生。',
      department: '待定',
      urgency: '视情况'
    };
  }
}

/**
 * 解析模型返回的医疗回复
 */
function parseMedicalResponse(content) {
  const answer = content;

  // 提取科室信息
  let department = '待定';
  const deptMatch = content.match(/【推荐科室】\s*([^\n]+)/);
  if (deptMatch) {
    department = deptMatch[1].trim();
  }

  // 提取紧急程度
  let urgency = '视情况';
  const urgencyMatch = content.match(/【紧急程度】\s*\(?([^\)\n]+)/);
  if (urgencyMatch) {
    urgency = urgencyMatch[1].trim();
  }

  return {
    answer,
    department,
    urgency
  };
}

/**
 * 检查是否为紧急情况
 */
function checkEmergency(userInput) {
  const emergencyKeywords = [
    '胸痛', '心悸', '晕厥', '昏迷', '大出血',
    '严重呼吸困难', '剧烈头痛', '抽搐', '休克',
    '心跳骤停', '意识不清', '大吐血'
  ];

  const lowerInput = userInput.toLowerCase();
  return emergencyKeywords.some(keyword => lowerInput.includes(keyword));
}

/**
 * 检查DeepSeek API是否可用
 */
async function checkDeepSeekHealth() {
  try {
    const response = await axios.get(
      'https://api.deepseek.com/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 10000
      }
    );

    return {
      success: true,
      models: response.data?.data || []
    };
  } catch (error) {
    logger.error('DeepSeek健康检查失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  chatWithDeepSeek,
  analyzeSymptom,
  checkEmergency,
  checkDeepSeekHealth,
  getMedicalSystemPrompt
};
