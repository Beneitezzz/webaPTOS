import { useState } from 'react'
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useAuth } from '../context/AuthContext'
import { googleProvider, appleProvider, facebookProvider, auth } from '../firebase'
import { getAuthError } from '../utils/authErrors'

const PROTECTED_ROUTES = ['/perfil', '/registro-comercio', '/admin']

export default function Login() {
  const { signInWithEmail, signInWithProvider, currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const redirect = searchParams.get('redirect') || '/'

  if (loading) return null
  if (currentUser) return <Navigate to={redirect} replace />

  const handleGuest = () => {
    const isProtected = PROTECTED_ROUTES.some((r) => redirect.startsWith(r))
    navigate(isProtected ? '/' : redirect, { replace: true })
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signInWithEmail(email, password)
      navigate(redirect, { replace: true })
    } catch (err) {
      const msg = getAuthError(err.code)
      if (msg) setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleProvider = async (provider) => {
    setError('')
    try {
      await signInWithProvider(provider)
      navigate(redirect, { replace: true })
    } catch (err) {
      const msg = getAuthError(err.code)
      if (msg) setError(msg)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Ingresá tu email para recuperar la contraseña')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
      setError('')
    } catch (err) {
      const msg = getAuthError(err.code)
      if (msg) setError(msg)
    }
  }

  return (
    <div className="page page-centered">
      <div className="container container-sm">
        <div className="page-header">
          <div className="page-icon"><LogIn size={28} /></div>
          <div>
            <h1>Iniciá sesión</h1>
            <p className="text-muted">Accedé a tu cuenta MapaApto</p>
          </div>
        </div>

        <div className="card form-card">
          <div className="oauth-buttons">
            <button type="button" className="oauth-btn" onClick={() => handleProvider(googleProvider)}>
              <span className="oauth-icon">G</span>
              Continuar con Google
            </button>
            <button type="button" className="oauth-btn" onClick={() => handleProvider(appleProvider)}>
              <span className="oauth-icon"></span>
              Continuar con Apple
            </button>
            <button type="button" className="oauth-btn" onClick={() => handleProvider(facebookProvider)}>
              <span className="oauth-icon">f</span>
              Continuar con Facebook
            </button>
          </div>

          <div className="auth-divider"><span>o con email</span></div>

          {error && <div className="auth-error">{error}</div>}
          {resetSent && (
            <div className="auth-success">
              Te enviamos un email para recuperar tu contraseña.
            </div>
          )}

          <form onSubmit={handleEmail}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setResetSent(false) }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="form-hint" style={{ textAlign: 'right', marginTop: '4px' }}>
                <button type="button" className="btn-link" onClick={handlePasswordReset}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="auth-footer">
            ¿No tenés cuenta?{' '}
            <Link
              to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="link"
            >
              Registrate
            </Link>
          </p>

          <button className="btn-ghost" onClick={handleGuest}>
            Continuar sin iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
