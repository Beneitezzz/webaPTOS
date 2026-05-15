import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Search, ShieldCheck, User, Store } from 'lucide-react'
import { useState } from 'react'
import { RESTRICTIONS } from '../data/mockData'

const features = [
  {
    icon: <User size={28} />,
    title: 'Perfil personalizado',
    desc: 'Configurá tus restricciones alimentarias una sola vez y el sistema filtra automáticamente.',
  },
  {
    icon: <MapPin size={28} />,
    title: 'Mapa interactivo',
    desc: 'Encontrá restaurantes, dietéticas y supermercados aptos cerca tuyo en Córdoba.',
  },
  {
    icon: <ShieldCheck size={28} />,
    title: 'Información verificada',
    desc: 'Solo mostramos comercios con certificaciones oficiales (ANMAT, RNPA, RME).',
  },
  {
    icon: <Store size={28} />,
    title: 'Para comercios',
    desc: 'Si tenés un local con productos aptos, registrate y llegá a tu público objetivo.',
  },
]

const steps = [
  { n: 1, title: 'Creá tu perfil', desc: 'Indicá tus restricciones: celiaquía, diabetes, SIBO, lactosa.' },
  { n: 2, title: 'Explorá el mapa', desc: 'El mapa resalta automáticamente los comercios que se adaptan a tu perfil.' },
  { n: 3, title: 'Visitá con confianza', desc: 'Cada comercio tiene menú, horarios y contacto directo verificados.' },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    navigate('/mapa')
  }

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">📍 Córdoba, Argentina</div>
          <h1 className="hero-title">
            Encontrá alimentos <span className="text-primary">seguros</span> cerca tuyo
          </h1>
          <p className="hero-subtitle">
            La primera plataforma de Córdoba que centraliza comercios verificados para
            personas con celiaquía, diabetes, SIBO e intolerancia a la lactosa.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por tipo de local o producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Explorar mapa
            </button>
          </form>

          <div className="hero-tags">
            {RESTRICTIONS.map((r) => (
              <span key={r.id} className="badge badge-md" style={{ backgroundColor: r.color }}>
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">¿Qué hace MapaApto?</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">¿Cómo funciona?</h2>
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* Disclaimer */}
      <footer className="app-footer">
        <div className="container">
          <p>
            <strong>Aviso legal:</strong> MapaApto es una herramienta informativa. No reemplaza diagnósticos
            médicos ni se hace responsable legalmente por reacciones alérgicas. Siempre consultá con tu médico.
          </p>
          <p className="footer-copy">© 2025 MapaApto · Proyecto académico — Universidad Siglo 21</p>
        </div>
      </footer>
    </div>
  )
}
