import { useState, useMemo } from 'react'
import { ShieldCheck, ShieldX, Eye, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import RestrictionBadge from '../components/RestrictionBadge'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../data/mockData'

export default function AdminPanel() {
  const { businesses, approveBusiness, rejectBusiness } = useApp()
  const [expanded, setExpanded] = useState(null)

  const pending = useMemo(
    () => businesses.filter((b) => b.pending && !b.verified),
    [businesses]
  )

  return (
    <div className="page">
      <div className="container container-md">
        <div className="page-header">
          <div className="page-icon"><ShieldCheck size={28} /></div>
          <div>
            <h1>Panel de Administración</h1>
            <p className="text-muted">Verificación de comercios pendientes</p>
          </div>
        </div>

        <div className="admin-stats">
          <div className="stat-card">
            <span className="stat-number">{pending.length}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{businesses.filter((b) => b.verified).length}</span>
            <span className="stat-label">Verificados</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{businesses.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="empty-state card">
            <ShieldCheck size={48} className="empty-icon" />
            <h3>Sin pendientes</h3>
            <p>No hay comercios esperando verificación.</p>
          </div>
        ) : (
          <div className="pending-list">
            {pending.map((b) => {
              const typeInfo = BUSINESS_TYPE_MAP[b.type]
              const isOpen = expanded === b.id
              return (
                <div key={b.id} className={`pending-card card ${isOpen ? 'expanded' : ''}`}>
                  <div className="pending-card-header">
                    <div>
                      <h3>{b.name}</h3>
                      <span
                        className="business-type-chip"
                        style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}
                      >
                        {typeInfo?.label}
                      </span>
                      <span className="pending-badge">
                        <AlertCircle size={12} /> Pendiente
                      </span>
                    </div>
                    <div className="pending-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setExpanded(isOpen ? null : b.id)}
                      >
                        <Eye size={14} /> {isOpen ? 'Cerrar' : 'Revisar'}
                      </button>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => approveBusiness(b.id)}
                      >
                        <ShieldCheck size={14} /> Aprobar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => rejectBusiness(b.id)}
                      >
                        <ShieldX size={14} /> Rechazar
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="pending-detail">
                      <div className="pending-info-grid">
                        <div><strong>Dirección:</strong> {b.address}</div>
                        <div><strong>Teléfono:</strong> {b.phone}</div>
                        <div><strong>Horario:</strong> {b.hours || '—'}</div>
                      </div>

                      {b.description && (
                        <p className="pending-description">{b.description}</p>
                      )}

                      <div className="pending-section">
                        <strong>Restricciones declaradas:</strong>
                        <div className="tags-list" style={{ marginTop: '8px' }}>
                          {b.tags.map((tag) => (
                            <RestrictionBadge key={tag} tagId={tag} size="sm" />
                          ))}
                        </div>
                      </div>

                      <div className="pending-section">
                        <strong>Certificaciones declaradas:</strong>
                        <div className="certs-declared">
                          {b.certifications.map((cert) => (
                            <div key={cert} className="cert-declared-item">
                              <ShieldCheck size={13} />
                              <span><strong>{cert}</strong> — {CERTIFICATIONS[cert]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="verify-note">
                        <AlertCircle size={14} />
                        Verificar los certificados físicos o digitales antes de aprobar.
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
