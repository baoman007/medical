# 数据库设计说明

## 概述

本数据库设计为智慧医疗AI助手提供完整的数据存储解决方案，采用MySQL作为主数据库，支持用户管理、预约挂号、AI问诊、报告解读、医生复核、慢病管理等核心功能。

## 数据库模块

### 1. 用户管理模块
- `users` - 用户表
- `user_health_profiles` - 用户健康档案

### 2. 医疗机构与科室模块
- `hospitals` - 医院表
- `departments` - 科室表（支持父子科室）
- `doctors` - 医生表
- `doctor_schedules` - 医生排班表

### 3. 预约挂号模块
- `appointments` - 预约订单表

### 4. AI问诊模块
- `ai_conversations` - AI对话记录表
- `ai_messages` - AI消息表

### 5. 报告解读模块
- `medical_reports` - 检查报告表
- `report_indicators` - 报告指标详情表

### 6. 医生复核模块
- `review_tasks` - 复核任务表

### 7. 慢病管理模块
- `chronic_diseases` - 慢病档案表
- `health_records` - 健康监测记录表

### 8. 用药提醒模块
- `medication_plans` - 用药计划表
- `medication_reminders` - 用药提醒记录表

### 9. 系统管理模块
- `system_configs` - 系统配置表
- `operation_logs` - 操作日志表

## 快速开始

### 1. 创建数据库

```bash
# 连接到MySQL
mysql -u root -p

# 执行SQL脚本
mysql -u root -p < database/schema.sql
```

或使用MySQL客户端工具导入 `database/schema.sql` 文件。

### 2. 验证数据库

```sql
USE medical_ai;

SHOW TABLES;

-- 查看表结构
DESCRIBE users;
DESCRIBE appointments;
```

### 3. 查看初始数据

```sql
-- 查看医院数据
SELECT * FROM hospitals;

-- 查看科室数据
SELECT * FROM departments WHERE parent_id IS NULL;

-- 查看医生数据
SELECT * FROM doctors;

-- 查看系统配置
SELECT * FROM system_configs;
```

## 数据库设计特点

### 1. 规范化设计
- 遵循第三范式（3NF）
- 合理的表结构分离
- 清晰的外键关系

### 2. 索引优化
- 关键字段建立索引
- 支持高效查询
- 避免全表扫描

### 3. 数据完整性
- 使用外键约束
- 枚举类型限制取值范围
- NOT NULL约束必填字段

### 4. 扩展性
- JSON字段存储灵活数据
- 预留扩展字段
- 支持多医院、多科室架构

### 5. 安全性
- 密码哈希存储
- 敏感信息加密标识
- 操作日志审计

## 核心表说明

### users（用户表）
主表，存储用户基本信息。
- 支持手机号、邮箱登录
- 支持实名认证
- 记录用户状态和登录信息

### user_health_profiles（用户健康档案）
扩展表，存储用户健康信息。
- 身高、体重、血型等基础信息
- 过敏史、慢性病史（JSON格式）
- 血压、心率等健康指标

### doctors（医生表）
存储医生信息。
- 支持职称分类
- 专长领域描述
- 评分系统

### appointments（预约订单表）
核心业务表。
- 完整的预约流程状态
- 支持支付状态管理
- 记录诊断结果和处方

### ai_conversations / ai_messages（AI对话表）
存储AI对话历史。
- 支持多种对话类型
- 记录使用的模型和token消耗
- 支持医生复核流程

### medical_reports（检查报告表）
存储检查报告和AI解读。
- 支持文件上传
- OCR结果存储
- AI分析和医生审核

### review_tasks（复核任务表）
医生复核工作流。
- 任务优先级管理
- 分配给指定医生
- 审核状态跟踪

## 视图说明

### v_appointment_details（预约详情视图）
关联用户、医院、科室、医生信息，提供完整的预约详情。

### v_doctor_schedule_details（医生排班详情视图）
关联医生、科室信息，提供排班详情。

## 性能优化建议

### 1. 分区表
对于历史数据，可以按时间分区：
- `appointments` 按月分区
- `ai_messages` 按月分区
- `operation_logs` 按月分区

### 2. 读写分离
- 主库：写操作
- 从库：读操作
- 使用中间件实现（如ProxySQL、MySQL Router）

### 3. 缓存层
- 使用Redis缓存热点数据
- 医生排班信息
- 用户基础信息
- 科室列表

### 4. 定期归档
- 归档1年前的对话记录
- 归档已完成超过1年的预约
- 归档操作日志

## 备份策略

### 1. 全量备份
```bash
# 每日全量备份
mysqldump -u root -p medical_ai > backup/medical_ai_$(date +%Y%m%d).sql
```

### 2. 增量备份
```bash
# 开启binlog
# 使用binlog进行增量恢复
```

### 3. 备份保留策略
- 每日全量备份保留7天
- 每周全量备份保留4周
- 每月全量备份保留12个月

## 安全建议

1. **访问控制**
   - 创建专用数据库用户
   - 限制远程访问
   - 使用SSL连接

2. **数据加密**
   - 敏感字段加密存储
   - 传输层加密
   - 定期更换密钥

3. **审计日志**
   - 启用慢查询日志
   - 启用通用查询日志
   - 定期分析异常访问

4. **定期维护**
   - 定期更新MySQL版本
   - 定期执行ANALYZE TABLE
   - 定期检查表健康状态

## 后续集成

数据库设计完成后，需要：

1. **安装MySQL数据库**
2. **执行schema.sql创建数据库结构**
3. **配置连接信息**
4. **实现后端API与数据库的交互**

是否需要我继续实现后端API与MySQL的连接？
