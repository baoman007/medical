const { query, insert, update } = require('../config/database');
const { analyzeSymptom, checkEmergency } = require('./ollama');
const logger = require('../utils/logger');

/**
 * 创建AI对话
 */
async function createConversation(userId, type, title) {
  const conversationId = await insert(
    `INSERT INTO ai_conversations (user_id, conversation_type, title, is_emergency)
     VALUES (?, ?, ?, ?)`,
    [userId, type, title, false]
  );

  return conversationId;
}

/**
 * 添加AI消息
 */
async function addAIMessage(conversationId, role, content, metadata = {}) {
  const messageId = await insert(
    `INSERT INTO ai_messages (conversation_id, role, content, model_used, tokens_used,
     department_recommended, urgency_level, requires_review, review_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      conversationId,
      role,
      content,
      metadata.model || null,
      metadata.tokens || null,
      metadata.department || null,
      metadata.urgency || null,
      metadata.requiresReview || false,
      'pending'
    ]
  );

  return messageId;
}

/**
 * 处理用户输入并返回AI回复
 */
async function processAIChat(userId, userInput, conversationId = null) {
  try {
    // 检查紧急情况
    if (checkEmergency(userInput)) {
      logger.info('检测到紧急情况', { userId });

      // 如果没有对话ID，创建新对话
      if (!conversationId) {
        conversationId = await createConversation(userId, 'consultation', '紧急咨询');
      }

      // 添加用户消息
      await addAIMessage(conversationId, 'user', userInput);

      // 返回紧急响应
      const emergencyResponse = {
        answer: `⚠️ 【紧急提醒】\n\n您描述的症状需要立即医疗关注！\n\n建议措施：\n1. 立即拨打 120 急救电话\n2. 或尽快前往最近医院急诊科\n3. 保持镇静，如有人在场请告知\n4. 如有可能，记录症状开始时间\n\n请不要依赖本AI系统，立即寻求专业医疗帮助！`,
        department: '急诊科',
        urgency: '紧急',
        isEmergency: true,
        conversationId
      };

      // 添加AI消息
      await addAIMessage(conversationId, 'assistant', emergencyResponse.answer, {
        department: '急诊科',
        urgency: '紧急',
        model: 'emergency_rule'
      });

      return emergencyResponse;
    }

    // 调用AI模型分析
    const aiResult = await analyzeSymptom(userInput);
    logger.info('AI分析完成', { userId, department: aiResult.department });

    // 如果没有对话ID，创建新对话
    if (!conversationId) {
      conversationId = await createConversation(userId, 'consultation', userInput.substring(0, 50));
    }

    // 添加用户消息
    await addAIMessage(conversationId, 'user', userInput);

    // 添加AI消息
    await addAIMessage(conversationId, 'assistant', aiResult.answer, {
      department: aiResult.department,
      urgency: aiResult.urgency,
      model: 'ollama',
      requiresReview: false // 根据需要可以设置为true
    });

    return {
      ...aiResult,
      conversationId,
      isEmergency: false
    };
  } catch (error) {
    logger.error('AI对话处理失败', { userId, error: error.message });
    throw error;
  }
}

/**
 * 获取用户对话历史
 */
async function getUserConversations(userId, limit = 10, offset = 0) {
  const conversations = await query(
    `SELECT * FROM ai_conversations
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return conversations;
}

/**
 * 获取对话详情（包含消息）
 */
async function getConversationDetails(conversationId, userId) {
  const conversations = await query(
    `SELECT * FROM ai_conversations
     WHERE conversation_id = ? AND user_id = ?`,
    [conversationId, userId]
  );

  if (conversations.length === 0) {
    return null;
  }

  const messages = await query(
    `SELECT * FROM ai_messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC`,
    [conversationId]
  );

  return {
    ...conversations[0],
    messages
  };
}

/**
 * 分析检查报告（预留接口）
 */
async function analyzeReport(userId, reportData) {
  try {
    // 这里可以调用OCR和AI分析
    // 暂时返回模拟数据
    logger.info('报告分析请求', { userId });

    const reportId = await insert(
      `INSERT INTO medical_reports (user_id, report_type, ocr_result, ai_analysis, ai_summary)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        reportData.type || '未知',
        JSON.stringify(reportData.ocr || {}),
        JSON.stringify({ indicators: [] }),
        'AI分析总结（待实现）'
      ]
    );

    return {
      success: true,
      reportId,
      message: '报告分析完成'
    };
  } catch (error) {
    logger.error('报告分析失败', { userId, error: error.message });
    throw error;
  }
}

/**
 * 获取待复核任务列表（医生端）
 */
async function getReviewTasks(doctorId, status = 'pending', limit = 20) {
  const tasks = await query(
    `SELECT rt.*, u.real_name as patient_name, ac.title as conversation_title
     FROM review_tasks rt
     LEFT JOIN users u ON rt.user_id = u.user_id
     LEFT JOIN ai_conversations ac ON rt.related_id = ac.conversation_id
     WHERE rt.assigned_to = ? AND rt.status = ?
     ORDER BY rt.created_at DESC
     LIMIT ?`,
    [doctorId, status, limit]
  );

  return tasks;
}

/**
 * 提交复核结果
 */
async function submitReview(taskId, doctorId, action, comment) {
  const status = action === 'approve' ? 'approved' : 'rejected';

  const result = await update(
    `UPDATE review_tasks
     SET status = ?, reviewer_comment = ?, reviewed_at = NOW()
     WHERE task_id = ? AND assigned_to = ?`,
    [status, comment, taskId, doctorId]
  );

  if (result === 0) {
    throw new Error('任务不存在或无权限操作');
  }

  return { success: true, status };
}

module.exports = {
  createConversation,
  addAIMessage,
  processAIChat,
  getUserConversations,
  getConversationDetails,
  analyzeReport,
  getReviewTasks,
  submitReview
};
