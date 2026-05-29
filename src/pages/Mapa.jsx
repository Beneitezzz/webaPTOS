import { useState, useMemo, useEffect } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import MapView from '../components/MapView'
import BusinessCard from '../components/BusinessCard'
import { RESTRICTIONS, BUSINESS_TYPES } from '../data/mockData'
import { useApp } from '../context/AppContext'
import { toggleItem } from '../utils/array'

export default function Mapa() {
  const { userProfile, businesses, businessesLoading, businessesError, profileLoading } = useApp()

  const [selectedRestrictions, setSelectedRestrictions] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filtersInitialized, setFiltersInitialized] = useState(false)

  useEffect(() => {
    if (!profileLoading && !filtersInitialized) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedRestrictions(userProfile.restrictions)
      setFiltersInitialized(true)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [profileLoading, filtersInitialized, userProfile.restrictions])

  const verifiedBusinesses = useMemo(
    () => businesses.filter((b) => b.verified && !b.pending),
    [businesses]
  )

  const filtered = useMemo(() => {
    return verifiedBusinesses.filter((b) => {
      const matchesRestrictions =
        selectedRestrictions.length === 0 ||
        selectedRestrictions.every((r) => b.tags.includes(r))
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(b.type)
      return matchesRestrictions && matchesType
    })
  }, [verifiedBusinesses, selectedRestrictions, selectedTypes])

  const toggleRestriction = (id) => setSelectedRestrictions((prev) => toggleItem(prev, id))
  const toggleType = (id) => setSelectedTypes((prev) => toggleItem(prev, id))

  const clearFilters = () => {
    setSelectedRestrictions([])
    setSelectedTypes([])
  }

  const hasFilters = selectedRestrictions.length > 0 || selectedTypes.length > 0

  return (
    <div className="map-page">
      <aside className={`map-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Filtros</h2>
          <div className="sidebar-header-actions">
            {hasFilters && (
              <button className="btn-link" onClick={clearFilters}>
                Limpiar
              </button>
            )}
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={18} /> : <SlidersHorizontal size={18} />}
            </button>
          </div>
        </div>

        {sidebarOpen && (
          <>
            {userProfile.restrictions.length > 0 && (
              <div className="sidebar-profile-hint">
                <span>Filtros de tu perfil aplicados</span>
              </div>
            )}

            <div className="filter-group">
              <h3>Restricción alimentaria</h3>
              {RESTRICTIONS.map((r) => (
                <label key={r.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedRestrictions.includes(r.id)}
                    onChange={() => toggleRestriction(r.id)}
                  />
                  <span className="filter-dot" style={{ backgroundColor: r.color }} />
                  {r.label}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3>Tipo de establecimiento</h3>
              {BUSINESS_TYPES.map((t) => (
                <label key={t.id} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(t.id)}
                    onChange={() => toggleType(t.id)}
                  />
                  <span className="filter-dot" style={{ backgroundColor: t.color }} />
                  {t.label}
                </label>
              ))}
            </div>

            <div className="sidebar-results-count">
              <strong>{filtered.length}</strong> resultado{filtered.length !== 1 ? 's' : ''}
            </div>

            <div className="sidebar-list">
              {filtered.length === 0 ? (
                <p className="no-results">
                  Ningún comercio coincide con los filtros seleccionados.
                </p>
              ) : (
                filtered.map((b) => <BusinessCard key={b.id} business={b} />)
              )}
            </div>
          </>
        )}
      </aside>

      <div className="map-container">
        {!sidebarOpen && (
          <button
            className="sidebar-open-fab"
            onClick={() => setSidebarOpen(true)}
            title="Abrir filtros"
          >
            <SlidersHorizontal size={20} />
          </button>
        )}
        {businessesLoading ? (
          <div className="page page-centered">
            <div className="spinner" />
          </div>
        ) : businessesError ? (
          <div className="page page-centered">
            <p className="text-muted">{businessesError}</p>
          </div>
        ) : (
          <MapView businesses={filtered} />
        )}
      </div>
    </div>
  )
}
