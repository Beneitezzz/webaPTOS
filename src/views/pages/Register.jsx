import { useState } from 'react'
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { UserPlus, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { googleProvider, appleProvider, facebookProvider } from '../../firebase'
import { getAuthError } from '../../utils/authErrors'

const PROTECTED_ROUTES = ['/perfil', '/registro-comercio', '/admin']

export default function Register() {
  const { registerWithEmail, signInWithProvider, currentUser, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirect = searchParams.get('redirect') || '/'
  const ALLOWED_ROLES = ['user', 'comercio']
  const rol = ALLOWED_ROLES.includes(searchParams.get('rol')) ? searchParams.get('rol') : 'user'

  if (loading) return null
  if (currentUser) return <Navigate to={redirect} replace />

  const handleGuest = () => {
    const isProtected = PROTECTED_ROUTES.some((r) => redirect.startsWith(r))
    navigate(isProtected ? '/' : redirect, { replace: true })
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await registerWithEmail(email, password, displayName, rol)
      navigate(rol === 'comercio' ? '/registro-comercio' : redirect, { replace: true })
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
      await signInWithProvider(provider, rol)
      navigate(rol === 'comercio' ? '/registro-comercio' : redirect, { replace: true })
    } catch (err) {
      const msg = getAuthError(err.code)
      if (msg) setError(msg)
    }
  }

  return (
    <div className="page page-centered">
      <div className="container container-sm">
        <div className="page-header">
          <div className="page-icon"><UserPlus size={28} /></div>
          <div>
            <h1>Creá tu cuenta</h1>
            <p className="text-muted">Unite a MapaApto</p>
          </div>
        </div>

        <div className="card form-card">
          {rol === 'comercio' && (
            <div className="auth-rol-chip">
              <Store size={14} />
              Registrándote como comercio — completarás los datos de tu negocio al finalizar
            </div>
          )}
          <div className="oauth-buttons">
            <button type="button" className="oauth-btn" onClick={() => handleProvider(googleProvider)}>
              <span className="oauth-icon">G</span>
              Registrarse con Google
            </button>
            <button type="button" className="oauth-btn" onClick={() => handleProvider(appleProvider)}>
              <span className="oauth-icon"></span>
              Registrarse con Apple
            </button>
            <button type="button" className="oauth-btn" onClick={() => handleProvider(facebookProvider)}>
              <span className="oauth-icon">f</span>
              Registrarse con Facebook
            </button>
          </div>

          <div className="auth-divider"><span>o con email</span></div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleEmail}>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input
                type="text"
                className="form-input"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmá la contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-footer">
            ¿Ya tenés cuenta?{' '}
            <Link
              to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
              className="link"
            >
              Iniciá sesión
            </Link>
          </p>

          {rol !== 'comercio' && (
            <button className="btn-ghost" onClick={handleGuest}>
              Continuar sin iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
