import { useState, useEffect } from 'react'
import { Polyline, Tooltip } from 'react-leaflet'

function formatDuration(seconds) {
  const mins = Math.round(seconds / 60)
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`
}

function formatDistance(meters) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`
}

const ROUTE_PATH_OPTIONS = { color: '#2563eb', weight: 4, opacity: 0.8 }

export default function RoutingLayer({ userPosition, destination }) {
  const [route, setRoute] = useState(null)

  useEffect(() => {
    if (!userPosition || !destination) {
      setRoute(null)
      return
    }
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${userPosition.lng},${userPosition.lat};${destination.lng},${destination.lat}` +
      `?overview=full&geometries=geojson`

    let cancelled = false
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.routes?.[0]) return
        const r = data.routes[0]
        setRoute({
          // OSRM returns [lng, lat] — Leaflet needs [lat, lng]
          positions: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          distance: r.distance,
          duration: r.duration,
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [userPosition, destination])

  if (!route) return null

  return (
    <Polyline
      positions={route.positions}
      pathOptions={ROUTE_PATH_OPTIONS}
    >
      <Tooltip sticky>
        <span className="route-info-label">
          {formatDistance(route.distance)} · {formatDuration(route.duration)}
        </span>
      </Tooltip>
    </Polyline>
  )
}
