# Diseño: Mejoras UX — Registro por rol, Valoraciones, Links dinámicos

**Fecha:** 2026-06-14  
**Estado:** Aprobado

---

## Resumen

Cuatro cambios de UX para MapaApto:

1. Flujo de registro con selección de rol (usuario / comercio)
2. Navbar: mover "Ingresar" a la lista de links; ocultar "Soy Comercio" a usuarios sin rol `comercio`
3. Sistema de valoraciones con estrellas y comentarios opcionales en DetalleComercio
4. Campo dinámico de links de redes sociales en RegistroComercio

---

## 1. Flujo de registro con selección de rol

### Pantalla de selección (`/register/tipo`)

Nueva ruta que reemplaza la entrada al flujo de registro. Muestra dos tarjetas:

- **Soy usuario** — crea cuenta con rol `user`
- **Soy comercio** — crea cuenta con rol `comercio`

Al elegir, se navega a `/register?rol=user` o `/register?rol=comercio`. El query param `rol` persiste durante todo el flujo.

### Formulario de registro (`/register`)

El formulario existente se mantiene sin cambios visuales, excepto:

- Si `rol=comercio`, muestra un chip informativo: "Registrándote como comercio — completarás los datos de tu negocio al finalizar"
- Al crear la cuenta, `registerWithEmail` y `signInWithProvider` reciben el rol y lo guardan en Firestore (`users/{uid}.role`)
- Tras el registro exitoso: si `rol=comercio`, redirige a `/registro-comercio`; si no, redirige al destino habitual

### Rutas nuevas / modificadas

| Ruta | Descripción |
|------|-------------|
| `/register/tipo` | Nueva pantalla de selección de rol |
| `/register?rol=user\|comercio` | Formulario existente, con chip de contexto |

---

## 2. Navbar

### Cambios

- `PUBLIC_LINKS` pierde el ítem `"Soy Comercio"`
- Cuando el usuario **no está logueado**, se agrega `"Ingresar"` dentro de `navbar-links` manteniendo su estilo de botón (`btn btn-sm`) para darle visibilidad, reemplazando al botón actual que vive fuera de la lista
- Cuando el usuario tiene rol `comercio` o `admin`, se agrega `"Mi Comercio"` → `/registro-comercio` dentro de los links condicionales
- El botón "Ingresar" actual fuera de los links se elimina (reemplazado por el link dentro de la lista)

### Visibilidad por rol

| Elemento | Sin cuenta | `user` | `comercio` | `admin` |
|----------|-----------|--------|-----------|---------|
| Inicio | ✅ | ✅ | ✅ | ✅ |
| Explorar Mapa | ✅ | ✅ | ✅ | ✅ |
| Ingresar | ✅ | — | — | — |
| Mi Perfil | — | ✅ | ✅ | ✅ |
| Mi Comercio | — | — | ✅ | ✅ |
| Admin | — | — | — | ✅ |

---

## 3. Sistema de valoraciones

### Almacenamiento

Subcolección Firestore: `businesses/{businessId}/reviews/{reviewId}`

```
reviewId (auto)
  userId:    string
  userName:  string
  rating:    number  (1–5)
  comment:   string | null
  createdAt: timestamp
```

Un usuario puede dejar **una sola reseña por comercio**. El `reviewId` es el `userId`, lo que permite hacer un `getDoc` directo para detectar si ya existe una reseña y sobreescribirla con `setDoc` (sin merge).

### UI en DetalleComercio

Se agrega el componente `<ReviewsSection businessId={id} />` al pie de la página, después del menú y antes del disclaimer legal:

**Sección de resumen:**
- Promedio calculado en el cliente al cargar las reseñas
- Distribución de estrellas (barras horizontales por cada puntuación 1–5)
- Total de reseñas

**Lista de reseñas:**
- Nombre del usuario, estrellas, fecha relativa ("hace 2 días"), comentario (si existe)
- Ordenadas por `createdAt` descendente
- Si no hay reseñas: mensaje "Todavía no hay reseñas. ¡Sé el primero!"

**Formulario:**
- Solo visible para usuarios con rol `user`
- Si el usuario tiene rol `comercio`, `admin`, o no está logueado: se muestra aviso "Iniciá sesión como usuario para dejar una reseña" con link a `/login`
- Estrellas interactivas (hover + clic para seleccionar puntuación)
- Textarea opcional para comentario
- Botón "Publicar reseña" (deshabilitado si no se eligió puntuación)
- Si el usuario ya tiene reseña: el formulario pre-carga sus datos con botón "Actualizar reseña"

### Promedio en la card de detalle

El campo `business.rating` estático que ya existe se reemplaza por el promedio calculado dinámicamente desde las reseñas de Firestore. Si no hay reseñas, no se muestra el bloque de rating.

---

## 4. Links de redes sociales dinámicos

### En RegistroComercio

Los campos `instagramUrl` y `websiteUrl` se reemplazan por:

```js
// Estado del formulario
socialLinks: ['']  // array de strings, inicia con un campo vacío
```

**UI:**
- Un campo de texto (`type="url"`) por cada elemento del array
- El botón × aparece solo cuando hay más de un campo
- Botón "+ Agregar link" al pie agrega un string vacío al array
- Al hacer submit: se filtran los strings vacíos; cada URL se valida con `isValidUrl()` (ya existe en el componente)

**Validación:**
- URLs vacías se ignoran al guardar
- URLs no vacías deben ser `http://` o `https://` válidas
- Error inline por campo si la URL es inválida

**En Firestore** se guarda como:
```
socialLinks: ["https://instagram.com/...", "https://mitienda.com"]
```

### Migración de datos existentes

Al leer un negocio desde Firestore, si tiene `instagramUrl` o `websiteUrl` (campos legacy), se construye `socialLinks` combinándolos, sin modificar el documento. El campo legacy no se borra del documento.

```js
// En AppContext al mapear el documento:
const socialLinks = doc.socialLinks
  ?? [doc.instagramUrl, doc.websiteUrl].filter(Boolean)
```

### En DetalleComercio

Se reemplaza el bloque de botones de Instagram y Sitio Web por un loop sobre `business.socialLinks`. Cada link se muestra como un botón con ícono de globo (`Globe`) y el dominio como label (ej: `instagram.com`).

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Register.jsx` | Leer `?rol` del query param, mostrar chip, pasar rol a register functions |
| `src/context/AuthContext.jsx` | `registerWithEmail` y `signInWithProvider` aceptan `role` param |
| `src/App.jsx` | Agregar ruta `/register/tipo` → nuevo componente `SelectRol.jsx` |
| `src/pages/SelectRol.jsx` | Nuevo componente — pantalla de selección de rol |
| `src/components/Navbar.jsx` | Mover "Ingresar" a links; agregar "Mi Comercio" condicional; quitar "Soy Comercio" de PUBLIC_LINKS |
| `src/components/ReviewsSection.jsx` | Nuevo componente — resumen, lista y formulario de reseñas |
| `src/pages/DetalleComercio.jsx` | Montar `<ReviewsSection>`; reemplazar links legacy por `socialLinks` |
| `src/pages/RegistroComercio.jsx` | Reemplazar campos de Instagram/web por campo dinámico `socialLinks` |
| `src/context/AppContext.jsx` | Normalizar `socialLinks` al mapear documentos de Firestore |
