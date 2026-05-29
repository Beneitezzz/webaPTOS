# RF02 — Geocodificación real de dirección en RegistroComercio

## Contexto

El formulario de registro de comercios asignaba coordenadas aleatorias cerca del centro de Córdoba (`Math.random()`), lo que violaba RF02 que exige "indicando ubicación geográfica" real. Este spec define el reemplazo: geocodificación automática vía Nominatim con confirmación visual en mini mapa.

## Alcance

Un único archivo modificado: `src/pages/RegistroComercio.jsx`. Sin nuevas dependencias (react-leaflet ya está instalado).

---

## Flujo de datos

1. El usuario escribe en el campo `address`.
2. Un `useEffect` con debounce de 800ms observa `form.address`.
3. Si `form.address.trim().length < 5`, no dispara la llamada.
4. Al dispararse, setea `geocoding: true` y llama a Nominatim:
   ```
   https://nominatim.openstreetmap.org/search
     ?q={address}+Córdoba+Argentina
     &format=json&limit=1&addressdetails=1
   ```
5. Si hay resultado: setea `coords: { lat: parseFloat(lat), lng: parseFloat(lon) }`, limpia `geocodeError`.
6. Si no hay resultado o fetch falla: setea `geocodeError`, `coords: null`.
7. En `handleSubmit`: usa `coords.lat` y `coords.lng` en lugar de `Math.random()`.
8. Si `address` tiene texto pero `coords` es null al enviar, agrega error de validación y bloquea el envío.

El debounce usa `useRef` para almacenar el timer y lo limpia en cada keystroke y en el cleanup del effect.

---

## Estado nuevo

```js
const [coords, setCoords] = useState(null)       // { lat, lng } | null
const [geocoding, setGeocoding] = useState(false)
const [geocodeError, setGeocodeError] = useState('')
const debounceRef = useRef(null)
```

---

## UI

Debajo del campo de dirección, zona de estado con estos casos mutuamente excluyentes:

| Condición | Qué se muestra |
|---|---|
| `address` vacío o < 5 chars | Nada |
| `geocoding: true` | Spinner pequeño + "Buscando ubicación..." |
| `coords` presente | Mini mapa 220px con pin arrastrable |
| `geocodeError` presente | "No se encontró la dirección. Intentá con más detalle." |

**Mini mapa:**
- `MapContainer`: altura 220px, zoom 15, `zoomControl={false}`, `scrollWheelZoom={false}`
- `TileLayer`: OpenStreetMap estándar
- `Marker` con `draggable={true}` en posición `[coords.lat, coords.lng]`
- Al soltar el drag (`dragend`), actualiza `coords` con la nueva posición del marker
- Centrado en `coords` al aparecer; si el usuario edita la dirección nuevamente el mapa desaparece y vuelve a geocodificar

**Componente interno `DraggableMarker`** (no exportado):
- Recibe `coords` y `onMove: (lat, lng) => void`
- Usa la prop `eventHandlers={{ dragend: (e) => onMove(e.target.getLatLng()) }}` del `<Marker>`
- Llama `onMove` con las nuevas coordenadas al soltar el pin

---

## Validación

En la función `validate()`, agrega:
```js
if (form.address.trim() && !coords) {
  errs.address = 'No se pudo verificar la ubicación. Ajustá la dirección.'
}
```

Esto se suma a la validación existente de campo vacío, así que si `address` está vacío ya falla antes.

---

## handleSubmit

Reemplaza:
```js
lat: -31.4201 + (Math.random() - 0.5) * 0.04,
lng: -64.1888 + (Math.random() - 0.5) * 0.04,
```
Por:
```js
lat: coords.lat,
lng: coords.lng,
```

---

## CSS nuevo

```css
.geocode-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.82rem; color: var(--text-muted);
  margin-top: 6px;
}
.geocode-error { font-size: 0.82rem; color: var(--danger); margin-top: 6px; }
.mini-map { height: 220px; margin-top: 8px; border-radius: var(--radius); overflow: hidden; }
```

---

## Casos borde

- **Nominatim rate limit (HTTP 429)**: el catch setea `geocodeError` con mensaje genérico. El usuario puede reintentarlo editando el campo.
- **Sin conexión**: idem, manejo en el catch.
- **Dirección fuera de Córdoba**: Nominatim puede devolver resultados de otras ciudades. El parámetro `+Córdoba+Argentina` en la query reduce esto pero no lo elimina. El mini mapa permite al usuario detectarlo visualmente y ajustar el pin.
- **Edición post-geocoding**: si el usuario edita la dirección, `coords` se resetea a null y el mapa desaparece hasta que el nuevo debounce resuelva.
