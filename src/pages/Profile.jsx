import { Card, Row, Col, Avatar, Tag, Descriptions, List, Button, Divider, Modal, Form, Input, message } from 'antd'
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SafetyOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useState } from 'react'
import './Profile.css'

const initialUserData = {
  name: '张三',
  phone: '138****8888',
  email: 'zhang***@example.com',
  age: 35,
  gender: '男',
  idCard: '310***********1234',
  address: '上海市浦东新区***路***号',
  registerDate: '2025-01-15'
}

const healthData = {
  height: 175,
  weight: 70,
  bloodPressure: '120/80',
  heartRate: 72,
  bloodType: 'A型',
  allergies: '青霉素',
  chronicDiseases: '高血压（控制良好）',
  lastCheckup: '2026-02-20',
  nextCheckup: '2026-08-20'
}

const appointments = [
  {
    id: 'AP2026032301',
    doctor: '张医生',
    department: '心血管内科',
    date: '2026-03-20',
    time: '09:00',
    status: '已完成'
  },
  {
    id: 'AP2026032501',
    doctor: '李医生',
    department: '神经内科',
    date: '2026-03-25',
    time: '14:30',
    status: '待就诊'
  },
  {
    id: 'AP2026032801',
    doctor: '王医生',
    department: '消化内科',
    date: '2026-03-28',
    time: '10:00',
    status: '待就诊'
  }
]

const healthRecords = [
  {
    date: '2026-02-20',
    type: '年度体检',
    department: '体检中心',
    result: '正常'
  },
  {
    date: '2026-01-15',
    type: '血常规',
    department: '检验科',
    result: '正常'
  },
  {
    date: '2025-12-10',
    type: '心电图',
    department: '心电图室',
    result: '正常'
  }
]

function Profile() {
  const [userData, setUserData] = useState(initialUserData)
  const [editModal, setEditModal] = useState(false)
  const [settingModal, setSettingModal] = useState(false)
  const [form] = Form.useForm()

  const handleEditProfile = () => {
    form.setFieldsValue(userData)
    setEditModal(true)
  }

  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields()
      setUserData(prev => ({ ...prev, ...values }))
      setEditModal(false)
      message.success('个人信息更新成功')
    } catch (error) {
      message.error('请填写完整信息')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      '待就诊': { color: 'warning', text: '待就诊' },
      '已完成': { color: 'success', text: '已完成' },
      '已取消': { color: 'default', text: '已取消' }
    }
    const { color, text } = statusMap[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  const getResultBadge = (result) => {
    const resultMap = {
      '正常': { color: 'success', text: '正常' },
      '异常': { color: 'error', text: '异常' },
      '待复查': { color: 'warning', text: '待复查' }
    }
    const { color, text } = resultMap[result] || { color: 'default', text: result }
    return <Tag color={color}>{text}</Tag>
  }

  return (
    <div className="profile">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="个人信息" bordered={false} className="profile-card">
            <div className="user-avatar-section">
              <Avatar size={100} icon={<UserOutlined />} className="avatar" />
              <h2 className="user-name">{userData.name}</h2>
              <div className="user-tags">
                <Tag color="blue">普通用户</Tag>
                <Tag color="green">已认证</Tag>
              </div>
            </div>

            <Divider />

            <Descriptions column={1} size="small" className="user-info">
              <Descriptions.Item label="手机号">
                <PhoneOutlined /> {userData.phone}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <MailOutlined /> {userData.email}
              </Descriptions.Item>
              <Descriptions.Item label="年龄">{userData.age} 岁</Descriptions.Item>
              <Descriptions.Item label="性别">{userData.gender}</Descriptions.Item>
              <Descriptions.Item label="注册日期">
                <CalendarOutlined /> {userData.registerDate}
              </Descriptions.Item>
            </Descriptions>

            <Button
              type="primary"
              block
              icon={<EditOutlined />}
              onClick={handleEditProfile}
              className="edit-btn"
            >
              编辑资料
            </Button>
          </Card>

          <Card title="健康档案" bordered={false} className="health-card">
            <Row gutter={16}>
              <Col span={12}>
                <div className="health-item">
                  <div className="health-label">身高</div>
                  <div className="health-value">{healthData.height} cm</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="health-item">
                  <div className="health-label">体重</div>
                  <div className="health-value">{healthData.weight} kg</div>
                </div>
              </Col>
            </Row>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="血压">
                {healthData.bloodPressure} mmHg
              </Descriptions.Item>
              <Descriptions.Item label="心率">
                {healthData.heartRate} 次/分
              </Descriptions.Item>
              <Descriptions.Item label="血型">{healthData.bloodType}</Descriptions.Item>
              <Descriptions.Item label="过敏史">
                <Tag color="red">{healthData.allergies}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="慢病">
                {healthData.chronicDiseases}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div className="checkup-info">
              <div className="info-row">
                <span>上次体检：</span>
                <span className="info-value">{healthData.lastCheckup}</span>
              </div>
              <div className="info-row">
                <span>下次体检：</span>
                <span className="info-value">{healthData.nextCheckup}</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="预约记录" bordered={false} className="appointment-card">
            <List
              dataSource={appointments}
              renderItem={item => (
                <List.Item className="appointment-item">
                  <List.Item.Meta
                    avatar={<Avatar icon={<CalendarOutlined />} />}
                    title={
                      <div className="appointment-title">
                        <span>{item.doctor} - {item.department}</span>
                        {getStatusBadge(item.status)}
                      </div>
                    }
                    description={
                      <div className="appointment-desc">
                        <ClockCircleOutlined /> {item.date} {item.time} · {item.id}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="健康记录" bordered={false} className="record-card">
            <List
              dataSource={healthRecords}
              renderItem={item => (
                <List.Item className="record-item">
                  <List.Item.Meta
                    avatar={<Avatar icon={<FileTextOutlined />} />}
                    title={
                      <div className="record-title">
                        <span>{item.type}</span>
                        {getResultBadge(item.result)}
                      </div>
                    }
                    description={
                      <div className="record-desc">
                        {item.department} · {item.date}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="快捷设置" bordered={false} className="settings-card">
            <div className="setting-buttons">
              <Button
                icon={<SafetyOutlined />}
                onClick={() => setSettingModal(true)}
              >
                隐私设置
              </Button>
              <Button icon={<SettingOutlined />}>
                通知设置
              </Button>
              <Button icon={<CheckCircleOutlined />}>
                账号安全
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="编辑个人信息"
        open={editModal}
        onOk={handleSaveProfile}
        onCancel={() => {
          setEditModal(false)
          form.resetFields()
        }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item name="address" label="地址">
            <Input.TextArea
              placeholder="请输入详细地址"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="隐私设置"
        open={settingModal}
        onCancel={() => setSettingModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setSettingModal(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={() => {
            setSettingModal(false)
            message.success('设置已保存')
          }}>
            保存
          </Button>
        ]}
      >
        <div className="privacy-settings">
          <div className="setting-item">
            <div className="setting-title">允许AI分析健康数据</div>
            <div className="setting-desc">授权AI助手分析您的健康记录，提供个性化建议</div>
          </div>
          <Divider />
          <div className="setting-item">
            <div className="setting-title">接收健康提醒</div>
            <div className="setting-desc">在就诊前、复查日等时间节点接收提醒通知</div>
          </div>
          <Divider />
          <div className="setting-item">
            <div className="setting-title">数据匿名化处理</div>
            <div className="setting-desc">在数据分析时自动隐藏个人敏感信息</div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Profile
