import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const cards = [
  {
    accent: '#296148',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.6" />
        <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
      </svg>
    ),
    title: 'Perfil personalizado',
    desc: 'Configurá tus restricciones alimentarias una sola vez y el sistema filtra automáticamente lo que es apto para vos.',
    cta: { label: 'Crear mi perfil', to: '/perfil' },
  },
  {
    accent: '#457B9D',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <path d="M12 21s-7-4.7-7-11a7 7 0 0 1 14 0c0 6.3-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.4" />
      </svg>
    ),
    title: 'Mapa interactivo',
    desc: 'Encontrá restaurantes, dietéticas y supermercados aptos cerca tuyo en Córdoba, resaltados en tiempo real.',
    cta: { label: 'Explorar mapa', to: '/mapa' },
  },
  {
    accent: '#2A9D8F',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3Z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: 'Información verificada',
    desc: 'Solo mostramos comercios con certificaciones oficiales vigentes, sin excepciones.',
    badge: 'Verificado por nuestro equipo',
  },
  {
    accent: '#C9821A',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <path d="M4 10l1.5-5h13L20 10" />
        <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />
        <path d="M9 20v-5h6v5" />
      </svg>
    ),
    title: 'Para comercios',
    desc: 'Si tenés un local con productos aptos, registrate y llegá directo a tu público objetivo en la ciudad.',
    cta: { label: 'Registrar mi comercio', to: '/registro-comercio' },
  },
]

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

export default function WhatWeDo() {
  const cardRefs = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('wwd-in-view') }),
      { threshold: 0.2 }
    )
    cardRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="wwd-section">
      <div className="wwd-head">
        <div className="wwd-eyebrow">🌿 La plataforma</div>
        <h2 className="wwd-title">¿Qué hace PuntoSano?</h2>
        <p className="wwd-subtitle">
          Todo lo que necesitás para encontrar — o para ofrecer — alimentos seguros en Córdoba.
        </p>
      </div>

      <div className="wwd-grid">
        {cards.map((card, i) => (
          <div
            key={i}
            ref={(el) => (cardRefs.current[i] = el)}
            className="wwd-card"
            style={{ '--wwd-accent': card.accent }}
          >
            <div className="wwd-icon-circle">
              {card.icon}
            </div>
            <h3 className="wwd-card-title">{card.title}</h3>
            <p className="wwd-card-desc">{card.desc}</p>

            {card.cta && (
              <Link to={card.cta.to} className="wwd-arrow">
                {card.cta.label} <ArrowIcon />
              </Link>
            )}
            {card.badge && (
              <span className="wwd-badge">
                <CheckIcon /> {card.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
