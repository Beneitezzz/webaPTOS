import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MapPin, Menu, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const navLinks = [
  { to: '/', label: 'Inicio' },
  { to: '/mapa', label: 'Explorar Mapa' },
  { to: '/perfil', label: 'Mi Perfil' },
  { to: '/registro-comercio', label: 'Soy Comercio' },
  { to: '/admin', label: 'Admin' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { userProfile } = useApp()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <MapPin size={22} />
        <span>MapaApto</span>
      </Link>

      <div className={`navbar-links ${open ? 'open' : ''}`}>
        {navLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link ${pathname === l.to ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        {userProfile.name && (
          <span className="navbar-user">Hola, {userProfile.name}</span>
        )}
      </div>

      <button className="navbar-toggle" onClick={() => setOpen(!open)} aria-label="Menú">
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>
  )
}
