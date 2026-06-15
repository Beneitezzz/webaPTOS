import { RESTRICTION_MAP } from '../models/mockData'

export default function RestrictionBadge({ tagId, size = 'md' }) {
  const restriction = RESTRICTION_MAP[tagId]
  if (!restriction) return null

  return (
    <span
      className={`badge badge-${size}`}
      style={{ backgroundColor: restriction.color }}
    >
      {restriction.label}
    </span>
  )
}
