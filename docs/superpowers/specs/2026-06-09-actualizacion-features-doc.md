---
name: actualizacion-features-doc
description: Spec de implementación de features faltantes según el documento "Punto Sano - Actualización Página Web" (Universidad Siglo 21, junio 2026)
metadata:
  type: project
---

# Spec: Actualización de features según documento Punto Sano

**Fuente:** `docs/actualizacion pagina web.docx.pdf`
**Fecha:** 2026-06-09

## Contexto

La app MapaApto (React + Vite + Firebase) tiene implementado: autenticación completa (Firebase Auth), Firestore para comercios, Storage para certificados, mapa con filtros, registro de comercios con geocoding y panel de admin con aprobar/rechazar.

El documento universitario define requerimientos funcionales y no funcionales que la app aún no cubre completamente. Este spec cubre todos los gaps detectados.

---

## Features a implementar

### 1. Barra de búsqueda (RF-B04)

**Qué:** Input en el sidebar del mapa que filtra comercios por nombre, dirección o tipo de establecimiento.

**Dónde:** `src/pages/Mapa.jsx`

**Comportamiento:**
- Filtro inmediato sobre el array `filtered` ya existente (no requiere llamada a Firestore)
- Case-insensitive, sin diacríticos (normalizar con `.normalize('NFD')`)
- Se combina con los filtros de restricción y tipo existentes (AND)
- Al limpiar filtros, el search también se limpia

---

### 2. Geolocalización del usuario (RF-B01)

**Qué:** Botón "Centrar en mi ubicación" en el mapa que mueve el viewport y muestra un marcador azul en la posición del usuario.

**Dónde:** `src/components/MapView.jsx`

**Comportamiento:**
- Usa `navigator.geolocation.getCurrentPosition()`
- Si el navegador niega el permiso, muestra un mensaje de error breve
- El marcador del usuario es visualmente distinto a los marcadores de comercios (círculo azul estándar de Leaflet)
- El botón está superpuesto sobre el mapa (FAB, bottom-right)

---

### 3. Social links en ficha de comercio (RF-B09 / RF-B10)

**Qué:** Botones de Instagram y sitio web en `DetalleComercio`, visibles solo si el comercio los tiene cargados.

**Dónde:** `src/pages/DetalleComercio.jsx`

**Comportamiento:**
- `target="_blank" rel="noopener noreferrer"` para abrir en nueva pestaña / app nativa
- Se agregan al bloque de `contact-buttons` junto a WhatsApp y Llamar
- Solo se renderizan si `business.instagramUrl` / `business.websiteUrl` tienen valor

---

### 4. Social links en formulario de registro (RF-C06 / RF-C07)

**Qué:** Dos campos opcionales en `RegistroComercio`: URL de sitio web y URL de perfil de Instagram.

**Dónde:** `src/pages/RegistroComercio.jsx`

**Validación (RF-C07):**
- Regex de URL válida: debe empezar con `https://` o `http://`
- Para Instagram: debe contener `instagram.com/`
- Error inline si el formato no es válido al intentar enviar

**Estado del form:**
```js
initialForm = {
  ...camposExistentes,
  instagramUrl: '',
  websiteUrl: '',
}
```

**Al enviar:** se incluyen en `addBusiness()`. El `ownerEmail` se toma de `currentUser.email` (ya disponible vía `useAuth`) y se guarda en el documento.

---

### 5. Horarios estructurados + estado Abierto/Cerrado (RF-C04)

#### 5a. Modelo de datos

Nuevo campo `openingHours` en el documento de Firestore:

```js
openingHours: [
  { day: 'lunes',    open: '09:00', close: '20:00', closed: false },
  { day: 'martes',   open: '09:00', close: '20:00', closed: false },
  { day: 'miércoles', open: '09:00', close: '20:00', closed: false },
  { day: 'jueves',   open: '09:00', close: '20:00', closed: false },
  { day: 'viernes',  open: '09:00', close: '20:00', closed: false },
  { day: 'sábado',   open: '09:00', close: '13:00', closed: false },
  { day: 'domingo',  open: '00:00', close: '00:00', closed: true  },
]
```

El campo `hours` (string libre) se elimina del form. Los datos existentes en Firestore que solo tengan `hours` string mostrarán el estado como "Horario no disponible" sin romper la UI.

#### 5b. Utilidad — `src/utils/hours.js` (archivo nuevo)

```js
// Retorna true si el comercio está abierto ahora mismo
export function isOpenNow(openingHours): boolean

// Retorna string legible: "Lun–Vie: 9:00–20:00 | Sáb: 9:00–13:00 | Dom: Cerrado"
export function formatOpeningHours(openingHours): string
```

Lógica de `isOpenNow`: obtiene el día actual (0=domingo…6=sábado en JS, mapear al array), compara hora actual con `open` y `close`. No maneja franjas partidas (ej: 9–13 y 17–20); para eso el comercio debe crear dos entradas — fuera de scope MVP.

#### 5c. Formulario de registro — `src/pages/RegistroComercio.jsx`

Reemplazar el input `hours` por un componente de horario estructurado:

- 7 filas (una por día)
- Cada fila: checkbox "Cerrado ese día" + dos `<input type="time">` (apertura y cierre)
- Si "Cerrado" está marcado, los inputs de hora se deshabilitan
- Valor por defecto: Lun–Sab 09:00–20:00 abiertos, Dom cerrado

#### 5d. Visualización

- `DetalleComercio.jsx`: chip "Abierto ahora" (verde) o "Cerrado" (gris) debajo del nombre, y el horario formateado debajo
- `BusinessCard.jsx`: chip pequeño "Abierto" / "Cerrado" en la tarjeta del sidebar

---

### 6. Rechazo con motivo obligatorio + emails EmailJS (RF-A07 / RF-A08 / RF-A06)

#### 6a. Cambio de estado al rechazar

Actualmente `rejectBusiness` hace `deleteDoc`. Se cambia a `updateDoc` con:
```js
{ verified: false, pending: false, status: 'rechazado', rejectionReason: motivo }
```

Esto preserva el registro para auditoría y permite mostrar el motivo.

#### 6b. UI en AdminPanel

Al hacer clic en "Rechazar", se muestra un área de texto inline (dentro de la tarjeta del comercio pendiente) con campo obligatorio para el motivo. El botón "Confirmar rechazo" queda deshabilitado hasta que haya al menos 10 caracteres en el motivo.

#### 6c. EmailJS — `src/utils/emailService.js` (archivo nuevo)

```js
export async function sendApprovalEmail({ businessName, ownerEmail })
export async function sendRejectionEmail({ businessName, ownerEmail, reason })
```

Usa `@emailjs/browser`. Variables de entorno requeridas en `.env`:
```
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_APROBACION=
VITE_EMAILJS_TEMPLATE_RECHAZO=
VITE_EMAILJS_PUBLIC_KEY=
```

Los templates en EmailJS deben crearse manualmente por el equipo. Los emails se envían después de actualizar Firestore — si fallan, el estado ya se actualizó (fail-safe).

#### 6d. AppContext

```js
// Antes:
const approveBusiness = (id) => updateDoc(...)
const rejectBusiness = (id) => deleteDoc(...)

// Después:
const approveBusiness = (id, { businessName, ownerEmail }) => { updateDoc(...); sendApprovalEmail(...) }
const rejectBusiness = (id, reason, { businessName, ownerEmail }) => { updateDoc(...); sendRejectionEmail(...) }
```

---

### 7. Suspensión de comercios aprobados (RF-A09 / RF-A10)

#### 7a. Modelo de estado

```js
suspendBusiness = (id) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false,
    pending: false,
    status: 'suspendido',
  })
```

Los comercios suspendidos tienen `verified: false` → el filtro existente del mapa los excluye automáticamente (RF-A10 resuelto).

#### 7b. UI en AdminPanel

Nueva sección "Comercios aprobados" debajo de la cola de pendientes. Muestra lista de comercios con `status === 'aprobado'` (o `verified === true`). Cada uno tiene botón "Suspender" con confirmación inline.

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/pages/Mapa.jsx` | Search bar + limpiar al resetear filtros |
| `src/components/MapView.jsx` | FAB de geolocalización + marcador usuario |
| `src/pages/DetalleComercio.jsx` | Social links, chip abierto/cerrado, horarios formateados |
| `src/components/BusinessCard.jsx` | Chip abierto/cerrado |
| `src/pages/RegistroComercio.jsx` | Social links, horarios estructurados, ownerEmail |
| `src/pages/AdminPanel.jsx` | Modal rechazo con motivo, sección aprobados + suspensión |
| `src/context/AppContext.jsx` | approveBusiness/rejectBusiness actualizados, suspendBusiness nuevo |
| `src/data/mockData.js` | Campos nuevos en seed data |
| `src/index.css` | Estilos para todos los componentes nuevos |

## Archivos nuevos

| Archivo | Contenido |
|---|---|
| `src/utils/hours.js` | `isOpenNow()`, `formatOpeningHours()` |
| `src/utils/emailService.js` | `sendApprovalEmail()`, `sendRejectionEmail()` |

## Dependencia nueva

```
@emailjs/browser
```

## Requerimientos no funcionales cubiertos

- **RNF02 (Responsividad):** todos los componentes nuevos usan las clases CSS existentes del sistema de diseño, que ya son responsive.
- **RNF04 (Compatibilidad):** no se usan APIs experimentales. `navigator.geolocation` tiene soporte universal.
- **RNF01 (Rendimiento):** el search y los filtros son operaciones sobre arrays en memoria (sin llamadas a Firestore extra), sub-1ms en el volumen MVP.

## Fuera de scope

- Fotos de comercios (decisión explícita del equipo)
- Firebase Cloud Functions para emails (reemplazado por EmailJS desde el frontend)
- Franjas horarias partidas (ej. 9–13 y 17–20 en el mismo día)
- Configuración de cuenta EmailJS (requiere acción manual del equipo)
