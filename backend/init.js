/**
 * 初始化脚本 - 创建初始用户和排班
 */
require('dotenv').config();
const { query, insert } = require('./src/config/database');
const bcrypt = require('bcryptjs');
const logger = require('./src/utils/logger');

async function initDatabase() {
  try {
    logger.info('开始初始化数据库...');

    // 1. 创建测试用户
    const hashedPassword = await bcrypt.hash('123456', 10);

    const userId = await insert(
      `INSERT INTO users (username, password_hash, phone, email, real_name, gender, age, status, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = LAST_INSERT_ID(user_id)`,
      ['testuser', hashedPassword, '13800138000', 'test@example.com', '测试用户', 'male', 30, 'active', true]
    );

    logger.info(`✅ 创建用户成功，userId: ${userId}`);

    // 2. 创建用户健康档案
    await insert(
      `INSERT INTO user_health_profiles (user_id, height, weight, blood_type, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, last_checkup, next_checkup)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE profile_id = LAST_INSERT_ID(profile_id)`,
      [userId, 175, 70, 'A', 120, 80, 72, '2026-02-20', '2026-08-20']
    );

    logger.info('✅ 创建健康档案成功');

    // 3. 初始化医生排班（未来7天）
    const doctors = await query('SELECT doctor_id FROM doctors LIMIT 3');
    const timeSlots = [
      '08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00',
      '10:00-10:30', '10:30-11:00', '14:00-14:30', '14:30-15:00',
      '15:00-15:30', '15:30-16:00', '16:00-16:30', '16:30-17:00'
    ];

    for (const doctor of doctors) {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        const dateStr = date.toISOString().split('T')[0];

        for (const timeSlot of timeSlots) {
          await insert(
            `INSERT INTO doctor_schedules (doctor_id, schedule_date, time_slot, total_slots, available_slots, status)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE schedule_id = LAST_INSERT_ID(schedule_id)`,
            [doctor.doctor_id, dateStr, timeSlot, 5, 5, 'available']
          );
        }
      }
      logger.info(`✅ 医生 ${doctor.doctor_id} 排班初始化完成`);
    }

    // 4. 创建一些测试预约
    const schedule = await query(
      `SELECT schedule_id, doctor_id FROM doctor_schedules LIMIT 1`
    );

    if (schedule.length > 0) {
      await insert(
        `INSERT INTO appointments (order_no, user_id, hospital_id, department_id, doctor_id, schedule_id,
         patient_name, patient_phone, appointment_date, appointment_time, fee, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `TEST${Date.now()}`,
          userId,
          1,
          6,
          schedule[0].doctor_id,
          schedule[0].schedule_id,
          '测试用户',
          '13800138000',
          '2026-03-24',
          '09:00-09:30',
          50.00,
          'pending'
        ]
      );
      logger.info('✅ 创建测试预约成功');
    }

    logger.info('✅ 数据库初始化完成！');
    logger.info('📝 测试账号: testuser / 123456');

    process.exit(0);
  } catch (error) {
    logger.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 执行初始化
initDatabase();
