import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { currentUser, userRole, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) return (
    <div className="page page-centered">
      <div className="spinner" />
    </div>
  )

  if (!currentUser)
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />

  if (userRole !== 'admin') return <Navigate to="/" replace />

  return children
}
