import { useState, useMemo } from 'react'
import { ShieldCheck, ShieldX, Eye, AlertCircle, PauseCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import RestrictionBadge from '../views/components/RestrictionBadge'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../models/mockData'
import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailService'
import { formatOpeningHours } from '../utils/hours'

export default function AdminPanel() {
  const { businesses, approveBusiness, rejectBusiness, suspendBusiness } = useApp()
  const [expanded, setExpanded] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [suspendingId, setSuspendingId] = useState(null)

  const pending = useMemo(
    () => businesses.filter((b) => b.pending && !b.verified),
    [businesses]
  )

  const approved = useMemo(
    () => businesses.filter((b) => b.verified && !b.pending),
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

        {actionError && <div className="auth-error" style={{ marginBottom: '16px' }}>{actionError}</div>}
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
                        onClick={async () => {
                          setActionError(null)
                          try {
                            await approveBusiness(b.id)
                            await sendApprovalEmail({ businessName: b.name, ownerEmail: b.ownerEmail ?? null })
                          } catch {
                            setActionError('Error al aprobar. Intentá de nuevo.')
                          }
                        }}
                      >
                        <ShieldCheck size={14} /> Aprobar
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (rejectingId === b.id) {
                            setRejectingId(null)
                            setRejectReason('')
                          } else {
                            setRejectingId(b.id)
                            setRejectReason('')
                            setExpanded(b.id)
                          }
                        }}
                      >
                        <ShieldX size={14} /> {rejectingId === b.id ? 'Cancelar' : 'Rechazar'}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="pending-detail">
                      <div className="pending-info-grid">
                        <div><strong>Dirección:</strong> {b.address}</div>
                        <div><strong>Teléfono:</strong> {b.phone}</div>
                        <div><strong>Horario:</strong> {b.openingHours ? (formatOpeningHours(b.openingHours) || '—') : (b.hours || '—')}</div>
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

                      {b.certDocuments && Object.keys(b.certDocuments).length > 0 && (
                        <div className="pending-section">
                          <strong>Documentos adjuntos:</strong>
                          <div className="cert-docs-list">
                            {Object.entries(b.certDocuments).map(([cert, url]) => (
                              <a
                                key={cert}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cert-doc-link"
                              >
                                <ShieldCheck size={13} /> Ver {cert}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="verify-note">
                        <AlertCircle size={14} />
                        Verificar los certificados antes de aprobar.
                      </div>

                      {rejectingId === b.id && (
                        <div className="reject-reason-form">
                          <label className="form-label">Motivo del rechazo *</label>
                          <textarea
                            className="form-textarea"
                            rows={3}
                            placeholder="Explicá por qué se rechaza este comercio (mínimo 10 caracteres)..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <div className="reject-reason-actions">
                            <button
                              className="btn btn-danger btn-sm"
                              disabled={rejectReason.trim().length < 10}
                              onClick={async () => {
                                setActionError(null)
                                try {
                                  await rejectBusiness(b.id, rejectReason.trim())
                                  await sendRejectionEmail({
                                    businessName: b.name,
                                    ownerEmail: b.ownerEmail ?? null,
                                    reason: rejectReason.trim(),
                                  })
                                  setRejectingId(null)
                                  setRejectReason('')
                                } catch {
                                  setActionError('Error al rechazar. Intentá de nuevo.')
                                }
                              }}
                            >
                              Confirmar rechazo
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => { setRejectingId(null); setRejectReason('') }}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {approved.length > 0 && (
          <div className="admin-section">
            <h2>Comercios aprobados ({approved.length})</h2>
            <div className="approved-list">
              {approved.map((b) => {
                const typeInfo = BUSINESS_TYPE_MAP[b.type]
                return (
                  <div key={b.id} className="approved-card card">
                    <div className="approved-card-header">
                      <div>
                        <h3>{b.name}</h3>
                        <span
                          className="business-type-chip"
                          style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}
                        >
                          {typeInfo?.label}
                        </span>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSuspendingId(suspendingId === b.id ? null : b.id)}
                      >
                        <PauseCircle size={14} /> {suspendingId === b.id ? 'Cancelar' : 'Suspender'}
                      </button>
                    </div>
                    {suspendingId === b.id && (
                      <div className="suspend-confirm">
                        <p>
                          ¿Confirmás la suspensión de <strong>{b.name}</strong>?
                          El comercio dejará de aparecer en el mapa inmediatamente.
                        </p>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={async () => {
                            setActionError(null)
                            try {
                              await suspendBusiness(b.id)
                              setSuspendingId(null)
                            } catch {
                              setActionError('Error al suspender. Intentá de nuevo.')
                            }
                          }}
                        >
                          Confirmar suspensión
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
