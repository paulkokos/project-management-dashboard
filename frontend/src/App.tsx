import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import ProjectList from '@/pages/ProjectList'
import ProjectDetail from '@/pages/ProjectDetail'
import ProjectCreate from '@/pages/ProjectCreate'
import ProjectEdit from '@/pages/ProjectEdit'
import ProjectChangeLog from '@/pages/ProjectChangeLog'
import DeletedProjects from '@/pages/DeletedProjects'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Settings from '@/pages/Settings'
import Search from '@/pages/Search'
import { useAuthStore } from '@/stores/authStore'
import { useWebSocket } from '@/hooks'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { NotificationContainer } from '@/components/NotificationContainer'

const queryClient = new QueryClient()

function AppContent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const checkAuth = useAuthStore((state) => state.checkAuth)

  // Check authentication on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Initialize WebSocket connection when authenticated
  useWebSocket({ autoConnect: isAuthenticated })

  // Auth routes - only show to unauthenticated users
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Authenticated routes
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/new" element={<ProjectCreate />} />
        <Route path="/projects/deleted" element={<DeletedProjects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/edit" element={<ProjectEdit />} />
        <Route path="/projects/:id/changelog" element={<ProjectChangeLog />} />
        <Route path="/search" element={<Search />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <NotificationContainer />
    </Layout>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </QueryClientProvider>
  )
}

export default App
