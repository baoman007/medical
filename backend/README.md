# 智慧医疗AI助手 - 后端API服务

## 概述

后端服务提供完整的RESTful API，支持AI问诊、预约挂号、报告解读、医生复核等功能。

## 技术栈

- **Node.js** - 运行时环境
- **Express.js** - Web框架
- **MySQL2** - 数据库驱动
- **Axios** - HTTP客户端（调用Ollama）
- **Winston** - 日志管理
- **JWT** - 身份验证（预留）
- **Multer** - 文件上传（预留）

## 项目结构

```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # 数据库配置
│   ├── services/
│   │   ├── ollama.js        # Ollama模型服务
│   │   ├── aiService.js     # AI业务逻辑
│   │   └── appointmentService.js  # 预约业务逻辑
│   ├── utils/
│   │   └── logger.js        # 日志工具
│   ├── routes/
│   │   └── api.js           # API路由
│   └── server.js            # 服务器入口
├── logs/                    # 日志目录（自动创建）
├── uploads/                 # 上传文件目录（自动创建）
├── .env                     # 环境变量
├── .env.example             # 环境变量示例
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

修改 `.env` 文件中的数据库密码等配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medical_ai
```

### 3. 创建数据库

确保MySQL服务已启动，然后执行数据库脚本：

```bash
cd ..
mysql -u root -p < database/schema.sql
```

### 4. 初始化医生排班（可选）

首次启动后，可以使用API或脚本初始化医生排班：

```bash
# 使用node脚本（待实现）
node scripts/initSchedule.js
```

### 5. 启动服务

**开发模式（自动重启）:**
```bash
npm run dev
```

**生产模式:**
```bash
npm start
```

服务将在 `http://localhost:8080` 启动

## API接口文档

### 基础信息

- **Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`

### AI对话接口

#### 1. AI智能问诊

```
POST /api/ai/chat
```

**请求体:**
```json
{
  "userId": 1,
  "message": "我最近总是头疼，应该怎么办？",
  "conversationId": null  // 可选，继续已有对话
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "answer": "【症状分析】\n...",
    "department": "神经内科",
    "urgency": "视情况",
    "conversationId": 1,
    "isEmergency": false
  }
}
```

#### 2. 获取对话列表

```
GET /api/ai/conversations?userId=1&limit=10
```

#### 3. 获取对话详情

```
GET /api/ai/conversations/1?userId=1
```

#### 4. 分析检查报告

```
POST /api/ai/report/analyze
```

**请求体:**
```json
{
  "userId": 1,
  "reportData": {
    "type": "血常规",
    "ocr": {}
  }
}
```

### 预约挂号接口

#### 1. 获取医院列表

```
GET /api/appointments/hospitals
```

#### 2. 获取科室列表

```
GET /api/appointments/departments?hospitalId=1
```

#### 3. 获取医生列表

```
GET /api/appointments/doctors?hospitalId=1&departmentId=6
```

#### 4. 获取医生排班

```
GET /api/appointments/schedule?doctorId=1&startDate=2026-03-24&endDate=2026-03-30
```

#### 5. 创建预约

```
POST /api/appointments
```

**请求体:**
```json
{
  "userId": 1,
  "hospitalId": 1,
  "departmentId": 6,
  "doctorId": 1,
  "scheduleId": 100,
  "patientName": "张三",
  "patientPhone": "13800138000",
  "patientIdCard": "",
  "appointmentDate": "2026-03-25",
  "appointmentTime": "09:00-09:30",
  "symptoms": "头痛持续3天"
}
```

#### 6. 获取用户预约列表

```
GET /api/appointments/user?userId=1&status=pending
```

#### 7. 取消预约

```
DELETE /api/appointments/1?userId=1
```

### 医生复核接口

#### 1. 获取待复核任务

```
GET /api/review/tasks?doctorId=1&status=pending
```

#### 2. 提交复核结果

```
POST /api/review/submit
```

**请求体:**
```json
{
  "taskId": 1,
  "doctorId": 1,
  "action": "approve",
  "comment": "AI分析准确，同意该建议"
}
```

### 健康检查接口

```
GET /api/health
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 8080 |
| HOST | 服务地址 | localhost |
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 3306 |
| DB_USER | 数据库用户 | root |
| DB_PASSWORD | 数据库密码 | - |
| DB_NAME | 数据库名称 | medical_ai |
| DB_CONNECTION_LIMIT | 连接池大小 | 10 |
| JWT_SECRET | JWT密钥 | - |
| JWT_EXPIRES_IN | JWT过期时间 | 24h |
| OLLAMA_BASE_URL | Ollama服务地址 | http://localhost:11434 |
| OLLAMA_MODEL | 主模型 | medical-v1 |
| OLLAMA_FALLBACK_MODEL | 备用模型 | qwen2.5 |
| MAX_FILE_SIZE | 最大文件大小 | 10485760 (10MB) |
| LOG_LEVEL | 日志级别 | info |

## 数据库操作

### 数据库连接配置

数据库连接池在 `src/config/database.js` 中配置：

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10
});
```

### 查询封装

提供了便捷的查询方法：

```javascript
const { query, insert, update, remove, transaction } = require('./config/database');

// 查询
const rows = await query('SELECT * FROM users WHERE user_id = ?', [userId]);

// 插入
const insertId = await insert('INSERT INTO users (...) VALUES (...)', params);

// 更新
const affectedRows = await update('UPDATE users SET ... WHERE user_id = ?', params);

// 删除
const affectedRows = await remove('DELETE FROM users WHERE user_id = ?', [userId]);

// 事务
await transaction(async (connection) => {
  // 多个操作
  await connection.query(...);
  await connection.query(...);
});
```

## 日志管理

日志文件存储在 `logs/` 目录：
- `combined.log` - 所有日志
- `error.log` - 错误日志

日志级别：`error`, `warn`, `info`, `debug`

## 测试

### 使用curl测试

```bash
# 健康检查
curl http://localhost:8080/api/health

# AI问诊
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"message":"我头疼，应该怎么办？"}'

# 获取医院列表
curl http://localhost:8080/api/appointments/hospitals
```

### 使用Postman测试

1. 导入API文档（待生成）
2. 设置环境变量
3. 发送请求测试

## 部署

### 使用PM2部署

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start src/server.js --name medical-ai-backend

# 查看状态
pm2 status

# 查看日志
pm2 logs medical-ai-backend

# 重启服务
pm2 restart medical-ai-backend

# 停止服务
pm2 stop medical-ai-backend
```

### 使用Docker部署（待实现）

```bash
# 构建镜像
docker build -t medical-ai-backend .

# 运行容器
docker run -d -p 8080:8080 --name medical-backend medical-ai-backend
```

## 故障排查

### 问题1: 数据库连接失败

**检查:**
```bash
# 检查MySQL服务是否运行
mysql -u root -p

# 检查.env配置
cat .env | grep DB_
```

**解决:**
- 确保MySQL服务运行
- 检查数据库密码是否正确
- 确认数据库已创建

### 问题2: Ollama连接失败

**检查:**
```bash
# 检查Ollama服务
curl http://localhost:11434/api/tags
```

**解决:**
- 确保Ollama服务运行
- 检查模型是否已下载
- 确认防火墙设置

### 问题3: 端口已被占用

**检查:**
```bash
lsof -ti:8080
```

**解决:**
```bash
# 杀掉占用端口的进程
lsof -ti:8080 | xargs kill -9

# 或修改.env中的PORT配置
```

## 开发指南

### 添加新的API接口

1. 在 `src/routes/api.js` 中添加路由
2. 在对应的 `src/services/` 中实现业务逻辑
3. 更新API文档

### 添加新的数据库表

1. 在 `database/schema.sql` 中添加表结构
2. 在 `src/services/` 中添加相关查询方法

## 安全建议

1. **生产环境必须修改:**
   - JWT_SECRET
   - DB_PASSWORD
   - 增加HTTPS支持

2. **启用身份验证:**
   - 实现JWT中间件
   - 保护敏感接口

3. **启用数据加密:**
   - 敏感字段加密存储
   - 使用HTTPS传输

4. **定期更新依赖:**
   ```bash
   npm audit
   npm update
   ```

## 许可证

MIT
