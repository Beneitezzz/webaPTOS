# Menu Upload y Ficha de Estado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar subida de carta/menú como archivo en el formulario de registro, y una página `/mi-comercio` donde el comercio puede ver el estado de su negocio y re-enviar si fue rechazado.

**Architecture:** La subida de menú usa Firebase Storage (ya configurado), igual que los certificados. La ficha de estado es una página nueva (`MiComercio.jsx`) que busca en el contexto global (`businesses`) el doc con `ownerId === currentUser.uid`. El re-envío reutiliza `/registro-comercio` con detección al montar: si el user tiene un negocio rechazado, pre-llena el form y usa `updateDoc` en lugar de `addDoc`.

**Tech Stack:** React 19, Vite, Firebase Firestore, Firebase Storage, react-router-dom, lucide-react. No hay test runner — la verificación es manual con `npm run dev`.

---

## Archivos involucrados

| Archivo | Cambio |
|---------|--------|
| `src/context/AppContext.jsx` | Normalizar `menuFileUrl` al mapear docs |
| `src/pages/DetalleComercio.jsx` | Reemplazar sección de menú texto por botón "Ver carta" |
| `src/pages/RegistroComercio.jsx` | Reemplazar campo `menu[]` por upload; agregar lógica de re-envío |
| `src/pages/MiComercio.jsx` | **Crear** — ficha de estado con 4 variantes |
| `src/App.jsx` | Agregar ruta `/mi-comercio` |
| `src/components/Navbar.jsx` | Actualizar link "Mi Comercio": `/registro-comercio` → `/mi-comercio` |
| `src/index.css` | Agregar estilos `.status-banner`, `.menu-upload-zone`, `.menu-file-selected` |

---

## Task 1: AppContext + DetalleComercio — normalizar menuFileUrl y actualizar display

**Files:**
- Modify: `src/context/AppContext.jsx:24-31`
- Modify: `src/pages/DetalleComercio.jsx:136-155`

### Contexto

`AppContext` mapea cada documento de Firestore. Ya normaliza `socialLinks`; hay que hacer lo mismo con `menuFileUrl`. `DetalleComercio` actualmente muestra la lista de productos (`business.menu`) — hay que reemplazarla por un botón que abre el archivo.

### Pasos

- [ ] **1.1 — Normalizar menuFileUrl en AppContext**

En `src/context/AppContext.jsx`, en el `onSnapshot` callback (línea ~29), el objeto que retorna el `map()` actualmente es:

```js
return {
  id: d.id,
  ...data,
  socialLinks: data.socialLinks ?? [data.instagramUrl, data.websiteUrl].filter(Boolean),
}
```

Reemplazarlo por:

```js
return {
  id: d.id,
  ...data,
  socialLinks: data.socialLinks ?? [data.instagramUrl, data.websiteUrl].filter(Boolean),
  menuFileUrl: data.menuFileUrl ?? null,
}
```

- [ ] **1.2 — Reemplazar sección de menú en DetalleComercio**

En `src/pages/DetalleComercio.jsx`, eliminar el bloque completo del menú (líneas 136-155):

```jsx
{/* Menu */}
{business.menu.length > 0 && (
  <div className="card">
    <h2>
      {MENU_TYPES.has(business.type) ? 'Menú' : 'Productos disponibles'}
    </h2>
    <div className="menu-grid">
      {business.menu.map((item) => (
        <div key={item.name} className="menu-item">
          <span className="menu-item-name">{item.name}</span>
          {item.price && (
            <span className="menu-item-price">${item.price.toLocaleString('es-AR')}</span>
          )}
        </div>
      ))}
    </div>
    <p className="menu-disclaimer">
      * Los precios son orientativos y pueden variar. Consultá directamente con el comercio.
    </p>
  </div>
)}
```

Y reemplazarlo por:

```jsx
{/* Menú */}
{business.menuFileUrl && (
  <div className="card">
    <h2>Carta / Menú</h2>
    <a
      href={business.menuFileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline"
    >
      📄 Ver carta del menú
    </a>
  </div>
)}
```

También eliminar la constante `MENU_TYPES` (línea 9: `const MENU_TYPES = new Set(['restaurante', 'cafe'])`) ya que no se usa más.

- [ ] **1.3 — Verificar en dev**

```bash
npm run dev
```

Abrí un comercio en `/comercio/:id`. La sección de menú texto ya no aparece. Si el comercio tuviera `menuFileUrl` en Firestore, aparecería el botón "Ver carta del menú".

- [ ] **1.4 — Commit**

```bash
git add src/context/AppContext.jsx src/pages/DetalleComercio.jsx
git commit -m "feat: normalize menuFileUrl in context and replace text menu with file link in detail"
```

---

## Task 2: CSS — estilos para upload de menú y status banner

**Files:**
- Modify: `src/index.css` (al final del archivo)

### Pasos

- [ ] **2.1 — Agregar estilos al final de index.css**

Agregar al final de `src/index.css`:

```css
/* ─── Menu file upload ─── */
.menu-upload-zone {
  display: block; cursor: pointer; text-align: center;
  border: 2px dashed var(--border); border-radius: var(--radius-sm);
  padding: 1.25rem 1rem; color: var(--text-muted); font-size: 0.875rem;
  transition: border-color 0.15s, background 0.15s;
}
.menu-upload-zone:hover { border-color: var(--primary); background: var(--primary-lighter); color: var(--primary); }
.menu-upload-hint { display: block; font-size: 0.75rem; color: #bbb; margin-top: 4px; }
.menu-file-selected {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm);
  padding: 0.5rem 0.75rem; font-size: 0.875rem;
}

/* ─── Status banner (mi-comercio) ─── */
.status-banner {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 1rem 1.25rem; border-radius: var(--radius); margin-bottom: 1rem;
  border: 1px solid;
}
.status-banner strong { display: block; margin-bottom: 2px; }
.status-banner p { font-size: 0.875rem; margin: 0; opacity: 0.9; }
.status-banner--pending  { background: #fff8e1; border-color: #ffc107; color: #7a5c00; }
.status-banner--approved { background: #e8f5e9; border-color: #4caf50; color: #1b5e20; }
.status-banner--rejected { background: #ffebee; border-color: #ef5350; color: #7f0000; }
.status-banner--suspended { background: #f5f5f5; border-color: #9e9e9e; color: #424242; }
```

- [ ] **2.2 — Commit**

```bash
git add src/index.css
git commit -m "style: add menu upload zone and status banner CSS"
```

---

## Task 3: RegistroComercio — reemplazar campo menu con upload de archivo

**Files:**
- Modify: `src/pages/RegistroComercio.jsx`

### Contexto

El form actual tiene `menu: [{ name, price }]` en `initialForm`, y handlers `addMenuItem` / `updateMenuItem` / `removeMenuItem`. Todo esto desaparece. En su lugar: un campo de subida de archivo opcional (PDF/JPG/PNG, máx 5 MB). El upload usa Firebase Storage igual que los certificados — ya está importado.

### Pasos

- [ ] **3.1 — Agregar imports necesarios**

En `src/pages/RegistroComercio.jsx`, la primera línea de imports actualmente es:

```js
import { useState, useEffect, useRef } from 'react'
```

Agregar `useNavigate` de react-router-dom y `useAuth`:

```js
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
```

Y más abajo, después de `import { useApp }`:

```js
import { useAuth } from '../context/AuthContext'
```

- [ ] **3.2 — Actualizar initialForm: quitar menu**

Reemplazar `initialForm` (líneas 21-32):

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
  socialLinks: [''],
  menu: [{ name: '', price: '' }],
}
```

Por:

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
  socialLinks: [''],
}
```

- [ ] **3.3 — Actualizar el cuerpo del componente: quitar handlers de menu, agregar estado de upload**

Dentro de `export default function RegistroComercio()`, el estado y hooks actuales empiezan así:

```js
const { addBusiness } = useApp()
const [form, setForm] = useState(initialForm)
const [certFiles, setCertFiles] = useState({})
const [submitted, setSubmitted] = useState(false)
const [errors, setErrors] = useState({})
const [coords, setCoords] = useState(null)
const [geocoding, setGeocoding] = useState(false)
const [geocodeError, setGeocodeError] = useState('')
const [geocodeId, setGeocodeId] = useState(0)
const debounceRef = useRef(null)
```

Reemplazar por:

```js
const { addBusiness, businesses, businessesLoading } = useApp()
const { currentUser } = useAuth()
const navigate = useNavigate()
const [form, setForm] = useState(initialForm)
const [certFiles, setCertFiles] = useState({})
const [menuFile, setMenuFile] = useState(null)
const [existingMenuFileUrl, setExistingMenuFileUrl] = useState(null)
const [menuFileError, setMenuFileError] = useState('')
const [editingBusinessId, setEditingBusinessId] = useState(null)
const [submitted, setSubmitted] = useState(false)
const [errors, setErrors] = useState({})
const [coords, setCoords] = useState(null)
const [geocoding, setGeocoding] = useState(false)
const [geocodeError, setGeocodeError] = useState('')
const [geocodeId, setGeocodeId] = useState(0)
const debounceRef = useRef(null)
const initializedRef = useRef(false)
```

- [ ] **3.4 — Eliminar los 3 handlers de menu**

Localizar y eliminar completamente estas funciones (líneas ~126-139):

```js
const addMenuItem = () => {
  setForm((prev) => ({ ...prev, menu: [...prev.menu, { name: '', price: '' }] }))
}

const updateMenuItem = (i, field, value) => {
  setForm((prev) => {
    const menu = [...prev.menu]
    menu[i] = { ...menu[i], [field]: value }
    return { ...prev, menu }
  })
}

const removeMenuItem = (i) => {
  setForm((prev) => ({ ...prev, menu: prev.menu.filter((_, idx) => idx !== i) }))
}
```

- [ ] **3.5 — Agregar constantes de validación (nivel módulo) y handler de archivo de menú**

Agregar las constantes **antes** de `const DEFAULT_OPENING_HOURS = ...` (al inicio del archivo, después de los imports):

```js
const ALLOWED_MENU_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const MAX_MENU_SIZE = 5 * 1024 * 1024
```

Y el handler **dentro** del componente, después de los handlers de social links (después de `removeSocialLink`):

```js
const handleMenuFile = (file) => {
  if (!file) { setMenuFile(null); setMenuFileError(''); return }
  if (!ALLOWED_MENU_TYPES.has(file.type)) {
    setMenuFileError('Solo se aceptan PDF, JPG o PNG')
    return
  }
  if (file.size > MAX_MENU_SIZE) {
    setMenuFileError('El archivo no puede superar los 5 MB')
    return
  }
  setMenuFile(file)
  setMenuFileError('')
  setExistingMenuFileUrl(null)
}
```

- [ ] **3.6 — Reemplazar la sección JSX del menú por el campo de upload**

Localizar el bloque JSX del menú (alrededor de línea 480):

```jsx
<div className="form-group">
  <label className="form-label">Productos / Menú</label>
  {form.menu.map((item, i) => (
    <div key={i} className="menu-input-row">
      <input
        className="form-input"
        placeholder="Nombre del producto"
        value={item.name}
        onChange={(e) => updateMenuItem(i, 'name', e.target.value)}
      />
      <input
        className="form-input price-input"
        placeholder="Precio ($)"
        type="number"
        value={item.price}
        onChange={(e) => updateMenuItem(i, 'price', e.target.value)}
      />
      {form.menu.length > 1 && (
        <button type="button" className="btn-remove" onClick={() => removeMenuItem(i)}>×</button>
      )}
    </div>
  ))}
  <button type="button" className="btn btn-outline btn-sm" onClick={addMenuItem}>
    + Agregar producto
  </button>
</div>
```

Reemplazarlo por:

```jsx
<div className="form-group">
  <label className="form-label">
    Carta / menú <span style={{ fontWeight: 400, color: '#888' }}>(opcional)</span>
  </label>
  <p className="form-hint" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
    Subí una foto o PDF de tu carta. Máx. 5 MB.
  </p>
  {existingMenuFileUrl && !menuFile && (
    <div className="menu-file-selected">
      <span>
        📄 Archivo actual:{' '}
        <a href={existingMenuFileUrl} target="_blank" rel="noopener noreferrer" className="link">
          ver menú
        </a>
      </span>
      <button type="button" className="btn-remove" onClick={() => setExistingMenuFileUrl(null)}>
        ×
      </button>
    </div>
  )}
  {!existingMenuFileUrl && (
    menuFile ? (
      <div className="menu-file-selected">
        <span>📄 {menuFile.name}</span>
        <button
          type="button"
          className="btn-remove"
          onClick={() => { setMenuFile(null); setMenuFileError('') }}
        >
          ×
        </button>
      </div>
    ) : (
      <label className="menu-upload-zone">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={(e) => handleMenuFile(e.target.files[0] ?? null)}
        />
        📎 Arrastrá o hacé clic para seleccionar
        <span className="menu-upload-hint">PDF · JPG · PNG</span>
      </label>
    )
  )}
  {menuFileError && <span className="form-error">{menuFileError}</span>}
</div>
```

- [ ] **3.7 — Actualizar handleSubmit para incluir el upload del menú**

Localizar `handleSubmit`. Actualmente termina así (luego de subir certDocuments):

```js
if (Object.keys(certUrls).length > 0) {
  await updateDoc(doc(db, 'businesses', docRef.id), { certDocuments: certUrls })
}
setSubmitted(true)
```

Reemplazar `handleSubmit` completo:

```js
const handleSubmit = async (e) => {
  e.preventDefault()
  const errs = validate()
  if (Object.keys(errs).length > 0) {
    setErrors(errs)
    return
  }
  try {
    const businessData = {
      ...form,
      lat: coords.lat,
      lng: coords.lng,
      whatsapp: form.phone.replace(/\D/g, ''),
      socialLinks: form.socialLinks.filter((u) => u.trim()),
    }

    let businessId
    if (editingBusinessId) {
      await updateDoc(doc(db, 'businesses', editingBusinessId), {
        ...businessData,
        status: 'pendiente',
        pending: true,
        verified: false,
        rejectionReason: null,
      })
      businessId = editingBusinessId
    } else {
      const docRef = await addBusiness(businessData)
      businessId = docRef.id
    }

    const certUrls = {}
    for (const [certCode, file] of Object.entries(certFiles)) {
      const ext = file.name.split('.').pop().toLowerCase()
      const fileRef = ref(storage, `certificados/${businessId}/${certCode}.${ext}`)
      await uploadBytes(fileRef, file)
      certUrls[certCode] = await getDownloadURL(fileRef)
    }
    if (Object.keys(certUrls).length > 0) {
      await updateDoc(doc(db, 'businesses', businessId), { certDocuments: certUrls })
    }

    if (menuFile) {
      const ext = menuFile.name.split('.').pop().toLowerCase()
      const menuRef = ref(storage, `menus/${businessId}/menu.${ext}`)
      await uploadBytes(menuRef, menuFile)
      const menuUrl = await getDownloadURL(menuRef)
      await updateDoc(doc(db, 'businesses', businessId), { menuFileUrl: menuUrl })
    }

    setSubmitted(true)
  } catch {
    setErrors({ submit: 'Error al enviar el comercio. Intentá de nuevo.' })
  }
}
```

- [ ] **3.8 — Actualizar la pantalla de éxito y el botón de submit**

La pantalla `submitted` actualmente tiene:

```jsx
<h1>¡Registro enviado!</h1>
<p>
  Tu comercio fue enviado para revisión. Una vez aprobado por un administrador,
  aparecerá en el mapa.
</p>
```

Reemplazar por:

```jsx
<h1>{editingBusinessId ? '¡Re-envío exitoso!' : '¡Registro enviado!'}</h1>
<p>
  {editingBusinessId
    ? 'Tu comercio fue re-enviado y está nuevamente en revisión. Te avisaremos cuando haya novedades.'
    : 'Tu comercio fue enviado para revisión. Una vez aprobado por un administrador, aparecerá en el mapa.'}
</p>
```

Y el botón de submit actualmente tiene:

```jsx
<button type="submit" className="btn btn-primary btn-full" disabled={geocoding}>
  {geocoding ? 'Verificando ubicación...' : 'Enviar para verificación'}
</button>
```

Reemplazar por:

```jsx
<button type="submit" className="btn btn-primary btn-full" disabled={geocoding}>
  {geocoding
    ? 'Verificando ubicación...'
    : editingBusinessId
    ? 'Re-enviar para verificación'
    : 'Enviar para verificación'}
</button>
```

- [ ] **3.9 — Verificar en dev (sin lógica de re-envío aún)**

```bash
npm run dev
```

Ir a `/registro-comercio` como usuario con rol `comercio` sin comercio registrado. Verificar:
- Ya no aparece la sección "Productos / Menú"
- Aparece el campo de upload con zona punteada
- Se puede seleccionar un archivo PDF o imagen
- Se muestra el nombre del archivo seleccionado con botón "×"
- El botón de submit dice "Enviar para verificación"

- [ ] **3.10 — Commit**

```bash
git add src/pages/RegistroComercio.jsx
git commit -m "feat: replace menu text list with file upload in RegistroComercio"
```

---

## Task 4: RegistroComercio — lógica de re-envío (detección y pre-llenado)

**Files:**
- Modify: `src/pages/RegistroComercio.jsx`

### Contexto

Al montar `RegistroComercio`, si el usuario ya tiene un negocio en Firestore, la página debe comportarse distinto según el estado del negocio:
- `pendiente`, `aprobado`, `suspendido` → redirigir a `/mi-comercio`
- `rechazado` → pre-llenar el form con los datos del documento existente

Esto usa `initializedRef` para que el efecto solo corra una vez por montaje.

### Pasos

- [ ] **4.1 — Agregar el effect de detección**

Después del `useEffect` de geocodificación (que termina con `return () => { ... }` y cierra `}, [form.address])`), agregar un nuevo `useEffect`:

```js
useEffect(() => {
  if (businessesLoading || !currentUser || initializedRef.current) return
  initializedRef.current = true
  const existing = businesses.find((b) => b.ownerId === currentUser.uid)
  if (!existing) return
  if (existing.status !== 'rechazado') {
    navigate('/mi-comercio', { replace: true })
    return
  }
  setEditingBusinessId(existing.id)
  setForm({
    name: existing.name ?? '',
    type: existing.type ?? '',
    address: existing.address ?? '',
    phone: existing.phone ?? '',
    openingHours: existing.openingHours ?? DEFAULT_OPENING_HOURS,
    description: existing.description ?? '',
    tags: existing.tags ?? [],
    certifications: existing.certifications ?? [],
    socialLinks: existing.socialLinks?.length ? existing.socialLinks : [''],
  })
  if (existing.menuFileUrl) setExistingMenuFileUrl(existing.menuFileUrl)
  if (existing.lat && existing.lng) setCoords({ lat: existing.lat, lng: existing.lng })
  setGeocodeId((n) => n + 1)
}, [businesses, businessesLoading, currentUser, navigate])
```

**Nota sobre `/* eslint-disable */`:** Si el linter se queja de `setCoords`, `setForm`, etc. dentro de un `useEffect` sin incluirlos en el array de deps, agregar el comentario inline `// eslint-disable-next-line react-hooks/exhaustive-deps` en la línea del array de deps: `}, [businesses, businessesLoading, currentUser, navigate]) // eslint-disable-next-line react-hooks/exhaustive-deps`. Estos setters son estables (garantía de React) y no necesitan estar en deps.

- [ ] **4.2 — Verificar re-envío en dev**

Para probar este flujo, necesitás tener en Firestore un doc en `businesses` con `ownerId` igual al UID del usuario logueado y `status: 'rechazado'`. Podés crearlo manualmente desde la consola de Firebase o usando el panel de admin para rechazarlo.

Luego:
1. Loguéate como el comercio dueño del negocio rechazado
2. Navegá a `/registro-comercio`
3. Verificar que el form aparece pre-llenado con los datos del negocio
4. El botón de submit dice "Re-enviar para verificación"
5. Si el negocio tiene `menuFileUrl`, aparece "📄 Archivo actual: ver menú"

Para verificar la redirección: crear otro negocio con `status: 'pendiente'` y navegar a `/registro-comercio` — debería redirigir a `/mi-comercio`.

- [ ] **4.3 — Commit**

```bash
git add src/pages/RegistroComercio.jsx
git commit -m "feat: add re-submit detection in RegistroComercio (redirect or pre-fill on existing business)"
```

---

## Task 5: MiComercio — nueva página de ficha de estado

**Files:**
- Create: `src/pages/MiComercio.jsx`

### Contexto

Página nueva accesible solo para usuarios con rol `comercio` o `admin`. Busca en `businesses` (ya cargado en contexto via `onSnapshot`) el negocio con `ownerId === currentUser.uid`. Muestra 4 variantes de estado con banners de color. La ruta aún no existe en `App.jsx` — se agrega en el Task 6.

### Pasos

- [ ] **5.1 — Crear src/pages/MiComercio.jsx**

```jsx
import { useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, CheckCircle, XCircle, Clock, PauseCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import RestrictionBadge from '../components/RestrictionBadge'
import { BUSINESS_TYPE_MAP } from '../data/mockData'

const STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente de revisión',
    description: 'Tu comercio está siendo verificado por el equipo de MapaApto. Te avisaremos por mail cuando haya novedades.',
    Icon: Clock,
    modifier: 'pending',
  },
  aprobado: {
    label: 'Comercio aprobado',
    description: 'Tu comercio ya aparece en el mapa y está visible para todos los usuarios.',
    Icon: CheckCircle,
    modifier: 'approved',
  },
  rechazado: {
    label: 'Comercio rechazado',
    description: null,
    Icon: XCircle,
    modifier: 'rejected',
  },
  suspendido: {
    label: 'Comercio suspendido',
    description: 'Tu comercio no aparece en el mapa. Contactá con el equipo de MapaApto para más información.',
    Icon: PauseCircle,
    modifier: 'suspended',
  },
}

export default function MiComercio() {
  const { businesses, businessesLoading } = useApp()
  const { currentUser, userRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (userRole !== 'comercio' && userRole !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [userRole, navigate])

  const myBusiness = useMemo(
    () => businesses.find((b) => b.ownerId === currentUser?.uid),
    [businesses, currentUser]
  )

  if (businessesLoading) {
    return (
      <div className="page page-centered">
        <div className="spinner" />
      </div>
    )
  }

  if (!myBusiness) {
    return (
      <div className="page page-centered">
        <div className="container container-sm">
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <Store size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>Todavía no registraste un comercio</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Registrá tu negocio para que aparezca en el mapa de MapaApto.
            </p>
            <Link to="/registro-comercio" className="btn btn-primary">
              Registrar mi comercio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const status = myBusiness.status ?? 'pendiente'
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendiente
  const { Icon } = config
  const typeInfo = BUSINESS_TYPE_MAP[myBusiness.type]

  return (
    <div className="page">
      <div className="container container-sm" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="page-header">
          <div className="page-icon"><Store size={28} /></div>
          <div>
            <h1>Mi Comercio</h1>
            <p className="text-muted">Estado de tu establecimiento en MapaApto</p>
          </div>
        </div>

        <div className={`status-banner status-banner--${config.modifier}`}>
          <Icon size={20} />
          <div>
            <strong>{config.label}</strong>
            <p>
              {status === 'rechazado' && myBusiness.rejectionReason
                ? myBusiness.rejectionReason
                : config.description}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '0.5rem' }}>{myBusiness.name}</h2>
          <span
            className="business-type-chip"
            style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}
          >
            {typeInfo?.label}
          </span>
          <ul className="info-list" style={{ marginTop: '1rem' }}>
            <li>📍 {myBusiness.address}</li>
            <li>📞 {myBusiness.phone}</li>
          </ul>
          {myBusiness.tags?.length > 0 && (
            <div className="tags-list" style={{ marginTop: '0.75rem' }}>
              {myBusiness.tags.map((tag) => (
                <RestrictionBadge key={tag} tagId={tag} size="sm" />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {status === 'aprobado' && (
            <Link to={`/comercio/${myBusiness.id}`} className="btn btn-outline">
              Ver ficha pública
            </Link>
          )}
          {status === 'rechazado' && (
            <Link to="/registro-comercio" className="btn btn-primary">
              Corregir y re-enviar
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **5.2 — Commit**

```bash
git add src/pages/MiComercio.jsx
git commit -m "feat: add MiComercio page with status banner and 4 state variants"
```

---

## Task 6: App.jsx + Navbar — registrar ruta y actualizar link

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Navbar.jsx`

### Pasos

- [ ] **6.1 — Agregar import y ruta en App.jsx**

En `src/App.jsx`, agregar el import de MiComercio junto a los otros imports de páginas:

```js
import MiComercio from './pages/MiComercio'
```

Y agregar la ruta dentro del `<Routes>`, después de la ruta `/registro-comercio`:

```jsx
<Route path="/mi-comercio" element={<PrivateRoute><MiComercio /></PrivateRoute>} />
```

El bloque de rutas completo queda:

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/mapa" element={<Mapa />} />
  <Route path="/comercio/:id" element={<DetalleComercio />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register/tipo" element={<SelectRol />} />
  <Route path="/register" element={<Register />} />
  <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
  <Route path="/registro-comercio" element={<PrivateRoute><RegistroComercio /></PrivateRoute>} />
  <Route path="/mi-comercio" element={<PrivateRoute><MiComercio /></PrivateRoute>} />
  <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
</Routes>
```

- [ ] **6.2 — Actualizar link en Navbar.jsx**

En `src/components/Navbar.jsx`, el link de "Mi Comercio" actualmente apunta a `/registro-comercio` (línea ~61):

```jsx
{(userRole === 'comercio' || userRole === 'admin') && (
  <Link
    to="/registro-comercio"
    className={`nav-link ${pathname === '/registro-comercio' ? 'active' : ''}`}
    onClick={() => setMenuOpen(false)}
  >
    Mi Comercio
  </Link>
)}
```

Reemplazar por:

```jsx
{(userRole === 'comercio' || userRole === 'admin') && (
  <Link
    to="/mi-comercio"
    className={`nav-link ${pathname === '/mi-comercio' ? 'active' : ''}`}
    onClick={() => setMenuOpen(false)}
  >
    Mi Comercio
  </Link>
)}
```

- [ ] **6.3 — Verificar flujo completo en dev**

```bash
npm run dev
```

Flujo 1 — comercio sin negocio registrado:
1. Loguéate con una cuenta de rol `comercio` que no tenga negocio en Firestore
2. El navbar muestra "Mi Comercio" → click → va a `/mi-comercio`
3. La página muestra la card "Todavía no registraste un comercio" con botón "Registrar mi comercio"
4. Click en el botón → va a `/registro-comercio` y muestra el form normal (sin pre-llenado)
5. El form ya no tiene sección "Productos / Menú" — en su lugar está el campo de upload

Flujo 2 — comercio con negocio pendiente:
1. Loguéate con una cuenta de rol `comercio` que tenga un negocio con `status: 'pendiente'` en Firestore
2. Click en "Mi Comercio" en el navbar → va a `/mi-comercio`
3. Aparece banner amarillo "Pendiente de revisión" con la info del negocio
4. Si navegás manualmente a `/registro-comercio`, redirige automáticamente a `/mi-comercio`

Flujo 3 — comercio rechazado:
1. Loguéate con cuenta de rol `comercio` con negocio `status: 'rechazado'` y `rejectionReason: "..."` en Firestore
2. `/mi-comercio` muestra banner rojo con el motivo del rechazo y botón "Corregir y re-enviar"
3. Click en "Corregir y re-enviar" → va a `/registro-comercio` pre-llenado
4. Editá algún campo, hacé submit → el negocio se actualiza en Firestore con `status: 'pendiente'`

Flujo 4 — usuario con rol `user` intenta acceder a `/mi-comercio`:
1. Loguéate con rol `user`
2. Navegá manualmente a `/mi-comercio`
3. Debería redirigir a `/`

- [ ] **6.4 — Commit**

```bash
git add src/App.jsx src/components/Navbar.jsx
git commit -m "feat: add /mi-comercio route and update navbar link for comercio role"
```

---

## Verificación final

```bash
npm run build
```

Esperado: build sin errores ni warnings críticos. Si hay warnings de ESLint sobre variables no usadas, corregirlos (ej: `MENU_TYPES` que fue eliminado de DetalleComercio).

```bash
firebase deploy --only hosting
```

Desplegar a producción en https://webaptos.web.app.
