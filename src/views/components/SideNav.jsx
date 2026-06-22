import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { id: 'destacados',    label: '⭐ Lo más valorado' },
  { id: 'que-hace',      label: '🌿 ¿Qué hace PuntoSano?' },
  { id: 'como-funciona', label: '🧭 ¿Cómo funciona?' },
  { id: 'registro',      label: '🌟 Registrate gratis' },
  { id: 'contacto',      label: '✉️ Contactanos' },
]

export default function SideNav() {
  const [active, setActive] = useState(null)

  useEffect(() => {
    const onScroll = () => {
      const midY = window.innerHeight / 2
      let bestId = null
      let bestDist = Infinity
      NAV_ITEMS.forEach(({ id }) => {
        const el = document.getElementById(id)
        if (!el) return
        const top = el.getBoundingClientRect().top
        if (top <= midY) {
          const dist = midY - top
          if (dist < bestDist) { bestDist = dist; bestId = id }
        }
      })
      // At the very bottom of the page, the last section can't scroll past midY.
      // Only then override with the last section that is visible in the viewport.
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50
      if (atBottom) {
        for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
          const el = document.getElementById(NAV_ITEMS[i].id)
          if (!el) continue
          const top = el.getBoundingClientRect().top
          if (top > 0 && top < window.innerHeight) {
            bestId = NAV_ITEMS[i].id
            break
          }
        }
      }
      setActive(bestId)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (e, id) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="side-nav" aria-label="Navegación por secciones">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`side-nav-item${active === item.id ? ' active' : ''}`}
          onClick={(e) => scrollTo(e, item.id)}
        >
          <span className="side-nav-label">{item.label}</span>
          <span className="side-nav-pip" />
        </a>
      ))}
    </nav>
  )
}
