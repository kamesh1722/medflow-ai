import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ admin, ready, children }) {
  const location = useLocation()
  if (!ready) {
    return <main className="auth-loading" aria-live="polite"><div className="auth-spinner"/><span>Checking administrator session…</span></main>
  }
  if (!admin) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
