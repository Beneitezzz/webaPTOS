# Fase 1 — Autenticación con Firebase
**Fecha:** 2026-05-28
**Proyecto:** MapaApto
**Scope:** RF01 (registro/perfil de usuario), RNF03 (seguridad y protección de datos)

---

## Resumen

Integrar Firebase Authentication y Cloud Firestore para reemplazar el sistema de perfil basado en `localStorage` por cuentas reales de usuario. El perfil nutricional (nombre + restricciones) sigue en `localStorage` durante esta fase — la migración a Firestore ocurre en la Fase 2.

---

## Enfoque elegido

**Enfoque A — Auth puro, Firestore mínimo.**
Firebase Auth maneja login/register/OAuth. Firestore solo guarda `{ role, createdAt }` por usuario. El perfil (nombre + restricciones) sigue en `localStorage`. La app actual cambia lo mínimo posible.

---

## Rutas protegidas

| Ruta | Requiere auth | Requiere rol admin |
|---|---|---|
| `/` | No | No |
| `/mapa` | No | No |
| `/comercio/:id` | No | No |
| `/perfil` | Sí | No |
| `/registro-comercio` | Sí | No |
| `/admin` | Sí | Sí |
| `/login` | No (redirige a `/` si ya tiene sesión) | No |
| `/register` | No (redirige a `/` si ya tiene sesión) | No |

---

## Archivos nuevos

```
src/firebase.js               ← exporta: auth, db, googleProvider, appleProvider, facebookProvider
src/context/AuthContext.jsx
src/pages/Login.jsx
src/pages/Register.jsx
src/components/PrivateRoute.jsx
src/components/AdminRoute.jsx
```

## Archivos modificados

```
src/App.jsx                    ← AuthProvider, rutas /login y /register, PrivateRoute/AdminRoute
src/components/Navbar.jsx      ← botón login/logout, nombre del usuario, link /admin solo para admins
src/pages/AdminPanel.jsx       ← elimina contraseña hardcodeada y formulario de login propio
src/pages/Perfil.jsx           ← sin cambios funcionales (PrivateRoute lo protege desde App.jsx)
src/pages/RegistroComercio.jsx ← sin cambios funcionales (PrivateRoute lo protege desde App.jsx)
.gitignore                     ← ya actualizado (.superpowers/)
```

---

## Firebase — servicios usados en Fase 1

| Servicio | Uso |
|---|---|
| Firebase Authentication | Login, register, OAuth, gestión de sesión |
| Cloud Firestore | Colección `users` — solo campo `role` y metadata |

### Estructura Firestore

```
users/{uid}
  email:        string
  displayName:  string
  role:         "user" | "admin"
  createdAt:    Timestamp
  lastLogin:    Timestamp
```

---

## AuthContext — API pública

```js
const {
  currentUser,   // objeto Firebase Auth o null
  userRole,      // "user" | "admin" | null
  loading,       // true mientras Firebase verifica la sesión
  signInWithEmail(email, password),
  signInWithProvider(provider),  // GoogleAuthProvider | OAuthProvider (Apple) | FacebookAuthProvider
  signOut(),
} = useAuth()
```

---

## Componentes de rutas

### PrivateRoute
```
loading === true   →  spinner centrado
currentUser null   →  redirige a /login?redirect=<ruta-actual>
currentUser ok     →  renderiza children
```

### AdminRoute
```
loading === true        →  spinner centrado
currentUser null        →  redirige a /login?redirect=/admin
userRole !== "admin"    →  redirige a / (silencioso, sin mensaje)
userRole === "admin"    →  renderiza AdminPanel
```

---

## Páginas de autenticación

### Login `/login`
- Botones OAuth: Google, Apple, Facebook
- Separador "o con email"
- Campos: email, contraseña
- Link "¿Olvidaste tu contraseña?" (dispara `sendPasswordResetEmail`)
- Link a `/register`
- Botón secundario "Continuar sin iniciar sesión" (ver comportamiento abajo)
- Si ya tiene sesión activa → redirige a `/`

### Register `/register`
- Botones OAuth: Google, Apple, Facebook
- Separador "o con email"
- Campos: nombre completo, email, contraseña, confirmar contraseña
- Al registrarse → crea `users/{uid}` en Firestore con `role: "user"`
- Link a `/login`
- Botón secundario "Continuar sin iniciar sesión" (ver comportamiento abajo)
- Si ya tiene sesión activa → redirige a `/`

### "Continuar sin iniciar sesión"
Botón de estilo secundario (sin relleno, texto simple) en la parte inferior de ambas páginas.

```
Si el parámetro redirect apunta a una ruta pública  →  vuelve a esa ruta
Si el parámetro redirect apunta a una ruta protegida →  redirige a /
Sin parámetro redirect                               →  redirige a /
```

El usuario puede usar libremente `/`, `/mapa` y `/comercio/:id`.
Si intenta acceder a `/perfil` o `/registro-comercio` de nuevo, vuelve a ver el login.

---

## Navbar — comportamiento por estado

| Estado | Elementos visibles |
|---|---|
| Sin sesión | Inicio · Mapa · **[Ingresar]** |
| Sesión activa (rol user) | Inicio · Mapa · Mi Perfil · **Hola, {nombre} ▾** (dropdown: Mi Perfil, Cerrar sesión) |
| Sesión activa (rol admin) | Inicio · Mapa · Mi Perfil · Admin · **Hola, {nombre} ▾** (dropdown: Mi Perfil, Cerrar sesión) |

El link a `/admin` **solo aparece** si `userRole === "admin"`. Usuarios con rol `"user"` nunca ven esa opción.

---

## Flujo de registro

### Email/contraseña
1. Firebase Auth crea la cuenta
2. Firestore crea `users/{uid}` con `role: "user"`, `createdAt: serverTimestamp()`
3. AuthContext actualiza `currentUser` y `userRole`
4. Redirige al destino original (parámetro `redirect`) o a `/`

### OAuth (Google / Apple / Facebook)
1. Firebase Auth maneja el popup del provider
2. Se verifica si `users/{uid}` ya existe en Firestore
3. Si no existe → se crea (primer login con OAuth)
4. Si existe → se actualiza `lastLogin`
5. AuthContext actualiza `currentUser` y `userRole`
6. Redirige al destino original o a `/`

---

## Redirect inteligente

```
Usuario sin sesión intenta entrar a /perfil
  → redirige a /login?redirect=/perfil
  → usuario se autentica
  → app lee el parámetro redirect
  → redirige a /perfil automáticamente
```

---

## Manejo de errores

### Errores de Firebase → mensajes en español

| Código Firebase | Mensaje mostrado |
|---|---|
| `auth/email-already-in-use` | "Ya existe una cuenta con ese email" |
| `auth/wrong-password` | "Email o contraseña incorrectos" |
| `auth/user-not-found` | "Email o contraseña incorrectos" |
| `auth/weak-password` | "La contraseña debe tener al menos 6 caracteres" |
| `auth/popup-closed-by-user` | (silencioso) |
| `auth/network-request-failed` | "Error de conexión. Revisá tu internet" |

`auth/wrong-password` y `auth/user-not-found` muestran el mismo mensaje por seguridad (no se revela si el email existe).

---

## Logout

```
signOut()
  → limpia currentUser y userRole en AuthContext
  → redirige a / (Home)
  → el perfil en localStorage se mantiene intacto
    (la Fase 2 decide qué hacer con esos datos)
```

---

## Nota sobre OAuth en producción

Google, Apple y Facebook requieren configuración en Firebase Console y cuentas de developer externas. El código queda listo en esta fase, pero los providers deben activarse manualmente en el panel de Firebase antes de usarlos en producción.

---

## Fuera de scope (Fase 1)

- Migración del perfil (nombre + restricciones) de `localStorage` a Firestore → Fase 2
- Migración de comercios de `mockData.js` a Firestore → Fase 2
- Subida de documentación (certificados/fotos) → Fase 3
- Firebase Hosting / deploy → Fase 3
