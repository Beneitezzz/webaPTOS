# Fase 2 — Migración a Firestore: Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el almacenamiento de comercios y perfil de usuario de localStorage/mockData.js a Cloud Firestore, manteniendo la API pública de `useApp()` sin cambios de firma para los componentes consumidores.

**Architecture:** AppContext reemplaza su backend de localStorage por una suscripción `onSnapshot` para comercios (tiempo real) y `getDoc/updateDoc` para el perfil de usuario. Las funciones de escritura pasan a ser async. Un script Node.js con `firebase-admin` carga los datos iniciales de forma idempotente.

**Tech Stack:** Firebase 12 (Firestore, client SDK), firebase-admin (seed script), React 19, Vite

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|---|---|---|
| Manual | Firebase Console → Firestore → Reglas | Publicar reglas de seguridad actualizadas |
| Instalar | `firebase-admin` (devDependency) | SDK para el script de seed server-side |
| Crear | `scripts/serviceAccount.json` | Credenciales de Firebase Admin (gitignored) |
| Crear | `scripts/seed.js` | Carga los 10 comercios de mockData a Firestore (idempotente) |
| Reescribir | `src/context/AppContext.jsx` | Reemplaza localStorage por Firestore |
| Modificar | `src/pages/Perfil.jsx` | `name` → `profileName`, async handleSave |
| Modificar | `src/pages/RegistroComercio.jsx` | async handleSubmit + manejo de errores |
| Modificar | `src/pages/Mapa.jsx` | Inicializar filtros tras carga asíncrona del perfil + loading/error state |

---

## Task 1: Actualizar reglas de Firestore y script de seed

**Files:**
- Manual: Firebase Console → Firestore → Reglas
- Create: `scripts/serviceAccount.json` (manual, gitignored)
- Create: `scripts/seed.js`
- Modify: `package.json` (add `seed` script)
- Modify: `.gitignore` (add `scripts/serviceAccount.json`)

- [ ] **Paso 1: Publicar reglas en Firebase Console**

Ir a **Firebase Console → Firestore Database → Reglas**, reemplazar el contenido con esto y hacer click en **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    match /businesses/{businessId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
                            && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

- [ ] **Paso 2: Descargar service account de Firebase Console**

Ir a **Firebase Console → Configuración del proyecto (ícono de engranaje) → Cuentas de servicio → Generar nueva clave privada** → descargar el JSON → guardar como `scripts/serviceAccount.json`.

- [ ] **Paso 3: Agregar `scripts/serviceAccount.json` al `.gitignore`**

Leer `.gitignore` y agregar al final:

```
# Firebase Admin service account (contiene credenciales privadas)
scripts/serviceAccount.json
```

- [ ] **Paso 4: Instalar `firebase-admin` como devDependency**

```bash
npm install --save-dev firebase-admin
```

Resultado esperado: `firebase-admin` aparece en `devDependencies` de `package.json`.

- [ ] **Paso 5: Crear `scripts/seed.js`**

```js
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { mockBusinesses } from '../src/data/mockData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8')
)

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()

async function seed() {
  const col = db.collection('businesses')
  const snapshot = await col.limit(1).get()

  if (!snapshot.empty) {
    console.log('Ya existen comercios en Firestore. Seed omitido.')
    process.exit(0)
  }

  const batch = db.batch()
  for (const { id, ...business } of mockBusinesses) {
    const ref = col.doc()
    batch.set(ref, {
      ...business,
      ownerId: null,
      createdAt: Timestamp.now(),
    })
  }

  await batch.commit()
  console.log(`Seed completado: ${mockBusinesses.length} comercios creados.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Error en seed:', err.message)
  process.exit(1)
})
```

- [ ] **Paso 6: Agregar script `seed` a `package.json`**

En la sección `"scripts"` de `package.json`, agregar:

```json
"seed": "node scripts/seed.js"
```

- [ ] **Paso 7: Correr el seed**

```bash
npm run seed
```

Resultado esperado:
```
Seed completado: 10 comercios creados.
```

Si ya hay datos:
```
Ya existen comercios en Firestore. Seed omitido.
```

Verificar en Firebase Console → Firestore → colección `businesses` que aparecen 10 documentos.

- [ ] **Paso 8: Verificar compilación**

```bash
npm run build
```

Resultado esperado: sin errores.

- [ ] **Paso 9: Commit**

```bash
git add scripts/seed.js package.json package-lock.json .gitignore
git commit -m "feat: add Firestore seed script and update security rules"
```

---

## Task 2: Reescribir AppContext

**Files:**
- Rewrite: `src/context/AppContext.jsx`

- [ ] **Paso 1: Reemplazar el contenido completo de `src/context/AppContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, getDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { currentUser } = useAuth()

  const [businesses, setBusinesses] = useState([])
  const [businessesLoading, setBusinessesLoading] = useState(true)
  const [businessesError, setBusinessesError] = useState(null)
  const [userProfile, setUserProfile] = useState({ profileName: '', restrictions: [] })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        setBusinesses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setBusinessesLoading(false)
        setBusinessesError(null)
      },
      (err) => {
        console.error('businesses snapshot error:', err)
        setBusinessesLoading(false)
        setBusinessesError('No se pudieron cargar los comercios')
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setUserProfile({ profileName: '', restrictions: [] })
      setProfileLoading(false)
      return
    }
    let cancelled = false
    setProfileLoading(true)
    getDoc(doc(db, 'users', currentUser.uid))
      .then((snap) => {
        if (cancelled) return
        if (snap.exists()) {
          const data = snap.data()
          setUserProfile({
            profileName: data.profileName ?? '',
            restrictions: data.restrictions ?? [],
          })
        }
      })
      .catch((err) => console.error('profile load error:', err))
      .finally(() => { if (!cancelled) setProfileLoading(false) })
    return () => { cancelled = true }
  }, [currentUser])

  const updateProfile = async (updates) => {
    await updateDoc(doc(db, 'users', currentUser.uid), updates)
    setUserProfile((prev) => ({ ...prev, ...updates }))
  }

  const addBusiness = (data) =>
    addDoc(collection(db, 'businesses'), {
      ...data,
      verified: false,
      pending: true,
      rating: null,
      ownerId: currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
    })

  const approveBusiness = (id) =>
    updateDoc(doc(db, 'businesses', id), { verified: true, pending: false })

  const rejectBusiness = (id) =>
    deleteDoc(doc(db, 'businesses', id))

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
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext)
```

- [ ] **Paso 2: Verificar compilación**

```bash
npm run build
```

Resultado esperado: sin errores.

- [ ] **Paso 3: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: replace localStorage with Firestore in AppContext"
```

---

## Task 3: Actualizar Perfil.jsx

**Files:**
- Modify: `src/pages/Perfil.jsx`

El cambio: `userProfile.name` → `userProfile.profileName`, `handleSave` pasa a ser async, y `updateProfile` recibe `{ profileName, restrictions }` en lugar de `{ name, restrictions }`.

- [ ] **Paso 1: Reemplazar el contenido completo de `src/pages/Perfil.jsx`**

```jsx
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { RESTRICTIONS } from '../data/mockData'
import { toggleItem } from '../utils/array'
import { CheckCircle, User } from 'lucide-react'

export default function Perfil() {
  const { userProfile, updateProfile } = useApp()
  const [name, setName] = useState(userProfile.profileName)
  const [restrictions, setRestrictions] = useState(userProfile.restrictions)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const toggleRestriction = (id) => {
    setRestrictions((prev) => toggleItem(prev, id))
    setSaved(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      await updateProfile({ profileName: name, restrictions })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('No se pudo guardar el perfil. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page page-centered">
      <div className="container container-sm">
        <div className="page-header">
          <div className="page-icon">
            <User size={28} />
          </div>
          <div>
            <h1>Mi Perfil</h1>
            <p className="text-muted">
              Configurá tus restricciones y el mapa se filtrará automáticamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="card form-card">
          <div className="form-group">
            <label className="form-label">Tu nombre (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: María"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaved(false)
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mis restricciones alimentarias</label>
            <p className="form-hint">
              Seleccioná todas las que correspondan. El mapa mostrará solo los comercios que
              cumplen con todas tus restricciones activas.
            </p>
            <div className="restriction-grid">
              {RESTRICTIONS.map((r) => {
                const active = restrictions.includes(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`restriction-btn ${active ? 'active' : ''}`}
                    style={active ? { backgroundColor: r.color, borderColor: r.color } : { borderColor: r.color, color: r.color }}
                    onClick={() => toggleRestriction(r.id)}
                  >
                    {active && <CheckCircle size={16} />}
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {restrictions.length > 0 && (
            <div className="profile-summary">
              <p>
                Vas a ver comercios aptos para:{' '}
                {restrictions.map((id) => {
                  const r = RESTRICTIONS.find((x) => x.id === id)
                  return (
                    <span
                      key={id}
                      className="badge badge-sm"
                      style={{ backgroundColor: r?.color }}
                    >
                      {r?.label}
                    </span>
                  )
                })}
              </p>
            </div>
          )}

          {saveError && <div className="auth-error">{saveError}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar perfil'}
          </button>

          {saved && (
            <div className="save-success">
              <CheckCircle size={16} /> Perfil guardado correctamente
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Verificar compilación**

```bash
npm run build
```

- [ ] **Paso 3: Commit**

```bash
git add src/pages/Perfil.jsx
git commit -m "feat: update Perfil to use Firestore profileName and async updateProfile"
```

---

## Task 4: Actualizar RegistroComercio.jsx

**Files:**
- Modify: `src/pages/RegistroComercio.jsx`

El único cambio: `handleSubmit` pasa a ser `async` y maneja el error de `addBusiness`.

- [ ] **Paso 1: Leer `src/pages/RegistroComercio.jsx` para ubicar `handleSubmit`**

El bloque actual (líneas 62-79):

```jsx
const handleSubmit = (e) => {
  e.preventDefault()
  const errs = validate()
  if (Object.keys(errs).length > 0) {
    setErrors(errs)
    return
  }
  addBusiness({
    ...form,
    lat: -31.4201 + (Math.random() - 0.5) * 0.04,
    lng: -64.1888 + (Math.random() - 0.5) * 0.04,
    whatsapp: form.phone.replace(/\D/g, ''),
    menu: form.menu
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name, price: m.price ? Number(m.price) : null })),
  })
  setSubmitted(true)
}
```

- [ ] **Paso 2: Reemplazar `handleSubmit` con la versión async**

```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  const errs = validate()
  if (Object.keys(errs).length > 0) {
    setErrors(errs)
    return
  }
  try {
    await addBusiness({
      ...form,
      lat: -31.4201 + (Math.random() - 0.5) * 0.04,
      lng: -64.1888 + (Math.random() - 0.5) * 0.04,
      whatsapp: form.phone.replace(/\D/g, ''),
      menu: form.menu
        .filter((m) => m.name.trim())
        .map((m) => ({ name: m.name, price: m.price ? Number(m.price) : null })),
    })
    setSubmitted(true)
  } catch {
    setErrors({ submit: 'Error al enviar el comercio. Intentá de nuevo.' })
  }
}
```

- [ ] **Paso 3: Agregar visualización del error de submit**

Buscar el botón de submit en el JSX (cerca del final del formulario) y agregar el error de submit justo antes:

```jsx
{errors.submit && <div className="auth-error">{errors.submit}</div>}

<button type="submit" className="btn btn-primary btn-full">
  Enviar para verificación
</button>
```

- [ ] **Paso 4: Verificar compilación**

```bash
npm run build
```

- [ ] **Paso 5: Commit**

```bash
git add src/pages/RegistroComercio.jsx
git commit -m "feat: make addBusiness async in RegistroComercio with error handling"
```

---

## Task 5: Actualizar Mapa.jsx

**Files:**
- Modify: `src/pages/Mapa.jsx`

Dos cambios:
1. Inicializar `selectedRestrictions` tras la carga asíncrona del perfil (evita flash de filtros vacíos)
2. Mostrar spinner/error mientras cargan los comercios desde Firestore

- [ ] **Paso 1: Reemplazar el contenido completo de `src/pages/Mapa.jsx`**

```jsx
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
      setSelectedRestrictions(userProfile.restrictions)
      setFiltersInitialized(true)
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
      {/* Sidebar */}
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

      {/* Map */}
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
```

- [ ] **Paso 2: Verificar compilación y lint**

```bash
npm run build && npm run lint
```

Resultado esperado: sin errores (puede haber el pre-existing warning de AppContext).

- [ ] **Paso 3: Verificación manual en el navegador**

```bash
npm run dev
```

Verificar:
1. `/mapa` muestra spinner brevemente mientras cargan los comercios, luego muestra el mapa con los 10 comercios del seed
2. Con sesión activa y restricciones guardadas en el perfil → el mapa pre-filtra automáticamente
3. Sin sesión → el mapa carga sin filtros pre-aplicados
4. Registrarse como nuevo comercio → aparece en el panel de admin como pendiente
5. Admin aprueba comercio → aparece en el mapa **sin recargar la página** (onSnapshot en tiempo real)
6. `/perfil` → guardar nombre y restricciones → recargar página → los datos persisten

- [ ] **Paso 4: Commit final**

```bash
git add src/pages/Mapa.jsx
git commit -m "feat: update Mapa to handle async Firestore loading and profile initialization"
```
