# RF02 — Geocodificación real de dirección en RegistroComercio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar las coordenadas aleatorias en el registro de comercios por geocodificación real vía Nominatim, con mini mapa de confirmación y pin arrastrable.

**Architecture:** `RegistroComercio.jsx` agrega un `useEffect` con debounce de 800ms que llama a Nominatim al cambiar el campo `address`. Las coordenadas resultantes se muestran en un mini `MapContainer` de react-leaflet (ya instalado) con un `Marker` arrastrable. Al enviar, se usan esas coordenadas en lugar de `Math.random()`. Si no hay coords al enviar, la validación bloquea el submit.

**Tech Stack:** React 19, react-leaflet (ya instalado), Nominatim API (gratuita, sin API key)

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|---|---|---|
| Modificar | `src/pages/RegistroComercio.jsx` | Todo el cambio: estado, useEffect, componente DraggableMarker, JSX, validate, handleSubmit |
| Modificar | `src/index.css` | Clases `.geocode-status`, `.geocode-error`, `.mini-map`, `.spinner-sm` |

---

## Task 1: Geocoding state, DraggableMarker, useEffect y UI

**Files:**
- Modify: `src/pages/RegistroComercio.jsx`
- Modify: `src/index.css`

- [ ] **Paso 1: Actualizar los imports de React y agregar react-leaflet**

Reemplazar la línea 1 de `src/pages/RegistroComercio.jsx`:

```jsx
import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Store } from 'lucide-react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc } from 'firebase/firestore'
import { storage, db } from '../firebase'
import { useApp } from '../context/AppContext'
import { RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS } from '../data/mockData'
import { toggleItem } from '../utils/array'
```

- [ ] **Paso 2: Agregar el componente `DraggableMarker` justo antes del `export default`**

Insertar entre la línea `const availableCerts = [...]` y el `export default function RegistroComercio()`:

```jsx
function DraggableMarker({ coords, onMove }) {
  return (
    <Marker
      position={[coords.lat, coords.lng]}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng()
          onMove(lat, lng)
        },
      }}
    />
  )
}
```

- [ ] **Paso 3: Agregar estado de geocodificación dentro del componente**

Después de la línea `const [errors, setErrors] = useState({})`, agregar:

```jsx
const [coords, setCoords] = useState(null)
const [geocoding, setGeocoding] = useState(false)
const [geocodeError, setGeocodeError] = useState('')
const [geocodeId, setGeocodeId] = useState(0)
const debounceRef = useRef(null)
```

- [ ] **Paso 4: Agregar el `useEffect` de geocodificación**

Después del bloque de estado nuevo (después de `debounceRef`), agregar:

```jsx
useEffect(() => {
  const addr = form.address.trim()
  if (addr.length < 5) {
    setCoords(null)
    setGeocodeError('')
    setGeocoding(false)
    return
  }
  clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(async () => {
    setGeocoding(true)
    setGeocodeError('')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr + ' Córdoba Argentina')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      if (data.length > 0) {
        setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
        setGeocodeId((n) => n + 1)
      } else {
        setCoords(null)
        setGeocodeError('No se encontró la dirección. Intentá con más detalle.')
      }
    } catch {
      setCoords(null)
      setGeocodeError('Error al buscar la dirección. Verificá tu conexión.')
    } finally {
      setGeocoding(false)
    }
  }, 800)
  return () => clearTimeout(debounceRef.current)
}, [form.address]) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Paso 5: Agregar la sección de geocoding en el JSX, debajo del input de dirección**

Reemplazar el bloque del campo dirección (líneas 174-183 del archivo original) con:

```jsx
<div className="form-group">
  <label className="form-label">Dirección *</label>
  <input
    className={`form-input ${errors.address ? 'error' : ''}`}
    placeholder="Ej: Av. Colón 1234, Córdoba"
    value={form.address}
    onChange={(e) => handleChange('address', e.target.value)}
  />
  {geocoding && (
    <p className="geocode-status"><span className="spinner-sm" /> Buscando ubicación...</p>
  )}
  {geocodeError && !geocoding && (
    <p className="geocode-error">{geocodeError}</p>
  )}
  {coords && !geocoding && (
    <div className="mini-map">
      <MapContainer
        key={geocodeId}
        center={[coords.lat, coords.lng]}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={false}
        style={{ height: '220px' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DraggableMarker
          coords={coords}
          onMove={(lat, lng) => setCoords({ lat, lng })}
        />
      </MapContainer>
    </div>
  )}
  {errors.address && <span className="form-error">{errors.address}</span>}
</div>
```

- [ ] **Paso 6: Agregar CSS en `src/index.css`**

Buscar la línea `.spinner {` (línea 444) y agregar justo antes:

```css
.geocode-status {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.82rem; color: var(--text-muted); margin-top: 6px;
}
.geocode-error { font-size: 0.82rem; color: #dc3545; margin-top: 6px; }
.mini-map { margin-top: 8px; border-radius: var(--radius); overflow: hidden; }
.spinner-sm {
  display: inline-block; width: 14px; height: 14px; flex-shrink: 0;
  border: 2px solid #e0e0e0; border-top-color: #1a6b3c;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
```

- [ ] **Paso 7: Verificar compilación**

```bash
npm run build
```

Resultado esperado: sin errores.

- [ ] **Paso 8: Verificar manualmente en el navegador**

```bash
npm run dev
```

Ir a `http://localhost:5173/registro-comercio` (loguearse si es necesario).

Verificar:
1. Al escribir "Av. Colón 1" en Dirección → nada (< 5 chars)
2. Al escribir "Av. Colón 1234" → spinner aparece brevemente, luego mini mapa centrado en Córdoba
3. El pin es arrastrable y al soltarlo el mapa queda en la nueva posición
4. Al borrar la dirección → mapa desaparece
5. Al escribir una dirección inexistente ("aaaaa bbbbb 99999") → aparece el mensaje de error

- [ ] **Paso 9: Commit**

```bash
git add src/pages/RegistroComercio.jsx src/index.css
git commit -m "feat: add Nominatim geocoding with draggable map to RegistroComercio"
```

---

## Task 2: Conectar coords a validate() y handleSubmit()

**Files:**
- Modify: `src/pages/RegistroComercio.jsx`

- [ ] **Paso 1: Actualizar `validate()` para exigir coords cuando hay dirección**

Reemplazar el bloque de `validate()`:

```jsx
const validate = () => {
  const errs = {}
  if (!form.name.trim()) errs.name = 'El nombre es requerido'
  if (!form.type) errs.type = 'Seleccioná un tipo de establecimiento'
  if (!form.address.trim()) errs.address = 'La dirección es requerida'
  else if (!coords) errs.address = 'No se pudo verificar la ubicación. Ajustá la dirección.'
  if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
  if (form.tags.length === 0) errs.tags = 'Seleccioná al menos una restricción alimentaria'
  if (form.certifications.length === 0) errs.certifications = 'Seleccioná al menos una certificación'
  return errs
}
```

- [ ] **Paso 2: Actualizar `handleSubmit()` para usar coords reales**

Reemplazar las dos líneas de `Math.random()` dentro de `addBusiness({...})`:

```jsx
lat: coords.lat,
lng: coords.lng,
```

El bloque completo de `handleSubmit` queda así:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  const errs = validate()
  if (Object.keys(errs).length > 0) {
    setErrors(errs)
    return
  }
  try {
    const docRef = await addBusiness({
      ...form,
      lat: coords.lat,
      lng: coords.lng,
      whatsapp: form.phone.replace(/\D/g, ''),
      menu: form.menu
        .filter((m) => m.name.trim())
        .map((m) => ({ name: m.name, price: m.price ? Number(m.price) : null })),
    })
    const certUrls = {}
    for (const [certCode, file] of Object.entries(certFiles)) {
      const ext = file.name.split('.').pop().toLowerCase()
      const fileRef = ref(storage, `certificados/${docRef.id}/${certCode}.${ext}`)
      await uploadBytes(fileRef, file)
      certUrls[certCode] = await getDownloadURL(fileRef)
    }
    if (Object.keys(certUrls).length > 0) {
      await updateDoc(doc(db, 'businesses', docRef.id), { certDocuments: certUrls })
    }
    setSubmitted(true)
  } catch {
    setErrors({ submit: 'Error al enviar el comercio. Intentá de nuevo.' })
  }
}
```

- [ ] **Paso 3: Limpiar estado de geocoding al registrar otro comercio**

Reemplazar el botón "Registrar otro comercio" en la pantalla de éxito:

```jsx
<button
  className="btn btn-primary"
  onClick={() => { setForm(initialForm); setCoords(null); setGeocodeError(''); setSubmitted(false) }}
>
  Registrar otro comercio
</button>
```

- [ ] **Paso 4: Verificar compilación y lint**

```bash
npm run build && npm run lint
```

Resultado esperado: sin errores ni warnings nuevos.

- [ ] **Paso 5: Verificar manualmente el flujo completo**

```bash
npm run dev
```

Verificar:
1. Llenar el formulario con dirección real (ej: "Av. Hipólito Yrigoyen 1200")
2. Esperar que aparezca el mapa y confirmar que el pin esté en Córdoba
3. Intentar enviar sin haber geocodificado (borrar y volver a escribir rápido sin esperar) → debe aparecer error "No se pudo verificar la ubicación"
4. Con mapa visible, enviar el formulario completo → pantalla de éxito
5. Verificar en Firebase Console → Firestore → colección `businesses` que el documento nuevo tiene `lat` y `lng` reales (no valores aleatorios alrededor de -31.4201)

- [ ] **Paso 6: Commit**

```bash
git add src/pages/RegistroComercio.jsx
git commit -m "feat: use geocoded coords in RegistroComercio validate and submit"
```
