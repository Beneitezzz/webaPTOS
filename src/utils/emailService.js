import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const TEMPLATE_APROBACION = import.meta.env.VITE_EMAILJS_TEMPLATE_APROBACION
const TEMPLATE_RECHAZO = import.meta.env.VITE_EMAILJS_TEMPLATE_RECHAZO

// Sends approval email to business owner. No-ops if env vars not configured or in dev.
export async function sendApprovalEmail({ businessName, ownerEmail }) {
  if (import.meta.env.DEV) return
  if (!SERVICE_ID || !PUBLIC_KEY || !TEMPLATE_APROBACION || !ownerEmail) return
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_APROBACION,
    { business_name: businessName, to_email: ownerEmail },
    PUBLIC_KEY,
  )
}

// Sends rejection or suspension email with reason. Uses the same template with an `accion` variable.
// No-ops if env vars not configured or in dev.
async function sendAdminActionEmail({ businessName, ownerEmail, accion, reason }) {
  if (import.meta.env.DEV) return
  if (!SERVICE_ID || !PUBLIC_KEY || !TEMPLATE_RECHAZO) return
  if (!ownerEmail) {
    console.warn('[emailService] sendAdminActionEmail: ownerEmail is empty for', businessName)
    return
  }
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_RECHAZO,
    { business_name: businessName, to_email: ownerEmail, accion, motivo: reason },
    PUBLIC_KEY,
  )
}

export const sendRejectionEmail = ({ businessName, ownerEmail, reason }) =>
  sendAdminActionEmail({ businessName, ownerEmail, accion: 'rechazado', reason })

export const sendSuspensionEmail = ({ businessName, ownerEmail, reason }) =>
  sendAdminActionEmail({ businessName, ownerEmail, accion: 'suspendido', reason })
