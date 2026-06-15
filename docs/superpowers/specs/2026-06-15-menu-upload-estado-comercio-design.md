# Diseño: Subida de menú y ficha de estado para comercios

**Fecha:** 2026-06-15  
**Estado:** Aprobado

---

## Resumen

Dos features nuevas orientadas al usuario con rol `comercio`:

1. **Subida de menú**: reemplaza la lista manual de productos por un campo de subida de archivo (PDF o imagen) en el formulario de registro.
2. **Ficha de estado en `/mi-comercio`**: página propia donde el comercio puede ver el estado de su negocio (pendiente, aprobado, rechazado, suspendido) y, si fue rechazado, corregir y re-enviar.

---

## Feature 1 — Subida de carta/menú

### Cambios en RegistroComercio

- Se elimina el campo `menu` (array de `{ name, price }`) del estado del formulario y del `initialForm`.
- Se elimina la sección de "Productos / Menú" con sus controles (`addMenuItem`, `updateMenuItem`, `removeMenuItem`).
- Se agrega un campo de subida de archivo:

```
Carta / menú  (opcional)
Subí una foto o PDF de tu carta. Máx. 5 MB.
[ 📎 Arrastrá o hacé clic para seleccionar — PDF · JPG · PNG ]
```

- Solo se acepta un archivo. Si el usuario selecciona uno, se muestra el nombre con un botón "× Quitar".
- No es campo obligatorio — si no se sube archivo, el negocio se guarda sin `menuFileUrl`.
- Validación: solo `application/pdf`, `image/jpeg`, `image/png`; tamaño máximo 5 MB. Error inline si no cumple.

### Upload a Firebase Storage

- Ruta: `menus/{businessId}/menu.{ext}` donde `ext` es la extensión del archivo original.
- El upload se hace **después** de crear el documento en Firestore (igual que los certificados).
- Si el upload tiene éxito, se hace `updateDoc` con `{ menuFileUrl: <downloadURL> }`.
- Si el upload falla, el negocio queda guardado sin `menuFileUrl` — se muestra un warning no bloqueante.

### Cambios en DetalleComercio

- Si `business.menuFileUrl` existe, se muestra un botón debajo de la descripción:

```
📄 Ver carta del menú   →   (abre en nueva pestaña)
```

- Si no existe, no se muestra nada en esa sección.

### Cambios en AppContext

- Al mapear documentos de Firestore, normalizar: `menuFileUrl: data.menuFileUrl ?? null`.
- El campo `menu` legacy en documentos existentes se ignora (no se muestra, no se borra).

---

## Feature 2 — Ficha de estado en /mi-comercio

### Ruta nueva

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/mi-comercio` | `MiComercio.jsx` | Solo rol `comercio` (guard existente en Navbar; redirigir a `/` si rol distinto) |

El link "Mi Comercio" del Navbar (actualmente apunta a `/registro-comercio`) se actualiza a `/mi-comercio`.

### Lógica de la página

Al montar, buscar en `businesses` (contexto, ya cargado vía `onSnapshot`) el primer documento donde `ownerId === currentUser.uid`.

**Caso: sin comercio registrado**

```
Todavía no registraste un comercio.
[ Registrar mi comercio → ]   ← link a /registro-comercio
```

**Caso: comercio encontrado → mostrar ficha de estado**

Siempre mostrar:
- Banner de estado (color + icono + texto según estado)
- Bloque resumen del comercio: nombre, tipo, dirección, teléfono, restricciones declaradas

Estado `pendiente`:
- Banner amarillo: "Pendiente de revisión — Tu comercio está siendo verificado. Te avisaremos por mail."
- Sin acciones.

Estado `aprobado`:
- Banner verde: "Comercio aprobado — Tu comercio ya aparece en el mapa."
- Link "Ver ficha pública" → `/comercio/{id}`.

Estado `rechazado`:
- Banner rojo: "Comercio rechazado"
- Motivo del rechazo (campo `rejectionReason` del documento).
- Botón "Corregir y re-enviar" → navega a `/registro-comercio` (ver flujo de re-envío abajo).

Estado `suspendido`:
- Banner gris: "Comercio suspendido — Tu comercio no aparece en el mapa. Contactá con el equipo de MapaApto."
- Sin acciones.

### Comportamiento de /registro-comercio según estado existente

Al montar, `RegistroComercio` busca en `businesses` si el usuario ya tiene un comercio (`ownerId === currentUser.uid`):

| Estado del doc existente | Comportamiento |
|--------------------------|----------------|
| Sin comercio | Muestra el formulario normal (flujo actual) |
| `pendiente` o `aprobado` | Redirige automáticamente a `/mi-comercio` |
| `rechazado` | Pre-carga el formulario en modo edición (flujo de re-envío) |
| `suspendido` | Redirige automáticamente a `/mi-comercio` |

### Flujo de re-envío (estado rechazado)

1. El usuario hace clic en "Corregir y re-enviar" en `/mi-comercio`.
2. Navega a `/registro-comercio` — la página detecta que el usuario tiene un comercio existente con `status === 'rechazado'` buscando en `businesses` por `ownerId`.
3. El formulario se pre-carga con los datos del documento existente (nombre, tipo, dirección, teléfono, horarios, descripción, tags, certifications, socialLinks). Si `menuFileUrl` existe, se muestra el nombre del archivo actual con opción de reemplazarlo.
4. El botón de submit muestra "Re-enviar para verificación" en lugar de "Enviar para verificación".
5. Al enviar: en vez de `addDoc`, se hace `updateDoc` sobre el documento existente, actualizando todos los campos del formulario más `{ status: 'pendiente', pending: true, verified: false, rejectionReason: null }`.
6. Los archivos de certificados se re-suben si el usuario los reemplazó; si no los tocó, los `certDocuments` existentes se preservan.
7. El archivo de menú: si el usuario sube uno nuevo, reemplaza el anterior en Storage y actualiza `menuFileUrl`. Si no toca el campo, el `menuFileUrl` existente se preserva.
8. Tras el re-envío exitoso, se muestra la pantalla de confirmación: "¡Re-envío enviado! Tu comercio está nuevamente en revisión."

---

## Archivos a modificar / crear

| Archivo | Cambio |
|---------|--------|
| `src/pages/RegistroComercio.jsx` | Eliminar sección `menu`; agregar campo de subida de menú; detectar re-envío (doc existente con `status='rechazado'`) y cambiar comportamiento de submit |
| `src/pages/MiComercio.jsx` | Nuevo componente — ficha de estado con 4 variantes |
| `src/components/Navbar.jsx` | Actualizar link "Mi Comercio": `/registro-comercio` → `/mi-comercio` |
| `src/App.jsx` | Agregar ruta `/mi-comercio` → `<MiComercio />` |
| `src/pages/DetalleComercio.jsx` | Agregar botón "Ver carta del menú" si `menuFileUrl` existe |
| `src/context/AppContext.jsx` | Normalizar `menuFileUrl` al mapear documentos |
| `src/index.css` | Estilos para: `.menu-upload-zone`, `.menu-file-selected`, `.mi-comercio-status-banner`, `.mi-comercio-card`, `.status-badge` |
