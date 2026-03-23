-- =====================================================
-- 智慧医疗AI助手 - MySQL数据库设计
-- =====================================================
-- 创建数据库
CREATE DATABASE IF NOT EXISTS medical_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE medical_ai;

-- =====================================================
-- 1. 用户管理模块
-- =====================================================

-- 用户表
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    phone VARCHAR(20) UNIQUE COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    real_name VARCHAR(50) COMMENT '真实姓名',
    id_card VARCHAR(18) COMMENT '身份证号（加密存储）',
    gender ENUM('male', 'female', 'other') COMMENT '性别',
    age INT COMMENT '年龄',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active' COMMENT '用户状态',
    is_verified BOOLEAN DEFAULT FALSE COMMENT '是否实名认证',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 用户健康档案表
CREATE TABLE user_health_profiles (
    profile_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '健康档案ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    height DECIMAL(5,2) COMMENT '身高(cm)',
    weight DECIMAL(5,2) COMMENT '体重(kg)',
    blood_type ENUM('A', 'B', 'AB', 'O', 'unknown') COMMENT '血型',
    allergies TEXT COMMENT '过敏史（JSON格式）',
    chronic_diseases TEXT COMMENT '慢性病史（JSON格式）',
    medications TEXT COMMENT '正在使用的药物（JSON格式）',
    blood_pressure_systolic INT COMMENT '收缩压',
    blood_pressure_diastolic INT COMMENT '舒张压',
    heart_rate INT COMMENT '心率(次/分)',
    medical_history TEXT COMMENT '既往病史',
    family_history TEXT COMMENT '家族病史',
    last_checkup DATE COMMENT '上次体检日期',
    next_checkup DATE COMMENT '下次体检日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户健康档案表';

-- =====================================================
-- 2. 医疗机构与科室模块
-- =====================================================

-- 医院表
CREATE TABLE hospitals (
    hospital_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '医院ID',
    name VARCHAR(200) NOT NULL COMMENT '医院名称',
    code VARCHAR(50) UNIQUE COMMENT '医院编码',
    level ENUM('grade1', 'grade2', 'grade3') COMMENT '医院等级',
    address VARCHAR(255) COMMENT '地址',
    latitude DECIMAL(10,6) COMMENT '纬度',
    longitude DECIMAL(10,6) COMMENT '经度',
    phone VARCHAR(20) COMMENT '联系电话',
    description TEXT COMMENT '医院简介',
    logo_url VARCHAR(255) COMMENT 'Logo URL',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_level (level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医院表';

-- 科室表
CREATE TABLE departments (
    department_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '科室ID',
    hospital_id BIGINT NOT NULL COMMENT '医院ID',
    name VARCHAR(100) NOT NULL COMMENT '科室名称',
    code VARCHAR(50) COMMENT '科室编码',
    parent_id BIGINT COMMENT '父科室ID（用于子科室）',
    description TEXT COMMENT '科室简介',
    floor VARCHAR(50) COMMENT '楼层位置',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='科室表';

-- 医生表
CREATE TABLE doctors (
    doctor_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '医生ID',
    hospital_id BIGINT NOT NULL COMMENT '医院ID',
    department_id BIGINT NOT NULL COMMENT '科室ID',
    name VARCHAR(50) NOT NULL COMMENT '医生姓名',
    title ENUM('chief', 'vice_chief', 'attending', 'resident') COMMENT '职称：主任医师/副主任医师/主治医师/住院医师',
    gender ENUM('male', 'female', 'other') COMMENT '性别',
    specialty VARCHAR(255) COMMENT '专长领域',
    education VARCHAR(255) COMMENT '学历',
    experience_years INT COMMENT '从业年限',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    bio TEXT COMMENT '个人简介',
    consultation_fee DECIMAL(10,2) COMMENT '挂号费',
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active' COMMENT '状态',
    is_expert BOOLEAN DEFAULT FALSE COMMENT '是否专家',
    rating DECIMAL(3,2) DEFAULT 5.00 COMMENT '评分（0-5）',
    rating_count INT DEFAULT 0 COMMENT '评分人数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_department_id (department_id),
    INDEX idx_title (title),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医生表';

-- 医生排班表
CREATE TABLE doctor_schedules (
    schedule_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '排班ID',
    doctor_id BIGINT NOT NULL COMMENT '医生ID',
    schedule_date DATE NOT NULL COMMENT '排班日期',
    time_slot VARCHAR(50) NOT NULL COMMENT '时间段（如：08:00-08:30）',
    total_slots INT DEFAULT 1 COMMENT '总号源数',
    available_slots INT DEFAULT 1 COMMENT '剩余号源',
    status ENUM('available', 'full', 'cancelled') DEFAULT 'available' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    UNIQUE KEY uk_doctor_date_time (doctor_id, schedule_date, time_slot),
    INDEX idx_schedule_date (schedule_date),
    INDEX idx_doctor_id (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医生排班表';

-- =====================================================
-- 3. 预约挂号模块
-- =====================================================

-- 预约订单表
CREATE TABLE appointments (
    appointment_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '预约ID',
    order_no VARCHAR(32) UNIQUE NOT NULL COMMENT '订单号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    hospital_id BIGINT NOT NULL COMMENT '医院ID',
    department_id BIGINT NOT NULL COMMENT '科室ID',
    doctor_id BIGINT NOT NULL COMMENT '医生ID',
    schedule_id BIGINT NOT NULL COMMENT '排班ID',
    patient_name VARCHAR(50) NOT NULL COMMENT '就诊人姓名',
    patient_phone VARCHAR(20) NOT NULL COMMENT '就诊人手机号',
    patient_id_card VARCHAR(18) COMMENT '就诊人身份证（加密）',
    appointment_date DATE NOT NULL COMMENT '预约日期',
    appointment_time VARCHAR(50) NOT NULL COMMENT '预约时间段',
    symptoms TEXT COMMENT '症状描述',
    diagnosis_result TEXT COMMENT '诊断结果（就诊后填写）',
    prescription TEXT COMMENT '处方（就诊后填写）',
    status ENUM('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show') DEFAULT 'pending' COMMENT '状态',
    cancel_reason VARCHAR(255) COMMENT '取消原因',
    fee DECIMAL(10,2) COMMENT '挂号费',
    payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid' COMMENT '支付状态',
    payment_time TIMESTAMP NULL COMMENT '支付时间',
    check_in_time TIMESTAMP NULL COMMENT '签到时间',
    complete_time TIMESTAMP NULL COMMENT '就诊完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES doctor_schedules(schedule_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_doctor_id (doctor_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约订单表';

-- =====================================================
-- 4. AI问诊模块
-- =====================================================

-- AI对话记录表
CREATE TABLE ai_conversations (
    conversation_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '对话ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    conversation_type ENUM('consultation', 'report_analysis', 'medication_query', 'follow_up') NOT NULL COMMENT '对话类型',
    title VARCHAR(255) COMMENT '对话标题',
    status ENUM('active', 'closed', 'archived') DEFAULT 'active' COMMENT '状态',
    is_emergency BOOLEAN DEFAULT FALSE COMMENT '是否紧急情况',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话记录表';

-- AI消息表
CREATE TABLE ai_messages (
    message_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
    conversation_id BIGINT NOT NULL COMMENT '对话ID',
    role ENUM('user', 'assistant', 'system') NOT NULL COMMENT '角色',
    content TEXT NOT NULL COMMENT '消息内容',
    model_used VARCHAR(50) COMMENT '使用的模型',
    tokens_used INT COMMENT '使用的token数',
    department_recommended VARCHAR(100) COMMENT '推荐的科室',
    urgency_level ENUM('general', 'moderate', 'urgent', 'emergency') COMMENT '紧急程度',
    requires_review BOOLEAN DEFAULT FALSE COMMENT '是否需要医生复核',
    review_status ENUM('pending', 'approved', 'rejected') COMMENT '复核状态',
    reviewed_by BIGINT COMMENT '复核医生ID',
    review_time TIMESTAMP NULL COMMENT '复核时间',
    review_comment TEXT COMMENT '复核意见',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_review_status (review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI消息表';

-- =====================================================
-- 5. 报告解读模块
-- =====================================================

-- 检查报告表
CREATE TABLE medical_reports (
    report_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '报告ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    report_type VARCHAR(50) NOT NULL COMMENT '报告类型（血常规/CT/MRI等）',
    report_no VARCHAR(100) COMMENT '报告编号',
    file_url VARCHAR(255) COMMENT '报告文件URL',
    original_file_url VARCHAR(255) COMMENT '原始文件URL',
    ocr_result TEXT COMMENT 'OCR识别结果（JSON）',
    ai_analysis TEXT COMMENT 'AI分析结果（JSON）',
    ai_summary TEXT COMMENT 'AI总结',
    ai_suggestions TEXT COMMENT 'AI建议（JSON）',
    hospital_name VARCHAR(200) COMMENT '医院名称',
    department_name VARCHAR(100) COMMENT '科室名称',
    report_date DATE COMMENT '报告日期',
    doctor_review_status ENUM('pending', 'reviewed') DEFAULT 'pending' COMMENT '医生审核状态',
    doctor_review_comment TEXT COMMENT '医生审核意见',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_report_type (report_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='检查报告表';

-- 报告指标详情表
CREATE TABLE report_indicators (
    indicator_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '指标ID',
    report_id BIGINT NOT NULL COMMENT '报告ID',
    indicator_name VARCHAR(100) NOT NULL COMMENT '指标名称',
    indicator_value VARCHAR(100) COMMENT '指标值',
    reference_range VARCHAR(100) COMMENT '参考范围',
    unit VARCHAR(50) COMMENT '单位',
    status ENUM('normal', 'high', 'low', 'abnormal') COMMENT '状态：正常/偏高/偏低/异常',
    interpretation TEXT COMMENT '解读说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (report_id) REFERENCES medical_reports(report_id) ON DELETE CASCADE,
    INDEX idx_report_id (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报告指标详情表';

-- =====================================================
-- 6. 医生复核模块
-- =====================================================

-- 复核任务表
CREATE TABLE review_tasks (
    task_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '任务ID',
    task_type ENUM('ai_consultation', 'report_analysis', 'medication_query') NOT NULL COMMENT '任务类型',
    related_id BIGINT NOT NULL COMMENT '关联ID（对话ID或报告ID）',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    ai_recommendation TEXT NOT NULL COMMENT 'AI建议内容',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' COMMENT '优先级',
    assigned_to BIGINT NOT NULL COMMENT '分配给医生ID',
    status ENUM('pending', 'in_review', 'approved', 'rejected', 'escalated') DEFAULT 'pending' COMMENT '状态',
    reviewer_comment TEXT COMMENT '复核意见',
    reviewed_at TIMESTAMP NULL COMMENT '复核时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='复核任务表';

-- =====================================================
-- 7. 慢病管理模块
-- =====================================================

-- 慢病档案表
CREATE TABLE chronic_diseases (
    disease_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '慢病ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    disease_name VARCHAR(100) NOT NULL COMMENT '疾病名称',
    disease_code VARCHAR(50) COMMENT '疾病编码（ICD-10）',
    diagnosis_date DATE COMMENT '诊断日期',
    severity ENUM('mild', 'moderate', 'severe') COMMENT '严重程度',
    stage VARCHAR(50) COMMENT '疾病分期',
    managing_doctor_id BIGINT COMMENT '管理医生ID',
    treatment_plan TEXT COMMENT '治疗方案',
    notes TEXT COMMENT '备注',
    status ENUM('active', 'controlled', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (managing_doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_disease_name (disease_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='慢病档案表';

-- 健康监测记录表
CREATE TABLE health_records (
    record_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    record_type ENUM('blood_pressure', 'blood_sugar', 'heart_rate', 'weight', 'temperature', 'custom') NOT NULL COMMENT '记录类型',
    value DECIMAL(10,2) NOT NULL COMMENT '数值',
    unit VARCHAR(20) COMMENT '单位',
    note VARCHAR(255) COMMENT '备注',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    source ENUM('manual', 'device', 'import') DEFAULT 'manual' COMMENT '来源',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_record_type (record_type),
    INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康监测记录表';

-- =====================================================
-- 8. 用药提醒模块
-- =====================================================

-- 用药计划表
CREATE TABLE medication_plans (
    plan_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '计划ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    medication_name VARCHAR(100) NOT NULL COMMENT '药品名称',
    dosage VARCHAR(50) COMMENT '剂量',
    frequency VARCHAR(50) COMMENT '频次',
    route VARCHAR(50) COMMENT '给药途径（口服/注射等）',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    prescribed_by BIGINT COMMENT '开药医生ID',
    notes TEXT COMMENT '注意事项',
    status ENUM('active', 'paused', 'completed') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (prescribed_by) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用药计划表';

-- 用药提醒记录表
CREATE TABLE medication_reminders (
    reminder_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '提醒ID',
    plan_id BIGINT NOT NULL COMMENT '计划ID',
    remind_time TIME NOT NULL COMMENT '提醒时间',
    weekdays VARCHAR(20) COMMENT '提醒星期（如：1,3,5表示周一三五）',
    is_taken BOOLEAN DEFAULT FALSE COMMENT '是否已服用',
    taken_at TIMESTAMP NULL COMMENT '服用时间',
    remind_date DATE NOT NULL COMMENT '提醒日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (plan_id) REFERENCES medication_plans(plan_id) ON DELETE CASCADE,
    INDEX idx_plan_id (plan_id),
    INDEX idx_remind_date (remind_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用药提醒记录表';

-- =====================================================
-- 9. 系统管理模块
-- =====================================================

-- 系统配置表
CREATE TABLE system_configs (
    config_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '配置类型',
    description VARCHAR(255) COMMENT '配置说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 操作日志表
CREATE TABLE operation_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id BIGINT COMMENT '用户ID',
    user_type ENUM('user', 'doctor', 'admin', 'system') COMMENT '用户类型',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    operation_detail TEXT COMMENT '操作详情',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(255) COMMENT '用户代理',
    status ENUM('success', 'failure') DEFAULT 'success' COMMENT '状态',
    error_message TEXT COMMENT '错误信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_operation_type (operation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- =====================================================
-- 10. 初始化数据
-- =====================================================

-- 插入系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('ai_model_name', 'medical-v1', 'string', 'AI模型名称'),
('ai_temperature', '0.7', 'number', 'AI温度参数'),
('enable_emergency_detection', 'true', 'boolean', '是否启用紧急情况检测'),
('appointment_cancel_hours', '24', 'number', '预约取消提前小时数'),
('max_report_file_size', '10485760', 'number', '最大报告文件大小（字节）');

-- 插入默认医院数据
INSERT INTO hospitals (name, code, level, address, phone, status) VALUES
('智慧医疗医院', 'WMH001', 'grade3', '上海市浦东新区张江高科技园区', '021-12345678', 'active');

-- 插入科室数据
INSERT INTO departments (hospital_id, name, code, parent_id, status) VALUES
(1, '内科', 'DEPT001', NULL, 'active'),
(1, '外科', 'DEPT002', NULL, 'active'),
(1, '妇儿科', 'DEPT003', NULL, 'active'),
(1, '专科', 'DEPT004', NULL, 'active'),
(1, '急诊', 'DEPT005', NULL, 'active');

INSERT INTO departments (hospital_id, name, code, parent_id, status) VALUES
(1, '心血管内科', 'DEPT001001', 1, 'active'),
(1, '呼吸内科', 'DEPT001002', 1, 'active'),
(1, '消化内科', 'DEPT001003', 1, 'active'),
(1, '内分泌科', 'DEPT001004', 1, 'active'),
(1, '神经内科', 'DEPT001005', 1, 'active'),
(1, '普外科', 'DEPT002001', 2, 'active'),
(1, '骨科', 'DEPT002002', 2, 'active'),
(1, '神经外科', 'DEPT002003', 2, 'active'),
(1, '泌尿外科', 'DEPT002004', 2, 'active'),
(1, '胸外科', 'DEPT002005', 2, 'active'),
(1, '妇科', 'DEPT003001', 3, 'active'),
(1, '产科', 'DEPT003002', 3, 'active'),
(1, '儿科', 'DEPT003003', 3, 'active'),
(1, '新生儿科', 'DEPT003004', 3, 'active'),
(1, '眼科', 'DEPT004001', 4, 'active'),
(1, '耳鼻喉科', 'DEPT004002', 4, 'active'),
(1, '口腔科', 'DEPT004003', 4, 'active'),
(1, '皮肤科', 'DEPT004004', 4, 'active'),
(1, '急诊内科', 'DEPT005001', 5, 'active'),
(1, '急诊外科', 'DEPT005002', 5, 'active');

-- 插入医生数据
INSERT INTO doctors (hospital_id, department_id, name, title, gender, specialty, experience_years, consultation_fee, status, is_expert, rating) VALUES
(1, 6, '张医生', 'chief', 'male', '冠心病、高血压', 20, 50.00, 'active', TRUE, 4.9),
(1, 6, '李医生', 'vice_chief', 'male', '心律失常、心力衰竭', 15, 40.00, 'active', FALSE, 4.7),
(1, 10, '王医生', 'chief', 'female', '脑血管病、帕金森病', 18, 50.00, 'active', TRUE, 4.8),
(1, 8, '赵医生', 'vice_chief', 'male', '胃炎、胃溃疡', 12, 40.00, 'active', FALSE, 4.6),
(1, 7, '刘医生', 'attending', 'female', '支气管炎、肺炎', 8, 30.00, 'active', FALSE, 4.5);

-- =====================================================
-- 11. 视图（便于查询）
-- =====================================================

-- 预约详情视图
CREATE VIEW v_appointment_details AS
SELECT
    a.appointment_id,
    a.order_no,
    a.user_id,
    u.real_name AS user_name,
    a.hospital_id,
    h.name AS hospital_name,
    a.department_id,
    d.name AS department_name,
    a.doctor_id,
    doc.name AS doctor_name,
    doc.title AS doctor_title,
    a.patient_name,
    a.patient_phone,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.fee,
    a.payment_status,
    a.created_at
FROM appointments a
LEFT JOIN users u ON a.user_id = u.user_id
LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
LEFT JOIN departments d ON a.department_id = d.department_id
LEFT JOIN doctors doc ON a.doctor_id = doc.doctor_id;

-- 医生排班详情视图
CREATE VIEW v_doctor_schedule_details AS
SELECT
    ds.schedule_id,
    ds.doctor_id,
    d.name AS doctor_name,
    d.title AS doctor_title,
    dep.name AS department_name,
    ds.schedule_date,
    ds.time_slot,
    ds.total_slots,
    ds.available_slots,
    ds.status
FROM doctor_schedules ds
LEFT JOIN doctors d ON ds.doctor_id = d.doctor_id
LEFT JOIN departments dep ON d.department_id = dep.department_id;

-- =====================================================
-- 完成数据库创建
-- =====================================================
