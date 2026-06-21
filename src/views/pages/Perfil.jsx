import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { RESTRICTIONS, BUSINESS_TYPE_MAP } from '../../models/mockData'
import { toggleItem } from '../../utils/array'
import { subscribeToUserReviews, deleteReview } from '../../services/reviewService'
import { useFavorites } from '../../hooks/useFavorites'

const TYPE_ICONS = {
  restaurante: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <path d="M3 11l19-9-9 19-2-8-8-2Z"/>
    </svg>
  ),
  dietetica: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <path d="M12 21s-7-4.6-9.5-9.1C.7 8.4 2.4 4.8 6 4.2c2.2-.4 4 .8 6 3 2-2.2 3.8-3.4 6-3 3.6.6 5.3 4.2 3.5 7.7C19 16.4 12 21 12 21Z"/>
    </svg>
  ),
  supermercado: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  cafe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <path d="M3 8h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z"/><path d="M16 9h2a2.5 2.5 0 0 1 0 5h-2"/>
    </svg>
  ),
}

function relativeDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days < 1) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'Hace 1 semana'
  if (weeks < 5) return `Hace ${weeks} semanas`
  const months = Math.floor(days / 30)
  if (months === 1) return 'Hace 1 mes'
  return `Hace ${months} meses`
}

function Stars({ rating }) {
  const pct = Math.round((rating / 5) * 100)
  return (
    <div className="resena-stars">
      <span className="stars-empty">★★★★★</span>
      <span className="stars-fill" style={{ width: `${pct}%` }}>★★★★★</span>
    </div>
  )
}

const RESTRICTION_ICONS = {
  'sin-tacc': (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
      <path d="M12 2 2 7l10 5 10-5-10-5Z"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  'apto-diabeticos': (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
      <path d="M19 14a7 7 0 1 1-9.9-9.9"/>
      <path d="M19 5l-7 7"/>
    </svg>
  ),
  'sin-lactosa': (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
      <path d="M8 2v4M16 2v4M5 9h14l-1.2 10.5A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.5L5 9Z"/>
    </svg>
  ),
  'apto-sibo': (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 9h.01M15 9h.01M8 14s1.5 2 4 2 4-2 4-2"/>
    </svg>
  ),
}

function formatMemberSince(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export default function Perfil() {
  const { userProfile, updateProfile, businesses, profileLoading } = useApp()
  const { currentUser, deleteAccount } = useAuth()
  const isLoading = profileLoading
  const navigate = useNavigate()

  const [name, setName] = useState(userProfile.profileName)
  const [restrictions, setRestrictions] = useState(userProfile.restrictions ?? [])

  // Sync form when Firestore finishes loading the profile (handles fresh page load)
  useEffect(() => {
    if (!profileLoading) {
      setName(userProfile.profileName)
      setRestrictions(userProfile.restrictions ?? [])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [notifNew, setNotifNew] = useState(true)
  const [notifNews, setNotifNews] = useState(false)

  const { favoriteIds, toggleFavorite, loading: favLoading } = useFavorites()
  const favoriteBusinesses = businesses.filter((b) => favoriteIds.has(String(b.id)))

  const [myReviews, setMyReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [deletingReview, setDeletingReview] = useState(null)

  useEffect(() => {
    if (!currentUser) return
    return subscribeToUserReviews(
      currentUser.uid,
      (data) => { setMyReviews(data); setReviewsLoading(false) },
      () => setReviewsLoading(false)
    )
  }, [currentUser])

  const [showDelete, setShowDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const deleteConfirmed = deleteInput.trim().toUpperCase() === 'ELIMINAR'

  const toggleRestriction = (id) => {
    setRestrictions((prev) => toggleItem(prev, id))
    setSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      await updateProfile({ profileName: name, restrictions })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('No se pudo guardar el perfil. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const initial = (name || currentUser?.email || '?')[0].toUpperCase()
  const memberSince = formatMemberSince(currentUser?.metadata?.creationTime)

  const activeCount = restrictions.length
  const countLabel =
    activeCount === 0 ? 'Sin restricciones activas' :
    activeCount === 1 ? '1 restricción activa' :
    `${activeCount} restricciones activas`

  return (
    <div className="page">
      <div className="perfil-page">

        {/* ── Profile head ── */}
        <div className="profile-head">
          <div className="avatar-big">{initial}</div>
          <div>
            <h1>Mi Perfil</h1>
            {memberSince && (
              <div className="member-since">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Miembro desde {memberSince}
              </div>
            )}
          </div>
        </div>

        {/* ── Datos personales + restricciones ── */}
        <form onSubmit={handleSave} className="perfil-card">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.6"/>
              <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2"/>
            </svg>
            Datos personales
          </div>

          {isLoading ? (
            <div className="perfil-skeleton">
              <div className="sk-row">
                <div className="sk-block" style={{ height: 62 }} />
                <div className="sk-block" style={{ height: 62 }} />
              </div>
              <div className="sk-block" style={{ height: 14, width: '50%' }} />
              <div className="sk-block" style={{ height: 10, width: '80%' }} />
              <div className="sk-grid">
                <div className="sk-block" style={{ height: 58 }} />
                <div className="sk-block" style={{ height: 58 }} />
                <div className="sk-block" style={{ height: 58 }} />
                <div className="sk-block" style={{ height: 58 }} />
              </div>
              <div className="sk-block" style={{ height: 46, borderRadius: 11 }} />
            </div>
          ) : (
            <>
          <div className="form-row" style={{ marginTop: '16px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">Tu nombre (opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: María"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false) }}
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={currentUser?.email ?? ''}
                disabled
                style={{ color: '#9AA8A0', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <label className="form-label">Mis restricciones alimentarias</label>
          <p className="card-desc" style={{ marginTop: '4px' }}>
            Seleccioná todas las que correspondan. El mapa mostrará solo los comercios que
            cumplen con todas tus restricciones activas.
          </p>

          <div className="restr-count">{countLabel}</div>

          <div className="restr-grid">
            {RESTRICTIONS.map((r) => {
              const active = restrictions.includes(r.id)
              return (
                <button
                  key={r.id}
                  type="button"
                  className="restr-toggle"
                  style={active ? {
                    borderColor: r.color,
                    background: `color-mix(in srgb, ${r.color} 8%, white)`,
                    transform: 'scale(1.015)',
                  } : {}}
                  onClick={() => toggleRestriction(r.id)}
                >
                  <span
                    className="restr-icon-box"
                    style={active ? { background: r.color, color: '#fff' } : {}}
                  >
                    {RESTRICTION_ICONS[r.id]}
                  </span>
                  <span className="restr-name" style={active ? { color: r.color } : {}}>
                    {r.label}
                  </span>
                  <span
                    className="restr-check"
                    style={active ? { background: r.color, borderColor: r.color } : {}}
                  >
                    <svg viewBox="0 0 24 24" fill="none" style={{ opacity: active ? 1 : 0 }}>
                      <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
              )
            })}
          </div>

          {saveError && <div className="auth-error">{saveError}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar perfil'}
          </button>
            </>
          )}
        </form>

        {/* ── Notificaciones ── */}
        <div className="perfil-card">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z"/>
              <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
            </svg>
            Notificaciones
          </div>
          <p className="card-desc">Elegí cómo querés que te avisemos. Podés cambiarlo cuando quieras.</p>

          <div className="notif-row">
            <div className="notif-label">
              <strong>Nuevos comercios aptos</strong>
              <span>Te avisamos cuando abre un local que cumple tu perfil cerca tuyo</span>
            </div>
            <label className="p-switch">
              <input type="checkbox" checked={notifNew} onChange={(e) => setNotifNew(e.target.checked)} />
              <span className="p-slider" />
            </label>
          </div>
          <div className="notif-row">
            <div className="notif-label">
              <strong>Novedades de PuntoSano</strong>
              <span>Noticias, mejoras y novedades de la plataforma</span>
            </div>
            <label className="p-switch">
              <input type="checkbox" checked={notifNews} onChange={(e) => setNotifNews(e.target.checked)} />
              <span className="p-slider" />
            </label>
          </div>
        </div>

        {/* ── Mis favoritos ── */}
        <div className="perfil-card">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/>
            </svg>
            Mis favoritos
          </div>
          <p className="card-desc">Los comercios que guardaste. Tocá el corazón en cualquier ficha para agregarlos.</p>

          {favLoading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div className="spinner-sm" style={{ margin: '0 auto' }} />
            </div>
          ) : favoriteBusinesses.length === 0 ? (
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
              Todavía no guardaste ningún comercio.
            </p>
          ) : (
            <div className="mis-favoritos-list">
              {favoriteBusinesses.map((b) => {
                const typeColor = BUSINESS_TYPE_MAP[b.type]?.color ?? 'var(--primary)'
                const typeLabel = BUSINESS_TYPE_MAP[b.type]?.label ?? ''
                return (
                  <div key={b.id} className="fav-item">
                    <div className="fav-item-dot" style={{ background: typeColor }} />
                    <div className="fav-item-body">
                      <Link to={`/comercio/${b.id}`} className="fav-item-name">{b.name}</Link>
                      <span className="fav-item-type" style={{ color: typeColor }}>{typeLabel}</span>
                    </div>
                    <button
                      type="button"
                      className="icon-btn-small icon-btn-danger"
                      title="Quitar de favoritos"
                      onClick={() => toggleFavorite(String(b.id))}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Mis reseñas ── */}
        <div className="perfil-card">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.55L3 20l1.05-5.4A8.5 8.5 0 1 1 21 11.5Z"/>
            </svg>
            Mis reseñas
          </div>
          <p className="card-desc">
            Las reseñas que dejaste en comercios que visitaste. Solo vos podés editarlas o borrarlas.
          </p>

          {reviewsLoading ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div className="spinner-sm" style={{ margin: '0 auto' }} />
            </div>
          ) : myReviews.length === 0 ? (
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
              Todavía no dejaste ninguna reseña.
            </p>
          ) : (
            <div className="mis-resenas-list">
              {myReviews.map((r) => {
                const biz = businesses.find((b) => b.id === r.businessId || String(b.id) === r.businessId)
                const typeColor = biz ? (BUSINESS_TYPE_MAP[biz.type]?.color ?? 'var(--primary)') : 'var(--primary)'
                return (
                  <div key={r.id} className="mis-resena-item">
                    <div className="resena-photo-box" style={{ background: typeColor }}>
                      {biz ? (TYPE_ICONS[biz.type] ?? TYPE_ICONS.restaurante) : TYPE_ICONS.restaurante}
                    </div>
                    <div className="resena-body">
                      <div className="resena-top">
                        <strong>{biz?.name ?? 'Comercio eliminado'}</strong>
                        <span className="resena-date">{relativeDate(r.createdAt)}</span>
                      </div>
                      <Stars rating={r.rating} />
                      {r.comment && <p className="resena-text">{r.comment}</p>}
                    </div>
                    <div className="resena-actions">
                      {biz && (
                        <Link to={`/comercio/${r.businessId}`} className="icon-btn-small" title="Ver comercio">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                        </Link>
                      )}
                      <button
                        type="button"
                        className="icon-btn-small icon-btn-danger"
                        title="Eliminar reseña"
                        disabled={deletingReview === r.businessId}
                        onClick={async () => {
                          if (!confirm('¿Eliminás esta reseña?')) return
                          setDeletingReview(r.businessId)
                          try { await deleteReview(r.businessId, currentUser.uid) }
                          finally { setDeletingReview(null) }
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Zona de peligro ── */}
        <div className="danger-perfil-card">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 9v4M12 17h.01"/>
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
            </svg>
            Zona de peligro
          </div>
          <p className="card-desc">
            Eliminar tu cuenta borra tu perfil, tus restricciones guardadas y no se puede deshacer.
          </p>

          {!showDelete ? (
            <button type="button" className="btn-danger-outline" onClick={() => setShowDelete(true)}>
              Eliminar mi cuenta
            </button>
          ) : (
            <div className="confirm-panel">
              <p>
                Para confirmar, escribí <strong>ELIMINAR</strong> en el campo de abajo.
                Esta acción es permanente.
              </p>
              <input
                type="text"
                className="confirm-input"
                placeholder="Escribí ELIMINAR"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => { setShowDelete(false); setDeleteInput('') }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn-danger-solid${deleteConfirmed && !deleting ? ' enabled' : ''}`}
                  disabled={deleting}
                  onClick={async () => {
                    if (!deleteConfirmed) return
                    setDeleting(true)
                    setDeleteError('')
                    try {
                      await deleteAccount()
                      navigate('/')
                    } catch (err) {
                      if (err.code === 'auth/requires-recent-login') {
                        setDeleteError('Por seguridad, cerrá sesión, volvé a iniciarla y repetí esta acción.')
                      } else {
                        setDeleteError('No se pudo eliminar la cuenta. Intentá de nuevo.')
                      }
                      setDeleting(false)
                    }
                  }}
                >
                  {deleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
                </button>
              </div>
              {deleteError && <p style={{ marginTop: '12px', fontSize: '13px', color: '#E63946' }}>{deleteError}</p>}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
