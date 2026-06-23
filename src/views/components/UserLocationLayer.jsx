import { useEffect } from 'react'
import { CircleMarker, Circle, useMap } from 'react-leaflet'

export default function UserLocationLayer({ position, accuracy }) {
  const map = useMap()

  useEffect(() => {
    if (position) map.panTo([position.lat, position.lng], { animate: true })
  }, [position, map])

  if (!position) return null

  return (
    <>
      {accuracy != null && (
        <Circle
          center={[position.lat, position.lng]}
          radius={accuracy}
          pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1, weight: 1 }}
        />
      )}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={9}
        pathOptions={{ fillColor: '#2563eb', color: '#fff', weight: 2, fillOpacity: 1 }}
      />
    </>
  )
}
