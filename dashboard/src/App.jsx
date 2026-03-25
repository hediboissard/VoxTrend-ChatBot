import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Conversations from './pages/Conversations'
import ToastProvider from './components/ToastProvider'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('vox_token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      {/* ToastProvider doit être DANS BrowserRouter pour que navigate() fonctionne */}
      <ToastProvider />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/conversations"
          element={
            <PrivateRoute>
              <Conversations />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/conversations" />} />
      </Routes>
    </BrowserRouter>
  )
}
