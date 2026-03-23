import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './components/Layout/MainLayout'
import Consultation from './pages/Consultation'
import ReportAnalysis from './pages/ReportAnalysis'
import Appointment from './pages/Appointment'
import DoctorReview from './pages/DoctorReview'
import Profile from './pages/Profile'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Consultation />} />
            <Route path="report" element={<ReportAnalysis />} />
            <Route path="appointment" element={<Appointment />} />
            <Route path="review" element={<DoctorReview />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
