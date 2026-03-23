require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');
const { getPoolStatus } = require('./config/database');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 最多100次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// API路由
app.use('/api', apiRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: '智慧医疗AI助手 - 后端API服务',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  logger.error('服务器错误:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 启动服务器
app.listen(PORT, HOST, () => {
  logger.info(`🚀 服务器启动成功`);
  logger.info(`📍 地址: http://${HOST}:${PORT}`);
  logger.info(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);

  // 打印数据库连接状态
  const poolStatus = getPoolStatus();
  logger.info(`📊 数据库连接池: ${JSON.stringify(poolStatus)}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，准备关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，准备关闭服务器...');
  process.exit(0);
});

module.exports = app;
