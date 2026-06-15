import { useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, CheckCircle, XCircle, Clock, PauseCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import RestrictionBadge from '../views/components/RestrictionBadge'
import { BUSINESS_TYPE_MAP } from '../models/mockData'

const STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente de revisión',
    description: 'Tu comercio está siendo verificado por el equipo de MapaApto. Te avisaremos por mail cuando haya novedades.',
    Icon: Clock,
    modifier: 'pending',
  },
  aprobado: {
    label: 'Comercio aprobado',
    description: 'Tu comercio ya aparece en el mapa y está visible para todos los usuarios.',
    Icon: CheckCircle,
    modifier: 'approved',
  },
  rechazado: {
    label: 'Comercio rechazado',
    description: null,
    Icon: XCircle,
    modifier: 'rejected',
  },
  suspendido: {
    label: 'Comercio suspendido',
    description: 'Tu comercio no aparece en el mapa. Contactá con el equipo de MapaApto para más información.',
    Icon: PauseCircle,
    modifier: 'suspended',
  },
}

export default function MiComercio() {
  const { businesses, businessesLoading } = useApp()
  const { currentUser, userRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (userRole !== 'comercio' && userRole !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [userRole, navigate])

  const myBusiness = useMemo(
    () => businesses.find((b) => b.ownerId === currentUser?.uid),
    [businesses, currentUser]
  )

  if (businessesLoading) {
    return (
      <div className="page page-centered">
        <div className="spinner" />
      </div>
    )
  }

  if (!myBusiness) {
    return (
      <div className="page page-centered">
        <div className="container container-sm">
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <Store size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>Todavía no registraste un comercio</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Registrá tu negocio para que aparezca en el mapa de MapaApto.
            </p>
            <Link to="/registro-comercio" className="btn btn-primary">
              Registrar mi comercio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const status = myBusiness.status ?? 'pendiente'
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendiente
  const { Icon } = config
  const typeInfo = BUSINESS_TYPE_MAP[myBusiness.type]

  return (
    <div className="page">
      <div className="container container-sm" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="page-header">
          <div className="page-icon"><Store size={28} /></div>
          <div>
            <h1>Mi Comercio</h1>
            <p className="text-muted">Estado de tu establecimiento en MapaApto</p>
          </div>
        </div>

        <div className={`status-banner status-banner--${config.modifier}`}>
          <Icon size={20} />
          <div>
            <strong>{config.label}</strong>
            <p>
              {status === 'rechazado' && myBusiness.rejectionReason
                ? myBusiness.rejectionReason
                : config.description}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '0.5rem' }}>{myBusiness.name}</h2>
          <span
            className="business-type-chip"
            style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}
          >
            {typeInfo?.label}
          </span>
          <ul className="info-list" style={{ marginTop: '1rem' }}>
            <li>📍 {myBusiness.address}</li>
            <li>📞 {myBusiness.phone}</li>
          </ul>
          {myBusiness.tags?.length > 0 && (
            <div className="tags-list" style={{ marginTop: '0.75rem' }}>
              {myBusiness.tags.map((tag) => (
                <RestrictionBadge key={tag} tagId={tag} size="sm" />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {status === 'aprobado' && (
            <Link to={`/comercio/${myBusiness.id}`} className="btn btn-outline">
              Ver ficha pública
            </Link>
          )}
          {status === 'rechazado' && (
            <Link to="/registro-comercio" className="btn btn-primary">
              Corregir y re-enviar
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
