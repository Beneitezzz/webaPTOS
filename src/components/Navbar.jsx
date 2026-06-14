import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MapPin, Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PUBLIC_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/mapa', label: 'Explorar Mapa' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { pathname } = useLocation()
  const { currentUser, userRole, signOut } = useAuth()
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName =
    currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <MapPin size={22} />
        <span>MapaApto</span>
      </Link>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {PUBLIC_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link ${pathname === l.to ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {l.label}
          </Link>
        ))}

        {currentUser && (
          <Link
            to="/perfil"
            className={`nav-link ${pathname === '/perfil' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Mi Perfil
          </Link>
        )}

        {(userRole === 'comercio' || userRole === 'admin') && (
          <Link
            to="/registro-comercio"
            className={`nav-link ${pathname === '/registro-comercio' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Mi Comercio
          </Link>
        )}

        {userRole === 'admin' && (
          <Link
            to="/admin"
            className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            Admin
          </Link>
        )}

        {currentUser ? (
          <div className="navbar-user-menu" ref={dropdownRef}>
            <button
              className="navbar-user-btn"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              Hola, {displayName} <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown">
                <Link
                  to="/perfil"
                  className="navbar-dropdown-item"
                  onClick={() => { setDropdownOpen(false); setMenuOpen(false) }}
                >
                  Mi Perfil
                </Link>
                <button
                  className="navbar-dropdown-item danger"
                  onClick={() => { signOut(); setDropdownOpen(false); setMenuOpen(false) }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="btn btn-sm"
            style={{ background: 'white', color: '#1a6b3c', fontWeight: 600 }}
            onClick={() => setMenuOpen(false)}
          >
            Ingresar
          </Link>
        )}
      </div>

      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menú"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>
  )
}
