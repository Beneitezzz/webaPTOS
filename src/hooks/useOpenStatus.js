import { useState, useEffect } from 'react'
import { isOpenNow } from '../utils/hours'

export function useOpenStatus(openingHours) {
  const [status, setStatus] = useState(() =>
    openingHours?.length ? isOpenNow(openingHours) : null
  )

  useEffect(() => {
    if (!openingHours?.length) return
    const tick = () => setStatus(isOpenNow(openingHours))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [openingHours])

  return status
}
