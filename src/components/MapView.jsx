import { useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { Locate } from 'lucide-react'
import L from 'leaflet'
import { BUSINESS_TYPE_MAP } from '../data/mockData'

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

function LocateButton() {
  const map = useMap()
  const markerRef = useRef(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización')
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (markerRef.current) markerRef.current.remove()
        markerRef.current = L.circleMarker([coords.latitude, coords.longitude], {
          radius: 9,
          fillColor: '#2563eb',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map)
        map.flyTo([coords.latitude, coords.longitude], 15)
        setLocating(false)
      },
      () => {
        setError('No se pudo obtener tu ubicación')
        setLocating(false)
      },
      { timeout: 10000 },
    )
  }

  return (
    <div className="locate-control">
      <button
        className="locate-btn"
        onClick={handleLocate}
        disabled={locating}
        title="Centrar en mi ubicación"
      >
        <Locate size={18} />
      </button>
      {error && <div className="locate-error">{error}</div>}
    </div>
  )
}

export default function MapView({ businesses }) {
  return (
    <MapContainer
      center={CORDOBA_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocateButton />
      {businesses.map((b) => {
        const typeInfo = BUSINESS_TYPE_MAP[b.type]
        return (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={PIN_ICONS[b.type] ?? DEFAULT_ICON}>
            <Popup>
              <div className="map-popup">
                <strong>{b.name}</strong>
                <span className="map-popup-type" style={{ color: typeInfo?.color }}>
                  {typeInfo?.label}
                </span>
                <p>{b.address}</p>
                <Link to={`/comercio/${b.id}`}>Ver detalles →</Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
