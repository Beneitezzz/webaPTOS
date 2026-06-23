import { useParams, Link } from 'react-router-dom'
import { MapPin, Clock, Phone, MessageCircle, ArrowLeft, ShieldCheck, Globe } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../hooks/useFavorites'
import RestrictionBadge from '../components/RestrictionBadge'
import ReviewsSection from '../components/ReviewsSection'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS, mockBusinesses } from '../../models/mockData'
import { formatOpeningHours } from '../../utils/hours'
import { useOpenStatus } from '../../hooks/useOpenStatus'


export default function DetalleComercio() {
  const { id } = useParams()
  const { businesses, businessesLoading } = useApp()
  const { currentUser } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const isFav = favoriteIds.has(String(id))
  const business =
    businesses.find((b) => String(b.id) === id) ||
    mockBusinesses.find((b) => String(b.id) === id)

  const openStatus = useOpenStatus(business?.openingHours)

  if (businessesLoading) return (
    <div className="page page-centered">
      <div className="spinner" />
    </div>
  )

  if (!business) {
    return (
      <div className="page page-centered">
        <div className="container container-sm" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2>Comercio no encontrado</h2>
          <Link to="/mapa" className="btn btn-primary mt-2">Volver al mapa</Link>
        </div>
      </div>
    )
  }

  const typeInfo = BUSINESS_TYPE_MAP[business.type]
  const hoursDisplay = business.openingHours
    ? formatOpeningHours(business.openingHours)
    : business.hours ?? null

  return (
    <div className="page">
      <div className="container container-md">
        <Link to="/mapa" className="back-link">
          <ArrowLeft size={16} /> Volver al mapa
        </Link>

        <div className="detail-header card">
          <div className="detail-header-top">
            <div>
              <span
                className="business-type-chip"
                style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}
              >
                {typeInfo?.label}
              </span>
              <h1 className="detail-name">{business.name}</h1>
              {openStatus !== null && (
                <div className={openStatus ? 'open-chip' : 'closed-chip'} style={{ marginTop: '4px', width: 'fit-content' }}>
                  {openStatus ? 'Abierto ahora' : 'Cerrado'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {currentUser && (
                <button
                  className={`fav-btn${isFav ? ' fav-btn--active' : ''}`}
                  onClick={() => toggleFavorite(String(id))}
                  title={isFav ? 'Quitar de favoritos' : 'Marcar como favorito'}
                >
                  {isFav ? '♥' : '♡'}
                  <span>{isFav ? 'Favorito' : 'Marcar como favorito'}</span>
                </button>
              )}
              {business.verified && (
                <div className="verified-badge">
                  <ShieldCheck size={18} />
                  Verificado
                </div>
              )}
            </div>
          </div>
          <p className="detail-description">{business.description}</p>
        </div>

        <div className="detail-grid">
          {/* Info */}
          <div className="card detail-info">
            <h2>Información</h2>
            <ul className="info-list">
              <li><MapPin size={16} /> {business.address}</li>
              {hoursDisplay && <li><Clock size={16} /> {hoursDisplay}</li>}
              <li><Phone size={16} /> {business.phone}</li>
            </ul>
            <div className="contact-buttons">
              <a
                href={`https://wa.me/${business.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a href={`tel:${business.phone}`} className="btn btn-outline">
                <Phone size={16} /> Llamar
              </a>
              {(business.socialLinks ?? []).map((url, i) => {
                let label = url
                try { label = new URL(url).hostname.replace('www.', '') } catch { /* mantener url */ }
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    <Globe size={16} /> {label}
                  </a>
                )
              })}
            </div>
            {business.lat != null && business.lng != null && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cómo llegar</h3>
                <div className="contact-buttons">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gmaps"
                  >
                    Google Maps
                  </a>
                  <a
                    href={`https://waze.com/ul?ll=${business.lat},${business.lng}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-waze"
                  >
                    Waze
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Restrictions */}
          <div className="card">
            <h2>Apto para</h2>
            <div className="tags-list">
              {business.tags.map((tag) => (
                <RestrictionBadge key={tag} tagId={tag} size="md" />
              ))}
            </div>

            <h2 className="mt-2">Certificaciones</h2>
            <div className="certifications-list">
              {business.certifications.map((cert) => (
                <div key={cert} className="certification-item">
                  <ShieldCheck size={14} className="cert-icon" />
                  <div>
                    <strong>{cert}</strong>
                    <span>{CERTIFICATIONS[cert]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fotos */}
        {business.photos?.length > 0 && (
          <div className="card">
            <h2>Fotos del comercio</h2>
            <div className="detail-photos-grid">
              {business.photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="detail-photo-link">
                  <img src={url} alt={`${business.name} foto ${i + 1}`} className="detail-photo-img" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Menú */}
        {business.menuFileUrl && (
          <div className="card">
            <h2>Carta / Menú</h2>
            <a
              href={business.menuFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              📄 Ver carta del menú
            </a>
          </div>
        )}

        <ReviewsSection businessId={id} />

        {/* Legal */}
        <div className="disclaimer-card">
          <strong>Aviso legal:</strong> PuntoSano es una herramienta informativa. No reemplaza
          diagnósticos médicos ni garantiza la ausencia total de alérgenos. Ante cualquier duda,
          consultá directamente con el establecimiento.
        </div>
      </div>
    </div>
  )
}
