const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { checkDeepSeekHealth } = require('../services/deepseek');

// 健康检查
router.get('/health', async (req, res) => {
  try {
    const db = require('../config/database');
    const dbHealth = true; // 数据库已在server.js中初始化

    // 检查DeepSeek API
    const deepseekHealth = await checkDeepSeekHealth();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'connected' : 'disconnected',
        deepseek: deepseekHealth.success ? 'connected' : 'disconnected',
        deepseekModels: deepseekHealth.success ? deepseekHealth.models : []
      }
    });
  } catch (error) {
    logger.error('健康检查失败:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// AI对话
router.post('/ai/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const aiService = require('../services/aiService');
    const result = await aiService.processAIChat(userId, message);

    res.json(result);
  } catch (error) {
    logger.error('AI对话处理失败:', error);
    res.status(500).json({
      success: false,
      message: '处理失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取对话列表
router.get('/ai/conversations', async (req, res) => {
  try {
    const userId = req.query.userId || 1; // 临时用户ID
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const aiService = require('../services/aiService');
    const conversations = await aiService.getUserConversations(userId, limit, offset);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error('获取对话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 获取对话详情
router.get('/ai/conversations/:id', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const conversationId = req.params.id;

    const aiService = require('../services/aiService');
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
    logger.error('获取对话详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 获取医院列表
router.get('/appointments/hospitals', async (req, res) => {
  try {
    const appointmentService = require('../services/appointmentService');
    const hospitals = await appointmentService.getHospitals();

    res.json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    logger.error('获取医院列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 获取科室列表
router.get('/appointments/departments', async (req, res) => {
  try {
    const hospitalId = req.query.hospitalId;

    const appointmentService = require('../services/appointmentService');
    const departments = await appointmentService.getDepartments(hospitalId);

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    logger.error('获取科室列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 获取医生列表
router.get('/appointments/doctors', async (req, res) => {
  try {
    const departmentId = req.query.departmentId;
    const hospitalId = req.query.hospitalId;

    const appointmentService = require('../services/appointmentService');
    const doctors = await appointmentService.getDoctors(departmentId, hospitalId);

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    logger.error('获取医生列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 获取医生排班
router.get('/appointments/schedule', async (req, res) => {
  try {
    const doctorId = req.query.doctorId;

    const appointmentService = require('../services/appointmentService');
    const schedule = await appointmentService.getDoctorSchedule(doctorId);

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    logger.error('获取医生排班失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 创建预约
router.post('/appointments', async (req, res) => {
  try {
    const { userId, hospitalId, departmentId, doctorId, appointmentDate, appointmentTime, symptoms } = req.body;

    if (!userId || !hospitalId || !departmentId || !doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const appointmentService = require('../services/appointmentService');
    const result = await appointmentService.createAppointment({
      userId,
      hospitalId,
      departmentId,
      doctorId,
      appointmentDate,
      appointmentTime,
      symptoms
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('创建预约失败:', error);
    res.status(500).json({
      success: false,
      message: '预约失败，请稍后重试'
    });
  }
});

// 获取用户预约
router.get('/appointments/user', async (req, res) => {
  try {
    const userId = req.query.userId || 1;

    const appointmentService = require('../services/appointmentService');
    const appointments = await appointmentService.getUserAppointments(userId);

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    logger.error('获取用户预约失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 取消预约
router.delete('/appointments/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.query.userId || 1;

    const appointmentService = require('../services/appointmentService');
    const result = await appointmentService.cancelAppointment(appointmentId, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('取消预约失败:', error);
    res.status(500).json({
      success: false,
      message: '取消失败'
    });
  }
});

// 获取待复核任务
router.get('/review/tasks', async (req, res) => {
  try {
    const doctorId = req.query.doctorId || 1;
    const status = req.query.status || 'pending';

    const aiService = require('../services/aiService');
    const tasks = await aiService.getReviewTasks(doctorId, status);

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    logger.error('获取复核任务失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 提交复核结果
router.post('/review/submit', async (req, res) => {
  try {
    const { taskId, doctorId, action, comment } = req.body;

    if (!taskId || !doctorId || !action) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const aiService = require('../services/aiService');
    const result = await aiService.submitReview(taskId, doctorId, action, comment);

    res.json(result);
  } catch (error) {
    logger.error('提交复核失败:', error);
    res.status(500).json({
      success: false,
      message: '提交失败'
    });
  }
});

module.exports = router;
