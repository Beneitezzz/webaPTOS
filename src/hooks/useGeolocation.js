import { useState, useRef, useCallback, useEffect } from 'react'

export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState(null)
  const watchIdRef = useRef(null)

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setActive(false)
    setPosition(null)
    setAccuracy(null)
    setError(null)
  }, [])

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización')
      return
    }
    if (watchIdRef.current !== null) return
    setError(null)
    setActive(true)
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setPosition({ lat: coords.latitude, lng: coords.longitude })
        setAccuracy(coords.accuracy)
        setError(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Permiso denegado. Habilitá la ubicación en tu navegador.')
        } else {
          setError('No se pudo obtener tu ubicación')
        }
        setActive(false)
        watchIdRef.current = null
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { position, accuracy, active, error, start, stop }
}
