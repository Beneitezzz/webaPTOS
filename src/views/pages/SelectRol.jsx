import { useNavigate, useSearchParams, Navigate, Link } from 'react-router-dom'
import { User, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function SelectRol() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentUser, loading } = useAuth()
  const redirect = searchParams.get('redirect') || '/'

  if (loading) return null
  if (currentUser) return <Navigate to={redirect} replace />

  const go = (rol) => {
    const params = new URLSearchParams({ rol })
    if (redirect !== '/') params.set('redirect', redirect)
    navigate(`/register?${params}`)
  }

  return (
    <div className="page page-centered">
      <div className="container container-sm">
        <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <h1>¿Cómo querés registrarte?</h1>
            <p className="text-muted">Elegí el tipo de cuenta que mejor te describe</p>
          </div>
        </div>

        <div className="rol-cards">
          <button className="rol-card" onClick={() => go('user')}>
            <User size={40} className="rol-card-icon" />
            <h2>Soy usuario</h2>
            <p>Quiero encontrar comercios aptos para mi dieta</p>
          </button>
          <button className="rol-card" onClick={() => go('comercio')}>
            <Store size={40} className="rol-card-icon" />
            <h2>Soy comercio</h2>
            <p>Quiero registrar mi negocio en el mapa</p>
          </button>
        </div>

        <p className="auth-footer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          ¿Ya tenés cuenta?{' '}
          <Link
            to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="link"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
