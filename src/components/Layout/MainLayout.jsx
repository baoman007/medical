import { Layout } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  MessageOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  AuditOutlined
} from '@ant-design/icons'
import './MainLayout.css'

const { Header, Content, Sider } = Layout

const menuItems = [
  { key: '/', icon: <MessageOutlined />, label: '智能问诊' },
  { key: '/report', icon: <FileTextOutlined />, label: '报告解读' },
  { key: '/appointment', icon: <CalendarOutlined />, label: '预约挂号' },
  { key: '/review', icon: <AuditOutlined />, label: '医生复核' },
  { key: '/profile', icon: <UserOutlined />, label: '个人中心' }
]

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="logo">
          🏥 智慧医疗AI助手
        </div>
        <div className="disclaimer">
          AI辅助 · 不构成医疗建议
        </div>
      </Header>
      <Layout>
        <Sider width={200} theme="light" className="sider">
          <div className="menu">
            {menuItems.map(item => (
              <div
                key={item.key}
                className={`menu-item ${location.pathname === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </div>
            ))}
          </div>
        </Sider>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
