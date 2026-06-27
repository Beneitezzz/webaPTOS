import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import MapView from '../components/MapView'
import BusinessCard from '../components/BusinessCard'
import SearchAutocomplete from '../components/SearchAutocomplete'
import { RESTRICTIONS, BUSINESS_TYPES, BUSINESS_TYPE_MAP } from '../../models/mockData'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useFavorites } from '../../hooks/useFavorites'
import { useGeolocation } from '../../hooks/useGeolocation'
import { toggleItem } from '../../utils/array'
import { isOpenNow } from '../../utils/hours'

const RADIUS_OPTIONS = [0.5, 1, 2, 5, 10]

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

export default function Mapa() {
  const { userProfile, businesses, businessesLoading, businessesError, profileLoading } = useApp()
  const { currentUser } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const {
    position: userPosition,
    accuracy: userAccuracy,
    active: trackingActive,
    error: trackingError,
    start: startTracking,
    stop: stopTracking,
  } = useGeolocation()

  const [selectedRestrictions, setSelectedRestrictions] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filtersInitialized, setFiltersInitialized] = useState(false)
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [sortByDistance, setSortByDistance] = useState(false)
  const [radiusIndex, setRadiusIndex] = useState(3) // default 5 km (index 3 in RADIUS_OPTIONS)

  const radiusKm = RADIUS_OPTIONS[radiusIndex]

  useEffect(() => {
    if (!profileLoading && !filtersInitialized) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedRestrictions(userProfile.restrictions)
      setFiltersInitialized(true)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [profileLoading, filtersInitialized, userProfile.restrictions])

  const verifiedBusinesses = useMemo(() => {
    return businesses.filter((b) => b.verified && !b.pending)
  }, [businesses])

  const distanceMap = useMemo(() => {
    if (!userPosition) return new Map()
    const map = new Map()
    verifiedBusinesses.forEach((b) => {
      map.set(String(b.id), haversineKm(userPosition.lat, userPosition.lng, b.lat, b.lng))
    })
    return map
  }, [userPosition, verifiedBusinesses])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    return verifiedBusinesses.filter((b) => {
      const matchesRestrictions =
        selectedRestrictions.length === 0 ||
        selectedRestrictions.every((r) => b.tags.includes(r))
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(b.type)
      const matchesSearch =
        !q ||
        b.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q) ||
        (b.address ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q) ||
        (BUSINESS_TYPE_MAP[b.type]?.label ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q) ||
        b.tags.some((tag) => {
          const r = RESTRICTIONS.find((res) => res.id === tag)
          return r && r.label.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)
        })
      const matchesOpen = !onlyOpen || isOpenNow(b.openingHours) === true
      const matchesRadius =
        !trackingActive ||
        !userPosition ||
        (distanceMap.get(String(b.id)) ?? Infinity) <= radiusKm
      return matchesRestrictions && matchesType && matchesSearch && matchesOpen && matchesRadius
    })
  }, [verifiedBusinesses, selectedRestrictions, selectedTypes, searchQuery, onlyOpen, trackingActive, userPosition, distanceMap, radiusKm])

  const sortedFiltered = useMemo(() => {
    if (!sortByDistance || !userPosition) return filtered
    return [...filtered].sort((a, b) => {
      const da = distanceMap.get(String(a.id)) ?? Infinity
      const db = distanceMap.get(String(b.id)) ?? Infinity
      return da - db
    })
  }, [filtered, sortByDistance, userPosition, distanceMap])

  const searchSuggestions = useMemo(() => {
    const names = verifiedBusinesses.map((b) => b.name)
    const addresses = verifiedBusinesses.map((b) => b.address).filter(Boolean)
    const types = BUSINESS_TYPES.map((t) => t.label)
    const restrictions = RESTRICTIONS.map((r) => r.label)
    return [...new Set([...types, ...restrictions, ...names, ...addresses])]
  }, [verifiedBusinesses])

  const toggleRestriction = (id) => setSelectedRestrictions((prev) => toggleItem(prev, id))
  const toggleType = (id) => setSelectedTypes((prev) => toggleItem(prev, id))

  const clearFilters = () => {
    setSelectedRestrictions([])
    setSelectedTypes([])
    setOnlyOpen(false)
    setSearchQuery('')
    setSortByDistance(false)
    setRadiusIndex(3)
  }

  const hasFilters =
    selectedRestrictions.length > 0 ||
    selectedTypes.length > 0 ||
    onlyOpen ||
    searchQuery.length > 0 ||
    sortByDistance

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
            <div className="search-bar-wrapper">
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                suggestions={searchSuggestions}
                placeholder="Buscar comercio, dirección..."
                inputClassName="form-input search-input"
              />
            </div>

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

            <div className="filter-group">
              <label className="filter-open-toggle">
                <span>Abierto ahora</span>
                <button
                  role="switch"
                  aria-checked={onlyOpen}
                  className={`toggle-switch ${onlyOpen ? 'on' : ''}`}
                  onClick={() => setOnlyOpen((v) => !v)}
                />
              </label>
            </div>

            {trackingActive && (
              <div className="filter-group">
                <h3>Radio de búsqueda</h3>
                <div className="radius-filter">
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={radiusIndex}
                    onChange={(e) => setRadiusIndex(Number(e.target.value))}
                  />
                  <span>{radiusKm < 1 ? `${radiusKm * 1000} m` : `${radiusKm} km`}</span>
                </div>
              </div>
            )}

            <div className="sidebar-sort">
              <select
                value={sortByDistance ? 'distance' : 'default'}
                onChange={(e) => setSortByDistance(e.target.value === 'distance')}
                disabled={!trackingActive}
              >
                <option value="default">Ordenar: por defecto</option>
                <option value="distance">Ordenar: más cercano primero</option>
              </select>
            </div>

            <div className="sidebar-results-count">
              <strong>{sortedFiltered.length}</strong> resultado{sortedFiltered.length !== 1 ? 's' : ''}
            </div>

            <div className="sidebar-list">
              {sortedFiltered.length === 0 ? (
                <p className="no-results">
                  Ningún comercio coincide con los filtros seleccionados.
                </p>
              ) : (
                sortedFiltered.map((b) => (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    isFavorite={currentUser ? favoriteIds.has(String(b.id)) : undefined}
                    onToggleFavorite={currentUser ? toggleFavorite : undefined}
                    onSelect={setSelectedBusinessId}
                    selected={selectedBusinessId === b.id}
                    distance={distanceMap.get(String(b.id))}
                  />
                ))
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
          <MapView
            businesses={sortedFiltered}
            sidebarOpen={sidebarOpen}
            selectedBusinessId={selectedBusinessId}
            favoriteIds={currentUser ? favoriteIds : undefined}
            onToggleFavorite={currentUser ? toggleFavorite : undefined}
            userPosition={userPosition}
            userAccuracy={userAccuracy}
            trackingActive={trackingActive}
            trackingError={trackingError}
            onStartTracking={startTracking}
            onStopTracking={stopTracking}
          />
        )}
      </div>
    </div>
  )
}
