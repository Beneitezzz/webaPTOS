# Actualización Features Punto Sano — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar los 7 feature-gaps detectados entre la app actual y el documento de requerimientos "Punto Sano" (Universidad Siglo 21, junio 2026).

**Architecture:** Todos los cambios son frontend-only sobre la base existente (React + Vite + Firebase Auth + Firestore + Storage). Los campos nuevos en Firestore son aditivos; los documentos existentes siguen siendo válidos con fallbacks en la UI. EmailJS reemplaza Firebase Cloud Functions para notificaciones.

**Tech Stack:** React 19, Vite, Firebase (Auth/Firestore/Storage), react-leaflet, Leaflet, EmailJS (`@emailjs/browser`), lucide-react, CSS plain.

> **Nota importante:** Este proyecto no tiene test runner. Los pasos de verificación usan `npm run dev` + inspección manual en el navegador.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/utils/hours.js` | Crear | `isOpenNow()`, `formatOpeningHours()` |
| `src/utils/emailService.js` | Crear | `sendApprovalEmail()`, `sendRejectionEmail()` |
| `src/data/mockData.js` | Modificar | Seed data con campos nuevos |
| `src/context/AppContext.jsx` | Modificar | `approveBusiness`, `rejectBusiness` (updateDoc), `suspendBusiness` (nuevo) |
| `src/pages/Mapa.jsx` | Modificar | Barra de búsqueda |
| `src/components/MapView.jsx` | Modificar | FAB de geolocalización + marcador usuario |
| `src/components/BusinessCard.jsx` | Modificar | Chip abierto/cerrado |
| `src/pages/DetalleComercio.jsx` | Modificar | Social links, chip + horarios formateados |
| `src/pages/RegistroComercio.jsx` | Modificar | Social links, horarios estructurados, ownerEmail |
| `src/pages/AdminPanel.jsx` | Modificar | Rechazo con motivo, sección suspensión |
| `src/index.css` | Modificar | Todos los estilos nuevos |
| `.env.example` | Crear/modificar | Variables EmailJS |

---

## Task 1: Instalar dependencia y configurar variables de entorno

**Files:**
- Modify: `package.json` (via npm)
- Create: `.env.example`

- [ ] **Step 1: Instalar @emailjs/browser**

```bash
cd /Users/matiasbeneitez/frontend
npm install @emailjs/browser
```

Expected output: `added 1 package` (o similar, sin errores)

- [ ] **Step 2: Crear .env.example**

Crear el archivo `.env.example` con el siguiente contenido:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_APROBACION=
VITE_EMAILJS_TEMPLATE_RECHAZO=
VITE_EMAILJS_PUBLIC_KEY=
```

> Las 4 variables `VITE_EMAILJS_*` deben agregarse también al `.env` local real con los valores reales de la cuenta EmailJS. Los templates en EmailJS deben tener las variables: `{{business_name}}`, `{{to_email}}`, `{{rejection_reason}}` (solo en template de rechazo).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add @emailjs/browser and env.example"
```

---

## Task 2: Actualizar mockData.js con campos nuevos

**Files:**
- Modify: `src/data/mockData.js`

- [ ] **Step 1: Agregar campos a los negocios en mockBusinesses**

Agregar los campos nuevos a TODOS los objetos en `mockBusinesses`. Para los negocios verificados (pending: false), usar `status: 'aprobado'`. Para los pendientes, usar `status: 'pendiente'`.

Reemplazar el campo `hours` de cada negocio por `openingHours` con el siguiente formato (ajustar horarios según el texto de `hours` original), y agregar `instagramUrl`, `websiteUrl`, `ownerEmail`.

Ejemplo completo para el primer negocio (reemplazar el objeto `id: 1`):

```js
{
  id: 1,
  name: 'La Mesa Sin TACC',
  type: 'restaurante',
  address: 'Av. Hipólito Yrigoyen 1200, Nueva Córdoba',
  lat: -31.419,
  lng: -64.1875,
  phone: '0351-423-1234',
  whatsapp: '5493514231234',
  openingHours: [
    { day: 'lunes',     open: '12:00', close: '23:30', closed: false },
    { day: 'martes',    open: '12:00', close: '23:30', closed: false },
    { day: 'miércoles', open: '12:00', close: '23:30', closed: false },
    { day: 'jueves',    open: '12:00', close: '23:30', closed: false },
    { day: 'viernes',   open: '12:00', close: '23:30', closed: false },
    { day: 'sábado',    open: '12:00', close: '23:30', closed: false },
    { day: 'domingo',   open: '00:00', close: '00:00', closed: true  },
  ],
  description: 'Restaurante especializado 100% libre de gluten. Todos nuestros platos son preparados en ambientes separados y contamos con certificación ALG-ANMAT.',
  tags: ['sin-tacc'],
  certifications: ['ALG', 'RNPA', 'RME'],
  verified: true,
  pending: false,
  status: 'aprobado',
  rating: 4.8,
  instagramUrl: 'https://instagram.com/lamesasintacc',
  websiteUrl: 'https://lamesasintacc.com.ar',
  ownerEmail: null,
  menu: [
    { name: 'Milanesa de soja sin TACC', price: 3200 },
    { name: 'Pizza base de maíz y arroz', price: 3800 },
    { name: 'Empanadas sin gluten (x6)', price: 2600 },
    { name: 'Pasta fresca sin gluten', price: 3400 },
  ],
},
```

Aplicar el mismo patrón a los negocios restantes (ids 2–10). Para negocios simples sin redes, usar `instagramUrl: null, websiteUrl: null`. Para los negocios con `pending: true` (ids 9–10), usar `status: 'pendiente'`.

Ejemplo de negocio pendiente (id 9):

```js
{
  id: 9,
  name: 'Sano y Rico',
  type: 'restaurante',
  address: 'Calle Mendoza 890, Nueva Córdoba',
  lat: -31.4195,
  lng: -64.19,
  phone: '0351-499-5678',
  whatsapp: '5493514995678',
  openingHours: [
    { day: 'lunes',     open: '11:00', close: '23:00', closed: false },
    { day: 'martes',    open: '11:00', close: '23:00', closed: false },
    { day: 'miércoles', open: '11:00', close: '23:00', closed: false },
    { day: 'jueves',    open: '11:00', close: '23:00', closed: false },
    { day: 'viernes',   open: '11:00', close: '23:00', closed: false },
    { day: 'sábado',    open: '11:00', close: '23:00', closed: false },
    { day: 'domingo',   open: '11:00', close: '23:00', closed: false },
  ],
  description: 'Nuevo restaurante con opciones saludables para diversas restricciones alimentarias.',
  tags: ['sin-tacc', 'apto-diabeticos'],
  certifications: ['RNPA'],
  verified: false,
  pending: true,
  status: 'pendiente',
  rating: null,
  instagramUrl: null,
  websiteUrl: null,
  ownerEmail: null,
  menu: [
    { name: 'Ensalada proteica', price: 2800 },
    { name: 'Bowl sin gluten', price: 3200 },
  ],
},
```

- [ ] **Step 2: Verificar que el archivo compila sin errores**

```bash
npm run lint
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/data/mockData.js
git commit -m "feat: add openingHours, social links and status fields to mockData"
```

---

## Task 3: Crear src/utils/hours.js

**Files:**
- Create: `src/utils/hours.js`

- [ ] **Step 1: Crear el archivo**

```js
// src/utils/hours.js

// openingHours array: index 0=lunes, 1=martes, ..., 5=sábado, 6=domingo
// JS Date.getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
// Mapping: Sunday(0)→6, Monday(1)→0, Tue(2)→1, ..., Sat(6)→5
function jsDayToIndex(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1
}

// Returns true if open, false if closed, null if no data
export function isOpenNow(openingHours) {
  if (!openingHours?.length) return null
  const now = new Date()
  const today = openingHours[jsDayToIndex(now.getDay())]
  if (!today || today.closed) return false
  const [oh, om] = today.open.split(':').map(Number)
  const [ch, cm] = today.close.split(':').map(Number)
  const cur = now.getHours() * 60 + now.getMinutes()
  return cur >= oh * 60 + om && cur < ch * 60 + cm
}

const DAY_ABBREV = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Returns a compact human-readable string grouping consecutive days with same hours
// e.g. "Lun–Vie: 9:00–20:00 | Sáb: 9:00–13:00 | Dom: Cerrado"
export function formatOpeningHours(openingHours) {
  if (!openingHours?.length) return null
  const parts = []
  let i = 0
  while (i < openingHours.length) {
    const cur = openingHours[i]
    let j = i + 1
    while (j < openingHours.length) {
      const next = openingHours[j]
      if (next.closed === cur.closed && next.open === cur.open && next.close === cur.close) j++
      else break
    }
    const range = i === j - 1 ? DAY_ABBREV[i] : `${DAY_ABBREV[i]}–${DAY_ABBREV[j - 1]}`
    parts.push(cur.closed ? `${range}: Cerrado` : `${range}: ${cur.open}–${cur.close}`)
    i = j
  }
  return parts.join(' | ')
}
```

- [ ] **Step 2: Verificar linting**

```bash
npm run lint
```

Expected: sin errores.

- [ ] **Step 3: Verificar manualmente en consola del navegador**

Iniciá el servidor (`npm run dev`), abrí la consola del navegador y pegá:

```js
// Test isOpenNow: si son las 10:00 de un lunes y el negocio abre 9:00–20:00 → debe retornar true
const testHours = [
  { day: 'lunes', open: '09:00', close: '20:00', closed: false },
  { day: 'martes', open: '09:00', close: '20:00', closed: false },
  { day: 'miércoles', open: '09:00', close: '20:00', closed: false },
  { day: 'jueves', open: '09:00', close: '20:00', closed: false },
  { day: 'viernes', open: '09:00', close: '20:00', closed: false },
  { day: 'sábado', open: '09:00', close: '13:00', closed: false },
  { day: 'domingo', open: '00:00', close: '00:00', closed: true },
]
```

La función se importa en módulos, no en la consola directamente. La verificación real es en los pasos siguientes cuando los componentes la usen.

- [ ] **Step 4: Commit**

```bash
git add src/utils/hours.js
git commit -m "feat: add hours utility (isOpenNow, formatOpeningHours)"
```

---

## Task 4: Crear src/utils/emailService.js

**Files:**
- Create: `src/utils/emailService.js`

- [ ] **Step 1: Crear el archivo**

```js
// src/utils/emailService.js
import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const TEMPLATE_APROBACION = import.meta.env.VITE_EMAILJS_TEMPLATE_APROBACION
const TEMPLATE_RECHAZO = import.meta.env.VITE_EMAILJS_TEMPLATE_RECHAZO

// Sends approval email to business owner. Silently no-ops if env vars not configured.
export async function sendApprovalEmail({ businessName, ownerEmail }) {
  if (!SERVICE_ID || !PUBLIC_KEY || !TEMPLATE_APROBACION || !ownerEmail) return
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_APROBACION,
    { business_name: businessName, to_email: ownerEmail },
    PUBLIC_KEY,
  )
}

// Sends rejection email with reason. Silently no-ops if env vars not configured.
export async function sendRejectionEmail({ businessName, ownerEmail, reason }) {
  if (!SERVICE_ID || !PUBLIC_KEY || !TEMPLATE_RECHAZO || !ownerEmail) return
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_RECHAZO,
    { business_name: businessName, to_email: ownerEmail, rejection_reason: reason },
    PUBLIC_KEY,
  )
}
```

- [ ] **Step 2: Verificar linting**

```bash
npm run lint
```

Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/utils/emailService.js
git commit -m "feat: add EmailJS email service utility"
```

---

## Task 5: Actualizar AppContext.jsx

**Files:**
- Modify: `src/context/AppContext.jsx`

Los cambios son:
1. `approveBusiness`: agrega `status: 'aprobado'` al update
2. `rejectBusiness`: cambia de `deleteDoc` a `updateDoc` con `status: 'rechazado'` y `rejectionReason`
3. `suspendBusiness`: función nueva
4. `addBusiness`: agrega `ownerEmail` y `status: 'pendiente'`

- [ ] **Step 1: Reemplazar las funciones en AppContext.jsx**

Localizar el bloque de funciones `addBusiness`, `approveBusiness`, `rejectBusiness` (líneas ~68–82) y reemplazarlo con:

```js
const addBusiness = (data) =>
  addDoc(collection(db, 'businesses'), {
    ...data,
    verified: false,
    pending: true,
    status: 'pendiente',
    rating: null,
    ownerId: currentUser?.uid ?? null,
    ownerEmail: currentUser?.email ?? null,
    createdAt: serverTimestamp(),
  })

const approveBusiness = (id) =>
  updateDoc(doc(db, 'businesses', id), { verified: true, pending: false, status: 'aprobado' })

const rejectBusiness = (id, reason) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false,
    pending: false,
    status: 'rechazado',
    rejectionReason: reason,
  })

const suspendBusiness = (id) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false,
    pending: false,
    status: 'suspendido',
  })
```

- [ ] **Step 2: Eliminar el import de deleteDoc**

En la línea de imports de firestore (línea ~2), eliminar `deleteDoc` de la lista ya que ya no se usa:

```js
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore'
```

- [ ] **Step 3: Exponer suspendBusiness en el Provider value**

En el `return` del Provider (línea ~84), agregar `suspendBusiness` y actualizar `rejectBusiness`:

```jsx
return (
  <AppContext.Provider
    value={{
      businesses,
      businessesLoading,
      businessesError,
      userProfile,
      profileLoading,
      updateProfile,
      addBusiness,
      approveBusiness,
      rejectBusiness,
      suspendBusiness,
    }}
  >
    {children}
  </AppContext.Provider>
)
```

- [ ] **Step 4: Verificar que no hay errores**

```bash
npm run lint
```

Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: update AppContext — status field, reject preserves doc, add suspendBusiness"
```

---

## Task 6: Barra de búsqueda — Mapa.jsx

**Files:**
- Modify: `src/pages/Mapa.jsx`

- [ ] **Step 1: Agregar estado de búsqueda**

Después de las líneas de estado existentes (después de `const [filtersInitialized, setFiltersInitialized] = useState(false)`), agregar:

```js
const [searchQuery, setSearchQuery] = useState('')
```

- [ ] **Step 2: Actualizar el import de mockData para incluir BUSINESS_TYPE_MAP**

Reemplazar la línea:
```js
import { RESTRICTIONS, BUSINESS_TYPES } from '../data/mockData'
```
por:
```js
import { RESTRICTIONS, BUSINESS_TYPES, BUSINESS_TYPE_MAP } from '../data/mockData'
```

- [ ] **Step 3: Agregar lógica de búsqueda al useMemo de filtered**

Reemplazar el `useMemo` de `filtered` completo con:

```js
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
      (BUSINESS_TYPE_MAP[b.type]?.label ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)
    return matchesRestrictions && matchesType && matchesSearch
  })
}, [verifiedBusinesses, selectedRestrictions, selectedTypes, searchQuery])
```

- [ ] **Step 4: Limpiar searchQuery en clearFilters**

Reemplazar la función `clearFilters`:

```js
const clearFilters = () => {
  setSelectedRestrictions([])
  setSelectedTypes([])
  setSearchQuery('')
}
```

Actualizar `hasFilters` para incluir la búsqueda:

```js
const hasFilters = selectedRestrictions.length > 0 || selectedTypes.length > 0 || searchQuery.length > 0
```

- [ ] **Step 5: Agregar el input de búsqueda en el JSX del sidebar**

Dentro del bloque `{sidebarOpen && (` y antes del `{userProfile.restrictions.length > 0 && ...}`, agregar:

```jsx
<div className="search-bar-wrapper">
  <input
    className="form-input search-input"
    type="search"
    placeholder="Buscar comercio, dirección..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>
```

- [ ] **Step 6: Verificar en el navegador**

```bash
npm run dev
```

Ir a `/mapa`. Escribir "dietetica" en el buscador → solo aparecen dietéticas. Escribir "colón" → aparecen negocios en Av. Colón. Limpiar filtros → el input también se vacía.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Mapa.jsx
git commit -m "feat: add search bar to map sidebar (RF-B04)"
```

---

## Task 7: Geolocalización del usuario — MapView.jsx

**Files:**
- Modify: `src/components/MapView.jsx`

- [ ] **Step 1: Agregar imports necesarios**

Reemplazar los imports en la parte superior del archivo:

```js
import { useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { Locate } from 'lucide-react'
import L from 'leaflet'
import { BUSINESS_TYPE_MAP } from '../data/mockData'
```

- [ ] **Step 2: Agregar el componente LocateButton antes de la función MapView**

Insertar después de la línea `const DEFAULT_ICON = buildDivIcon('#2d6a4f')`:

```jsx
function LocateButton() {
  const map = useMap()
  const markerRef = useRef(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización')
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (markerRef.current) markerRef.current.remove()
        markerRef.current = L.circleMarker([coords.latitude, coords.longitude], {
          radius: 9,
          fillColor: '#2563eb',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map)
        map.flyTo([coords.latitude, coords.longitude], 15)
        setLocating(false)
      },
      () => {
        setError('No se pudo obtener tu ubicación')
        setLocating(false)
      },
      { timeout: 10000 },
    )
  }

  return (
    <div className="locate-control">
      <button
        className="locate-btn"
        onClick={handleLocate}
        disabled={locating}
        title="Centrar en mi ubicación"
      >
        <Locate size={18} />
      </button>
      {error && <div className="locate-error">{error}</div>}
    </div>
  )
}
```

- [ ] **Step 3: Agregar LocateButton dentro del MapContainer**

Dentro del JSX de `MapView`, agregar `<LocateButton />` después del `<TileLayer>`:

```jsx
export default function MapView({ businesses }) {
  return (
    <MapContainer
      center={CORDOBA_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocateButton />
      {businesses.map((b) => {
        const typeInfo = BUSINESS_TYPE_MAP[b.type]
        return (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={PIN_ICONS[b.type] ?? DEFAULT_ICON}>
            <Popup>
              <div className="map-popup">
                <strong>{b.name}</strong>
                <span className="map-popup-type" style={{ color: typeInfo?.color }}>
                  {typeInfo?.label}
                </span>
                <p>{b.address}</p>
                <Link to={`/comercio/${b.id}`}>Ver detalles →</Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
```

- [ ] **Step 4: Verificar en el navegador**

```bash
npm run dev
```

Ir a `/mapa`. Debe verse un botón circular con el ícono de ubicación en la esquina inferior-derecha del mapa. Al hacer clic, el navegador pide permiso de geolocalización. Si se acepta, el mapa vuela a la ubicación y aparece un punto azul.

- [ ] **Step 5: Commit**

```bash
git add src/components/MapView.jsx
git commit -m "feat: add user geolocation button to map (RF-B01)"
```

---

## Task 8: Chip abierto/cerrado — BusinessCard.jsx

**Files:**
- Modify: `src/components/BusinessCard.jsx`

- [ ] **Step 1: Agregar imports de la utilidad**

Agregar después de los imports existentes:

```js
import { isOpenNow } from '../utils/hours'
```

- [ ] **Step 2: Calcular estado de apertura y reemplazar la línea de horario**

Dentro de la función `BusinessCard`, después de `const typeInfo = ...`, agregar:

```js
const openStatus = business.openingHours ? isOpenNow(business.openingHours) : null
```

Reemplazar la línea `<span><Clock size={13} /> {business.hours}</span>` con:

```jsx
{openStatus !== null && (
  <span className={openStatus ? 'open-chip' : 'closed-chip'}>
    {openStatus ? 'Abierto ahora' : 'Cerrado'}
  </span>
)}
```

El import de `Clock` ya no se usa si se elimina esa línea. Removerlo del import:

```js
import { MapPin, Star, CheckCircle } from 'lucide-react'
```

- [ ] **Step 3: Verificar en el navegador**

```bash
npm run dev
```

Ir a `/mapa`. En el sidebar, las tarjetas de comercios deben mostrar el chip "Abierto ahora" (verde) o "Cerrado" (gris) según la hora actual.

- [ ] **Step 4: Commit**

```bash
git add src/components/BusinessCard.jsx
git commit -m "feat: add open/closed chip to BusinessCard (RF-C04)"
```

---

## Task 9: Social links + horarios en DetalleComercio.jsx

**Files:**
- Modify: `src/pages/DetalleComercio.jsx`

- [ ] **Step 1: Agregar imports**

Agregar `Globe, Instagram` a los imports de lucide-react. Reemplazar la línea de imports de lucide:

```js
import { MapPin, Clock, Phone, MessageCircle, Star, ArrowLeft, ShieldCheck, Globe, Instagram } from 'lucide-react'
```

Agregar import de utilidades:

```js
import { isOpenNow, formatOpeningHours } from '../utils/hours'
```

- [ ] **Step 2: Calcular estado de apertura y horarios formateados**

Dentro de `DetalleComercio`, después de `const typeInfo = BUSINESS_TYPE_MAP[business.type]`, agregar:

```js
const openStatus = business.openingHours ? isOpenNow(business.openingHours) : null
const hoursDisplay = business.openingHours
  ? formatOpeningHours(business.openingHours)
  : business.hours ?? null
```

- [ ] **Step 3: Agregar chip de estado debajo del nombre**

En el bloque `<div className="detail-header-top">`, dentro del `<div>` que tiene el nombre, agregar el chip después de `<h1 className="detail-name">`:

```jsx
<h1 className="detail-name">{business.name}</h1>
{openStatus !== null && (
  <span className={openStatus ? 'open-chip' : 'closed-chip'} style={{ marginTop: '4px', display: 'inline-flex' }}>
    {openStatus ? 'Abierto ahora' : 'Cerrado'}
  </span>
)}
```

- [ ] **Step 4: Reemplazar la línea de horario en info-list**

Localizar `<li><Clock size={16} /> {business.hours}</li>` y reemplazar con:

```jsx
{hoursDisplay && <li><Clock size={16} /> {hoursDisplay}</li>}
```

- [ ] **Step 5: Agregar botones de social links en contact-buttons**

Localizar el bloque `<div className="contact-buttons">` y agregar los botones después de "Llamar":

```jsx
<div className="contact-buttons">
  <a
    href={`https://wa.me/${business.whatsapp}`}
    target="_blank"
    rel="noopener noreferrer"
    className="btn btn-whatsapp"
  >
    <MessageCircle size={16} /> WhatsApp
  </a>
  <a href={`tel:${business.phone}`} className="btn btn-outline">
    <Phone size={16} /> Llamar
  </a>
  {business.instagramUrl && (
    <a
      href={business.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-instagram"
    >
      <Instagram size={16} /> Instagram
    </a>
  )}
  {business.websiteUrl && (
    <a
      href={business.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline"
    >
      <Globe size={16} /> Sitio web
    </a>
  )}
</div>
```

- [ ] **Step 6: Verificar en el navegador**

```bash
npm run dev
```

Ir a `/comercio/1` (La Mesa Sin TACC). Debe verse: chip "Abierto ahora" o "Cerrado", horario en formato "Lun–Sáb: 12:00–23:30 | Dom: Cerrado", botones de WhatsApp, Llamar, Instagram y Sitio web.

- [ ] **Step 7: Commit**

```bash
git add src/pages/DetalleComercio.jsx
git commit -m "feat: add social links, open/closed chip and formatted hours to business detail (RF-B09, RF-B10, RF-C04)"
```

---

## Task 10: Horarios estructurados + social links en RegistroComercio.jsx

**Files:**
- Modify: `src/pages/RegistroComercio.jsx`

- [ ] **Step 1: Agregar DEFAULT_OPENING_HOURS y actualizar initialForm**

Después de los imports (antes de `const initialForm = ...`), agregar la constante:

```js
const DEFAULT_OPENING_HOURS = [
  { day: 'lunes',     open: '09:00', close: '20:00', closed: false },
  { day: 'martes',    open: '09:00', close: '20:00', closed: false },
  { day: 'miércoles', open: '09:00', close: '20:00', closed: false },
  { day: 'jueves',    open: '09:00', close: '20:00', closed: false },
  { day: 'viernes',   open: '09:00', close: '20:00', closed: false },
  { day: 'sábado',    open: '09:00', close: '13:00', closed: false },
  { day: 'domingo',   open: '00:00', close: '00:00', closed: true  },
]
```

Reemplazar `initialForm` completo:

```js
const initialForm = {
  name: '',
  type: '',
  address: '',
  phone: '',
  openingHours: DEFAULT_OPENING_HOURS,
  description: '',
  tags: [],
  certifications: [],
  instagramUrl: '',
  websiteUrl: '',
  menu: [{ name: '', price: '' }],
}
```

- [ ] **Step 2: Agregar función de validación de URL y updateHourField**

Después de `const removeMenuItem = ...`, agregar:

```js
const isValidUrl = (url) => {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

const updateHourField = (i, field, value) => {
  setForm((prev) => {
    const openingHours = [...prev.openingHours]
    openingHours[i] = { ...openingHours[i], [field]: value }
    return { ...prev, openingHours }
  })
}
```

- [ ] **Step 3: Actualizar la función validate para incluir las nuevas validaciones**

Reemplazar la función `validate` completa:

```js
const validate = () => {
  const errs = {}
  if (!form.name.trim()) errs.name = 'El nombre es requerido'
  if (!form.type) errs.type = 'Seleccioná un tipo de establecimiento'
  if (!form.address.trim()) errs.address = 'La dirección es requerida'
  else if (!coords) errs.address = 'No se pudo verificar la ubicación. Ajustá la dirección.'
  if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
  if (form.tags.length === 0) errs.tags = 'Seleccioná al menos una restricción alimentaria'
  if (form.certifications.length === 0) errs.certifications = 'Seleccioná al menos una certificación'
  if (form.websiteUrl.trim() && !isValidUrl(form.websiteUrl.trim()))
    errs.websiteUrl = 'Ingresá una URL válida (ej: https://micomercio.com)'
  if (form.instagramUrl.trim() && (!isValidUrl(form.instagramUrl.trim()) || !form.instagramUrl.includes('instagram.com/')))
    errs.instagramUrl = 'Ingresá una URL de Instagram válida (ej: https://instagram.com/milocal)'
  return errs
}
```

- [ ] **Step 4: Actualizar handleSubmit para limpiar los campos opcionales**

Localizar dentro de `handleSubmit` la llamada a `addBusiness` y reemplazarla:

```js
const docRef = await addBusiness({
  ...form,
  lat: coords.lat,
  lng: coords.lng,
  whatsapp: form.phone.replace(/\D/g, ''),
  instagramUrl: form.instagramUrl.trim() || null,
  websiteUrl: form.websiteUrl.trim() || null,
  menu: form.menu
    .filter((m) => m.name.trim())
    .map((m) => ({ name: m.name, price: m.price ? Number(m.price) : null })),
})
```

- [ ] **Step 5: Reemplazar el campo de horario en el JSX**

Localizar el bloque del campo `hours` (el `<div className="form-row">` que contiene "Teléfono / WhatsApp" y "Horario de atención") y reemplazar **solo** el campo de horario por el componente de horarios estructurados.

Primero, en `form-row`, eliminar el grupo de "Horario de atención" para que solo quede el teléfono:

```jsx
<div className="form-group">
  <label className="form-label">Teléfono / WhatsApp *</label>
  <input
    className={`form-input ${errors.phone ? 'error' : ''}`}
    placeholder="0351-123-4567"
    value={form.phone}
    onChange={(e) => handleChange('phone', e.target.value)}
  />
  {errors.phone && <span className="form-error">{errors.phone}</span>}
</div>
```

Luego, inmediatamente después de ese `form-group` y antes del campo "Descripción", agregar el componente de horarios:

```jsx
<div className="form-group">
  <label className="form-label">Horarios de atención</label>
  <div className="hours-grid">
    {form.openingHours.map((h, i) => (
      <div key={h.day} className="hours-row">
        <span className="hours-day">{h.day.charAt(0).toUpperCase() + h.day.slice(1)}</span>
        <label className="hours-closed-label">
          <input
            type="checkbox"
            checked={h.closed}
            onChange={(e) => updateHourField(i, 'closed', e.target.checked)}
          />
          Cerrado
        </label>
        <input
          type="time"
          className="form-input time-input"
          value={h.open}
          disabled={h.closed}
          onChange={(e) => updateHourField(i, 'open', e.target.value)}
        />
        <span className="hours-separator">–</span>
        <input
          type="time"
          className="form-input time-input"
          value={h.close}
          disabled={h.closed}
          onChange={(e) => updateHourField(i, 'close', e.target.value)}
        />
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 6: Agregar campos de redes sociales antes del bloque de menú**

Agregar después del campo "Descripción" y antes de "Restricciones alimentarias":

```jsx
<div className="form-row">
  <div className="form-group">
    <label className="form-label">Sitio web (opcional)</label>
    <input
      className={`form-input ${errors.websiteUrl ? 'error' : ''}`}
      placeholder="https://micomercio.com"
      value={form.websiteUrl}
      onChange={(e) => handleChange('websiteUrl', e.target.value)}
    />
    {errors.websiteUrl && <span className="form-error">{errors.websiteUrl}</span>}
  </div>
  <div className="form-group">
    <label className="form-label">Instagram (opcional)</label>
    <input
      className={`form-input ${errors.instagramUrl ? 'error' : ''}`}
      placeholder="https://instagram.com/milocal"
      value={form.instagramUrl}
      onChange={(e) => handleChange('instagramUrl', e.target.value)}
    />
    {errors.instagramUrl && <span className="form-error">{errors.instagramUrl}</span>}
  </div>
</div>
```

- [ ] **Step 7: Verificar en el navegador**

```bash
npm run dev
```

Ir a `/registro-comercio`. Verificar:
- El campo de horario libre desapareció y en su lugar hay una grilla de 7 días con checkbox "Cerrado" + inputs de hora
- Al marcar "Cerrado" en un día, los inputs de hora se deshabilitan
- Los campos de Sitio web e Instagram aparecen
- Ingresar una URL inválida en "Sitio web" y hacer clic en enviar → aparece mensaje de error
- Ingresar `https://facebook.com/algo` en Instagram → error de validación
- Ingresar `https://instagram.com/milocal` → sin error

- [ ] **Step 8: Commit**

```bash
git add src/pages/RegistroComercio.jsx
git commit -m "feat: add structured opening hours and social links to business registration (RF-C04, RF-C06, RF-C07)"
```

---

## Task 11: Rechazo con motivo + suspensión — AdminPanel.jsx

**Files:**
- Modify: `src/pages/AdminPanel.jsx`

- [ ] **Step 1: Actualizar imports**

Reemplazar la línea de imports de lucide:

```js
import { ShieldCheck, ShieldX, Eye, AlertCircle, PauseCircle } from 'lucide-react'
```

Agregar imports de email:

```js
import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailService'
```

- [ ] **Step 2: Actualizar la destructuring de useApp para incluir suspendBusiness**

```js
const { businesses, approveBusiness, rejectBusiness, suspendBusiness } = useApp()
```

- [ ] **Step 3: Agregar estados para rechazo y suspensión**

Después de `const [actionError, setActionError] = useState(null)`, agregar:

```js
const [rejectingId, setRejectingId] = useState(null)
const [rejectReason, setRejectReason] = useState('')
const [suspendingId, setSuspendingId] = useState(null)
```

- [ ] **Step 4: Agregar useMemo para la lista de aprobados**

Después del `useMemo` de `pending`, agregar:

```js
const approved = useMemo(
  () => businesses.filter((b) => b.verified && !b.pending),
  [businesses]
)
```

- [ ] **Step 5: Reemplazar el botón "Rechazar" y agregar el formulario de motivo**

Localizar el botón de rechazo actual:

```jsx
<button
  className="btn btn-danger btn-sm"
  onClick={async () => {
    setActionError(null)
    try {
      await rejectBusiness(b.id)
    } catch {
      setActionError('Error al rechazar. Intentá de nuevo.')
    }
  }}
>
  <ShieldX size={14} /> Rechazar
</button>
```

Reemplazarlo con:

```jsx
<button
  className="btn btn-danger btn-sm"
  onClick={() => {
    if (rejectingId === b.id) {
      setRejectingId(null)
      setRejectReason('')
    } else {
      setRejectingId(b.id)
      setRejectReason('')
    }
  }}
>
  <ShieldX size={14} /> {rejectingId === b.id ? 'Cancelar' : 'Rechazar'}
</button>
```

- [ ] **Step 6: Actualizar también el botón Aprobar para enviar email**

Reemplazar el botón Aprobar existente:

```jsx
<button
  className="btn btn-success btn-sm"
  onClick={async () => {
    setActionError(null)
    try {
      await approveBusiness(b.id)
      await sendApprovalEmail({ businessName: b.name, ownerEmail: b.ownerEmail ?? null })
    } catch {
      setActionError('Error al aprobar. Intentá de nuevo.')
    }
  }}
>
  <ShieldCheck size={14} /> Aprobar
</button>
```

- [ ] **Step 7: Agregar el formulario de motivo de rechazo**

Dentro del bloque `{isOpen && (` (detalle expandido del comercio), agregar al final (antes del `</div>` de cierre de `pending-detail`):

```jsx
{rejectingId === b.id && (
  <div className="reject-reason-form">
    <label className="form-label">Motivo del rechazo *</label>
    <textarea
      className="form-textarea"
      rows={3}
      placeholder="Explicá por qué se rechaza este comercio (mínimo 10 caracteres)..."
      value={rejectReason}
      onChange={(e) => setRejectReason(e.target.value)}
    />
    <div className="reject-reason-actions">
      <button
        className="btn btn-danger btn-sm"
        disabled={rejectReason.trim().length < 10}
        onClick={async () => {
          setActionError(null)
          try {
            await rejectBusiness(b.id, rejectReason.trim())
            await sendRejectionEmail({
              businessName: b.name,
              ownerEmail: b.ownerEmail ?? null,
              reason: rejectReason.trim(),
            })
            setRejectingId(null)
            setRejectReason('')
          } catch {
            setActionError('Error al rechazar. Intentá de nuevo.')
          }
        }}
      >
        Confirmar rechazo
      </button>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => { setRejectingId(null); setRejectReason('') }}
      >
        Cancelar
      </button>
    </div>
  </div>
)}
```

> Importante: para que el formulario de motivo sea visible, el card debe estar expandido (`isOpen === true`). Si el admin hace clic en "Rechazar" sin haber abierto el detalle, primero hay que abrir el detalle. Para simplificar, al hacer clic en "Rechazar" también abrir automáticamente el detalle:

Reemplazar el onClick del botón "Rechazar" (recién actualizado) con:

```jsx
onClick={() => {
  if (rejectingId === b.id) {
    setRejectingId(null)
    setRejectReason('')
  } else {
    setRejectingId(b.id)
    setRejectReason('')
    setExpanded(b.id) // auto-expand the card
  }
}}
```

- [ ] **Step 8: Agregar la sección de comercios aprobados + suspensión**

Al final del JSX del componente, antes del `</div>` final de `container container-md`, agregar:

```jsx
{approved.length > 0 && (
  <div className="admin-section">
    <h2>Comercios aprobados ({approved.length})</h2>
    <div className="approved-list">
      {approved.map((b) => {
        const typeInfo = BUSINESS_TYPE_MAP[b.type]
        return (
          <div key={b.id} className="approved-card card">
            <div className="approved-card-header">
              <div>
                <h3>{b.name}</h3>
                <span
                  className="business-type-chip"
                  style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}
                >
                  {typeInfo?.label}
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSuspendingId(suspendingId === b.id ? null : b.id)}
              >
                <PauseCircle size={14} /> {suspendingId === b.id ? 'Cancelar' : 'Suspender'}
              </button>
            </div>
            {suspendingId === b.id && (
              <div className="suspend-confirm">
                <p>
                  ¿Confirmás la suspensión de <strong>{b.name}</strong>?
                  El comercio dejará de aparecer en el mapa inmediatamente.
                </p>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={async () => {
                    setActionError(null)
                    try {
                      await suspendBusiness(b.id)
                      setSuspendingId(null)
                    } catch {
                      setActionError('Error al suspender. Intentá de nuevo.')
                    }
                  }}
                >
                  Confirmar suspensión
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  </div>
)}
```

- [ ] **Step 9: Verificar en el navegador**

```bash
npm run dev
```

Ir a `/admin` (contraseña: `admin123`). Verificar:
- Los comercios pendientes siguen apareciendo
- Hacer clic en "Rechazar" → se expande el card y aparece el textarea para el motivo
- El botón "Confirmar rechazo" está deshabilitado hasta tener 10+ caracteres
- Escribir el motivo y confirmar → el comercio desaparece de la lista de pendientes
- Sección "Comercios aprobados" visible al final con botón "Suspender" por comercio
- Confirmar suspensión → el comercio desaparece del mapa

- [ ] **Step 10: Commit**

```bash
git add src/pages/AdminPanel.jsx
git commit -m "feat: add rejection reason, EmailJS notifications and business suspension to admin panel (RF-A07, RF-A08, RF-A09, RF-A10)"
```

---

## Task 12: Estilos CSS — index.css

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Agregar todos los estilos nuevos al final de index.css**

Agregar al final del archivo:

```css
/* ── Search bar ── */
.search-bar-wrapper {
  margin-bottom: 12px;
}
.search-input {
  width: 100%;
}

/* ── Locate button (overlaid on map) ── */
.locate-control {
  position: absolute;
  bottom: 32px;
  right: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.locate-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  color: #374151;
  transition: background 0.15s;
}
.locate-btn:hover { background: #f3f4f6; }
.locate-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.locate-error {
  background: white;
  border: 1px solid #e63946;
  color: #e63946;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* ── Open / Closed chips ── */
.open-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: #d1fae5;
  color: #065f46;
}
.closed-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  background: #f3f4f6;
  color: #6b7280;
}

/* ── Instagram button ── */
.btn-instagram {
  background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  color: white !important;
  border-color: transparent !important;
}
.btn-instagram:hover { opacity: 0.88; }

/* ── Structured opening hours form ── */
.hours-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}
.hours-row {
  display: grid;
  grid-template-columns: 90px 90px 1fr 14px 1fr;
  align-items: center;
  gap: 8px;
}
.hours-day {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #111827);
}
.hours-closed-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
}
.hours-separator {
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}
.time-input {
  padding: 6px 8px;
  font-size: 0.85rem;
}
.time-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

/* ── Reject reason form in AdminPanel ── */
.reject-reason-form {
  padding: 14px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  margin-top: 14px;
}
.reject-reason-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

/* ── Approved businesses section in AdminPanel ── */
.admin-section {
  margin-top: 36px;
}
.admin-section > h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
}
.approved-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.approved-card {
  padding: 12px 16px;
}
.approved-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.approved-card-header h3 {
  font-size: 0.95rem;
  margin: 0 0 4px;
  font-weight: 600;
}
.suspend-confirm {
  padding: 12px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  margin-top: 12px;
}
.suspend-confirm p {
  margin: 0 0 10px;
  font-size: 0.875rem;
  color: #374151;
}

/* ── Responsive adjustments for hours grid ── */
@media (max-width: 500px) {
  .hours-row {
    grid-template-columns: 80px 80px 1fr 10px 1fr;
    gap: 4px;
  }
  .hours-day { font-size: 0.8rem; }
}
```

- [ ] **Step 2: Verificar visualmente todas las pantallas**

```bash
npm run dev
```

Revisar en orden:
1. `/mapa` → search bar visible en sidebar, chip abierto/cerrado en BusinessCards, botón de geolocalización en el mapa
2. `/comercio/1` → chip, horarios formateados, botones Instagram y Sitio web
3. `/registro-comercio` → grilla de horarios por día, campos de Instagram y web
4. `/admin` → formulario de rechazo con motivo, sección de comercios aprobados con suspensión

- [ ] **Step 3: Verificar responsividad**

Abrir DevTools → modo móvil (375px). La grilla de horarios debe verse correctamente. El sidebar del mapa debe funcionar en móvil.

- [ ] **Step 4: Lint final**

```bash
npm run lint
```

Expected: sin errores ni warnings nuevos.

- [ ] **Step 5: Commit final**

```bash
git add src/index.css
git commit -m "feat: add styles for search bar, geolocation, open/closed chips, hours form, social links and admin panels"
```

---

## Self-Review del plan contra el spec

| Requerimiento | Task que lo cubre |
|---|---|
| RF-B01 Geolocalización usuario | Task 7 |
| RF-B04 Búsqueda por nombre/dirección/tipo | Task 6 |
| RF-B09/B10 Social links en ficha | Task 9 |
| RF-C04 Abierto/Cerrado en tiempo real | Tasks 3, 8, 9 |
| RF-C06/C07 Social links en registro + validación URL | Task 10 |
| RF-A06 Email al aprobar | Task 4 + Task 11 (step 6) |
| RF-A07 Rechazo con motivo obligatorio | Task 11 (steps 5–7) |
| RF-A08 Email al rechazar | Task 4 + Task 11 (step 7) |
| RF-A09/A10 Suspensión + ocultar del mapa | Tasks 5 + 11 (step 8) |
| ownerEmail en registro | Task 5 (AppContext.addBusiness) |
| RNF02 Responsividad | Task 12 (media query) |

Cobertura: 100%. Sin gaps detectados.
