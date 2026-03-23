import { useState } from 'react'
import { Card, Upload, Button, message, Spin, Tag, Space, Divider, Alert, Descriptions, Progress } from 'antd'
import {
  InboxOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { analyzeReport } from '../services/api'
import './ReportAnalysis.css'

const { Dragger } = Upload

function ReportAnalysis() {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)

  const handleUpload = async (info) => {
    const { file } = info

    if (!file) return

    setUploading(true)
    setProgress(30)

    try {
      setAnalyzing(true)
      setProgress(60)

      const analysisResult = await analyzeReport(file)

      setProgress(100)
      setResult(analysisResult)
      message.success('报告解析成功！')
    } catch (error) {
      message.error('报告解析失败，请重试')
    } finally {
      setUploading(false)
      setAnalyzing(false)
      setProgress(0)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case '正常':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case '偏高':
        return <WarningOutlined style={{ color: '#faad14' }} />
      case '偏低':
        return <WarningOutlined style={{ color: '#fa8c16' }} />
      case '异常':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />
      default:
        return <InfoCircleOutlined />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case '正常':
        return 'success'
      case '偏高':
      case '偏低':
        return 'warning'
      case '异常':
        return 'error'
      default:
        return 'default'
    }
  }

  const handleReset = () => {
    setResult(null)
    setProgress(0)
  }

  return (
    <div className="report-analysis">
      <Card title="检查报告解读" bordered={false} className="main-card">
        <Alert
          message="上传您的检查报告，AI将为您解读各项指标"
          description="支持血常规、生化、影像报告等多种检查报告。本服务为AI辅助解读，不构成医疗诊断，如有疑问请咨询医生。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {!result ? (
          <div className="upload-section">
            <Dragger
              accept="image/*"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleUpload}
              disabled={uploading || analyzing}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽检查报告图片到此处上传</p>
              <p className="ant-upload-hint">
                支持 JPG、PNG 等常见图片格式，请确保图片清晰可见
              </p>
            </Dragger>

            {(uploading || analyzing) && (
              <div className="progress-container">
                <Spin size="large" tip={uploading ? '正在上传...' : '正在智能分析...'} />
                <Progress percent={progress} status="active" />
              </div>
            )}
          </div>
        ) : (
          <div className="result-section">
            <div className="result-header">
              <Space>
                <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <span className="report-type">{result.reportType}检查报告</span>
              </Space>
              <Button onClick={handleReset}>上传新报告</Button>
            </div>

            <Divider />

            <div className="report-items">
              <div className="section-title">检查指标</div>
              {result.items.map((item, index) => (
                <Card key={index} size="small" className="item-card">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="项目名称">{item.name}</Descriptions.Item>
                    <Descriptions.Item label="检测结果">
                      <Space>
                        {item.value}
                        <Tag color={getStatusColor(item.status)} icon={getStatusIcon(item.status)}>
                          {item.status}
                        </Tag>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="参考范围">{item.reference}</Descriptions.Item>
                  </Descriptions>
                </Card>
              ))}
            </div>

            <Divider />

            <div className="summary-section">
              <div className="section-title">AI解读总结</div>
              <Alert
                message="综合评估"
                description={result.summary}
                type="success"
                showIcon
              />
            </div>

            <Divider />

            <div className="suggestions-section">
              <div className="section-title">健康建议</div>
              <ul className="suggestions-list">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>

            <Alert
              message="重要提示"
              description="本解读由AI自动生成，仅供参考。如对检查结果有疑问，请携带检查报告咨询专业医生进行综合诊断。"
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default ReportAnalysis
