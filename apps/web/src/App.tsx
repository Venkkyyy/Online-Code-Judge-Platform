import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import RegisterPage from './pages/RegisterPage'
import ProblemsPage from './pages/ProblemsPage'
import WorkspacePage from './pages/WorkspacePage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:id" element={<WorkspacePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}

export default App
