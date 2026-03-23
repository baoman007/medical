const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const appointmentService = require('../services/appointmentService');
const logger = require('../utils/logger');

// ========================================
// AI对话接口
// ========================================

/**
 * POST /api/ai/chat
 * AI智能问诊
 */
router.post('/ai/chat', async (req, res) => {
  try {
    const { userId, message, conversationId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const result = await aiService.processAIChat(userId, message, conversationId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('AI对话接口错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/conversations
 * 获取用户对话列表
 */
router.get('/ai/conversations', async (req, res) => {
  try {
    const { userId } = req.query;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少userId参数'
      });
    }

    const conversations = await aiService.getUserConversations(userId, limit, offset);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error('获取对话列表错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * GET /api/ai/conversations/:conversationId
 * 获取对话详情
 */
router.get('/ai/conversations/:conversationId', async (req, res) => {
  try {
    const { userId } = req.query;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少userId参数'
      });
    }

    const conversation = await aiService.getConversationDetails(conversationId, userId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: '对话不存在'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error('获取对话详情错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * POST /api/ai/report/analyze
 * 分析检查报告
 */
router.post('/ai/report/analyze', async (req, res) => {
  try {
    const { userId, reportData } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少userId参数'
      });
    }

    const result = await aiService.analyzeReport(userId, reportData || {});

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('报告分析错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// ========================================
// 预约挂号接口
// ========================================

/**
 * GET /api/appointments/hospitals
 * 获取医院列表
 */
router.get('/appointments/hospitals', async (req, res) => {
  try {
    const hospitals = await appointmentService.getHospitals();

    res.json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    logger.error('获取医院列表错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * GET /api/appointments/departments
 * 获取科室列表
 */
router.get('/appointments/departments', async (req, res) => {
  try {
    const { hospitalId } = req.query;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: '缺少hospitalId参数'
      });
    }

    const departments = await appointmentService.getDepartments(hospitalId);

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    logger.error('获取科室列表错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * GET /api/appointments/doctors
 * 获取医生列表
 */
router.get('/appointments/doctors', async (req, res) => {
  try {
    const { hospitalId, departmentId } = req.query;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: '缺少hospitalId参数'
      });
    }

    const doctors = await appointmentService.getDoctors(hospitalId, departmentId);

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    logger.error('获取医生列表错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * GET /api/appointments/schedule
 * 获取医生排班
 */
router.get('/appointments/schedule', async (req, res) => {
  try {
    const { doctorId } = req.query;
    const startDate = req.query.startDate || new Date().toISOString().split('T')[0];
    const endDate = req.query.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: '缺少doctorId参数'
      });
    }

    const schedules = await appointmentService.getDoctorSchedule(doctorId, startDate, endDate);

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    logger.error('获取医生排班错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * POST /api/appointments
 * 创建预约
 */
router.post('/appointments', async (req, res) => {
  try {
    const appointmentData = req.body;

    const requiredFields = ['userId', 'hospitalId', 'departmentId', 'doctorId', 'scheduleId',
                            'patientName', 'patientPhone', 'appointmentDate', 'appointmentTime'];

    const missingFields = requiredFields.filter(field => !appointmentData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `缺少必要参数: ${missingFields.join(', ')}`
      });
    }

    const result = await appointmentService.createAppointment(appointmentData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('创建预约错误', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

/**
 * GET /api/appointments/user
 * 获取用户预约列表
 */
router.get('/appointments/user', async (req, res) => {
  try {
    const { userId, status } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少userId参数'
      });
    }

    const appointments = await appointmentService.getUserAppointments(userId, status, limit);

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    logger.error('获取用户预约列表错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * DELETE /api/appointments/:appointmentId
 * 取消预约
 */
router.delete('/appointments/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少userId参数'
      });
    }

    const result = await appointmentService.cancelAppointment(appointmentId, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('取消预约错误', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// ========================================
// 医生复核接口
// ========================================

/**
 * GET /api/review/tasks
 * 获取待复核任务列表
 */
router.get('/review/tasks', async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: '缺少doctorId参数'
      });
    }

    const tasks = await aiService.getReviewTasks(doctorId, status);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    logger.error('获取复核任务错误', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * POST /api/review/submit
 * 提交复核结果
 */
router.post('/review/submit', async (req, res) => {
  try {
    const { taskId, doctorId, action, comment } = req.body;

    if (!taskId || !doctorId || !action) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action参数错误'
      });
    }

    const result = await aiService.submitReview(taskId, doctorId, action, comment);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('提交复核错误', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

// ========================================
// 健康检查接口
// ========================================

/**
 * GET /api/health
 * 健康检查
 */
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: '服务正常',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
