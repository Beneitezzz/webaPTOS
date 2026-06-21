import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, CheckCircle } from 'lucide-react'
import RestrictionBadge from './RestrictionBadge'
import { BUSINESS_TYPE_MAP } from '../../models/mockData'
import { useOpenStatus } from '../../hooks/useOpenStatus'

export default memo(function BusinessCard({ business, isFavorite, onToggleFavorite }) {
  const typeInfo = BUSINESS_TYPE_MAP[business.type]
  const openStatus = useOpenStatus(business.openingHours)

  return (
    <div className="business-card">
      <div className="business-card-header">
        <div>
          <h3 className="business-card-name">{business.name}</h3>
          <span className="business-type-chip" style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}>
            {typeInfo?.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {business.rating && (
            <div className="business-rating">
              <Star size={14} fill="#ffc107" color="#ffc107" />
              <span>{business.rating}</span>
            </div>
          )}
          {onToggleFavorite && (
            <button
              className={`card-fav-btn${isFavorite ? ' active' : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(String(business.id)) }}
              title={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>

      <div className="business-card-info">
        <span><MapPin size={13} /> {business.address}</span>
        {openStatus !== null && (
          <div className={openStatus ? 'open-chip' : 'closed-chip'}>
            {openStatus ? 'Abierto ahora' : 'Cerrado'}
          </div>
        )}
      </div>

      <div className="business-card-tags">
        {business.tags.map((tag) => (
          <RestrictionBadge key={tag} tagId={tag} size="sm" />
        ))}
      </div>

      {business.verified && (
        <div className="business-verified">
          <CheckCircle size={13} /> Verificado
        </div>
      )}

      <Link to={`/comercio/${business.id}`} className="btn btn-primary btn-sm mt-1">
        Ver detalles
      </Link>
    </div>
  )
})
