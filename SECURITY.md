# Seguridad de MapaApto — Estado final

## 1. HTTPS

Firebase Hosting sirve la app **exclusivamente por HTTPS**. Todos los datos viajan cifrados en tránsito.

---

## 2. Contraseñas (Hash)

Las contraseñas nunca tocan el frontend. Firebase Authentication las hashea con **bcrypt** en servidores de Google. Soporta email/contraseña, Google, Apple y Facebook OAuth.

---

## 3. Autenticación con JWT

Firebase devuelve un **token JWT** firmado tras el login, usado en cada request a Firestore y Storage. Expira automáticamente y se renueva en segundo plano.

---

## 4. Firebase App Check

Cada request a Firebase lleva un token firmado por Google que certifica que viene de la app real. Requests desde scripts, bots o Postman son rechazados aunque tengan las credenciales de Firebase. Implementado con **reCAPTCHA Enterprise**.

| API | Estado |
|---|---|
| Cloud Firestore | Aplicada |
| Storage | Aplicada |
| Authentication | Supervisión (versión preliminar) |

---

## 5. Protección de rutas (frontend)

| Componente | Rutas protegidas | Condición |
|---|---|---|
| `PrivateRoute` | `/perfil`, `/registro-comercio`, `/mi-comercio` | Usuario autenticado |
| `AdminRoute` | `/admin` | Autenticado + `role === 'admin'` |

---

## 6. Reglas de Firestore

### `businesses`

- **Crear**: solo autenticado con `ownerId == uid` propio
- **Editar (dueño)**: restringido a campos de contenido — `name`, `address`, `phone`, `description`, `tags`, `certifications`, `socialLinks`, `openingHours`, `photoUrls`, `menuFileUrl`, `certFileUrls`, `lat`, `lng`
- **Editar** `verified` / `pending` / `status`: solo admin
- **Editar** `rating`: solo autenticado + valor entre 0–5 o `null`
- **Eliminar**: admin o dueño

### `reviews` (subcolección)

Solo el autor puede escribir y eliminar su propia reseña.

### `users`

- No se puede crear una cuenta con `role: 'admin'`
- El usuario no puede cambiar su propio `role`
- Cambio de rol: solo admin
- Leer: solo el propio usuario

### `favorites` (subcolección)

Solo el propio usuario puede leer y escribir sus favoritos.

---

## 7. Reglas de Storage

| Carpeta | Leer | Escribir |
|---|---|---|
| `/fotos/{businessId}/` | Público | Dueño verificado en Firestore + JPEG/PNG/WebP ≤ 5 MB |
| `/menus/{businessId}/` | Público | Dueño verificado en Firestore + PDF/JPEG/PNG ≤ 5 MB |
| `/certificados/{businessId}/` | Público | Dueño verificado en Firestore + PDF/JPEG/PNG ≤ 10 MB |

Tipo MIME y tamaño máximo validados en el servidor (no solo en el cliente).

---

## 8. Headers de seguridad HTTP

Configurados en `firebase.json` y aplicados por Firebase Hosting en todas las respuestas.

| Header | Protege contra |
|---|---|
| `Content-Security-Policy` | XSS — whitelist de dominios para scripts, estilos, imágenes y conexiones |
| `X-Content-Type-Options: nosniff` | MIME sniffing |
| `X-Frame-Options: DENY` | Clickjacking |
| `Referrer-Policy` | Filtración de URLs internas a sitios externos |
| `Permissions-Policy` | Geolocation solo desde la app; cámara y micrófono bloqueados |
