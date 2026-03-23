import { useState, useRef, useEffect } from 'react'
import { Card, Input, Button, message, Tag, Space, Spin, Modal, Form, Radio } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { chatWithAI } from '../services/api'
import './Consultation.css'

const initialSymptoms = [
  '头疼', '发热', '咳嗽', '腹痛', '乏力', '失眠',
  '恶心', '关节痛', '咽痛', '呼吸困难'
]

const quickQuestions = [
  '我最近总是头疼，应该怎么办？',
  '体检报告上的指标异常代表什么？',
  '高血压患者平时需要注意什么？',
  '这个药饭前吃还是饭后吃？'
]

function Consultation() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '您好！我是您的智慧医疗AI助手。\n\n我可以为您提供以下服务：\n• 智能导诊与分诊建议\n• 健康咨询与症状科普\n• 用药提醒与注意事项\n• 检查报告解读（辅助）\n• 慢病管理建议\n\n请告诉我您的主要症状或问题，我会尽力为您提供帮助。\n\n⚠️ 提示：本服务为AI辅助，不构成医疗建议。如有不适请及时就医。'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false)
  const [currentSymptom, setCurrentSymptom] = useState('')
  const [form] = Form.useForm()
  const messagesEndRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const detectEmergency = (text) => {
    const emergencyKeywords = ['胸痛', '心悸', '晕厥', '昏迷', '大出血', '严重呼吸困难', '剧烈头痛', '抽搐', '休克']
    return emergencyKeywords.some(keyword => text.includes(keyword))
  }

  const handleEmergency = () => {
    Modal.warning({
      title: '⚠️ 紧急提醒',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: '您描述的症状可能属于紧急情况，请立即拨打120急救电话或前往最近医院的急诊科就医！',
      okText: '我知道了'
    })
    return {
      type: 'emergency',
      content: '⚠️ 【紧急提醒】\n\n您描述的症状需要立即医疗关注！\n\n建议措施：\n1. 立即拨打 120 急救电话\n2. 或尽快前往最近医院急诊科\n3. 保持镇静，如有人在场请告知\n4. 如有可能，记录症状开始时间\n\n请不要依赖本AI系统，立即寻求专业医疗帮助！'
    }
  }

  const handleSend = async () => {
    if (!inputText.trim()) return

    const userText = inputText.trim()

    // 检测紧急情况（双重检测：前端+后端）
    if (detectEmergency(userText)) {
      const emergencyResponse = handleEmergency()
      setMessages(prev => [
        ...prev,
        { id: Date.now(), type: 'user', content: userText },
        { id: Date.now() + 1, type: 'ai', ...emergencyResponse }
      ])
      setInputText('')
      return
    }

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: userText }])
    setInputText('')
    setLoading(true)

    try {
      const response = await chatWithAI(userText)

      // 检查后端返回的是否为紧急情况
      if (response.isEmergency) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'ai',
            content: response.answer,
            urgency: response.urgency,
            department: response.department,
            isEmergency: true
          }
        ])
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          content: response.answer,
          department: response.department,
          urgency: response.urgency
        }])
      }
    } catch (error) {
      message.error('获取回复失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSymptomClick = (symptom) => {
    setCurrentSymptom(symptom)
    setFollowUpModalVisible(true)
  }

  const handleQuickQuestion = (question) => {
    setInputText(question)
  }

  const handleFollowUpSubmit = async (values) => {
    const followUpText = `症状：${currentSymptom}\n持续时间：${values.duration}\n伴随症状：${values.accompanying || '无'}\n严重程度：${values.severity}`
    setInputText(followUpText)
    setFollowUpModalVisible(false)
    form.resetFields()

    setTimeout(() => {
      handleSend()
    }, 100)
  }

  return (
    <div className="consultation">
      <div className="quick-actions">
        <Space wrap size="small">
          <span className="quick-label">常见症状：</span>
          {initialSymptoms.map(symptom => (
            <Tag
              key={symptom}
              className="symptom-tag"
              onClick={() => handleSymptomClick(symptom)}
            >
              {symptom}
            </Tag>
          ))}
        </Space>
      </div>

      <div className="quick-questions">
        <Space wrap>
          {quickQuestions.map((question, index) => (
            <Button
              key={index}
              type="text"
              size="small"
              className="quick-question-btn"
              onClick={() => handleQuickQuestion(question)}
            >
              {question}
            </Button>
          ))}
        </Space>
      </div>

      <Card className="chat-container" bordered={false}>
        <div className="messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <div className="message-header">
                {msg.type === 'ai' ? (
                  <>
                    <RobotOutlined className="avatar-icon ai-avatar" />
                    <span className="sender">AI助手</span>
                  </>
                ) : (
                  <>
                    <UserOutlined className="avatar-icon user-avatar" />
                    <span className="sender">用户</span>
                  </>
                )}
              </div>
              <div className="message-content">
                {msg.urgency && (
                  <Tag color={msg.urgency === '紧急' ? 'red' : msg.urgency === '较紧急' ? 'orange' : 'green'}>
                    {msg.urgency}
                  </Tag>
                )}
                {msg.department && <Tag color="blue">{msg.department}</Tag>}
                <div className="text">{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="message ai">
              <div className="message-header">
                <RobotOutlined className="avatar-icon ai-avatar" />
                <span className="sender">AI助手</span>
              </div>
              <div className="message-content">
                <Spin size="small" /> 正在分析...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <Input.TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="请描述您的症状或问题..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!inputText.trim()}
            className="send-btn"
          >
            发送
          </Button>
        </div>
      </Card>

      <Modal
        title={`症状详情：${currentSymptom}`}
        open={followUpModalVisible}
        onCancel={() => {
          setFollowUpModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
        okText="提交咨询"
      >
        <Form form={form} onFinish={handleFollowUpSubmit} layout="vertical">
          <Form.Item
            label="持续时间"
            name="duration"
            rules={[{ required: true, message: '请选择持续时间' }]}
          >
            <Radio.Group>
              <Radio value="今天">今天</Radio>
              <Radio value="1-3天">1-3天</Radio>
              <Radio value="4-7天">4-7天</Radio>
              <Radio value="1-2周">1-2周</Radio>
              <Radio value="超过2周">超过2周</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="伴随症状" name="accompanying">
            <Input.TextArea
              placeholder="请描述其他伴随症状，如：发热、呕吐等"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          <Form.Item
            label="严重程度"
            name="severity"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Radio.Group>
              <Radio value="轻微">轻微</Radio>
              <Radio value="中度">中度</Radio>
              <Radio value="较严重">较严重</Radio>
              <Radio value="严重">严重</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Consultation
