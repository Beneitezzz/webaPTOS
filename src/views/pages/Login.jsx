import { useState } from 'react'
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useAuth } from '../../context/AuthContext'
import { googleProvider, appleProvider, facebookProvider, auth } from '../../firebase'
import { getAuthError } from '../../utils/authErrors'

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
    <div className="login-split">

      {/* ── Panel izquierdo ── */}
      <div className="login-left">
        <div className="login-deco-circle" />
        <div className="login-left-content">
          <h2>Encontrá alimentos <span>seguros</span> cerca tuyo</h2>
          <p className="login-desc">
            La primera plataforma de Córdoba que centraliza comercios verificados para personas
            con celiaquía, diabetes, SIBO e intolerancia a la lactosa.
          </p>

          <div className="login-benefits">
            <div className="login-benefit login-benefit-1">
              <div className="login-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="19" height="19">
                  <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="login-benefit-text">
                <strong>Guardá tus etiquetas</strong>
                <span>Sin TACC, SIBO, lactosa y más</span>
              </div>
            </div>

            <div className="login-benefit login-benefit-2">
              <div className="login-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="19" height="19">
                  <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.55L3 20l1.05-5.4A8.5 8.5 0 1 1 21 11.5Z" />
                </svg>
              </div>
              <div className="login-benefit-text">
                <strong>Dejá tus reseñas</strong>
                <span>Ayudá a la comunidad</span>
              </div>
            </div>

            <div className="login-benefit login-benefit-3">
              <div className="login-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="19" height="19">
                  <path d="M20.8 8.6c0 5.5-8.8 10.4-8.8 10.4S3.2 14.1 3.2 8.6a4.8 4.8 0 0 1 8.8-2.7 4.8 4.8 0 0 1 8.8 2.7Z" />
                </svg>
              </div>
              <div className="login-benefit-text">
                <strong>Guardá favoritos</strong>
                <span>Tus locales de confianza</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-left-footer">© 2026 PuntoSano · Córdoba, Argentina</div>
      </div>

      {/* ── Panel derecho ── */}
      <div className="login-right">
        <div className="login-form-box">
          <h1>Iniciá sesión</h1>
          <p className="login-subtitle">Accedé a tu cuenta PuntoSano</p>

          <button type="button" className="login-social-btn" onClick={() => handleProvider(googleProvider)}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </button>

          <button type="button" className="login-social-btn login-social-apple" onClick={() => handleProvider(appleProvider)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.28-2.17 3.83.03 3.02 2.65 4.03 2.68 4.04l-.06.25zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Continuar con Apple
          </button>

          <button type="button" className="login-social-btn" onClick={() => handleProvider(facebookProvider)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continuar con Facebook
          </button>

          <div className="login-divider">o con email</div>

          {error && <div className="auth-error">{error}</div>}
          {resetSent && (
            <div className="auth-success">Te enviamos un email para recuperar tu contraseña.</div>
          )}

          <form onSubmit={handleEmail}>
            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                type="email"
                className="login-input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setResetSent(false) }}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label">Contraseña</label>
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="login-forgot" onClick={handlePasswordReset}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="login-footer-links">
            ¿No tenés cuenta?{' '}
            <Link to={`/register/tipo${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
              Registrate
            </Link>
            <button type="button" className="login-guest" onClick={handleGuest}>
              Continuar sin iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
