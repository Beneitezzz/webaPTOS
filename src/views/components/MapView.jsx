import { useRef, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { Locate, Square } from 'lucide-react'
import L from 'leaflet'
import { BUSINESS_TYPE_MAP } from '../../models/mockData'
import UserLocationLayer from './UserLocationLayer'
import RoutingLayer from './RoutingLayer'

const CORDOBA_CENTER = [-31.4201, -64.1888]

function buildDivIcon(color) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="38">
      <path fill="${color}" stroke="white" stroke-width="1.5"
        d="M12 0C7.58 0 4 3.58 4 8c0 6.67 8 16 8 16s8-9.33 8-16c0-4.42-3.58-8-8-8z"/>
      <circle cx="12" cy="8" r="3.5" fill="white"/>
    </svg>`
  )
  return L.divIcon({
    html: `<img src="data:image/svg+xml,${svg}" width="28" height="38" />`,
    className: '',
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -40],
  })
}

const PIN_ICONS = Object.fromEntries(
  Object.values(BUSINESS_TYPE_MAP).map(({ id, color }) => [id, buildDivIcon(color)])
)
const DEFAULT_ICON = buildDivIcon('#2d6a4f')

function FlyToSelected({ selectedId, businesses, markerRefs }) {
  const map = useMap()
  useEffect(() => {
    if (!selectedId) return
    const business = businesses.find((b) => String(b.id) === String(selectedId))
    if (!business) return
    map.flyTo([business.lat, business.lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
    const timer = setTimeout(() => {
      const marker = markerRefs.current[String(selectedId)]
      if (marker) marker.openPopup()
    }, 850)
    return () => clearTimeout(timer)
  }, [selectedId, businesses, map, markerRefs])
  return null
}

function ResizeWatcher({ trigger }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 220)
    return () => clearTimeout(t)
  }, [trigger, map])
  return null
}

function LocateButton({ active, onStart, onStop, error }) {
  return (
    <div className="locate-control">
      <button
        className={`locate-btn${active ? ' locate-btn--active' : ''}`}
        onClick={active ? onStop : onStart}
        title={active ? 'Detener seguimiento' : 'Activar seguimiento de ubicación'}
      >
        {active ? <Square size={16} /> : <Locate size={18} />}
      </button>
      {error && <div className="locate-error">{error}</div>}
    </div>
  )
}

export default function MapView({
  businesses,
  sidebarOpen,
  selectedBusinessId,
  favoriteIds,
  onToggleFavorite,
  userPosition,
  userAccuracy,
  trackingActive,
  trackingError,
  onStartTracking,
  onStopTracking,
}) {
  const markerRefs = useRef({})

  const destination = useMemo(() => {
    const b = selectedBusinessId
      ? businesses.find((b) => String(b.id) === String(selectedBusinessId))
      : null
    return b ? { lat: b.lat, lng: b.lng } : null
  }, [selectedBusinessId, businesses])

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
    <MapContainer
      center={CORDOBA_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topright" />
      <ResizeWatcher trigger={sidebarOpen} />
      <UserLocationLayer position={userPosition} accuracy={userAccuracy} />
      {trackingActive && (
        <RoutingLayer userPosition={userPosition} destination={destination} />
      )}
      <FlyToSelected selectedId={selectedBusinessId} businesses={businesses} markerRefs={markerRefs} />
      {businesses.map((b) => {
        const typeInfo = BUSINESS_TYPE_MAP[b.type]
        return (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={PIN_ICONS[b.type] ?? DEFAULT_ICON}
            ref={(el) => { if (el) markerRefs.current[String(b.id)] = el }}
          >
            <Popup>
              <div className="map-popup">
                <div className="map-popup-header">
                  <strong>{b.name}</strong>
                  {onToggleFavorite && (
                    <button
                      className={`popup-fav-btn${favoriteIds?.has(String(b.id)) ? ' active' : ''}`}
                      onClick={() => onToggleFavorite(String(b.id))}
                      title={favoriteIds?.has(String(b.id)) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    >
                      {favoriteIds?.has(String(b.id)) ? '♥' : '♡'}
                    </button>
                  )}
                </div>
                <span className="map-popup-type" style={{ color: typeInfo?.color }}>
                  {typeInfo?.label}
                </span>
                <p>{b.address}</p>
                <Link to={`/comercio/${b.id}`}>Ver detalles →</Link>
                {trackingActive && userPosition && (
                  <div className="popup-nav-links">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${b.lat},${b.lng}&travelmode=walking`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?ll=${b.lat},${b.lng}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Waze
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
    <LocateButton
      active={trackingActive}
      onStart={onStartTracking}
      onStop={onStopTracking}
      error={trackingError}
    />
    </div>
  )
}
