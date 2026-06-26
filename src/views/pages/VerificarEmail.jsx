import { useState } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { resendVerificationEmail } from '../../services/authService'

export default function VerificarEmail() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [resendDisabled, setResendDisabled] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [resendError, setResendError] = useState('')
  const [checkError, setCheckError] = useState('')

  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.emailVerified) return <Navigate to={next} replace />

  const handleResend = async () => {
    setResendDisabled(true)
    setResendSent(false)
    setResendError('')
    try {
      await resendVerificationEmail(currentUser)
      setResendSent(true)
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setResendError('Demasiados intentos. Esperá unos minutos antes de reenviar.')
      } else {
        setResendError('No se pudo reenviar el email. Intentá de nuevo.')
      }
      setResendDisabled(false)
      return
    }
    setTimeout(() => setResendDisabled(false), 60000)
  }

  const handleCheckVerified = async () => {
    setCheckError('')
    try {
      await currentUser.reload()
      if (currentUser.emailVerified) {
        navigate(next, { replace: true })
      } else {
        setCheckError('Tu email aún no fue verificado. Revisá tu bandeja de entrada.')
      }
    } catch {
      setCheckError('Ocurrió un error. Intentá de nuevo.')
    }
  }

  return (
    <div className="page page-centered">
      <div className="container container-sm">
        <div className="card form-card verify-email-card">
          <div className="verify-email-icon">
            <Mail size={48} />
          </div>
          <h1>Verificá tu email</h1>
          <p className="text-muted">
            Enviamos un link de verificación a{' '}
            <strong>{currentUser.email}</strong>.
            Revisá tu bandeja de entrada y también la carpeta de spam.
          </p>

          {checkError && <div className="auth-error" style={{ marginTop: '1rem' }}>{checkError}</div>}
          {resendError && <div className="auth-error" style={{ marginTop: '1rem' }}>{resendError}</div>}
          {resendSent && <div className="auth-success" style={{ marginTop: '1rem' }}>Email reenviado. Revisá tu bandeja (y la carpeta de spam).</div>}

          <div className="verify-email-actions">
            <button className="btn btn-primary btn-full" onClick={handleCheckVerified}>
              Ya verifiqué mi email
            </button>
            <button
              type="button"
              className="btn btn-outline btn-full"
              onClick={handleResend}
              disabled={resendDisabled}
            >
              {resendDisabled && !resendSent ? 'Enviando...' : 'Reenviar email de verificación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
