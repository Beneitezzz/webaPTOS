import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Mail, Phone } from 'lucide-react'
import { useState, useEffect } from 'react'
import { RESTRICTIONS } from '../../models/mockData'
import TopRatedSection from '../components/TopRatedSection'
import HowItWorks from '../components/HowItWorks'
import WhatWeDo from '../components/WhatWeDo'


function useFadeIn(delay) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  }
}

export default function Home() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const anim1 = useFadeIn(50)
  const anim2 = useFadeIn(200)
  const anim3 = useFadeIn(350)
  const anim4 = useFadeIn(500)
  const anim5 = useFadeIn(650)

  const handleSearch = (e) => {
    e.preventDefault()
    navigate('/mapa')
  }

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge" style={anim1}>📍 Córdoba, Argentina</div>
          <h1 className="hero-title" style={anim2}>
            Encontrá alimentos <span className="text-primary">seguros</span> cerca tuyo
          </h1>
          <p className="hero-subtitle" style={anim3}>
            La primera plataforma de Córdoba que centraliza comercios verificados para
            personas con celiaquía, diabetes, SIBO e intolerancia a la lactosa.
          </p>

          <div className="hero-search-wrap" style={anim4}>
            <div className="sonar-ring" />
            <div className="sonar-ring sonar-delay" />
            <form className="hero-search" onSubmit={handleSearch}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por tipo de local, restricción o dirección..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Explorar mapa
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          <div className="hero-tags" style={anim5}>
            {RESTRICTIONS.map((r) => (
              <span key={r.id} className="badge badge-md" style={{ backgroundColor: r.color }}>
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <TopRatedSection />

      <WhatWeDo />

      <HowItWorks />

      {/* CTA */}
      <section className="section cta-section">
        <div className="container cta-container">
          <h2>Empezá ahora, es gratis</h2>
          <p>Configurá tu perfil en menos de un minuto y empezá a explorar.</p>
          <div className="cta-buttons">
            <Link to="/perfil" className="btn btn-primary btn-lg">
              Crear mi perfil
            </Link>
            <Link to="/mapa" className="btn btn-outline btn-lg">
              Ver mapa directamente
            </Link>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="section contact-section">
        <div className="container">
          <div className="contact-header">
            <h2>Contactanos</h2>
            <p>Estamos para ayudarte. Escribinos o llamanos sin cargo.</p>
          </div>
          <div className="contact-cards">
            <div className="contact-card">
              <div className="contact-card-icon">
                <Mail size={24} />
              </div>
              <div className="contact-card-body">
                <span className="contact-card-label">Correo electrónico</span>
                <span className="contact-card-value">
                  <a href="mailto:contacto@puntosano.com.ar">contacto@puntosano.com.ar</a>
                </span>
                <span className="contact-card-sub">Respondemos en menos de 48 hs</span>
              </div>
            </div>
            <div className="contact-card">
              <div className="contact-card-icon">
                <Phone size={24} />
              </div>
              <div className="contact-card-body">
                <span className="contact-card-label">Línea gratuita</span>
                <span className="contact-card-value">0800-555-SANO (7266)</span>
                <span className="contact-card-sub">Lun a Vie, 9 a 18 hs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <footer className="app-footer">
        <div className="container">
          <p>
            <strong>Aviso legal:</strong> PuntoSano es una herramienta informativa. No reemplaza diagnósticos
            médicos ni se hace responsable legalmente por reacciones alérgicas. Siempre consultá con tu médico.
          </p>
          <p className="footer-links">
            <Link to="/politicas">Políticas y Privacidad</Link>
          </p>
          <p className="footer-copy">© 2025 PuntoSano · Proyecto académico — Universidad Siglo 21</p>
        </div>
      </footer>
    </div>
  )
}
