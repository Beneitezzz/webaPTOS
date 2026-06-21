---
title: Motivo de suspensión en panel de admin
date: 2026-06-21
status: approved
---

# Motivo de suspensión — Diseño

## Contexto

El panel de administración (`AdminPanel.jsx`) ya tiene un flujo de rechazo con motivo obligatorio (mínimo 10 caracteres), validación visible y envío de email al dueño. La suspensión actualmente solo pide confirmación sin motivo ni notificación. Esta feature replica el patrón de rechazo para la suspensión.

## Cambios por archivo

### `src/views/pages/AdminPanel.jsx`

- Agregar estado `suspendReason` (string vacío, resetear al cancelar/confirmar).
- El bloque `.suspend-confirm` pasa a incluir:
  - Un textarea con placeholder descriptivo.
  - Un mensaje de error visible (`"Mínimo 10 caracteres"`) que aparece cuando el admin intenta confirmar con menos de 10 caracteres (no simplemente deshabilitar el botón).
  - El botón "Confirmar suspensión" llama `suspendBusiness(b.id, suspendReason.trim())` y luego `sendSuspensionEmail({ businessName, ownerEmail, reason })`.
  - Toast de éxito al completar.

### `src/services/businessService.js`

- `suspendBusiness(id, reason)` — agrega el parámetro `reason` y lo escribe en Firestore como `suspensionReason`.

### `src/utils/emailService.js`

- Nueva función `sendSuspensionEmail({ businessName, ownerEmail, reason })`.
- Lee `VITE_EMAILJS_TEMPLATE_SUSPENSION` del env.
- Mismo patrón de no-op en dev o si faltan vars de entorno.

## Validación

- Mínimo 10 caracteres (igual que rechazo).
- Mensaje de error visible al intentar confirmar sin cumplir el mínimo.

## Datos en Firestore

El documento del comercio queda con:
```
status: 'suspendido'
verified: false
pending: false
suspensionReason: "<motivo ingresado>"
```

## Variables de entorno requeridas

- `VITE_EMAILJS_TEMPLATE_SUSPENSION` — ID del template de EmailJS para suspensión.

## Lo que NO cambia

- El flujo de rechazo no se toca.
- No hay modal ni overlay nuevo.
- No se agrega ningún estado global.
