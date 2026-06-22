import { useMemo, useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Store, CheckCircle, XCircle, Clock, PauseCircle, Trash2, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import RestrictionBadge from '../components/RestrictionBadge'
import { BUSINESS_TYPE_MAP } from '../../models/mockData'

const STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente de revisión',
    description: 'Tu comercio está siendo verificado por el equipo de PuntoSano. Te avisaremos por mail cuando haya novedades.',
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
    description: 'Tu comercio no aparece en el mapa. Contactá con el equipo de PuntoSano para más información.',
    Icon: PauseCircle,
    modifier: 'suspended',
  },
}

function BusinessCard({ business, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const status = business.status ?? 'pendiente'
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendiente
  const { Icon } = config
  const typeInfo = BUSINESS_TYPE_MAP[business.type]

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className={`status-banner status-banner--${config.modifier}`} style={{ marginBottom: '1rem' }}>
        <Icon size={20} />
        <div>
          <strong>{config.label}</strong>
          <p>
            {status === 'rechazado' && business.rejectionReason
              ? business.rejectionReason
              : config.description}
          </p>
        </div>
      </div>

      <h2 style={{ marginBottom: '0.5rem' }}>{business.name}</h2>
      <span
        className="business-type-chip"
        style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}
      >
        {typeInfo?.label}
      </span>
      <ul className="info-list" style={{ marginTop: '1rem' }}>
        <li>📍 {business.address}</li>
        <li>📞 {business.phone}</li>
      </ul>
      {business.tags?.length > 0 && (
        <div className="tags-list" style={{ marginTop: '0.75rem' }}>
          {business.tags.map((tag) => (
            <RestrictionBadge key={tag} tagId={tag} size="sm" />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        {status === 'aprobado' && (
          <>
            <Link to={`/comercio/${business.id}`} className="btn btn-outline btn-sm">
              Ver ficha pública
            </Link>
            <Link to={`/registro-comercio/${business.id}`} className="btn btn-primary btn-sm">
              Editar datos
            </Link>
          </>
        )}
        {status === 'pendiente' && (
          <Link to={`/registro-comercio/${business.id}`} className="btn btn-outline btn-sm">
            Editar comercio
          </Link>
        )}
        {status === 'rechazado' && (
          <Link to={`/registro-comercio/${business.id}`} className="btn btn-primary btn-sm">
            Corregir y re-enviar
          </Link>
        )}
        {status === 'suspendido' && (
          <Link to={`/registro-comercio/${business.id}`} className="btn btn-primary btn-sm">
            Editar y re-enviar
          </Link>
        )}
        <button
          className="btn btn-danger btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => { setConfirmingDelete(true); setDeleteError(null) }}
        >
          <Trash2 size={14} /> Eliminar
        </button>
      </div>

      {confirmingDelete && (
        <div className="card" style={{ marginTop: '1rem', borderColor: 'var(--danger, #dc3545)', borderWidth: '1.5px' }}>
          <p style={{ marginBottom: '0.75rem' }}>
            ¿Confirmás que querés eliminar <strong>{business.name}</strong>? Esta acción no se puede deshacer.
          </p>
          {deleteError && <p className="form-error" style={{ marginBottom: '0.5rem' }}>{deleteError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-danger btn-sm"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true)
                setDeleteError(null)
                try {
                  await onDelete(business.id)
                } catch {
                  setDeleteError('Error al eliminar. Intentá de nuevo.')
                  setDeleting(false)
                }
              }}
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={deleting}
              onClick={() => { setConfirmingDelete(false); setDeleteError(null) }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MiComercio() {
  const { businesses, businessesLoading, deleteBusiness } = useApp()
  const { currentUser, userRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = location.state?.successMessage ?? null

  useEffect(() => {
    if (userRole !== 'comercio' && userRole !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [userRole, navigate])

  const myBusinesses = useMemo(
    () => businesses.filter((b) => b.ownerId === currentUser?.uid),
    [businesses, currentUser]
  )

  if (businessesLoading) {
    return (
      <div className="page page-centered">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container container-sm" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="page-header">
          <div className="page-icon"><Store size={28} /></div>
          <div style={{ flex: 1 }}>
            <h1>Mis Comercios</h1>
            <p className="text-muted">Estado de tus establecimientos en PuntoSano</p>
          </div>
          <Link to="/registro-comercio" className="btn btn-primary btn-sm" style={{ alignSelf: 'center' }}>
            <Plus size={16} /> Nuevo comercio
          </Link>
        </div>

        {successMessage && (
          <div className="status-banner status-banner--approved" style={{ marginBottom: '1rem' }}>
            <CheckCircle size={20} />
            <div><p>{successMessage}</p></div>
          </div>
        )}

        {myBusinesses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <Store size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>Todavía no registraste un comercio</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Registrá tu negocio para que aparezca en el mapa de PuntoSano.
            </p>
            <Link to="/registro-comercio" className="btn btn-primary">
              Registrar mi comercio
            </Link>
          </div>
        ) : (
          myBusinesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              onDelete={deleteBusiness}
            />
          ))
        )}
      </div>
    </div>
  )
}
