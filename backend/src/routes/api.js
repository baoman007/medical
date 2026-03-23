const express = require('express');
const router = express.Router();
const multer = require('multer');
const logger = require('../utils/logger');
const { checkDeepSeekHealth, chatWithDeepSeek } = require('../services/deepseek');
const { chatWithOpenAI } = require('../services/openai');
const path = require('path');

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只支持图片文件格式'));
  }
});

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

// 报告分析
router.post('/report/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传报告图片'
      });
    }

    logger.info('收到报告分析请求，文件名:', req.file.originalname);

    // 使用Tesseract OCR提取文字
    const Tesseract = require('tesseract.js');

    logger.info('开始OCR识别...');
    const { data: { text } } = await Tesseract.recognize(
      req.file.buffer,
      'chi_sim+eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            logger.info(`OCR进度: ${(m.progress * 100).toFixed(0)}%`);
          }
        }
      }
    );

    logger.info('OCR识别完成，提取文字长度:', text.length);
    logger.info('提取的文字预览:', text.substring(0, 200));

    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: '无法从图片中提取文字，请确保图片清晰'
      });
    }

    // 构建分析提示
    const prompt = `你是一位专业的医疗报告分析助手。请分析以下医疗检查报告的文字内容：

${text}

请提取以下信息并以JSON格式返回：
1. 报告类型（如：血常规、生化检查、影像报告等）
2. 检查指标列表（至少5项，如果有多项），每项包括：
   - 项目名称
   - 检测结果
   - 参考范围
   - 状态（正常/偏高/偏低/异常，根据结果和参考范围判断）
3. 综合评估总结
4. 健康建议（至少4条）

请严格按照以下JSON格式返回，不要添加其他文字说明：
{
  "reportType": "报告类型",
  "items": [
    {
      "name": "项目名称",
      "value": "检测结果",
      "reference": "参考范围",
      "status": "状态"
    }
  ],
  "summary": "综合评估总结",
  "suggestions": ["建议1", "建议2", "建议3", "建议4"]
}`;

    // 使用DeepSeek API分析文字内容
    const analysis = await chatWithDeepSeek([
      {
        role: 'user',
        content: prompt
      }
    ]);

    logger.info('报告分析完成');

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    logger.error('报告分析失败:', error);
    res.status(500).json({
      success: false,
      message: '报告分析失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
