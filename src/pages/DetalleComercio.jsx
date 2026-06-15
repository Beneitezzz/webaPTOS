import { useParams, Link } from 'react-router-dom'
import { MapPin, Clock, Phone, MessageCircle, ArrowLeft, ShieldCheck, Globe } from 'lucide-react'
import { useApp } from '../context/AppContext'
import RestrictionBadge from '../views/components/RestrictionBadge'
import ReviewsSection from '../views/components/ReviewsSection'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../models/mockData'
import { isOpenNow, formatOpeningHours } from '../utils/hours'


export default function DetalleComercio() {
  const { id } = useParams()
  const { businesses, businessesLoading } = useApp()
  const business = businesses.find((b) => String(b.id) === id)

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
  const openStatus = business.openingHours ? isOpenNow(business.openingHours) : null
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
                <span className={openStatus ? 'open-chip' : 'closed-chip'} style={{ marginTop: '4px', display: 'inline-flex' }}>
                  {openStatus ? 'Abierto ahora' : 'Cerrado'}
                </span>
              )}
            </div>
            {business.verified && (
              <div className="verified-badge">
                <ShieldCheck size={18} />
                Verificado
              </div>
            )}
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
          <strong>Aviso legal:</strong> MapaApto es una herramienta informativa. No reemplaza
          diagnósticos médicos ni garantiza la ausencia total de alérgenos. Ante cualquier duda,
          consultá directamente con el establecimiento.
        </div>
      </div>
    </div>
  )
}
