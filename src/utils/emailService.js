import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const TEMPLATE_APROBACION = import.meta.env.VITE_EMAILJS_TEMPLATE_APROBACION
const TEMPLATE_RECHAZO = import.meta.env.VITE_EMAILJS_TEMPLATE_RECHAZO
const TEMPLATE_SUSPENSION = import.meta.env.VITE_EMAILJS_TEMPLATE_SUSPENSION

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

// Sends rejection email with reason. No-ops if env vars not configured or in dev.
export async function sendRejectionEmail({ businessName, ownerEmail, reason }) {
  if (import.meta.env.DEV) return
  if (!SERVICE_ID || !PUBLIC_KEY || !TEMPLATE_RECHAZO || !ownerEmail) return
  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_RECHAZO,
    { business_name: businessName, to_email: ownerEmail, rejection_reason: reason },
    PUBLIC_KEY,
  )
}

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
