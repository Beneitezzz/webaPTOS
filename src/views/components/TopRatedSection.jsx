import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Star, ChevronLeft, ChevronRight, Coffee, Utensils, ShoppingBag, Heart } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { BUSINESS_TYPES, RESTRICTION_MAP, mockBusinesses } from '../../models/mockData'
import { useOpenStatus } from '../../hooks/useOpenStatus'

const TYPE_ICONS = {
  restaurante: <Utensils size={42} color="rgba(255,255,255,0.85)" />,
  dietetica: <Heart size={42} color="rgba(255,255,255,0.85)" />,
  supermercado: <ShoppingBag size={42} color="rgba(255,255,255,0.85)" />,
  cafe: <Coffee size={42} color="rgba(255,255,255,0.85)" />,
}

const RANK_MEDALS = ['🥇', '🥈', '🥉']

function StarRating({ rating, size = 16 }) {
  const num = parseFloat(rating) || 0
  return (
    <span className="star-display">
      {[1, 2, 3, 4, 5].map((s) => {
        const full = num >= s
        const half = !full && num >= s - 0.5
        return (
          <span key={s} className="star-slot" style={{ width: size, height: size }}>
            <Star size={size} fill="none" color="#ffc107" className="star-empty" />
            {(full || half) && (
              <Star
                size={size}
                fill="#ffc107"
                color="#ffc107"
                className="star-filled"
                style={half ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
              />
            )}
          </span>
        )
      })}
    </span>
  )
}

function getNeighborhood(address) {
  if (!address) return ''
  const parts = address.split(',')
  return parts.length > 1 ? parts[parts.length - 1].trim() : address
}

function OpenBadge({ openingHours }) {
  const status = useOpenStatus(openingHours)
  if (status === null) return null
  return (
    <span className={status ? 'open-chip' : 'closed-chip'} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
      {status ? 'Abierto' : 'Cerrado'}
    </span>
  )
}

function TypeCarousel({ type, topBusinesses }) {
  const [index, setIndex] = useState(0)
  const business = topBusinesses[index]
  if (!business) return null

  const mainRestriction = business.tags?.[0] ? RESTRICTION_MAP[business.tags[0]] : null
  const restrictionLabel = mainRestriction
    ? mainRestriction.label.split('/')[0].trim().toUpperCase()
    : null

  return (
    <div className="top-rated-type-card">
      <h3 className="top-rated-type-title">{type.label.toUpperCase()}</h3>

      <div className="top-rated-carousel">
        <button
          className="carousel-arrow"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label="Anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <Link
          to={`/comercio/${business.id}`}
          className="top-rated-business-card"
        >
          <div
            className="top-rated-image"
            style={business.photos?.[0]
              ? { backgroundImage: `url(${business.photos[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { backgroundColor: type.color }}
          >
            <span className="top-rated-rank-badge">
              {RANK_MEDALS[index]} #{index + 1}
            </span>
            {!business.photos?.[0] && TYPE_ICONS[type.id]}
            {mainRestriction && (
              <span
                className="top-rated-restriction-badge"
                style={{ backgroundColor: mainRestriction.color }}
              >
                {restrictionLabel}
              </span>
            )}
          </div>
          <div className="top-rated-info">
            <p className="top-rated-name">{business.name}</p>
            <p className="top-rated-address">{getNeighborhood(business.address)}</p>
            {business.rating != null ? (
              <div className="top-rated-stars">
                <StarRating rating={business.rating} />
                <span className="top-rated-stars-score">
                  {parseFloat(business.rating).toFixed(1)}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sin reseñas aún</span>
            )}
            <div style={{ marginTop: '4px' }}>
              <OpenBadge openingHours={business.openingHours} />
            </div>
          </div>
        </Link>

        <button
          className="carousel-arrow"
          onClick={() => setIndex((i) => Math.min(topBusinesses.length - 1, i + 1))}
          disabled={index === topBusinesses.length - 1}
          aria-label="Siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {topBusinesses.length > 1 && (
        <div className="carousel-dots">
          {topBusinesses.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === index ? ' active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Ver comercio ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopRatedSection() {
  const { businesses, businessesLoading } = useApp()

  const topByType = useMemo(() => {
    const approvedFromFirebase = businesses.filter((b) => b.verified && !b.pending)
    const source = approvedFromFirebase.length > 0 ? approvedFromFirebase : mockBusinesses
    return BUSINESS_TYPES.map((type) => ({
      type,
      topBusinesses: source
        .filter((b) => b.type === type.id)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 3),
    })).filter(({ topBusinesses }) => topBusinesses.length > 0)
  }, [businesses])

  if (businessesLoading) return null
  if (topByType.length === 0) return null

  return (
    <section className="section top-rated-section">
      <div className="container">
        <div className="top-rated-header">
          <span className="top-rated-badge">⭐ LO MÁS VALORADO</span>
          <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>
            Comercios con mejor puntuación
          </h2>
          <p className="top-rated-subtitle">
            Los locales mejor calificados por la comunidad, en cada categoría.
          </p>
        </div>

        <div className="top-rated-grid">
          {topByType.map(({ type, topBusinesses }) => (
            <TypeCarousel key={type.id} type={type} topBusinesses={topBusinesses} />
          ))}
        </div>

        <div className="top-rated-footer">
          <Link to="/mapa" className="top-rated-see-all">
            Ver todos los comercios →
          </Link>
        </div>
      </div>
    </section>
  )
}
