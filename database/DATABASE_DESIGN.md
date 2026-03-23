# MySQL数据库结构设计文档

## 一、设计原则

1. **规范化设计**：遵循第三范式，减少数据冗余
2. **索引优化**：为常用查询字段建立索引
3. **扩展性**：预留扩展字段，支持业务发展
4. **安全性**：敏感信息加密存储，操作审计
5. **性能考虑**：合理分表分库，支持数据增长

## 二、ER图关系

```
┌─────────────┐
│   users     │ (用户表)
│             │
│ user_id (PK)│───┬──────────────┬─────────────────┬───────────────┐
└─────────────┘   │              │                 │               │
                  │              │                 │               │
         ┌────────▼──────┐ ┌─────▼────────┐ ┌────▼──────┐ ┌────▼────────┐
         │  user_health  │ │appointments  │ │ai_convers│ │chronic_     │
         │  _profiles    │ │              │ │ations     │ │diseases     │
         └───────────────┘ │appointment_  │ └───────────┘ └──────────────┘
                           │id (PK)       │
                           │              │
                           │user_id (FK)  │
                           │doctor_id (FK)│
                           │department_   │
                           │  id (FK)     │
                           │hospital_id   │
                           │  (FK)        │
                           └──────────────┘
                                     │
                                     │
        ┌────────────────────────────┼──────────────────────┐
        │                            │                      │
┌───────▼────────┐        ┌─────────▼────────┐  ┌────────▼──────────┐
│doctor_schedules│        │   hospitals      │  │   departments      │
│                │        │                  │  │                    │
│doctor_id (FK)  │        │hospital_id (PK)  │  │department_id (PK)  │
│                │        │                  │  │parent_id (FK)      │
└────────────────┘        └──────────────────┘  └────────────────────┘
        │                                               │
        │                                               │
┌───────▼───────────────────────────────────────────────▼──────┐
│                       doctors                            │
│                                                            │
│ doctor_id (PK)                                             │
│ department_id (FK)                                         │
│ hospital_id (FK)                                           │
└────────────────────────────────────────────────────────────┘
```

## 三、核心表设计详解

### 3.1 用户表（users）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| user_id | BIGINT | 用户ID | PK, AUTO_INCREMENT |
| username | VARCHAR(50) | 用户名 | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | 密码哈希 | NOT NULL |
| phone | VARCHAR(20) | 手机号 | UNIQUE |
| email | VARCHAR(100) | 邮箱 | UNIQUE |
| real_name | VARCHAR(50) | 真实姓名 | |
| id_card | VARCHAR(18) | 身份证号（加密） | |
| gender | ENUM | 性别 | male/female/other |
| age | INT | 年龄 | |
| avatar_url | VARCHAR(255) | 头像URL | |
| status | ENUM | 用户状态 | active/inactive/suspended |
| is_verified | BOOLEAN | 是否实名认证 | DEFAULT FALSE |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |
| last_login_at | TIMESTAMP | 最后登录时间 | |
| last_login_ip | VARCHAR(50) | 最后登录IP | |

**索引**：
- `idx_phone` (phone)
- `idx_email` (email)
- `idx_created_at` (created_at)

---

### 3.2 预约订单表（appointments）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| appointment_id | BIGINT | 预约ID | PK, AUTO_INCREMENT |
| order_no | VARCHAR(32) | 订单号 | UNIQUE, NOT NULL |
| user_id | BIGINT | 用户ID | FK, NOT NULL |
| hospital_id | BIGINT | 医院ID | FK, NOT NULL |
| department_id | BIGINT | 科室ID | FK, NOT NULL |
| doctor_id | BIGINT | 医生ID | FK, NOT NULL |
| schedule_id | BIGINT | 排班ID | FK, NOT NULL |
| patient_name | VARCHAR(50) | 就诊人姓名 | NOT NULL |
| patient_phone | VARCHAR(20) | 就诊人手机号 | NOT NULL |
| patient_id_card | VARCHAR(18) | 身份证（加密） | |
| appointment_date | DATE | 预约日期 | NOT NULL |
| appointment_time | VARCHAR(50) | 预约时间段 | NOT NULL |
| symptoms | TEXT | 症状描述 | |
| diagnosis_result | TEXT | 诊断结果 | |
| prescription | TEXT | 处方 | |
| status | ENUM | 状态 | pending/confirmed/checked_in/completed/cancelled/no_show |
| cancel_reason | VARCHAR(255) | 取消原因 | |
| fee | DECIMAL(10,2) | 挂号费 | |
| payment_status | ENUM | 支付状态 | unpaid/paid/refunded |
| payment_time | TIMESTAMP | 支付时间 | |
| check_in_time | TIMESTAMP | 签到时间 | |
| complete_time | TIMESTAMP | 就诊完成时间 | |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

**状态流转**：
```
pending → confirmed → checked_in → completed
    ↓
cancelled
```

**索引**：
- `idx_user_id` (user_id)
- `idx_doctor_id` (doctor_id)
- `idx_appointment_date` (appointment_date)
- `idx_status` (status)
- `idx_order_no` (order_no)

---

### 3.3 AI对话记录表（ai_conversations）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| conversation_id | BIGINT | 对话ID | PK, AUTO_INCREMENT |
| user_id | BIGINT | 用户ID | FK, NOT NULL |
| conversation_type | ENUM | 对话类型 | consultation/report_analysis/medication_query/follow_up |
| title | VARCHAR(255) | 对话标题 | |
| status | ENUM | 状态 | active/closed/archived |
| is_emergency | BOOLEAN | 是否紧急情况 | DEFAULT FALSE |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

**索引**：
- `idx_user_id` (user_id)
- `idx_created_at` (created_at)
- `idx_status` (status)

---

### 3.4 AI消息表（ai_messages）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| message_id | BIGINT | 消息ID | PK, AUTO_INCREMENT |
| conversation_id | BIGINT | 对话ID | FK, NOT NULL |
| role | ENUM | 角色 | user/assistant/system |
| content | TEXT | 消息内容 | NOT NULL |
| model_used | VARCHAR(50) | 使用的模型 | |
| tokens_used | INT | 使用的token数 | |
| department_recommended | VARCHAR(100) | 推荐的科室 | |
| urgency_level | ENUM | 紧急程度 | general/moderate/urgent/emergency |
| requires_review | BOOLEAN | 是否需要医生复核 | DEFAULT FALSE |
| review_status | ENUM | 复核状态 | pending/approved/rejected |
| reviewed_by | BIGINT | 复核医生ID | FK |
| review_time | TIMESTAMP | 复核时间 | |
| review_comment | TEXT | 复核意见 | |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |

**索引**：
- `idx_conversation_id` (conversation_id)
- `idx_review_status` (review_status)

---

### 3.5 检查报告表（medical_reports）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| report_id | BIGINT | 报告ID | PK, AUTO_INCREMENT |
| user_id | BIGINT | 用户ID | FK, NOT NULL |
| report_type | VARCHAR(50) | 报告类型 | NOT NULL |
| report_no | VARCHAR(100) | 报告编号 | |
| file_url | VARCHAR(255) | 报告文件URL | |
| original_file_url | VARCHAR(255) | 原始文件URL | |
| ocr_result | TEXT | OCR识别结果（JSON） | |
| ai_analysis | TEXT | AI分析结果（JSON） | |
| ai_summary | TEXT | AI总结 | |
| ai_suggestions | TEXT | AI建议（JSON） | |
| hospital_name | VARCHAR(200) | 医院名称 | |
| department_name | VARCHAR(100) | 科室名称 | |
| report_date | DATE | 报告日期 | |
| doctor_review_status | ENUM | 医生审核状态 | pending/reviewed |
| doctor_review_comment | TEXT | 医生审核意见 | |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

**索引**：
- `idx_user_id` (user_id)
- `idx_report_type` (report_type)
- `idx_created_at` (created_at)

---

### 3.6 医生排班表（doctor_schedules）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| schedule_id | BIGINT | 排班ID | PK, AUTO_INCREMENT |
| doctor_id | BIGINT | 医生ID | FK, NOT NULL |
| schedule_date | DATE | 排班日期 | NOT NULL |
| time_slot | VARCHAR(50) | 时间段 | NOT NULL |
| total_slots | INT | 总号源数 | DEFAULT 1 |
| available_slots | INT | 剩余号源 | DEFAULT 1 |
| status | ENUM | 状态 | available/full/cancelled |
| created_at | TIMESTAMP | 创建时间 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新时间 | ON UPDATE CURRENT_TIMESTAMP |

**唯一约束**：
- `uk_doctor_date_time` (doctor_id, schedule_date, time_slot)

**索引**：
- `idx_schedule_date` (schedule_date)
- `idx_doctor_id` (doctor_id)

## 四、业务流程数据设计

### 4.1 预约挂号流程

```
1. 用户选择科室、医生、日期、时间
2. 创建预约记录（status = pending）
3. 用户支付（payment_status = unpaid → paid）
4. 确认预约（status = confirmed）
5. 用户签到（status = checked_in）
6. 就诊完成（status = completed）
   - 填写诊断结果（diagnosis_result）
   - 填写处方（prescription）
7. 如取消（status = cancelled）
   - 退款（payment_status = refunded）
   - 恢复号源
```

### 4.2 AI问诊流程

```
1. 用户发起对话
2. 创建conversation记录
3. 用户发送消息（ai_messages, role = user）
4. AI分析消息
   - 调用本地模型
   - 生成回复
   - 记录到ai_messages（role = assistant）
5. 判断是否需要医生复核
   - requires_review = true
   - 创建review_task
6. 医生复核
   - 更新review_status
   - 填写review_comment
```

### 4.3 报告解读流程

```
1. 用户上传报告图片
2. OCR识别
   - 存储到ocr_result
3. AI分析
   - 提取指标（report_indicators）
   - 生成解读（ai_analysis）
   - 生成建议（ai_suggestions）
4. 医生审核
   - doctor_review_status = reviewed
   - 填写doctor_review_comment
```

## 五、性能优化建议

### 5.1 索引策略

**必需索引**：
- 所有外键字段
- 常用查询条件
- 排序字段

**复合索引**：
```sql
-- 预约查询（用户+日期+状态）
CREATE INDEX idx_user_date_status ON appointments(user_id, appointment_date, status);

-- 医生排班查询（日期+状态）
CREATE INDEX idx_date_status ON doctor_schedules(schedule_date, status);

-- 消息查询（对话+时间）
CREATE INDEX idx_conv_time ON ai_messages(conversation_id, created_at);
```

### 5.2 分区策略

**按时间分区**：
```sql
-- appointments按月分区
ALTER TABLE appointments PARTITION BY RANGE (YEAR(appointment_date)*100 + MONTH(appointment_date));

-- ai_messages按月分区
ALTER TABLE ai_messages PARTITION BY RANGE (YEAR(created_at)*100 + MONTH(created_at));
```

### 5.3 读写分离

- 主库：写操作
- 从库：读操作
- 使用ProxySQL或MySQL Router

### 5.4 缓存策略

**Redis缓存**：
- 医生排班信息（TTL: 1小时）
- 用户基本信息（TTL: 30分钟）
- 科室列表（TTL: 1天）

## 六、安全策略

### 6.1 数据加密

**加密字段**：
- `users.id_card` - AES加密
- `appointments.patient_id_card` - AES加密
- `user_health_profiles.allergies` - AES加密

### 6.2 访问控制

**角色权限**：
- 用户：只读自己的数据
- 医生：可访问分配的复核任务
- 管理员：完全访问权限

### 6.3 审计日志

所有敏感操作记录到`operation_logs`：
- 登录/登出
- 修改个人信息
- 取消预约
- 查看病历

## 七、备份恢复

### 7.1 备份策略

- **每日全量备份**：保留7天
- **每周全量备份**：保留4周
- **每月全量备份**：保留12个月
- **binlog增量备份**：实时

### 7.2 恢复策略

```bash
# 全量恢复
mysql -u root -p medical_ai < backup/medical_ai_20260323.sql

# 增量恢复
mysqlbinlog --start-datetime="2026-03-23 00:00:00" binlog.000001 | mysql -u root -p
```

## 八、监控告警

### 8.1 关键指标

- 连接数
- 慢查询
- 表空间使用率
- 复制延迟（如有）

### 8.2 告警规则

- 连接数 > 最大连接数的80%
- 慢查询数 > 100/小时
- 表空间使用率 > 80%
- 复制延迟 > 5秒

## 九、扩展性考虑

### 9.1 水平扩展

- 按user_id分片
- 按医院分片
- 按时间分片

### 9.2 垂直扩展

- 历史数据归档
- 冷热数据分离
- 使用列式存储（ClickHouse）存储日志数据
