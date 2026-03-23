import { useState, useEffect } from 'react'
import { Card, Select, Button, message, Spin, Tag, Space, Divider, Collapse, Steps, Modal, Descriptions } from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import { getDepartments, getDoctors, bookAppointment } from '../services/api'
import './Appointment.css'

const { Option } = Select
const { Panel } = Collapse

const timeSlots = [
  '08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00',
  '10:00-10:30', '10:30-11:00', '14:00-14:30', '14:30-15:00',
  '15:00-15:30', '15:30-16:00', '16:00-16:30', '16:30-17:00'
]

function Appointment() {
  const [currentStep, setCurrentStep] = useState(0)
  const [departments, setDepartments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [appointmentData, setAppointmentData] = useState({
    department: null,
    subDepartment: null,
    doctor: null,
    date: null,
    timeSlot: null,
    patientName: '',
    patientPhone: '',
    symptoms: ''
  })
  const [appointmentResult, setAppointmentResult] = useState(null)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const data = await getDepartments()
      setDepartments(data)
    } catch (error) {
      message.error('获取科室信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentChange = async (departmentId, departmentName) => {
    setAppointmentData(prev => ({
      ...prev,
      department: { id: departmentId, name: departmentName },
      subDepartment: null,
      doctor: null
    }))
    setDoctors([])
    setCurrentStep(1)
  }

  const handleSubDepartmentChange = async (subDepartment) => {
    setAppointmentData(prev => ({
      ...prev,
      subDepartment,
      doctor: null
    }))

    setLoading(true)
    try {
      const departmentId = appointmentData.department.id
      const data = await getDoctors(departmentId)
      setDoctors(data)
      setCurrentStep(2)
    } catch (error) {
      message.error('获取医生信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDoctorChange = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId)
    setAppointmentData(prev => ({
      ...prev,
      doctor
    }))
    setCurrentStep(3)
  }

  const handleDateChange = (date) => {
    setAppointmentData(prev => ({
      ...prev,
      date
    }))
    setCurrentStep(4)
  }

  const handleTimeSlotSelect = (timeSlot) => {
    setAppointmentData(prev => ({
      ...prev,
      timeSlot
    }))
    setCurrentStep(5)
  }

  const handleSubmit = async () => {
    if (!appointmentData.patientName || !appointmentData.patientPhone) {
      message.error('请填写患者信息')
      return
    }

    setBooking(true)
    try {
      const result = await bookAppointment({
        ...appointmentData,
        appointmentTime: `${appointmentData.date} ${appointmentData.timeSlot}`
      })
      setAppointmentResult(result)
      setSuccessModal(true)
      message.success('预约成功！')
    } catch (error) {
      message.error('预约失败，请重试')
    } finally {
      setBooking(false)
    }
  }

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1))
  }

  const generateDates = () => {
    const dates = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
      dates.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        label: `${date.getMonth() + 1}月${date.getDate()}日 ${weekDay}`
      })
    }
    return dates
  }

  const resetForm = () => {
    setCurrentStep(0)
    setAppointmentData({
      department: null,
      subDepartment: null,
      doctor: null,
      date: null,
      timeSlot: null,
      patientName: '',
      patientPhone: '',
      symptoms: ''
    })
    setSuccessModal(false)
  }

  if (loading && currentStep === 0) {
    return (
      <div className="appointment">
        <Card bordered={false} className="loading-card">
          <Spin size="large" tip="加载中..." />
        </Card>
      </div>
    )
  }

  return (
    <div className="appointment">
      <Card title="预约挂号" bordered={false} className="main-card">
        <Steps current={currentStep} className="steps">
          <Steps.Step title="选择科室" />
          <Steps.Step title="选择子科室" />
          <Steps.Step title="选择医生" />
          <Steps.Step title="选择日期" />
          <Steps.Step title="选择时间" />
          <Steps.Step title="确认信息" />
        </Steps>

        <Divider />

        <div className="step-content">
          {currentStep === 0 && (
            <div className="step-department">
              <h3>选择科室</h3>
              <Collapse accordion>
                {departments.map(dept => (
                  <Panel header={dept.name} key={dept.id}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      {dept.subDepartments.map(subDept => (
                        <Button
                          key={subDept}
                          type="text"
                          block
                          onClick={() => handleSubDepartmentChange(subDept)}
                          style={{ textAlign: 'left' }}
                        >
                          {subDept}
                        </Button>
                      ))}
                    </Space>
                  </Panel>
                ))}
              </Collapse>
            </div>
          )}

          {currentStep === 1 && (
            <div className="step-department">
              <h3>已选择：{appointmentData.subDepartment}</h3>
              <p className="hint">正在加载医生信息...</p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-doctor">
              <h3>选择医生</h3>
              <div className="doctor-list">
                {doctors.map(doctor => (
                  <Card
                    key={doctor.id}
                    hoverable
                    className={`doctor-card ${appointmentData.doctor?.id === doctor.id ? 'selected' : ''}`}
                    onClick={() => handleDoctorChange(doctor.id)}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div className="doctor-header">
                        <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                        <div>
                          <div className="doctor-name">{doctor.name}</div>
                          <Tag color="blue">{doctor.title}</Tag>
                        </div>
                      </div>
                      <div className="doctor-info">
                        <p><strong>科室：</strong>{doctor.department}</p>
                        <p><strong>擅长：</strong>{doctor.expertise}</p>
                      </div>
                      <div className="doctor-slots">
                        <Tag color="green">
                          <ClockCircleOutlined /> 剩余号源：{doctor.availableSlots}
                        </Tag>
                      </div>
                    </Space>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-date">
              <h3>选择就诊日期</h3>
              <div className="date-grid">
                {generateDates().map(date => (
                  <Card
                    key={date.value}
                    hoverable
                    className={`date-card ${appointmentData.date === date.value ? 'selected' : ''}`}
                    onClick={() => handleDateChange(date.value)}
                  >
                    <CalendarOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                    <div className="date-label">{date.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-time">
              <h3>选择就诊时间</h3>
              <p className="hint">已选择日期：{appointmentData.date}</p>
              <div className="time-grid">
                {timeSlots.map(slot => (
                  <Card
                    key={slot}
                    hoverable
                    className={`time-card ${appointmentData.timeSlot === slot ? 'selected' : ''}`}
                    onClick={() => handleTimeSlotSelect(slot)}
                  >
                    <ClockCircleOutlined />
                    <div>{slot}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="step-confirm">
              <h3>确认预约信息</h3>
              <Card className="confirm-card">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="就诊科室">{appointmentData.subDepartment}</Descriptions.Item>
                  <Descriptions.Item label="就诊医生">
                    {appointmentData.doctor?.name} - {appointmentData.doctor?.title}
                  </Descriptions.Item>
                  <Descriptions.Item label="擅长领域">{appointmentData.doctor?.expertise}</Descriptions.Item>
                  <Descriptions.Item label="就诊日期">{appointmentData.date}</Descriptions.Item>
                  <Descriptions.Item label="就诊时间">{appointmentData.timeSlot}</Descriptions.Item>
                </Descriptions>

                <Divider />

                <h4>患者信息</h4>
                <div className="patient-form">
                  <div className="form-item">
                    <label>姓名 *</label>
                    <input
                      type="text"
                      value={appointmentData.patientName}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="请输入患者姓名"
                    />
                  </div>
                  <div className="form-item">
                    <label>手机号 *</label>
                    <input
                      type="tel"
                      value={appointmentData.patientPhone}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, patientPhone: e.target.value }))}
                      placeholder="请输入手机号"
                    />
                  </div>
                  <div className="form-item">
                    <label>症状描述</label>
                    <textarea
                      value={appointmentData.symptoms}
                      onChange={(e) => setAppointmentData(prev => ({ ...prev, symptoms: e.target.value }))}
                      placeholder="请简要描述症状或就诊目的"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="actions">
                  <Button onClick={handleBack}>上一步</Button>
                  <Button type="primary" onClick={handleSubmit} loading={booking}>
                    确认预约
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>

      <Modal
        title={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
        open={successModal}
        onCancel={resetForm}
        footer={null}
        centered
        className="success-modal"
      >
        {appointmentResult && (
          <div className="success-content">
            <h3>预约成功！</h3>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="预约编号">{appointmentResult.appointmentId}</Descriptions.Item>
              <Descriptions.Item label="就诊医院">{appointmentResult.hospital}</Descriptions.Item>
              <Descriptions.Item label="就诊医生">{appointmentResult.doctor}</Descriptions.Item>
              <Descriptions.Item label="就诊时间">{appointmentResult.appointmentTime}</Descriptions.Item>
              <Descriptions.Item label="预约状态">
                <Tag color="success">已预约</Tag>
              </Descriptions.Item>
            </Descriptions>
            <div className="modal-actions">
              <Button type="primary" onClick={resetForm}>完成</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Appointment
