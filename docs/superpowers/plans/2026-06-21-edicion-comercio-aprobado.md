# Edición de ficha para comercios aprobados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que dueños de comercios `aprobado` editen su ficha sin revisión, excepto cuando cambian certificaciones, caso en que el comercio vuelve a `pendiente`.

**Architecture:** Se extiende `useBusinessForm` para detectar el modo "edición de aprobado", snapshotear las certs originales y bifurcar el submit. `MiComercio` recibe un botón "Editar datos" y `RegistroComercio` muestra banners y textos diferenciados según el modo.

**Tech Stack:** React 19, Vite, Firebase Firestore, react-router-dom v6, lucide-react

## Global Constraints

- Sin test runner — verificación manual en el browser con `npm run dev`
- UI en español
- Sin frameworks CSS — plain CSS con convenciones BEM existentes (`.btn`, `.btn-primary`, `.btn-outline`, `.card`, etc.)
- No crear archivos nuevos — solo modificar los tres archivos listados

---

### Task 1: Extender `useBusinessForm` para modo "edición aprobado"

**Files:**
- Modify: `src/hooks/useBusinessForm.js`

**Interfaces:**
- Produces:
  - `editingApprovedBusiness: boolean` — true cuando el comercio cargado tiene `status === 'aprobado'`
  - `certsChanged: boolean` — true cuando `form.certifications` difiere del snapshot original
  - Ambos expuestos en el `return` del hook

- [ ] **Step 1: Agregar estado y ref en el hook**

En `src/hooks/useBusinessForm.js`, dentro de `export function useBusinessForm()`, agregar después de la línea `const [submitted, setSubmitted] = useState(false)` (línea 51):

```js
const [editingApprovedBusiness, setEditingApprovedBusiness] = useState(false)
const initialCertificationsRef = useRef([])
```

`useRef` ya está importado en la línea 1 del archivo.

- [ ] **Step 2: Permitir que comercios `aprobado` entren al form**

En el `useEffect` que carga el negocio existente (alrededor de la línea 108), localizar:

```js
    if (existing.status !== 'rechazado') {
      navigate('/mi-comercio', { replace: true })
      return
    }
```

Reemplazar por:

```js
    if (existing.status !== 'rechazado' && existing.status !== 'aprobado') {
      navigate('/mi-comercio', { replace: true })
      return
    }
    if (existing.status === 'aprobado') {
      setEditingApprovedBusiness(true)
      initialCertificationsRef.current = existing.certifications ?? []
    }
```

- [ ] **Step 3: Agregar `certsChanged` como valor derivado con `useMemo`**

Después de todos los `useState` y antes del primer `useEffect`, agregar:

```js
const certsChanged = useMemo(() => {
  if (!editingApprovedBusiness) return false
  const cur = [...form.certifications].sort().join(',')
  const orig = [...initialCertificationsRef.current].sort().join(',')
  return cur !== orig
}, [editingApprovedBusiness, form.certifications])
```

`useMemo` ya está importado en la línea 1.

- [ ] **Step 4: Bifurcar la lógica de submit según el modo**

En `handleSubmit`, localizar el bloque `if (editingBusinessId)` (alrededor de la línea 283):

```js
      if (editingBusinessId) {
        await updateBusiness(editingBusinessId, {
          ...businessData,
          status: 'pendiente',
          pending: true,
          verified: false,
          rejectionReason: null,
        })
        businessId = editingBusinessId
```

Reemplazar por:

```js
      if (editingBusinessId) {
        if (editingApprovedBusiness) {
          const updateData = { ...businessData }
          if (certsChanged) {
            updateData.status = 'pendiente'
            updateData.pending = true
            updateData.verified = false
          }
          await updateBusiness(editingBusinessId, updateData)
        } else {
          await updateBusiness(editingBusinessId, {
            ...businessData,
            status: 'pendiente',
            pending: true,
            verified: false,
            rejectionReason: null,
          })
        }
        businessId = editingBusinessId
```

- [ ] **Step 5: Exponer los nuevos valores en el return del hook**

Al final del hook, en el objeto `return { ... }`, agregar:

```js
    editingApprovedBusiness,
    certsChanged,
```

- [ ] **Step 6: Verificar en browser**

```bash
npm run dev
```

Abrir `/registro-comercio` con un usuario sin comercio → debe funcionar como siempre (sin regresiones).

Abrir `/registro-comercio` con un usuario cuyo comercio es `aprobado` → debe cargar el form con los datos del comercio (ya no redirigir a `/mi-comercio`). En DevTools, agregar `console.log({ editingApprovedBusiness, certsChanged })` temporalmente en el hook para verificar valores.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useBusinessForm.js
git commit -m "feat: extend useBusinessForm to support editing approved businesses"
```

---

### Task 2: Botón "Editar datos" en `MiComercio`

**Files:**
- Modify: `src/views/pages/MiComercio.jsx`

**Interfaces:**
- Consumes: nada nuevo del hook (solo react-router `Link` ya importado)

- [ ] **Step 1: Agregar el botón junto al de "Ver ficha pública"**

En `src/views/pages/MiComercio.jsx`, localizar el bloque (alrededor de la línea 129):

```jsx
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
```

Reemplazar por:

```jsx
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {status === 'aprobado' && (
            <>
              <Link to={`/comercio/${myBusiness.id}`} className="btn btn-outline">
                Ver ficha pública
              </Link>
              <Link to="/registro-comercio" className="btn btn-primary">
                Editar datos
              </Link>
            </>
          )}
          {status === 'rechazado' && (
            <Link to="/registro-comercio" className="btn btn-primary">
              Corregir y re-enviar
            </Link>
          )}
        </div>
```

- [ ] **Step 2: Verificar en browser**

Navegar a `/mi-comercio` con un usuario cuyo comercio es `aprobado`. Debe aparecer "Ver ficha pública" y "Editar datos" lado a lado. Click en "Editar datos" → debe navegar a `/registro-comercio` y cargar el form con los datos del comercio.

- [ ] **Step 3: Commit**

```bash
git add src/views/pages/MiComercio.jsx
git commit -m "feat: add edit button to MiComercio for approved businesses"
```

---

### Task 3: Banner, aviso dinámico y textos diferenciados en `RegistroComercio`

**Files:**
- Modify: `src/views/pages/RegistroComercio.jsx`

**Interfaces:**
- Consumes:
  - `editingApprovedBusiness: boolean` — del hook (Task 1)
  - `certsChanged: boolean` — del hook (Task 1)
  - `editingBusinessId: string | null` — ya existía en el hook

- [ ] **Step 1: Desestructurar los nuevos valores del hook**

En `RegistroComercio.jsx`, localizar la desestructuración del hook (alrededor de línea 39):

```js
  const {
    form, certFiles, menuFile, existingMenuFileUrl, setExistingMenuFileUrl,
    menuFileError, newPhotos, existingPhotos, photoError,
    handleAddPhotos, removeNewPhoto, removeExistingPhoto,
    editingBusinessId, submitted, errors, coords,
    geocoding, geocodeError, geocodeId,
    handleChange, handleMarkerMove, handleMenuFile, handleCertFile,
    addSocialLink, updateSocialLink, removeSocialLink,
    updateHourField, toggleSecondShift, toggleTag, toggleCert,
    handleSubmit, onSuccessReset,
  } = useBusinessForm()
```

Reemplazar por:

```js
  const {
    form, certFiles, menuFile, existingMenuFileUrl, setExistingMenuFileUrl,
    menuFileError, newPhotos, existingPhotos, photoError,
    handleAddPhotos, removeNewPhoto, removeExistingPhoto,
    editingBusinessId, submitted, errors, coords,
    geocoding, geocodeError, geocodeId,
    editingApprovedBusiness, certsChanged,
    handleChange, handleMarkerMove, handleMenuFile, handleCertFile,
    addSocialLink, updateSocialLink, removeSocialLink,
    updateHourField, toggleSecondShift, toggleTag, toggleCert,
    handleSubmit, onSuccessReset,
  } = useBusinessForm()
```

- [ ] **Step 2: Actualizar la pantalla de éxito**

Localizar el bloque `if (submitted)` (alrededor de la línea 51):

```jsx
  if (submitted) {
    return (
      <div className="page page-centered">
        <div className="container container-sm success-screen">
          <CheckCircle size={64} className="success-icon" />
          <h1>{editingBusinessId ? '¡Re-envío exitoso!' : '¡Registro enviado!'}</h1>
          <p>
            {editingBusinessId
              ? 'Tu comercio fue re-enviado y está nuevamente en revisión. Te avisaremos cuando haya novedades.'
              : 'Tu comercio fue enviado para revisión. Una vez aprobado por un administrador, aparecerá en el mapa.'}
          </p>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            ¿Sos administrador?{' '}
            <a href="/admin" className="link">Ir al panel de administración</a> para aprobar el comercio.
          </p>
          <button className="btn btn-primary" onClick={onSuccessReset}>
            Registrar otro comercio
          </button>
        </div>
      </div>
    )
  }
```

Reemplazar por:

```jsx
  if (submitted) {
    let successTitle, successMessage
    if (editingApprovedBusiness) {
      if (certsChanged) {
        successTitle = '¡Cambios enviados!'
        successMessage = 'Tus certificaciones cambiaron, por lo que tu comercio volvió a revisión y dejará de aparecer en el mapa hasta ser aprobado nuevamente.'
      } else {
        successTitle = '¡Cambios guardados!'
        successMessage = 'Tu ficha fue actualizada y los cambios ya son visibles en el mapa.'
      }
    } else if (editingBusinessId) {
      successTitle = '¡Re-envío exitoso!'
      successMessage = 'Tu comercio fue re-enviado y está nuevamente en revisión. Te avisaremos cuando haya novedades.'
    } else {
      successTitle = '¡Registro enviado!'
      successMessage = 'Tu comercio fue enviado para revisión. Una vez aprobado por un administrador, aparecerá en el mapa.'
    }

    return (
      <div className="page page-centered">
        <div className="container container-sm success-screen">
          <CheckCircle size={64} className="success-icon" />
          <h1>{successTitle}</h1>
          <p>{successMessage}</p>
          {!editingApprovedBusiness && (
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              ¿Sos administrador?{' '}
              <a href="/admin" className="link">Ir al panel de administración</a> para aprobar el comercio.
            </p>
          )}
          {!editingApprovedBusiness && (
            <button className="btn btn-primary" onClick={onSuccessReset}>
              Registrar otro comercio
            </button>
          )}
        </div>
      </div>
    )
  }
```

- [ ] **Step 3: Agregar banner informativo al tope del form**

En el JSX del return principal, localizar:

```jsx
        <form onSubmit={handleSubmit} className="card form-card">
          <div className="form-group">
            <label className="form-label">Nombre del comercio *</label>
```

Reemplazar por:

```jsx
        <form onSubmit={handleSubmit} className="card form-card">
          {editingApprovedBusiness && (
            <div className="info-banner info-banner--edit" style={{ marginBottom: '1.5rem' }}>
              <strong>Estás editando tu ficha.</strong>
              {' '}Los cambios se aplican de inmediato. Si modificás las certificaciones, tu comercio volverá a revisión y dejará de aparecer en el mapa hasta ser aprobado nuevamente.
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Nombre del comercio *</label>
```

- [ ] **Step 4: Agregar aviso dinámico cerca de la sección de certificaciones**

Localizar el bloque de certificaciones:

```jsx
          <div className="form-group">
            <label className="form-label">Certificaciones que posee *</label>
            {errors.certifications && <span className="form-error">{errors.certifications}</span>}
```

Reemplazar por:

```jsx
          <div className="form-group">
            <label className="form-label">Certificaciones que posee *</label>
            {errors.certifications && <span className="form-error">{errors.certifications}</span>}
            {editingApprovedBusiness && certsChanged && (
              <div className="cert-review-warning">
                ⚠️ Modificaste las certificaciones — al guardar, tu comercio pasará a revisión y dejará de ser visible en el mapa.
              </div>
            )}
```

- [ ] **Step 5: Actualizar texto del botón submit**

Localizar:

```jsx
          <button type="submit" className="btn btn-primary btn-full" disabled={geocoding}>
            {geocoding
              ? 'Verificando ubicación...'
              : editingBusinessId
              ? 'Re-enviar para verificación'
              : 'Enviar para verificación'}
          </button>
```

Reemplazar por:

```jsx
          <button type="submit" className="btn btn-primary btn-full" disabled={geocoding}>
            {geocoding
              ? 'Verificando ubicación...'
              : editingApprovedBusiness
              ? certsChanged
                ? 'Guardar y enviar a revisión'
                : 'Guardar cambios'
              : editingBusinessId
              ? 'Re-enviar para verificación'
              : 'Enviar para verificación'}
          </button>
```

- [ ] **Step 6: Agregar estilos para los nuevos elementos**

En `src/index.css`, al final del archivo, agregar:

```css
.info-banner--edit {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.cert-review-warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
  border-radius: 6px;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}
```

- [ ] **Step 7: Verificar flujo completo en browser**

```bash
npm run dev
```

**Caso 1 — Edición sin cambio de certs:**
1. Loguear como dueño de un comercio `aprobado`
2. Ir a `/mi-comercio` → verificar que aparece botón "Editar datos"
3. Click "Editar datos" → verificar que el form carga con datos del comercio y muestra el banner azul
4. Cambiar el nombre o el teléfono sin tocar certificaciones
5. Verificar que el botón dice "Guardar cambios" (sin aviso amarillo)
6. Guardar → pantalla de éxito dice "¡Cambios guardados! Tu ficha fue actualizada..."
7. Navegar a `/comercio/:id` → verificar que el nombre/teléfono nuevo se ve en la ficha pública

**Caso 2 — Edición con cambio de certs:**
1. Desde `/mi-comercio`, click "Editar datos"
2. En la sección de certificaciones, marcar o desmarcar una
3. Verificar que aparece el aviso amarillo ⚠️
4. Verificar que el botón dice "Guardar y enviar a revisión"
5. Guardar → pantalla de éxito dice "¡Cambios enviados! Tus certificaciones cambiaron..."
6. En Firestore o en el panel admin, verificar que el comercio tiene `status: 'pendiente'`
7. Ir al mapa → verificar que el comercio NO aparece

**Caso 3 — Regresión `rechazado`:**
1. Con un comercio `rechazado`, ir a `/registro-comercio`
2. Verificar que NO aparece el banner azul
3. Guardar → comportamiento actual (estado pendiente, mensaje "¡Re-envío exitoso!")

- [ ] **Step 8: Commit**

```bash
git add src/views/pages/RegistroComercio.jsx src/index.css
git commit -m "feat: add edit mode UI for approved businesses in RegistroComercio"
```
