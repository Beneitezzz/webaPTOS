# Geolocalización en tiempo real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time user location tracking to MapaApto's Leaflet map, with in-app OSRM routing to the selected business, external navigation links (Google Maps + Waze), distance badges in the sidebar, and a radius filter.

**Architecture:** A `useGeolocation` hook in `Mapa.jsx` drives all location state via `watchPosition`; it passes `userPosition`/`userAccuracy` down to `MapView`, which renders a `UserLocationLayer` (blue dot + accuracy circle + auto-pan) and a `RoutingLayer` (OSRM route polyline when a business is selected). `Mapa.jsx` also computes per-business distances via Haversine and exposes a radius slider + sort-by-proximity selector in the sidebar.

**Tech Stack:** React 19, React-Leaflet v5, Leaflet 1.9, `navigator.geolocation.watchPosition`, OSRM public routing API (`router.project-osrm.org`), lucide-react icons.

## Global Constraints

- All UI copy is in Spanish.
- No test runner — verification is manual via `npm run dev`.
- Plain CSS only — no Tailwind, no CSS modules. Add new rules to `src/index.css`.
- Follow existing class naming (`kebab-case`, BEM-like). Use CSS custom properties from `:root`.
- `react-leaflet` components that call `useMap()` must be rendered inside `<MapContainer>`.
- Never import `useMap` outside of a component rendered inside `<MapContainer>`.
- Commit after each task.

---

### Task 1: `useGeolocation` hook

**Files:**
- Create: `src/hooks/useGeolocation.js`

**Interfaces:**
- Produces:
  ```js
  // hook return shape
  {
    position: { lat: number, lng: number } | null,
    accuracy: number | null,   // meters
    active: boolean,
    error: string | null,
    start: () => void,
    stop: () => void,
  }
  ```

- [ ] **Step 1: Create the hook file**

  Create `src/hooks/useGeolocation.js` with this exact content:

  ```js
  import { useState, useRef, useCallback } from 'react'

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

    return { position, accuracy, active, error, start, stop }
  }
  ```

- [ ] **Step 2: Start dev server and verify the hook can be imported**

  Run: `npm run dev`

  Open the browser console and run:
  ```js
  // The hook won't be accessible in the console directly, but there should be no import errors in the Vite output.
  ```
  Expected: Vite compiles without errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/hooks/useGeolocation.js
  git commit -m "feat: add useGeolocation hook with watchPosition and cleanup"
  ```

---

### Task 2: `UserLocationLayer` component + CSS

**Files:**
- Create: `src/views/components/UserLocationLayer.jsx`
- Modify: `src/index.css` (add `.locate-btn--active`)

**Interfaces:**
- Consumes: `position: { lat, lng } | null`, `accuracy: number | null` from `useGeolocation`
- Produces: a React-Leaflet component rendered inside `<MapContainer>` that shows a blue dot + accuracy circle and auto-pans the map.

- [ ] **Step 1: Create `UserLocationLayer.jsx`**

  Create `src/views/components/UserLocationLayer.jsx`:

  ```jsx
  import { useEffect } from 'react'
  import { CircleMarker, Circle, useMap } from 'react-leaflet'

  export default function UserLocationLayer({ position, accuracy }) {
    const map = useMap()

    useEffect(() => {
      if (position) map.panTo([position.lat, position.lng], { animate: true })
    }, [position, map])

    if (!position) return null

    return (
      <>
        {accuracy != null && (
          <Circle
            center={[position.lat, position.lng]}
            radius={accuracy}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1, weight: 1 }}
          />
        )}
        <CircleMarker
          center={[position.lat, position.lng]}
          radius={9}
          pathOptions={{ fillColor: '#2563eb', color: '#fff', weight: 2, fillOpacity: 1 }}
        />
      </>
    )
  }
  ```

- [ ] **Step 2: Add `.locate-btn--active` CSS to `src/index.css`**

  Find the existing `.locate-btn:disabled` rule (around line 1100) and add after it:

  ```css
  .locate-btn--active { background: #2563eb; color: #fff; border-color: #2563eb; }
  .locate-btn--active:hover { background: #1d4ed8; }
  ```

- [ ] **Step 3: Verify**

  `npm run dev` — no Vite errors. (The component isn't mounted yet; full visual verification happens in Task 4.)

- [ ] **Step 4: Commit**

  ```bash
  git add src/views/components/UserLocationLayer.jsx src/index.css
  git commit -m "feat: add UserLocationLayer component with accuracy circle and auto-pan"
  ```

---

### Task 3: `RoutingLayer` component

**Files:**
- Create: `src/views/components/RoutingLayer.jsx`
- Modify: `src/index.css` (add `.popup-nav-links`, `.route-info-label`)

**Interfaces:**
- Consumes:
  ```js
  userPosition: { lat: number, lng: number } | null
  destination: { lat: number, lng: number } | null
  ```
- Produces: a React-Leaflet component that draws the OSRM driving route as a blue Polyline with a tooltip. Silently does nothing when either prop is `null` or fetch fails.

- [ ] **Step 1: Create `RoutingLayer.jsx`**

  Create `src/views/components/RoutingLayer.jsx`:

  ```jsx
  import { useState, useEffect } from 'react'
  import { Polyline, Tooltip } from 'react-leaflet'

  function formatDuration(seconds) {
    const mins = Math.round(seconds / 60)
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`
  }

  function formatDistance(meters) {
    return meters < 1000
      ? `${Math.round(meters)} m`
      : `${(meters / 1000).toFixed(1)} km`
  }

  export default function RoutingLayer({ userPosition, destination }) {
    const [route, setRoute] = useState(null)

    useEffect(() => {
      if (!userPosition || !destination) {
        setRoute(null)
        return
      }
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${userPosition.lng},${userPosition.lat};${destination.lng},${destination.lat}` +
        `?overview=full&geometries=geojson`

      let cancelled = false
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled || !data.routes?.[0]) return
          const r = data.routes[0]
          setRoute({
            // OSRM returns [lng, lat] — Leaflet needs [lat, lng]
            positions: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
            distance: r.distance,
            duration: r.duration,
          })
        })
        .catch(() => {})
      return () => { cancelled = true }
    }, [userPosition, destination])

    if (!route) return null

    return (
      <Polyline
        positions={route.positions}
        pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
      >
        <Tooltip sticky>
          <span className="route-info-label">
            {formatDistance(route.distance)} · {formatDuration(route.duration)}
          </span>
        </Tooltip>
      </Polyline>
    )
  }
  ```

- [ ] **Step 2: Add CSS for `.route-info-label` and `.popup-nav-links` to `src/index.css`**

  Add after the `.locate-error` rule block (around line 1112):

  ```css
  .route-info-label { font-size: 0.82rem; font-weight: 600; color: var(--text); }

  .popup-nav-links { display: flex; gap: 6px; margin-top: 6px; }
  .popup-nav-links a {
    font-size: 0.75rem; font-weight: 600; color: var(--primary);
    padding: 3px 8px; background: var(--primary-lighter);
    border-radius: 4px; white-space: nowrap;
  }
  .popup-nav-links a:hover { background: var(--accent); color: #fff; }
  ```

- [ ] **Step 3: Verify**

  `npm run dev` — no Vite errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/views/components/RoutingLayer.jsx src/index.css
  git commit -m "feat: add RoutingLayer component with OSRM route polyline and tooltip"
  ```

---

### Task 4: Update `MapView.jsx`

Wire the new components, convert `LocateButton` to a controlled toggle, and add "Cómo llegar" links in the popup.

**Files:**
- Modify: `src/views/components/MapView.jsx`

**Interfaces:**
- Consumes (new props):
  ```js
  userPosition: { lat: number, lng: number } | null
  userAccuracy: number | null
  trackingActive: boolean
  trackingError: string | null
  onStartTracking: () => void
  onStopTracking: () => void
  ```
- All existing props (`businesses`, `sidebarOpen`, `selectedBusinessId`, `favoriteIds`, `onToggleFavorite`) remain unchanged.

- [ ] **Step 1: Replace `MapView.jsx` with the updated version**

  Full replacement of `src/views/components/MapView.jsx`:

  ```jsx
  import { useRef, useEffect } from 'react'
  import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet'
  import { Link } from 'react-router-dom'
  import { Locate, Square } from 'lucide-react'
  import L from 'leaflet'
  import { BUSINESS_TYPE_MAP } from '../../models/mockData'
  import UserLocationLayer from './UserLocationLayer'
  import RoutingLayer from './RoutingLayer'

  const CORDOBA_CENTER = [-31.4201, -64.1888]

  function buildDivIcon(color) {
    const svg = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="38">
        <path fill="${color}" stroke="white" stroke-width="1.5"
          d="M12 0C7.58 0 4 3.58 4 8c0 6.67 8 16 8 16s8-9.33 8-16c0-4.42-3.58-8-8-8z"/>
        <circle cx="12" cy="8" r="3.5" fill="white"/>
      </svg>`
    )
    return L.divIcon({
      html: `<img src="data:image/svg+xml,${svg}" width="28" height="38" />`,
      className: '',
      iconSize: [28, 38],
      iconAnchor: [14, 38],
      popupAnchor: [0, -40],
    })
  }

  const PIN_ICONS = Object.fromEntries(
    Object.values(BUSINESS_TYPE_MAP).map(({ id, color }) => [id, buildDivIcon(color)])
  )
  const DEFAULT_ICON = buildDivIcon('#2d6a4f')

  function FlyToSelected({ selectedId, businesses, markerRefs }) {
    const map = useMap()
    useEffect(() => {
      if (!selectedId) return
      const business = businesses.find((b) => String(b.id) === String(selectedId))
      if (!business) return
      map.flyTo([business.lat, business.lng], Math.max(map.getZoom(), 15), { duration: 0.8 })
      const timer = setTimeout(() => {
        const marker = markerRefs.current[String(selectedId)]
        if (marker) marker.openPopup()
      }, 850)
      return () => clearTimeout(timer)
    }, [selectedId, businesses, map, markerRefs])
    return null
  }

  function ResizeWatcher({ trigger }) {
    const map = useMap()
    useEffect(() => {
      const t = setTimeout(() => map.invalidateSize(), 220)
      return () => clearTimeout(t)
    }, [trigger, map])
    return null
  }

  function LocateButton({ active, onStart, onStop, error }) {
    return (
      <div className="locate-control">
        <button
          className={`locate-btn${active ? ' locate-btn--active' : ''}`}
          onClick={active ? onStop : onStart}
          title={active ? 'Detener seguimiento' : 'Activar seguimiento de ubicación'}
        >
          {active ? <Square size={16} /> : <Locate size={18} />}
        </button>
        {error && <div className="locate-error">{error}</div>}
      </div>
    )
  }

  export default function MapView({
    businesses,
    sidebarOpen,
    selectedBusinessId,
    favoriteIds,
    onToggleFavorite,
    userPosition,
    userAccuracy,
    trackingActive,
    trackingError,
    onStartTracking,
    onStopTracking,
  }) {
    const markerRefs = useRef({})

    const selectedBusiness = selectedBusinessId
      ? businesses.find((b) => String(b.id) === String(selectedBusinessId))
      : null
    const destination = selectedBusiness
      ? { lat: selectedBusiness.lat, lng: selectedBusiness.lng }
      : null

    return (
      <MapContainer
        center={CORDOBA_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        <ResizeWatcher trigger={sidebarOpen} />
        <LocateButton
          active={trackingActive}
          onStart={onStartTracking}
          onStop={onStopTracking}
          error={trackingError}
        />
        <UserLocationLayer position={userPosition} accuracy={userAccuracy} />
        {trackingActive && (
          <RoutingLayer userPosition={userPosition} destination={destination} />
        )}
        <FlyToSelected selectedId={selectedBusinessId} businesses={businesses} markerRefs={markerRefs} />
        {businesses.map((b) => {
          const typeInfo = BUSINESS_TYPE_MAP[b.type]
          return (
            <Marker
              key={b.id}
              position={[b.lat, b.lng]}
              icon={PIN_ICONS[b.type] ?? DEFAULT_ICON}
              ref={(el) => { if (el) markerRefs.current[String(b.id)] = el }}
            >
              <Popup>
                <div className="map-popup">
                  <div className="map-popup-header">
                    <strong>{b.name}</strong>
                    {onToggleFavorite && (
                      <button
                        className={`popup-fav-btn${favoriteIds?.has(String(b.id)) ? ' active' : ''}`}
                        onClick={() => onToggleFavorite(String(b.id))}
                        title={favoriteIds?.has(String(b.id)) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                      >
                        {favoriteIds?.has(String(b.id)) ? '♥' : '♡'}
                      </button>
                    )}
                  </div>
                  <span className="map-popup-type" style={{ color: typeInfo?.color }}>
                    {typeInfo?.label}
                  </span>
                  <p>{b.address}</p>
                  <Link to={`/comercio/${b.id}`}>Ver detalles →</Link>
                  {trackingActive && userPosition && (
                    <div className="popup-nav-links">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${b.lat},${b.lng}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Maps
                      </a>
                      <a
                        href={`https://waze.com/ul?ll=${b.lat},${b.lng}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Waze
                      </a>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    )
  }
  ```

- [ ] **Step 2: Verify**

  `npm run dev` → go to `/mapa`. The locate button should appear in the bottom-right corner. Clicking it should prompt for location permission. If granted, the blue dot should appear and the map should pan to your position. The button icon should change to a stop square. Clicking again stops tracking and removes the dot. No console errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/components/MapView.jsx
  git commit -m "feat: wire UserLocationLayer and RoutingLayer into MapView, convert LocateButton to toggle"
  ```

---

### Task 5: Update `Mapa.jsx` — hook, distances, radius filter, sort

**Files:**
- Modify: `src/views/pages/Mapa.jsx`
- Modify: `src/index.css` (add `.sidebar-sort`, `.radius-filter`, `.distance-badge`)

**Interfaces:**
- Consumes: `useGeolocation` from Task 1 — `{ position, accuracy, active, error, start, stop }`
- Produces: `userPosition` and `userAccuracy` passed to `MapView`; `distance` (number|undefined) passed to each `BusinessCard`.

- [ ] **Step 1: Add CSS for sidebar sort, radius filter, and distance badge to `src/index.css`**

  Find the `.sidebar-results-count` rule (around line 514) and add before it:

  ```css
  .sidebar-sort { padding: 0.5rem 1rem; border-bottom: 1px solid var(--border); }
  .sidebar-sort select {
    width: 100%; padding: 6px 10px;
    border: 1px solid var(--border); border-radius: var(--radius-sm);
    font-family: inherit; font-size: 0.82rem; color: var(--text); background: #fff;
    cursor: pointer;
  }
  .sidebar-sort select:disabled { opacity: 0.5; cursor: not-allowed; }

  .radius-filter { display: flex; align-items: center; gap: 10px; }
  .radius-filter input[type="range"] { flex: 1; accent-color: var(--primary); }
  .radius-filter span { font-size: 0.82rem; font-weight: 600; color: var(--primary); min-width: 42px; text-align: right; }

  .distance-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 0.72rem; font-weight: 600;
    color: var(--primary); background: var(--primary-lighter);
    padding: 2px 7px; border-radius: 10px;
  }
  ```

- [ ] **Step 2: Replace `Mapa.jsx` with the updated version**

  Full replacement of `src/views/pages/Mapa.jsx`:

  ```jsx
  import { useState, useMemo, useEffect } from 'react'
  import { useSearchParams } from 'react-router-dom'
  import { SlidersHorizontal, X } from 'lucide-react'
  import MapView from '../components/MapView'
  import BusinessCard from '../components/BusinessCard'
  import SearchAutocomplete from '../components/SearchAutocomplete'
  import { RESTRICTIONS, BUSINESS_TYPES, BUSINESS_TYPE_MAP, mockBusinesses } from '../../models/mockData'
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
      const fromFirebase = businesses.filter((b) => b.verified && !b.pending)
      return fromFirebase.length > 0
        ? fromFirebase
        : mockBusinesses.filter((b) => b.verified && !b.pending)
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
  ```

- [ ] **Step 3: Verify**

  `npm run dev` → go to `/mapa`:
  - Sort dropdown appears below the "Abierto ahora" toggle, disabled (grey).
  - Click the locate button → grant permission → blue dot appears, map pans, button turns blue with stop icon.
  - "Ordenar: más cercano primero" option is now enabled in the dropdown.
  - A "Radio de búsqueda" slider appears; moving it changes the km label and filters businesses on the map and sidebar.
  - Distance badges appear on each `BusinessCard` (after Task 6).
  - Click a business marker → popup shows "Google Maps" and "Waze" links.

- [ ] **Step 4: Commit**

  ```bash
  git add src/views/pages/Mapa.jsx src/index.css
  git commit -m "feat: integrate geolocation into Mapa with distance calculation, radius filter, and sort by proximity"
  ```

---

### Task 6: Update `BusinessCard` with distance badge

**Files:**
- Modify: `src/views/components/BusinessCard.jsx`

**Interfaces:**
- Consumes: new prop `distance: number | undefined` (km). When `undefined`, renders nothing extra.

- [ ] **Step 1: Add `distance` prop and badge to `BusinessCard.jsx`**

  Add `distance` to the props destructuring and insert the badge in the `business-card-info` section.

  In `src/views/components/BusinessCard.jsx`, change:

  ```jsx
  export default memo(function BusinessCard({ business, isFavorite, onToggleFavorite, onSelect, selected }) {
  ```
  to:
  ```jsx
  export default memo(function BusinessCard({ business, isFavorite, onToggleFavorite, onSelect, selected, distance }) {
  ```

  Then find the `.business-card-info` block:
  ```jsx
        <div className="business-card-info">
          <span><MapPin size={13} /> {business.address}</span>
          {openStatus !== null && (
  ```
  and replace it with:
  ```jsx
        <div className="business-card-info">
          <span><MapPin size={13} /> {business.address}</span>
          {distance != null && (
            <span className="distance-badge">
              {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
            </span>
          )}
          {openStatus !== null && (
  ```

- [ ] **Step 2: Verify**

  `npm run dev` → activate tracking → each business card in the sidebar now shows a green distance badge (e.g. `1.2 km` or `340 m`). Deactivate tracking → badges disappear (distance becomes `undefined`).

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/components/BusinessCard.jsx
  git commit -m "feat: show distance badge on BusinessCard when tracking is active"
  ```

---

### Task 7: Add "Cómo llegar" buttons to `DetalleComercio`

Note: `DetalleComercio` is a standalone page without access to the tracking state from `Mapa.jsx`. The "Cómo llegar" buttons here always appear and open Google Maps / Waze without a prefilled origin — both apps use the device's GPS automatically for the origin.

**Files:**
- Modify: `src/views/pages/DetalleComercio.jsx`
- Modify: `src/index.css` (add `.btn-gmaps`, `.btn-waze`)

**Interfaces:**
- Consumes: `business.lat`, `business.lng` — already available on the business object.

- [ ] **Step 1: Add CSS for navigation buttons to `src/index.css`**

  Find the `.contact-buttons` style block (search for `.contact-buttons`) and add after it:

  ```css
  .btn-gmaps {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: var(--radius-sm);
    font-size: 0.875rem; font-weight: 600;
    background: #4285f4; color: #fff; border: none;
  }
  .btn-gmaps:hover { background: #3367d6; }
  .btn-waze {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: var(--radius-sm);
    font-size: 0.875rem; font-weight: 600;
    background: #33ccff; color: #1a1a1a; border: none;
  }
  .btn-waze:hover { background: #00b8e6; }
  ```

- [ ] **Step 2: Add "Cómo llegar" section to `DetalleComercio.jsx`**

  Find this exact block (the end of the `contact-buttons` div, before the `{/* Restrictions */}` comment):

  ```jsx
            </div>
          </div>

          {/* Restrictions */}
  ```

  Replace with:

  ```jsx
            </div>
            {business.lat != null && business.lng != null && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cómo llegar</h3>
                <div className="contact-buttons">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gmaps"
                  >
                    Google Maps
                  </a>
                  <a
                    href={`https://waze.com/ul?ll=${business.lat},${business.lng}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-waze"
                  >
                    Waze
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Restrictions */}
  ```

- [ ] **Step 3: Verify**

  `npm run dev` → go to any `/comercio/:id` page. A "Cómo llegar" section should appear below the contact buttons with Google Maps (blue) and Waze (cyan) buttons. Clicking either opens the respective app/site with the business location prefilled as destination.

- [ ] **Step 4: Commit**

  ```bash
  git add src/views/pages/DetalleComercio.jsx src/index.css
  git commit -m "feat: add Cómo llegar navigation buttons to DetalleComercio"
  ```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| `useGeolocation` hook with `watchPosition` + cleanup | Task 1 |
| `UserLocationLayer`: blue dot + accuracy circle + auto-pan | Task 2 |
| `RoutingLayer`: OSRM fetch + Polyline + tooltip distance/time | Task 3 |
| `LocateButton` toggle (start/stop) | Task 4 |
| "Cómo llegar" in map popup (Google Maps + Waze) | Task 4 |
| Hook wired into `Mapa.jsx` | Task 5 |
| Haversine distance per business | Task 5 |
| Radius filter slider (0.5–10 km, default 5 km) | Task 5 |
| Sort by proximity selector | Task 5 |
| Distance badge on `BusinessCard` | Task 6 |
| "Cómo llegar" on `DetalleComercio` | Task 7 |
| Error states: denied, timeout, OSRM failure, no-geolocation browser | Task 1 + Task 4 |
| `clearWatch` on unmount / stop | Task 1 |
