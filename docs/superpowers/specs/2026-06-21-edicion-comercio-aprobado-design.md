# Spec: Edición de ficha para comercios aprobados

**Fecha:** 2026-06-21  
**Estado:** Aprobado

## Resumen

Permitir que el dueño de un comercio con status `aprobado` edite los datos de su ficha sin pasar por revisión, excepto cuando modifica las certificaciones, caso en que el comercio vuelve a estado `pendiente` y deja de aparecer en el mapa.

## Reglas de negocio

- Campos de edición libre (cambios inmediatos, sin revisión): nombre, tipo de establecimiento, dirección, teléfono, horarios, descripción, restricciones alimentarias, links sociales, fotos, menú.
- Campos que disparan re-revisión: certificaciones (agregar, quitar o cambiar archivos).
- Cuando los certs cambian: `status → 'pendiente'`, `pending → true`, `verified → false`. El comercio deja de aparecer en el mapa hasta nueva aprobación por admin.
- Cuando los certs NO cambian: `updateBusiness` sin tocar el status — el comercio sigue visible en el mapa.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/hooks/useBusinessForm.js` | Lógica principal |
| `src/views/pages/MiComercio.jsx` | Botón "Editar datos" |
| `src/views/pages/RegistroComercio.jsx` | Banner, aviso dinámico, textos |

## Cambios detallados

### `useBusinessForm.js`

1. **Permitir edición de comercios `aprobado`**: cambiar la condición de redirección de `status !== 'rechazado'` a `status !== 'rechazado' && status !== 'aprobado'`.

2. **Snapshot de certs originales**: agregar `initialCertificationsRef = useRef([])`. Al cargar un comercio existente, asignar `initialCertificationsRef.current = existing.certifications ?? []`.

3. **Flag de modo**: agregar `editingApprovedBusiness` (boolean derivado de `existing.status === 'aprobado'` al momento de cargar). Exponer en el return del hook.

4. **Flag de certs cambiadas**: `certsChanged` — comparar `form.certifications` con `initialCertificationsRef.current` (mismo conjunto de strings, orden no importa). Exponer en el return del hook.

5. **`handleSubmit` para `aprobado`**:
   ```
   if (editingBusinessId && editingApprovedBusiness) {
     if (certsChanged) {
       updateBusiness(id, { ...data, status: 'pendiente', pending: true, verified: false })
     } else {
       updateBusiness(id, { ...data })  // status no se toca
     }
   }
   // caso rechazado: comportamiento actual (siempre pendiente)
   ```

### `MiComercio.jsx`

Agregar botón "Editar datos" junto al botón "Ver ficha pública", visible solo cuando `status === 'aprobado'`:

```jsx
<Link to="/registro-comercio" className="btn btn-primary">
  Editar datos
</Link>
```

### `RegistroComercio.jsx`

El componente recibe `editingApprovedBusiness` y `certsChanged` del hook y los usa para:

1. **Banner informativo** (arriba del form, solo en modo edición aprobado):
   > "Estás editando tu ficha. Los cambios se aplican de inmediato. Si modificás las certificaciones, tu comercio volverá a revisión y dejará de aparecer en el mapa hasta ser aprobado nuevamente."

2. **Aviso dinámico de certs** (junto a la sección de certificaciones, solo cuando `certsChanged === true`):
   > ⚠️ "Modificaste las certificaciones — al guardar, tu comercio pasará a revisión y dejará de ser visible en el mapa."

3. **Texto del botón submit**:
   - `editingApprovedBusiness && !certsChanged` → `"Guardar cambios"`
   - `editingApprovedBusiness && certsChanged` → `"Guardar y enviar a revisión"`
   - `editingBusinessId && !editingApprovedBusiness` → `"Re-enviar para verificación"` (caso rechazado, actual)
   - Default → `"Enviar para verificación"`

4. **Pantalla de éxito** (`submitted === true`):
   - `editingApprovedBusiness && !certsChanged` → "¡Cambios guardados! Tu ficha fue actualizada."
   - `editingApprovedBusiness && certsChanged` → "Cambios enviados. Tu comercio está en revisión y dejará de aparecer en el mapa hasta ser aprobado."
   - Caso `rechazado` → texto actual ("¡Re-envío exitoso!")

## Flujo completo

```
Comercio aprobado → MiComercio → click "Editar datos"
  → /registro-comercio (hook carga datos del comercio)
  → Usuario edita campos
    → Si no toca certs: botón "Guardar cambios"
      → updateBusiness sin cambiar status → éxito inmediato
    → Si toca certs: aparece aviso ⚠️ + botón "Guardar y enviar a revisión"
      → updateBusiness + status pendiente → éxito con aviso de revisión
```

## Lo que NO cambia

- El flujo de `rechazado` → re-envío sigue igual.
- Los estados `pendiente` y `suspendido` no tienen edición habilitada.
- La lógica del admin panel no se toca.
