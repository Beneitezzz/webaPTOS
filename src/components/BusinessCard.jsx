import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, Clock, CheckCircle } from 'lucide-react'
import RestrictionBadge from './RestrictionBadge'
import { BUSINESS_TYPE_MAP } from '../data/mockData'

export default memo(function BusinessCard({ business }) {
  const typeInfo = BUSINESS_TYPE_MAP[business.type]

  return (
    <div className="business-card">
      <div className="business-card-header">
        <div>
          <h3 className="business-card-name">{business.name}</h3>
          <span className="business-type-chip" style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}>
            {typeInfo?.label}
          </span>
        </div>
        {business.rating && (
          <div className="business-rating">
            <Star size={14} fill="#ffc107" color="#ffc107" />
            <span>{business.rating}</span>
          </div>
        )}
      </div>

      <div className="business-card-info">
        <span><MapPin size={13} /> {business.address}</span>
        <span><Clock size={13} /> {business.hours}</span>
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
