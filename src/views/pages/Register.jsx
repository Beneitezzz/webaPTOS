import { useState } from 'react'
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { UserPlus, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { googleProvider, facebookProvider } from '../../firebase'
import { getAuthError } from '../../utils/authErrors'
import PolicyModal from '../components/PolicyModal'

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
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false)
  const [acceptVeracity, setAcceptVeracity] = useState(false)
  const [acceptReview, setAcceptReview] = useState(false)
  const [policySection, setPolicySection] = useState(null)

  const redirect = searchParams.get('redirect') || '/'
  const ALLOWED_ROLES = ['user', 'comercio']
  const rol = ALLOWED_ROLES.includes(searchParams.get('rol')) ? searchParams.get('rol') : 'user'

  if (loading) return null
  if (currentUser) return <Navigate to={redirect} replace />

  const policiesAccepted =
    acceptTerms &&
    (rol === 'user' ? acceptDisclaimer : acceptVeracity && acceptReview)

  const handleGuest = () => {
    const isProtected = PROTECTED_ROUTES.some((r) => redirect.startsWith(r))
    navigate(isProtected ? '/' : redirect, { replace: true })
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    if (!policiesAccepted) {
      setError('Debés aceptar todas las políticas para continuar')
      return
    }
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
    if (!policiesAccepted) {
      setError('Debés aceptar todas las políticas para continuar')
      return
    }
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
            <p className="text-muted">Unite a PuntoSano</p>
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
            <button
              type="button"
              className={`oauth-btn${!policiesAccepted ? ' oauth-btn-disabled' : ''}`}
              onClick={() => handleProvider(googleProvider)}
            >
              <span className="oauth-icon">G</span>
              Registrarse con Google
            </button>
<button
              type="button"
              className={`oauth-btn${!policiesAccepted ? ' oauth-btn-disabled' : ''}`}
              onClick={() => handleProvider(facebookProvider)}
            >
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

            {/* Políticas — justo antes del botón Crear cuenta */}
            <div className="politicas-checks">
              <p className="politicas-checks-title">Antes de continuar, aceptá las políticas:</p>

              <label className="policy-check-label">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span>
                  Leí y acepto los{' '}
                  <button type="button" className="link-btn" onClick={() => setPolicySection('terminos')}>Términos y Condiciones</button>
                  {' '}y la{' '}
                  <button type="button" className="link-btn" onClick={() => setPolicySection('privacidad')}>Política de Privacidad</button>
                  {' '}de PuntoSano
                </span>
              </label>

              {rol === 'user' && (
                <label className="policy-check-label">
                  <input
                    type="checkbox"
                    checked={acceptDisclaimer}
                    onChange={(e) => setAcceptDisclaimer(e.target.checked)}
                  />
                  <span>
                    Entiendo que PuntoSano es una{' '}
                    <button type="button" className="link-btn" onClick={() => setPolicySection('usuarios')}>herramienta informativa</button>
                    {' '}y no reemplaza diagnósticos ni consejos médicos profesionales
                  </span>
                </label>
              )}

              {rol === 'comercio' && (
                <>
                  <label className="policy-check-label">
                    <input
                      type="checkbox"
                      checked={acceptVeracity}
                      onChange={(e) => setAcceptVeracity(e.target.checked)}
                    />
                    <span>
                      Me comprometo a proporcionar <strong>información veraz y actualizada</strong> sobre mi comercio y sus certificaciones
                    </span>
                  </label>
                  <label className="policy-check-label">
                    <input
                      type="checkbox"
                      checked={acceptReview}
                      onChange={(e) => setAcceptReview(e.target.checked)}
                    />
                    <span>
                      Acepto que mi registro será{' '}
                      <button type="button" className="link-btn" onClick={() => setPolicySection('comercios')}>revisado y verificado</button>
                      {' '}por PuntoSano y podrá ser rechazado si no cumple los requisitos
                    </span>
                  </label>
                </>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={submitting || !policiesAccepted}
            >
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
      {policySection && (
        <PolicyModal section={policySection} onClose={() => setPolicySection(null)} />
      )}
    </div>
  )
}
