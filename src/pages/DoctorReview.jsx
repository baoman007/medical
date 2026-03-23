import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, message, Modal, Form, Input, Space, Alert, Tabs, Empty, Spin } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { getPendingReviews, submitReview } from '../services/api'
import './DoctorReview.css'

const { TextArea } = Input

function DoctorReview() {
  const [loading, setLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [reviewForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const data = await getPendingReviews()
      setReviews(data)
    } catch (error) {
      message.error('获取待复核列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (review) => {
    setSelectedReview(review)
    setDetailModal(true)
  }

  const handleReview = async (action) => {
    try {
      await reviewForm.validateFields()
      const values = reviewForm.getFieldsValue()
      await submitReview(selectedReview.id, action, values.comment)

      message.success(action === 'approve' ? '已确认该建议' : '已驳回该建议')
      setDetailModal(false)
      reviewForm.resetFields()

      setReviews(prev => prev.filter(r => r.id !== selectedReview.id))
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写审核意见')
      } else {
        message.error('操作失败，请重试')
      }
    }
  }

  const getTypeColor = (type) => {
    const colorMap = {
      '智能问诊': 'blue',
      '报告解读': 'green',
      '用药咨询': 'orange'
    }
    return colorMap[type] || 'default'
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      '待复核': { color: 'warning', text: '待复核' },
      '已确认': { color: 'success', text: '已确认' },
      '已驳回': { color: 'error', text: '已驳回' }
    }
    const { color, text } = statusMap[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  const columns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '患者',
      dataIndex: 'patient',
      key: 'patient',
      width: 120
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => <Tag color={getTypeColor(type)}>{type}</Tag>
    },
    {
      title: '内容摘要',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content) => (
        <div className="content-ellipsis">
          {content.length > 50 ? content.substring(0, 50) + '...' : content}
        </div>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusBadge(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看
        </Button>
      )
    }
  ]

  const pendingReviews = reviews.filter(r => r.status === '待复核')
  const reviewedReviews = reviews.filter(r => r.status !== '待复核')

  return (
    <div className="doctor-review">
      <Card title="医生复核中心" bordered={false} className="main-card">
        <Alert
          message="医生复核说明"
          description="本系统所有AI建议均需医生复核后才能生效。请仔细核对AI分析结果，确认或驳回建议。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  <ClockCircleOutlined />
                  待复核 ({pendingReviews.length})
                </span>
              ),
              children: (
                <div className="tab-content">
                  {loading ? (
                    <div className="loading-container">
                      <Spin size="large" tip="加载中..." />
                    </div>
                  ) : pendingReviews.length === 0 ? (
                    <Empty
                      description="暂无需复核的内容"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <Table
                      columns={columns}
                      dataSource={pendingReviews}
                      rowKey="id"
                      pagination={false}
                      scroll={{ x: 1000 }}
                    />
                  )}
                </div>
              )
            },
            {
              key: 'reviewed',
              label: '已复核',
              children: (
                <div className="tab-content">
                  {loading ? (
                    <div className="loading-container">
                      <Spin size="large" tip="加载中..." />
                    </div>
                  ) : reviewedReviews.length === 0 ? (
                    <Empty
                      description="暂无复核记录"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <Table
                      columns={columns}
                      dataSource={reviewedReviews}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条记录`
                      }}
                      scroll={{ x: 1000 }}
                    />
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title="AI建议详情"
        open={detailModal}
        onCancel={() => {
          setDetailModal(false)
          reviewForm.resetFields()
        }}
        width={700}
        footer={null}
        className="detail-modal"
      >
        {selectedReview && (
          <div className="review-detail">
            <div className="detail-header">
              <Space size="large">
                <div>
                  <span className="label">患者：</span>
                  <span className="value">{selectedReview.patient}</span>
                </div>
                <div>
                  <span className="label">类型：</span>
                  <Tag color={getTypeColor(selectedReview.type)}>{selectedReview.type}</Tag>
                </div>
                <div>
                  <span className="label">时间：</span>
                  <span className="value">{selectedReview.timestamp}</span>
                </div>
              </Space>
            </div>

            <div className="detail-content">
              <div className="content-title">AI分析内容</div>
              <div className="content-text">{selectedReview.content}</div>
            </div>

            <Alert
              message="审核要求"
              description={
                <ul className="audit-requirements">
                  <li>✓ 核对AI分析的医学准确性</li>
                  <li>✓ 确认建议的科室和就诊时机是否合理</li>
                  <li>✓ 检查是否存在风险提示遗漏</li>
                  <li>✓ 确保回答符合医疗规范和伦理</li>
                </ul>
              }
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
              style={{ margin: '20px 0' }}
            />

            <Form form={reviewForm} layout="vertical">
              <Form.Item
                name="comment"
                label="审核意见"
                rules={[{ required: true, message: '请填写审核意见' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请详细说明审核意见，包括确认或驳回的原因..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>

            <div className="modal-actions">
              <Space>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleReview('reject')}
                >
                  驳回
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleReview('approve')}
                >
                  确认
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DoctorReview
