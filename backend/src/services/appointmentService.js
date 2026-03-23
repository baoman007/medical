const { query, insert, update, transaction } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 获取所有医院列表
 */
async function getHospitals() {
  const hospitals = await query('SELECT * FROM hospitals WHERE status = ? ORDER BY level', ['active']);
  return hospitals;
}

/**
 * 获取医院科室列表
 */
async function getDepartments(hospitalId) {
  const departments = await query(
    `SELECT * FROM departments
     WHERE hospital_id = ? AND status = ? AND parent_id IS NULL
     ORDER BY name`,
    [hospitalId, 'active']
  );

  // 获取子科室
  for (const dept of departments) {
    dept.subDepartments = await query(
      `SELECT * FROM departments
       WHERE parent_id = ? AND status = ?
       ORDER BY name`,
      [dept.department_id, 'active']
    );
  }

  return departments;
}

/**
 * 获取医生列表
 */
async function getDoctors(hospitalId, departmentId) {
  const doctors = await query(
    `SELECT d.*, dep.name as department_name
     FROM doctors d
     LEFT JOIN departments dep ON d.department_id = dep.department_id
     WHERE d.hospital_id = ? AND d.status = ?
     ORDER BY d.is_expert DESC, d.rating DESC`,
    [hospitalId, 'active']
  );

  // 如果指定了科室，过滤
  if (departmentId) {
    return doctors.filter(doc =>
      doc.department_id === departmentId ||
      doc.department_id === departmentId
    );
  }

  return doctors;
}

/**
 * 获取医生排班
 */
async function getDoctorSchedule(doctorId, startDate, endDate) {
  const schedules = await query(
    `SELECT * FROM doctor_schedules
     WHERE doctor_id = ? AND schedule_date BETWEEN ? AND ?
     AND status != 'cancelled'
     ORDER BY schedule_date ASC, time_slot ASC`,
    [doctorId, startDate, endDate]
  );

  return schedules;
}

/**
 * 创建预约订单
 */
async function createAppointment(appointmentData) {
  return transaction(async (connection) => {
    // 生成订单号
    const orderNo = `AP${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 检查排班号源
    const schedules = await connection.query(
      `SELECT * FROM doctor_schedules
       WHERE schedule_id = ? AND available_slots > 0 AND status = 'available'`,
      [appointmentData.scheduleId]
    );

    if (schedules[0].length === 0) {
      throw new Error('该时段已无号源');
    }

    const schedule = schedules[0][0];

    // 创建预约订单
    const appointmentId = await connection.query(
      `INSERT INTO appointments
       (order_no, user_id, hospital_id, department_id, doctor_id, schedule_id,
        patient_name, patient_phone, patient_id_card, appointment_date, appointment_time,
        symptoms, fee, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNo,
        appointmentData.userId,
        appointmentData.hospitalId,
        appointmentData.departmentId,
        appointmentData.doctorId,
        appointmentData.scheduleId,
        appointmentData.patientName,
        appointmentData.patientPhone,
        appointmentData.patientIdCard || null,
        appointmentData.appointmentDate,
        appointmentData.appointmentTime,
        appointmentData.symptoms || null,
        appointmentData.fee || 50.00,
        'pending'
      ]
    );

    // 减少号源
    await connection.query(
      `UPDATE doctor_schedules
       SET available_slots = available_slots - 1,
        status = IF(available_slots - 1 = 0, 'full', 'available')
       WHERE schedule_id = ?`,
      [appointmentData.scheduleId]
    );

    logger.info('预约创建成功', {
      appointmentId: appointmentId[0].insertId,
      orderNo,
      userId: appointmentData.userId
    });

    return {
      success: true,
      appointmentId: appointmentId[0].insertId,
      orderNo,
      message: '预约成功'
    };
  });
}

/**
 * 获取用户预约列表
 */
async function getUserAppointments(userId, status = null, limit = 20) {
  let sql = `SELECT * FROM v_appointment_details WHERE user_id = ?`;
  let params = [userId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const appointments = await query(sql, params);
  return appointments;
}

/**
 * 取消预约
 */
async function cancelAppointment(appointmentId, userId) {
  return transaction(async (connection) => {
    // 查询预约信息
    const appointments = await connection.query(
      `SELECT * FROM appointments
       WHERE appointment_id = ? AND user_id = ?`,
      [appointmentId, userId]
    );

    if (appointments[0].length === 0) {
      throw new Error('预约不存在或无权限操作');
    }

    const appointment = appointments[0][0];

    // 检查是否可以取消
    if (['completed', 'cancelled', 'checked_in'].includes(appointment.status)) {
      throw new Error('该预约状态不允许取消');
    }

    // 取消预约
    await connection.query(
      `UPDATE appointments
       SET status = 'cancelled', cancel_reason = ?, updated_at = NOW()
       WHERE appointment_id = ?`,
      ['用户取消', appointmentId]
    );

    // 恢复号源
    await connection.query(
      `UPDATE doctor_schedules
       SET available_slots = available_slots + 1,
        status = 'available'
       WHERE schedule_id = ?`,
      [appointment.schedule_id]
    );

    logger.info('预约取消成功', { appointmentId, userId });

    return { success: true, message: '预约已取消' };
  });
}

/**
 * 初始化医生排班（用于测试）
 */
async function initDoctorSchedules(doctorId, days = 7) {
  const schedules = [];
  const timeSlots = [
    '08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00',
    '10:00-10:30', '10:30-11:00', '14:00-14:30', '14:30-15:00',
    '15:00-15:30', '15:30-16:00', '16:00-16:30', '16:30-17:00'
  ];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const dateStr = date.toISOString().split('T')[0];

    for (const timeSlot of timeSlots) {
      const scheduleId = await insert(
        `INSERT INTO doctor_schedules (doctor_id, schedule_date, time_slot, total_slots, available_slots, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [doctorId, dateStr, timeSlot, 5, 5, 'available']
      );
      schedules.push({ scheduleId, date: dateStr, timeSlot });
    }
  }

  logger.info('医生排班初始化完成', { doctorId, schedulesCount: schedules.length });
  return schedules;
}

module.exports = {
  getHospitals,
  getDepartments,
  getDoctors,
  getDoctorSchedule,
  createAppointment,
  getUserAppointments,
  cancelAppointment,
  initDoctorSchedules
};
