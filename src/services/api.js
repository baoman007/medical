// 医疗AI服务 - 支持DeepSeek API和备用模拟数据
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 配置：是否使用后端API（DeepSeek）
const USE_BACKEND_API = true

// 模拟数据（备用）
const medicalKnowledgeBase = {
  headache: {
    department: '神经内科',
    urgency: '视情况',
    symptoms: ['头疼', '头痛', '偏头痛'],
    advice: '头痛是常见症状，可能原因包括紧张性头痛、偏头痛、颈椎病等。建议您注意休息，避免长时间低头看手机或电脑。如果头痛持续不缓解或伴随呕吐、意识模糊，请及时就医。',
    questions: ['头痛多久了？', '是持续性还是间歇性？', '是否伴随恶心呕吐？']
  },
  fever: {
    department: '发热门诊',
    urgency: '较紧急',
    symptoms: ['发热', '发烧', '体温升高'],
    advice: '发热是身体对感染的免疫反应。建议您：1. 多喝温水；2. 物理降温；3. 体温超过38.5°C可使用退烧药。如持续高热不退或出现呼吸困难，请立即就医。',
    questions: ['体温多少度？', '持续多久？', '是否伴随咳嗽或咽痛？']
  },
  cough: {
    department: '呼吸内科',
    urgency: '视情况',
    symptoms: ['咳嗽', '咳痰'],
    advice: '咳嗽是呼吸道疾病的常见症状。建议多喝水，避免刺激性食物。如咳嗽持续超过2周、咳血或伴随呼吸困难，请及时就医。',
    questions: ['干咳还是有痰？', '多久了？', '是否有呼吸困难？']
  },
  hypertension: {
    department: '心血管内科',
    urgency: '视情况',
    symptoms: ['高血压', '血压高'],
    advice: '高血压患者日常注意事项：1. 定期监测血压；2. 低盐饮食；3. 适量运动；4. 按时服药；5. 戒烟限酒。请遵医嘱调整用药，不可自行停药。',
    questions: ['血压控制如何？', '是否按时服药？', '有无头晕头痛？']
  },
  medication: {
    department: '药学部',
    urgency: '一般',
    advice: '关于用药提醒：\n• 饭前服：刺激胃小的药，需空腹吸收\n• 饭后服：减少胃肠道刺激\n• 睡前服：镇静类、降脂类\n• 每日定时服药，设置提醒\n\n如有疑问请咨询药师或医生。'
  },
  report: {
    department: '相应科室',
    urgency: '视情况',
    advice: '体检报告解读提示：\n• 箭头↑表示指标偏高\n• 箭头↓表示指标偏低\n• (+) 表示阳性\n• 异常指标需结合临床症状\n\n请携带报告咨询医生进行综合分析。'
  },
  default: {
    department: '待定',
    urgency: '视情况',
    advice: '根据您的描述，建议您：\n1. 保持良好作息，注意休息\n2. 饮食清淡，避免刺激性食物\n3. 适当运动，增强体质\n4. 如症状持续不缓解，请及时就医\n\n如需更详细的健康建议，建议您描述更多症状细节或预约医生面诊。'
  }
}

// 紧急情况检测函数
const checkEmergency = (text) => {
  const emergencyKeywords = [
    '胸痛', '心悸', '晕厥', '昏迷', '大出血',
    '严重呼吸困难', '剧烈头痛', '抽搐', '休克',
    '心跳骤停', '意识不清', '大吐血'
  ]
  return emergencyKeywords.some(keyword => text.includes(keyword))
}

export async function chatWithAI(message) {
  // 检查是否为紧急情况
  if (checkEmergency(message)) {
    return {
      answer: `⚠️ 【紧急提醒】\n\n您描述的症状需要立即医疗关注！\n\n建议措施：\n1. 立即拨打 120 急救电话\n2. 或尽快前往最近医院急诊科\n3. 保持镇静，如有人在场请告知\n4. 如有可能，记录症状开始时间\n\n请不要依赖本AI系统，立即寻求专业医疗帮助！`,
      department: '急诊科',
      urgency: '紧急',
      isEmergency: true
    }
  }

  // 使用后端API（DeepSeek）
  if (USE_BACKEND_API) {
    try {
      console.log('调用后端API分析:', message)
      console.log('API地址:', API_BASE_URL)
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 1, // 临时用户ID
          message: message
        })
      })

      console.log('响应状态:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        console.log('后端API返回结果:', result)
        console.log('返回的answer字段:', result.answer)
        return result
      } else {
        console.error('后端API调用失败，状态码:', response.status)
        const errorText = await response.text()
        console.error('错误响应:', errorText)
        throw new Error(`API返回错误: ${response.status}`)
      }
    } catch (error) {
      console.error('后端API调用失败，切换到备用模式:', error.message)
      console.error('错误堆栈:', error.stack)
      // 继续使用备用方案
    }
  }

  // 备用方案：使用模拟数据
  await mockDelay(1500)

  const lowerMessage = message.toLowerCase()

  let result = medicalKnowledgeBase.default

  if (lowerMessage.includes('头疼') || lowerMessage.includes('头痛') || lowerMessage.includes('偏头痛')) {
    result = medicalKnowledgeBase.headache
  } else if (lowerMessage.includes('发热') || lowerMessage.includes('发烧') || lowerMessage.includes('体温')) {
    result = medicalKnowledgeBase.fever
  } else if (lowerMessage.includes('咳嗽') || lowerMessage.includes('咳')) {
    result = medicalKnowledgeBase.cough
  } else if (lowerMessage.includes('高血压') || lowerMessage.includes('血压')) {
    result = medicalKnowledgeBase.hypertension
  } else if (lowerMessage.includes('药') || lowerMessage.includes('服药') || lowerMessage.includes('用药')) {
    result = medicalKnowledgeBase.medication
  } else if (lowerMessage.includes('报告') || lowerMessage.includes('体检') || lowerMessage.includes('指标')) {
    result = medicalKnowledgeBase.report
  }

  const answer = `${result.advice}\n\n【推荐科室】${result.department}\n【紧急程度】${result.urgency}\n\n温馨提示：本回复仅供参考，不构成医疗建议。请以医生诊断为准。`

  return {
    answer,
    department: result.department,
    urgency: result.urgency
  }
}

export async function analyzeReport(imageFile) {
  await mockDelay(2000)

  return {
    success: true,
    reportType: '血常规',
    items: [
      { name: '白细胞计数 (WBC)', value: '6.5×10⁹/L', reference: '4-10×10⁹/L', status: '正常' },
      { name: '红细胞计数 (RBC)', value: '4.8×10¹²/L', reference: '4.0-5.5×10¹²/L', status: '正常' },
      { name: '血红蛋白 (HGB)', value: '142 g/L', reference: '120-160 g/L', status: '正常' },
      { name: '血小板计数 (PLT)', value: '185×10⁹/L', reference: '100-300×10⁹/L', status: '正常' }
    ],
    summary: '您的血常规检查结果均在正常范围内，未发现明显异常。建议保持良好的生活习惯，定期体检。如不适请及时就医。',
    suggestions: [
      '继续保持良好的生活习惯',
      '均衡饮食，适量运动',
      '充足睡眠，避免熬夜',
      '定期体检，监测健康'
    ]
  }
}

export async function getDepartments() {
  await mockDelay(500)

  return [
    { id: 1, name: '内科', subDepartments: ['心血管内科', '呼吸内科', '消化内科', '内分泌科', '神经内科'] },
    { id: 2, name: '外科', subDepartments: ['普外科', '骨科', '神经外科', '泌尿外科', '胸外科'] },
    { id: 3, name: '妇儿科', subDepartments: ['妇科', '产科', '儿科', '新生儿科'] },
    { id: 4, name: '专科', subDepartments: ['眼科', '耳鼻喉科', '口腔科', '皮肤科'] },
    { id: 5, name: '急诊', subDepartments: ['急诊内科', '急诊外科'] }
  ]
}

export async function getDoctors(departmentId) {
  await mockDelay(500)

  const doctors = [
    { id: 1, name: '张医生', title: '主任医师', department: '心血管内科', expertise: '冠心病、高血压', availableSlots: 5 },
    { id: 2, name: '李医生', title: '副主任医师', department: '心血管内科', expertise: '心律失常、心力衰竭', availableSlots: 3 },
    { id: 3, name: '王医生', title: '主任医师', department: '神经内科', expertise: '脑血管病、帕金森病', availableSlots: 8 },
    { id: 4, name: '赵医生', title: '副主任医师', department: '消化内科', expertise: '胃炎、胃溃疡', availableSlots: 4 },
    { id: 5, name: '刘医生', title: '主治医师', department: '呼吸内科', expertise: '支气管炎、肺炎', availableSlots: 6 }
  ]

  return doctors.filter(doctor => {
    if (departmentId === 1) return ['心血管内科', '呼吸内科', '消化内科', '内分泌科', '神经内科'].includes(doctor.department)
    if (departmentId === 3) return doctor.department.includes('神经内科')
    return true
  })
}

export async function bookAppointment(appointmentData) {
  await mockDelay(1000)

  return {
    success: true,
    appointmentId: `AP${Date.now()}`,
    appointmentTime: appointmentData.appointmentTime,
    doctor: appointmentData.doctorName,
    hospital: '智慧医疗医院',
    status: '已预约'
  }
}

export async function getPendingReviews() {
  await mockDelay(300)

  return [
    {
      id: 1,
      patient: '张三',
      type: '智能问诊',
      content: '患者描述头痛症状，持续3天，伴随恶心。AI建议就诊神经内科。',
      timestamp: '2026-03-23 10:30',
      status: '待复核'
    },
    {
      id: 2,
      patient: '李四',
      type: '报告解读',
      content: '血常规检查白细胞偏高，AI提示可能有感染。',
      timestamp: '2026-03-23 11:15',
      status: '待复核'
    },
    {
      id: 3,
      patient: '王五',
      type: '用药咨询',
      content: '高血压患者询问是否可以自行减量。',
      timestamp: '2026-03-23 12:00',
      status: '待复核'
    }
  ]
}

export async function submitReview(reviewId, action, comment) {
  await mockDelay(500)

  return {
    success: true,
    message: action === 'approve' ? '已确认' : '已驳回'
  }
}
