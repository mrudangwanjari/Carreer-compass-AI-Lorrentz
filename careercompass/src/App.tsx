import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { AuthProvider }  from './context/AuthContext'
import { ResumeProvider } from './context/ResumeContext'
import { JobsProvider }   from './context/JobsContext'
import { RecsProvider }   from './context/RecommendationsContext'

import Landing       from './pages/Landing'
import Login         from './pages/Login'
import Register      from './pages/Register'

import Overview      from './pages/dashboard/Overview'
import ResumePage    from './pages/dashboard/ResumePage'
import JobsPage      from './pages/dashboard/JobsPage'
import CoursesPage   from './pages/dashboard/CoursesPage'
import ResearchPage  from './pages/dashboard/ResearchPage'
import RoadmapPage   from './pages/dashboard/RoadmapPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'
import SettingsPage  from './pages/dashboard/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ResumeProvider>
        <JobsProvider>
        <RecsProvider>
        <Navbar />

        <Routes>
          {/* ── Public ── */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Dashboard (protected shell) ── */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index                  element={<Overview />} />
            <Route path="resume"          element={<ResumePage />} />
            <Route path="jobs"            element={<JobsPage />} />
            <Route path="courses"         element={<CoursesPage />} />
            <Route path="research"        element={<ResearchPage />} />
            <Route path="roadmap"         element={<RoadmapPage />} />
            <Route path="analytics"       element={<AnalyticsPage />} />
            <Route path="settings"        element={<SettingsPage />} />
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </RecsProvider>
        </JobsProvider>
      </ResumeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
