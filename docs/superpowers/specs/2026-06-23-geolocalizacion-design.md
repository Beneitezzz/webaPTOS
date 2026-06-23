# Geolocalización en tiempo real — Diseño

**Fecha:** 2026-06-23
**Proyecto:** MapaApto (frontend)
**Estado:** Aprobado

---

## Resumen

Agregar seguimiento de ubicación en tiempo real del usuario sobre el mapa de Leaflet, con ruta visual desde su posición hasta el comercio seleccionado, links de navegación externa (Google Maps y Waze), distancias en el sidebar y filtro de radio.

---

## Arquitectura y flujo de datos

El estado de geolocalización vive en `Mapa.jsx` porque lo consumen tanto el mapa como el sidebar. El flujo es:

```
useGeolocation (hook)
    ↓ { position, accuracy, active, error, start, stop }
Mapa.jsx
    ├── calcula distancias por comercio (useMemo, Haversine)
    ├── aplica filtro de radio (distanceKm <= radioSeleccionado)
    ├── sidebar → BusinessCard recibe `distance`
    └── MapView recibe `userPosition` + `userAccuracy`
            ├── UserLocationLayer  (punto azul + círculo de precisión + auto-pan)
            └── RoutingLayer       (ruta OSRM + botón externo cuando hay comercio seleccionado)
```

---

## Archivos nuevos

| Archivo | Responsabilidad |
|---|---|
| `src/hooks/useGeolocation.js` | Encapsula `watchPosition`, cleanup, errores y estado activo |
| `src/views/components/UserLocationLayer.jsx` | Marcador azul + círculo de precisión + auto-pan |
| `src/views/components/RoutingLayer.jsx` | Fetch OSRM + Polyline + tooltip distancia/tiempo + links externos |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/views/components/MapView.jsx` | Monta `UserLocationLayer` y `RoutingLayer`; botón toggle start/stop; "Cómo llegar" en popup |
| `src/views/pages/Mapa.jsx` | Usa `useGeolocation`; calcula distancias; filtro de radio; sort por cercanía |
| `src/views/components/BusinessCard.jsx` | Badge de distancia (`1.2 km` o `340 m`) cuando `distance` está disponible |

---

## Componentes en detalle

### `useGeolocation` hook

```
retorna: { position, accuracy, active, error, start, stop }
```

- `start()` llama `navigator.geolocation.watchPosition` y guarda el watch ID en un ref.
- `stop()` llama `clearWatch` y resetea el estado.
- `useEffect` cleanup llama `clearWatch` para evitar watchers huérfanos al desmontar.
- Si el navegador no soporta geolocalización, `start()` setea `error` inmediatamente.
- `position` es `{ lat, lng }` | `null`.

### `UserLocationLayer`

- Solo se renderiza si `position !== null`.
- `CircleMarker` azul (radio 9px, borde blanco) en la posición del usuario.
- `Circle` semitransparente (azul, 20% opacidad) con radio = `accuracy` en metros — indica la precisión del GPS.
- En cada cambio de `position`, llama `map.panTo([lat, lng], { animate: true })`.

### `RoutingLayer`

- Solo se activa cuando `userPosition !== null` && `selectedBusinessId !== null`.
- Hace `fetch` a la API pública de OSRM:
  ```
  https://router.project-osrm.org/route/v1/driving/{userLng},{userLat};{destLng},{destLat}?overview=full&geometries=geojson
  ```
- Dibuja la ruta como `Polyline` azul (`#2563eb`, weight 4, opacity 0.8).
- Muestra un `Tooltip` permanente sobre la ruta con distancia en km y duración en minutos.
- Si el fetch falla (sin conexión, OSRM caído), la ruta simplemente no se dibuja — sin error visible.
- Al deseleccionar el comercio, la ruta desaparece.

### Botón "Cómo llegar" (en popup y en `DetalleComercio`)

Aparece solo cuando `userPosition` está activo. Dos íconos/links:

- **Google Maps:** `https://www.google.com/maps/dir/?api=1&origin={userLat},{userLng}&destination={destLat},{destLng}&travelmode=walking`
- **Waze:** `https://waze.com/ul?ll={destLat},{destLng}&navigate=yes`

Ambos abren en nueva pestaña (`target="_blank" rel="noopener noreferrer"`).

---

## Sidebar — Distancias, ordenamiento y filtro de radio

### Cálculo de distancias

En `Mapa.jsx`, `useMemo` calcula un `Map<businessId, distanceKm>` usando la fórmula de Haversine sobre cada comercio filtrado. Solo se recalcula cuando `position` o `verifiedBusinesses` cambian.

### Badge en `BusinessCard`

Cuando `distance` (en km) está disponible:
- `>= 1 km`: muestra `1.2 km`
- `< 1 km`: muestra `340 m`

### Selector de orden

Visible siempre. Opciones: "Por defecto" | "Más cercano primero". El sort por cercanía ordena el array `filtered` por `distanceKm` antes de renderizar. Si `active` es false, la opción "Más cercano primero" está deshabilitada.

### Filtro de radio

Visible solo cuando el seguimiento está activo. Slider con valores: 0.5, 1, 2, 5, 10 km. Valor por defecto: 5 km. El `useMemo` de `filtered` incorpora: `distanceKm <= radioSeleccionado`. El contador de resultados existente refleja el filtro.

---

## Manejo de errores

| Escenario | Comportamiento |
|---|---|
| Permiso denegado | El botón muestra "Permiso denegado". El mapa sigue funcionando normalmente. |
| Timeout / sin señal | Mensaje "No se pudo obtener tu ubicación" con botón para reintentar (`start()`). |
| OSRM sin respuesta | La ruta no se dibuja. El mapa y los comercios siguen funcionando. |
| Navegador sin geolocalización | `error` se setea al intentar activar. Mensaje explicativo. |
| Desmontar con tracking activo | `clearWatch` garantizado en cleanup de `useEffect`. |

---

## Fuera de scope

- Filtro de radio cuando el seguimiento está inactivo (sin posición no hay distancias).
- Notificaciones push cuando el usuario entra en radio de un comercio.
- Caché de rutas OSRM.
- Modo de navegación paso a paso dentro de la app (cubierto por la apertura en Google Maps / Waze).
