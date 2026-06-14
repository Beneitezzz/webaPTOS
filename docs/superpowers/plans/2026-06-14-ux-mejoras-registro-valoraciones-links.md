# UX Mejoras — Registro por rol, Valoraciones, Links dinámicos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar selección de rol en el registro, ocultar "Soy Comercio" del navbar a usuarios sin rol, sistema de valoraciones con estrellas y comentarios opcionales, y campo dinámico de links de redes sociales en el formulario de comercio.

**Architecture:** Cuatro cambios independientes que comparten la misma base de autenticación (Firebase Auth + Firestore). El flujo de registro introduce una pantalla previa (`/register/tipo`) y un query param `rol` que controla la redirección post-registro. Las valoraciones se guardan en una subcolección Firestore `businesses/{id}/reviews`. Los links sociales reemplazan los campos fijos `instagramUrl`/`websiteUrl` por un array dinámico `socialLinks` con retrocompatibilidad en la lectura.

**Tech Stack:** React 19, Vite, Firebase (Auth + Firestore), react-router-dom, lucide-react, plain CSS en `src/index.css`.

> **Nota:** No hay test runner configurado en este proyecto. Los pasos de verificación usan `npm run lint` y prueba manual con `npm run dev`.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|----------------|
| `src/pages/SelectRol.jsx` | Crear | Pantalla de selección usuario/comercio |
| `src/context/AuthContext.jsx` | Modificar | Acepta `role` param en las funciones de registro |
| `src/pages/Register.jsx` | Modificar | Lee `?rol`, muestra chip, redirige post-registro |
| `src/pages/Login.jsx` | Modificar | Link "Registrate" apunta a `/register/tipo` |
| `src/App.jsx` | Modificar | Agregar ruta `/register/tipo` |
| `src/components/Navbar.jsx` | Modificar | Reestructura links según rol |
| `src/components/ReviewsSection.jsx` | Crear | Resumen, lista y formulario de reseñas |
| `src/pages/DetalleComercio.jsx` | Modificar | Monta ReviewsSection, reemplaza links legacy |
| `src/pages/RegistroComercio.jsx` | Modificar | Campo dinámico `socialLinks` |
| `src/context/AppContext.jsx` | Modificar | Normaliza `socialLinks` al leer Firestore |
| `src/index.css` | Modificar | Estilos para clases nuevas |

---

## Task 1: AuthContext — aceptar `role` en las funciones de registro

**Files:**
- Modify: `src/context/AuthContext.jsx`

- [ ] **Paso 1: Actualizar `registerWithEmail` para aceptar `role`**

En `src/context/AuthContext.jsx`, cambiar la firma y el `setDoc`:

```js
// Antes (línea 58):
const registerWithEmail = async (email, password, displayName) => {

// Después:
const registerWithEmail = async (email, password, displayName, role = 'user') => {
```

Y dentro del `setDoc` (donde dice `role: 'user'`):
```js
// Antes (línea 62-68):
await setDoc(doc(db, 'users', credential.user.uid), {
  email,
  displayName,
  role: 'user',
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp(),
})

// Después:
await setDoc(doc(db, 'users', credential.user.uid), {
  email,
  displayName,
  role,
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp(),
})
```

- [ ] **Paso 2: Actualizar `signInWithProvider` para aceptar `role`**

```js
// Antes (línea 76):
const signInWithProvider = async (provider) => {

// Después:
const signInWithProvider = async (provider, role = 'user') => {
```

Y dentro del `if (!snap.exists())`:
```js
// Antes (línea 82-87):
await setDoc(userRef, {
  email: credential.user.email,
  displayName: credential.user.displayName,
  role: 'user',
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp(),
})

// Después:
await setDoc(userRef, {
  email: credential.user.email,
  displayName: credential.user.displayName,
  role,
  createdAt: serverTimestamp(),
  lastLogin: serverTimestamp(),
})
```

- [ ] **Paso 3: Lint**

```bash
npm run lint
```

Esperado: sin errores.

- [ ] **Paso 4: Commit**

```bash
git add src/context/AuthContext.jsx
git commit -m "feat: accept role param in registerWithEmail and signInWithProvider"
```

---

## Task 2: Pantalla de selección de rol (`/register/tipo`)

**Files:**
- Create: `src/pages/SelectRol.jsx`
- Modify: `src/App.jsx`
- Modify: `src/pages/Login.jsx`
- Modify: `src/index.css`

- [ ] **Paso 1: Crear `src/pages/SelectRol.jsx`**

```jsx
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import { User, Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SelectRol() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentUser, loading } = useAuth()
  const redirect = searchParams.get('redirect') || '/'

  if (loading) return null
  if (currentUser) return <Navigate to={redirect} replace />

  const go = (rol) => {
    const params = new URLSearchParams({ rol })
    if (redirect !== '/') params.set('redirect', redirect)
    navigate(`/register?${params}`)
  }

  return (
    <div className="page page-centered">
      <div className="container container-sm">
        <div className="page-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <h1>¿Cómo querés registrarte?</h1>
            <p className="text-muted">Elegí el tipo de cuenta que mejor te describe</p>
          </div>
        </div>

        <div className="rol-cards">
          <button className="rol-card" onClick={() => go('user')}>
            <User size={40} className="rol-card-icon" />
            <h2>Soy usuario</h2>
            <p>Quiero encontrar comercios aptos para mi dieta</p>
          </button>
          <button className="rol-card" onClick={() => go('comercio')}>
            <Store size={40} className="rol-card-icon" />
            <h2>Soy comercio</h2>
            <p>Quiero registrar mi negocio en el mapa</p>
          </button>
        </div>

        <p className="auth-footer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          ¿Ya tenés cuenta?{' '}
          <a href="/login" className="link">Iniciá sesión</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Agregar ruta en `src/App.jsx`**

Agregar el import al final del bloque de imports existente:
```js
import SelectRol from './pages/SelectRol'
```

Agregar la ruta ANTES de la ruta de `/register`:
```jsx
<Route path="/register/tipo" element={<SelectRol />} />
<Route path="/register" element={<Register />} />
```

- [ ] **Paso 3: Actualizar link "Registrate" en `src/pages/Login.jsx`**

En la línea 145-149 de `Login.jsx`, cambiar el `to` del Link:
```jsx
// Antes:
<Link
  to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
  className="link"
>

// Después:
<Link
  to={`/register/tipo${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
  className="link"
>
```

- [ ] **Paso 4: Agregar estilos en `src/index.css`**

Al final de `src/index.css`, agregar:
```css
/* SelectRol */
.rol-cards {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.rol-card {
  flex: 1;
  min-width: 180px;
  max-width: 240px;
  background: white;
  border: 2px solid var(--color-primary, #1a6b3c);
  border-radius: 14px;
  padding: 2rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.rol-card:hover {
  background: #f0faf4;
  transform: translateY(-2px);
}

.rol-card-icon {
  color: var(--color-primary, #1a6b3c);
}

.rol-card h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #1a1a1a;
}

.rol-card p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
}
```

- [ ] **Paso 5: Lint**

```bash
npm run lint
```

Esperado: sin errores.

- [ ] **Paso 6: Verificar manualmente**

```bash
npm run dev
```

Navegar a `http://localhost:5173/register/tipo`. Debe mostrar dos tarjetas. Al hacer clic en "Soy usuario" debe redirigir a `/register?rol=user`. Al hacer clic en "Soy comercio" debe redirigir a `/register?rol=comercio`.

- [ ] **Paso 7: Commit**

```bash
git add src/pages/SelectRol.jsx src/App.jsx src/pages/Login.jsx src/index.css
git commit -m "feat: add /register/tipo role selection screen"
```

---

## Task 3: Register.jsx — chip de rol y redirección post-registro

**Files:**
- Modify: `src/pages/Register.jsx`
- Modify: `src/index.css`

- [ ] **Paso 1: Leer `rol` desde searchParams**

En `src/pages/Register.jsx`, agregar la lectura del param `rol` junto al `redirect` existente (línea 13-21):

```jsx
// Agregar Store al import de lucide-react:
import { UserPlus, Store } from 'lucide-react'

// Junto a donde se lee redirect (línea 21):
const redirect = searchParams.get('redirect') || '/'
const rol = searchParams.get('rol') || 'user'
```

- [ ] **Paso 2: Mostrar chip de contexto cuando `rol === 'comercio'`**

Dentro del `<div className="card form-card">`, agregar el chip ANTES del bloque de `oauth-buttons`:

```jsx
{rol === 'comercio' && (
  <div className="auth-rol-chip">
    <Store size={14} />
    Registrándote como comercio — completarás los datos de tu negocio al finalizar
  </div>
)}
```

- [ ] **Paso 3: Pasar `rol` a `registerWithEmail`**

En la función `handleEmail` (línea 39):
```js
// Antes:
await registerWithEmail(email, password, displayName)

// Después:
await registerWithEmail(email, password, displayName, rol)
```

- [ ] **Paso 4: Redirigir a `/registro-comercio` si el rol es `comercio`**

En `handleEmail`, cambiar la línea de navigate post-registro:
```js
// Antes:
navigate(redirect, { replace: true })

// Después:
navigate(rol === 'comercio' ? '/registro-comercio' : redirect, { replace: true })
```

- [ ] **Paso 5: Pasar `rol` a `handleProvider` también**

```js
// Antes (línea 50):
const handleProvider = async (provider) => {
  ...
  await signInWithProvider(provider)
  navigate(redirect, { replace: true })

// Después:
const handleProvider = async (provider) => {
  ...
  await signInWithProvider(provider, rol)
  navigate(rol === 'comercio' ? '/registro-comercio' : redirect, { replace: true })
```

- [ ] **Paso 6: Agregar estilo del chip en `src/index.css`**

```css
/* Register — chip de rol */
.auth-rol-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e8f5e9;
  color: #1a6b3c;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.825rem;
  font-weight: 500;
  margin-bottom: 1rem;
}
```

- [ ] **Paso 7: Lint**

```bash
npm run lint
```

Esperado: sin errores.

- [ ] **Paso 8: Verificar manualmente**

Navegar a `/register/tipo`, elegir "Soy comercio". El formulario de registro debe mostrar el chip verde. Al completar el registro, debe redirigir a `/registro-comercio`.

- [ ] **Paso 9: Commit**

```bash
git add src/pages/Register.jsx src/index.css
git commit -m "feat: add role chip and post-register redirect in Register page"
```

---

## Task 4: Navbar — reestructurar links según rol

**Files:**
- Modify: `src/components/Navbar.jsx`

- [ ] **Paso 1: Quitar "Soy Comercio" de PUBLIC_LINKS**

```js
// Antes (líneas 6-10):
const PUBLIC_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/mapa', label: 'Explorar Mapa' },
  { to: '/registro-comercio', label: 'Soy Comercio' },
]

// Después:
const PUBLIC_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/mapa', label: 'Explorar Mapa' },
]
```

- [ ] **Paso 2: Reemplazar el bloque condicional de autenticación al final de `navbar-links`**

El bloque que va desde `{currentUser && <Link to="/perfil">...` hasta el cierre de `</div>` (fin de `navbar-links`) reemplazarlo por:

```jsx
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
```

- [ ] **Paso 3: Lint**

```bash
npm run lint
```

Esperado: sin errores.

- [ ] **Paso 4: Verificar manualmente**

- Sin sesión: ver Inicio, Explorar Mapa, Ingresar. Sin "Soy Comercio".
- Con sesión rol `user`: ver Inicio, Explorar Mapa, Mi Perfil, dropdown usuario. Sin "Mi Comercio".
- Con sesión rol `comercio`: ver Inicio, Explorar Mapa, Mi Perfil, Mi Comercio, dropdown usuario.
- Con sesión rol `admin`: ver Inicio, Explorar Mapa, Mi Perfil, Mi Comercio, Admin, dropdown usuario.

- [ ] **Paso 5: Commit**

```bash
git add src/components/Navbar.jsx
git commit -m "feat: restructure navbar links by user role"
```

---

## Task 5: Componente ReviewsSection

**Files:**
- Create: `src/components/ReviewsSection.jsx`
- Modify: `src/index.css`

- [ ] **Paso 1: Crear `src/components/ReviewsSection.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

function StarDisplay({ rating, size = 16 }) {
  return (
    <span className="star-display">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= rating ? '#ffc107' : 'none'}
          color="#ffc107"
        />
      ))}
    </span>
  )
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`
  return d.toLocaleDateString('es-AR')
}

export default function ReviewsSection({ businessId }) {
  const { currentUser, userRole } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [myReview, setMyReview] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'businesses', businessId, 'reviews'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setReviews(data)
      if (currentUser) {
        const mine = data.find((r) => r.id === currentUser.uid)
        if (mine) {
          setMyReview(mine)
          setRating(mine.rating)
          setComment(mine.comment ?? '')
        } else {
          setMyReview(null)
        }
      }
      setLoading(false)
    })
    return unsub
  }, [businessId, currentUser])

  const average = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) return
    setSubmitting(true)
    try {
      await setDoc(doc(db, 'businesses', businessId, 'reviews', currentUser.uid), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        rating,
        comment: comment.trim() || null,
        createdAt: serverTimestamp(),
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="card reviews-card">
      <h2>Valoraciones</h2>

      {average ? (
        <div className="reviews-summary">
          <div className="reviews-average">
            <span className="reviews-score">{average}</span>
            <StarDisplay rating={Math.round(average)} size={18} />
            <span className="reviews-count">
              {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="reviews-bars">
            {distribution.map(({ star, count }) => (
              <div key={star} className="reviews-bar-row">
                <span className="reviews-bar-label">{star}★</span>
                <div className="reviews-bar-track">
                  <div
                    className="reviews-bar-fill"
                    style={{ width: `${(count / reviews.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted">Todavía no hay reseñas. ¡Sé el primero!</p>
      )}

      {userRole === 'user' ? (
        <form onSubmit={handleSubmit} className="reviews-form">
          <div className="form-label">
            {myReview ? 'Tu reseña' : 'Dejá tu valoración'}
          </div>
          <div className="star-picker">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className="star-picker-btn"
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
              >
                <Star
                  size={30}
                  fill={(hover || rating) >= s ? '#ffc107' : 'none'}
                  color="#ffc107"
                />
              </button>
            ))}
          </div>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Contá tu experiencia... (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!rating || submitting}
          >
            {submitting
              ? 'Publicando...'
              : myReview
              ? 'Actualizar reseña'
              : 'Publicar reseña'}
          </button>
        </form>
      ) : (
        <p className="text-muted reviews-login-prompt">
          <Link to="/login" className="link">Iniciá sesión</Link> como usuario para dejar una reseña.
        </p>
      )}

      {reviews.length > 0 && (
        <div className="reviews-list">
          {reviews.map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-header">
                <div className="review-meta">
                  <span className="review-author">{r.userName}</span>
                  <StarDisplay rating={r.rating} size={13} />
                </div>
                <span className="review-date">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Paso 2: Agregar estilos en `src/index.css`**

```css
/* ReviewsSection */
.reviews-card { margin-top: 1.5rem; }

.reviews-summary {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.reviews-average {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.reviews-score {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a6b3c;
  line-height: 1;
}

.reviews-count {
  font-size: 0.8rem;
  color: #888;
}

.reviews-bars { flex: 1; min-width: 160px; }

.reviews-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.reviews-bar-label {
  font-size: 0.75rem;
  color: #555;
  width: 20px;
  text-align: right;
}

.reviews-bar-track {
  flex: 1;
  background: #eee;
  border-radius: 4px;
  height: 7px;
  overflow: hidden;
}

.reviews-bar-fill {
  background: #ffc107;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.star-display { display: inline-flex; gap: 2px; vertical-align: middle; }

.reviews-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid #eee;
  padding-top: 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.star-picker { display: flex; gap: 4px; }

.star-picker-btn {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  line-height: 0;
}

.star-picker-btn:hover { transform: scale(1.15); }

.reviews-login-prompt {
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.reviews-list { border-top: 1px solid #eee; padding-top: 1rem; }

.review-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child { border-bottom: none; }

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.review-meta { display: flex; align-items: center; gap: 8px; }

.review-author { font-weight: 600; font-size: 0.9rem; }

.review-date { font-size: 0.78rem; color: #aaa; }

.review-comment { font-size: 0.875rem; color: #555; margin: 4px 0 0; line-height: 1.5; }
```

- [ ] **Paso 3: Lint**

```bash
npm run lint
```

Esperado: sin errores.

- [ ] **Paso 4: Commit**

```bash
git add src/components/ReviewsSection.jsx src/index.css
git commit -m "feat: add ReviewsSection component with star ratings and comments"
```

---

## Task 6: DetalleComercio — montar ReviewsSection y actualizar links sociales

**Files:**
- Modify: `src/pages/DetalleComercio.jsx`

- [ ] **Paso 1: Importar ReviewsSection y quitar iconos Instagram/Globe del import**

```jsx
// Antes (línea 2):
import { MapPin, Clock, Phone, MessageCircle, Star, ArrowLeft, ShieldCheck, Globe, Instagram } from 'lucide-react'

// Después:
import { MapPin, Clock, Phone, MessageCircle, ArrowLeft, ShieldCheck, Globe } from 'lucide-react'

// Agregar import de ReviewsSection:
import ReviewsSection from '../components/ReviewsSection'
```

- [ ] **Paso 2: Quitar el bloque de rating estático del header**

Eliminar el bloque completo (líneas 60-64):
```jsx
// Eliminar:
{business.rating && (
  <div className="business-rating">
    <Star size={16} fill="#ffc107" color="#ffc107" />
    <span>{business.rating} / 5.0</span>
  </div>
)}
```

- [ ] **Paso 3: Reemplazar botones Instagram/Website por loop de `socialLinks`**

Dentro de `contact-buttons`, reemplazar:
```jsx
// Antes:
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

// Después:
{(business.socialLinks ?? []).map((url) => {
  let label = url
  try { label = new URL(url).hostname.replace('www.', '') } catch { /* mantener url */ }
  return (
    <a
      key={url}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline"
    >
      <Globe size={16} /> {label}
    </a>
  )
})}
```

- [ ] **Paso 4: Montar `<ReviewsSection>` antes del disclaimer**

Reemplazar:
```jsx
// Antes:
{/* Legal */}
<div className="disclaimer-card">

// Después:
<ReviewsSection businessId={id} />

{/* Legal */}
<div className="disclaimer-card">
```

- [ ] **Paso 5: Lint**

```bash
npm run lint
```

Esperado: sin errores.

- [ ] **Paso 6: Verificar manualmente**

```bash
npm run dev
```

Navegar a un comercio verificado. Debe:
- No mostrar el rating estático en el header
- Mostrar la sección de valoraciones al pie
- El formulario de reseña visible solo si el usuario tiene rol `user`
- Si el comercio tenía `instagramUrl` o `websiteUrl`, deben aparecer como botones con el dominio

- [ ] **Paso 7: Commit**

```bash
git add src/pages/DetalleComercio.jsx
git commit -m "feat: mount ReviewsSection and update social links display in DetalleComercio"
```

---

## Task 7: RegistroComercio + AppContext — links sociales dinámicos

**Files:**
- Modify: `src/pages/RegistroComercio.jsx`
- Modify: `src/context/AppContext.jsx`
- Modify: `src/index.css`

- [ ] **Paso 1: Actualizar `initialForm` en `RegistroComercio`**

```js
// Antes (línea 21-33):
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

// Después:
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

- [ ] **Paso 2: Agregar helpers para `socialLinks` en el componente**

Justo después de `removeMenuItem` (alrededor de línea 141), agregar:

```js
const addSocialLink = () =>
  setForm((prev) => ({ ...prev, socialLinks: [...prev.socialLinks, ''] }))

const updateSocialLink = (i, value) =>
  setForm((prev) => {
    const socialLinks = [...prev.socialLinks]
    socialLinks[i] = value
    return { ...prev, socialLinks }
  })

const removeSocialLink = (i) =>
  setForm((prev) => ({ ...prev, socialLinks: prev.socialLinks.filter((_, idx) => idx !== i) }))
```

- [ ] **Paso 3: Actualizar `validate()` — quitar validaciones de Instagram/website y agregar la de `socialLinks`**

```js
// Quitar estas líneas del validate():
if (form.websiteUrl.trim() && !isValidUrl(form.websiteUrl.trim()))
  errs.websiteUrl = 'Ingresá una URL válida (ej: https://micomercio.com)'
if (form.instagramUrl.trim() && (!isValidUrl(form.instagramUrl.trim()) || !form.instagramUrl.includes('instagram.com/')))
  errs.instagramUrl = 'Ingresá una URL de Instagram válida (ej: https://instagram.com/milocal)'

// Agregar en su lugar:
form.socialLinks.forEach((url, i) => {
  if (url.trim() && !isValidUrl(url.trim()))
    errs[`socialLink_${i}`] = 'Ingresá una URL válida (ej: https://instagram.com/milocal)'
})
```

- [ ] **Paso 4: Actualizar `handleSubmit` — reemplazar `instagramUrl`/`websiteUrl` por `socialLinks`**

```js
// Antes (líneas 185-191):
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

// Después:
const docRef = await addBusiness({
  ...form,
  lat: coords.lat,
  lng: coords.lng,
  whatsapp: form.phone.replace(/\D/g, ''),
  socialLinks: form.socialLinks.filter((u) => u.trim()),
  menu: form.menu
    .filter((m) => m.name.trim())
    .map((m) => ({ name: m.name, price: m.price ? Number(m.price) : null })),
})
```

- [ ] **Paso 5: Reemplazar el bloque JSX de Instagram/website por el campo dinámico**

Reemplazar el bloque `<div className="form-row">` que contiene los campos de Instagram y Sitio web (líneas 374-395):

```jsx
// Reemplazar todo ese bloque por:
<div className="form-group">
  <label className="form-label">Links del comercio <span style={{ fontWeight: 400, color: '#888' }}>(opcional)</span></label>
  <p className="form-hint" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
    Agregá tu sitio web, Instagram, Facebook, TikTok, etc.
  </p>
  {form.socialLinks.map((url, i) => (
    <div key={i} className="social-link-row">
      <input
        type="url"
        className={`form-input ${errors[`socialLink_${i}`] ? 'error' : ''}`}
        placeholder="https://instagram.com/milocal"
        value={url}
        onChange={(e) => updateSocialLink(i, e.target.value)}
      />
      {form.socialLinks.length > 1 && (
        <button type="button" className="btn-remove" onClick={() => removeSocialLink(i)}>×</button>
      )}
      {errors[`socialLink_${i}`] && (
        <span className="form-error">{errors[`socialLink_${i}`]}</span>
      )}
    </div>
  ))}
  <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }} onClick={addSocialLink}>
    + Agregar link
  </button>
</div>
```

- [ ] **Paso 6: Agregar estilo `.social-link-row` en `src/index.css`**

```css
/* RegistroComercio — social links */
.social-link-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.social-link-row .form-input { flex: 1; min-width: 0; }

.social-link-row .form-error { width: 100%; }
```

- [ ] **Paso 7: Normalizar `socialLinks` en `AppContext` al leer Firestore**

En `src/context/AppContext.jsx`, actualizar el `onSnapshot` (línea 22-25):

```js
// Antes:
(snapshot) => {
  setBusinesses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))

// Después:
(snapshot) => {
  setBusinesses(snapshot.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      socialLinks: data.socialLinks ?? [data.instagramUrl, data.websiteUrl].filter(Boolean),
    }
  }))
```

- [ ] **Paso 8: Lint**

```bash
npm run lint
```

Esperado: sin errores.

- [ ] **Paso 9: Verificar manualmente**

```bash
npm run dev
```

- Navegar a `/registro-comercio`. El bloque de links debe mostrar un campo con "+ Agregar link".
- Agregar dos links: al agregar el segundo aparece el botón ×. Al quitar uno queda el ×-less.
- Ingresar una URL inválida y enviar: debe mostrar error por campo.
- Completar y enviar el formulario: el negocio se crea con `socialLinks` en Firestore.

- [ ] **Paso 10: Commit**

```bash
git add src/pages/RegistroComercio.jsx src/context/AppContext.jsx src/index.css
git commit -m "feat: replace static social link fields with dynamic socialLinks array"
```

---

## Verificación final

- [ ] `npm run build` completa sin errores
- [ ] Flujo completo: `/register/tipo` → elegir comercio → formulario con chip → `/registro-comercio`
- [ ] Navbar sin "Soy Comercio" para usuarios sin rol; "Mi Comercio" visible para rol `comercio`
- [ ] Reseña publicada por usuario `user` aparece en la lista con nombre, estrellas y fecha
- [ ] Editar una reseña existente actualiza el documento en Firestore sin crear uno nuevo
- [ ] Comercios legacy con `instagramUrl`/`websiteUrl` muestran los links correctamente en DetalleComercio
