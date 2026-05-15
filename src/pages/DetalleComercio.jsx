import { useParams, Link } from 'react-router-dom'
import { MapPin, Clock, Phone, MessageCircle, Star, ArrowLeft, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import RestrictionBadge from '../components/RestrictionBadge'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../data/mockData'

const MENU_TYPES = new Set(['restaurante', 'cafe'])

export default function DetalleComercio() {
  const { id } = useParams()
  const { businesses } = useApp()
  const business = businesses.find((b) => String(b.id) === id)

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
              {business.rating && (
                <div className="business-rating">
                  <Star size={16} fill="#ffc107" color="#ffc107" />
                  <span>{business.rating} / 5.0</span>
                </div>
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
              <li><Clock size={16} /> {business.hours}</li>
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

        {/* Menu */}
        {business.menu.length > 0 && (
          <div className="card">
            <h2>
              {MENU_TYPES.has(business.type) ? 'Menú' : 'Productos disponibles'}
            </h2>
            <div className="menu-grid">
              {business.menu.map((item) => (
                <div key={item.name} className="menu-item">
                  <span className="menu-item-name">{item.name}</span>
                  {item.price && (
                    <span className="menu-item-price">${item.price.toLocaleString('es-AR')}</span>
                  )}
                </div>
              ))}
            </div>
            <p className="menu-disclaimer">
              * Los precios son orientativos y pueden variar. Consultá directamente con el comercio.
            </p>
          </div>
        )}

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
