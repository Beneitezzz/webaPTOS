# Suspension Reason Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un motivo obligatorio (mínimo 10 caracteres) cuando el admin suspende un comercio, con validación visible y envío de email al dueño.

**Architecture:** Se replica el patrón exacto del flujo de rechazo ya existente. Tres archivos modificados: el service (agrega `reason` a `suspendBusiness`), el emailService (agrega `sendSuspensionEmail`), y el AdminPanel (agrega estado + textarea + validación + llamadas).

**Tech Stack:** React 19, Firebase Firestore, EmailJS (`@emailjs/browser`)

## Global Constraints

- UI en español
- Mínimo 10 caracteres para el motivo (igual que rechazo)
- Mensaje de error visible al intentar confirmar sin cumplir el mínimo (no solo deshabilitar el botón)
- No-op en dev y si faltan vars de entorno (mismo patrón emailService existente)
- Seguir convenciones CSS existentes (clases `.reject-reason-form`, `.form-textarea`, etc.)

---

### Task 1: Actualizar `suspendBusiness` en el service

**Files:**
- Modify: `src/services/businessService.js:47-50`

**Interfaces:**
- Produces: `suspendBusiness(id: string, reason: string): Promise<void>` — escribe `suspensionReason` en Firestore

- [ ] **Step 1: Modificar la función `suspendBusiness`**

Reemplazar:
```js
export const suspendBusiness = (id) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false, pending: false, status: 'suspendido',
  })
```

Por:
```js
export const suspendBusiness = (id, reason) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false, pending: false, status: 'suspendido', suspensionReason: reason,
  })
```

- [ ] **Step 2: Commit**

```bash
git add src/services/businessService.js
git commit -m "feat: add reason param to suspendBusiness"
```

---

### Task 2: Agregar `sendSuspensionEmail` al emailService

**Files:**
- Modify: `src/utils/emailService.js`

**Interfaces:**
- Consumes: `emailjs.send`, `SERVICE_ID`, `PUBLIC_KEY` (ya definidos en el archivo)
- Produces: `sendSuspensionEmail({ businessName: string, ownerEmail: string, reason: string }): Promise<void>`

- [ ] **Step 1: Agregar la variable de template al inicio del archivo**

Después de `const TEMPLATE_RECHAZO = import.meta.env.VITE_EMAILJS_TEMPLATE_RECHAZO` agregar:
```js
const TEMPLATE_SUSPENSION = import.meta.env.VITE_EMAILJS_TEMPLATE_SUSPENSION
```

- [ ] **Step 2: Agregar la función `sendSuspensionEmail` al final del archivo**

```js
// Sends suspension email with reason. No-ops if env vars not configured or in dev.
export async function sendSuspensionEmail({ businessName, ownerEmail, reason }) {
  if (import.meta.env.DEV) return
  if (!SERVICE_ID || !PUBLIC_KEY || !TEMPLATE_SUSPENSION || !ownerEmail) return
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_SUSPENSION,
    { business_name: businessName, to_email: ownerEmail, suspension_reason: reason },
    PUBLIC_KEY,
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/emailService.js
git commit -m "feat: add sendSuspensionEmail utility"
```

---

### Task 3: Actualizar AdminPanel — estado, textarea, validación y llamadas

**Files:**
- Modify: `src/views/pages/AdminPanel.jsx`

**Interfaces:**
- Consumes: `suspendBusiness(id, reason)` (Task 1), `sendSuspensionEmail(...)` (Task 2)

- [ ] **Step 1: Agregar import de `sendSuspensionEmail`**

En la línea 6, cambiar:
```js
import { sendApprovalEmail, sendRejectionEmail } from '../../utils/emailService'
```
Por:
```js
import { sendApprovalEmail, sendRejectionEmail, sendSuspensionEmail } from '../../utils/emailService'
```

- [ ] **Step 2: Agregar estado `suspendReason`**

Después de la línea `const [suspendingId, setSuspendingId] = useState(null)` (línea 15), agregar:
```js
const [suspendReason, setSuspendReason] = useState('')
const [suspendReasonError, setSuspendReasonError] = useState(false)
```

- [ ] **Step 3: Reemplazar el bloque `.suspend-confirm`**

Reemplazar el bloque completo (líneas 261-283):
```jsx
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
```

Por:
```jsx
{suspendingId === b.id && (
  <div className="suspend-confirm">
    <p>
      ¿Confirmás la suspensión de <strong>{b.name}</strong>?
      El comercio dejará de aparecer en el mapa inmediatamente.
    </p>
    <div className="reject-reason-form">
      <label className="form-label">Motivo de la suspensión *</label>
      <textarea
        className="form-textarea"
        rows={3}
        placeholder="Explicá por qué se suspende este comercio (mínimo 10 caracteres)..."
        value={suspendReason}
        onChange={(e) => { setSuspendReason(e.target.value); setSuspendReasonError(false) }}
      />
      {suspendReasonError && (
        <p className="form-error">El motivo debe tener al menos 10 caracteres.</p>
      )}
      <div className="reject-reason-actions">
        <button
          className="btn btn-danger btn-sm"
          onClick={async () => {
            if (suspendReason.trim().length < 10) {
              setSuspendReasonError(true)
              return
            }
            setActionError(null)
            try {
              await suspendBusiness(b.id, suspendReason.trim())
              await sendSuspensionEmail({
                businessName: b.name,
                ownerEmail: b.ownerEmail ?? null,
                reason: suspendReason.trim(),
              })
              setSuspendingId(null)
              setSuspendReason('')
              setSuspendReasonError(false)
              showToast(`Suspensión de "${b.name}" aplicada correctamente.`)
            } catch {
              setActionError('Error al suspender. Intentá de nuevo.')
            }
          }}
        >
          Confirmar suspensión
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => { setSuspendingId(null); setSuspendReason(''); setSuspendReasonError(false) }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Actualizar el botón "Suspender/Cancelar" para resetear el reason al cancelar**

En el onClick del botón de suspender (el que alterna `suspendingId`), cambiar:
```jsx
onClick={() => setSuspendingId(suspendingId === b.id ? null : b.id)}
```
Por:
```jsx
onClick={() => {
  if (suspendingId === b.id) {
    setSuspendingId(null)
    setSuspendReason('')
    setSuspendReasonError(false)
  } else {
    setSuspendingId(b.id)
    setSuspendReason('')
    setSuspendReasonError(false)
  }
}}
```

- [ ] **Step 5: Verificar manualmente en el navegador**

Ejecutar `npm run dev` y verificar:
- El botón "Suspender" muestra el textarea.
- Intentar confirmar con menos de 10 chars → aparece mensaje de error.
- Completar con 10+ chars → confirma sin error, muestra toast.
- Cancelar → limpia el textarea y oculta el form.

- [ ] **Step 6: Commit**

```bash
git add src/views/pages/AdminPanel.jsx
git commit -m "feat: add suspension reason form with validation and email notification"
```
