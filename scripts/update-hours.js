/* global process */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Helpers
const open  = (o, c, o2, c2) => ({ open: o, close: c, closed: false, ...(o2 ? { open2: o2, close2: c2 } : {}) })
const cerrado = { open: '00:00', close: '00:00', closed: true }

const h = (lun, mar, mie, jue, vie, sab, dom) => [
  { day: 'lunes',      ...lun },
  { day: 'martes',     ...mar },
  { day: 'miércoles',  ...mie },
  { day: 'jueves',     ...jue },
  { day: 'viernes',    ...vie },
  { day: 'sábado',     ...sab },
  { day: 'domingo',    ...dom },
]

// Nota: horarios con split (ej. 9-14 y 17-21) se unifican en un solo rango.
// Horarios que cierran pasada medianoche se recortan a 23:59.
const UPDATES = [
  {
    name: 'Lo de Jacinto SIN GLUTEN',
    // Todos los días: 12–4 p.m. y 8 p.m.–12 a.m.
    openingHours: h(open('12:00','23:59'), open('12:00','23:59'), open('12:00','23:59'),
                    open('12:00','23:59'), open('12:00','23:59'), open('12:00','23:59'), open('12:00','23:59')),
  },
  {
    name: 'Santa Calma',
    // 24 horas todos los días
    openingHours: h(open('00:00','23:59'), open('00:00','23:59'), open('00:00','23:59'),
                    open('00:00','23:59'), open('00:00','23:59'), open('00:00','23:59'), open('00:00','23:59')),
  },
  {
    name: 'La Sintaqueria SIN TACC',
    // Dom: cerrado · Lun: 17–20:30 · Mar-Sáb: 10–20
    openingHours: h(open('17:00','20:30'), open('10:00','20:00'), open('10:00','20:00'),
                    open('10:00','20:00'), open('10:00','20:00'), open('10:00','20:00'), cerrado),
  },
  {
    name: 'AC Sin TACC Sin gluten',
    // Dom: cerrado · Lun-Vie: 8–18 · Sáb: 8–13
    openingHours: h(open('08:00','18:00'), open('08:00','18:00'), open('08:00','18:00'),
                    open('08:00','18:00'), open('08:00','18:00'), open('08:00','13:00'), cerrado),
  },
  {
    name: 'La Gran Chipa',
    // Dom: cerrado · Lun-Vie: 8–19 · Sáb: 9–12:30
    openingHours: h(open('08:00','19:00'), open('08:00','19:00'), open('08:00','19:00'),
                    open('08:00','19:00'), open('08:00','19:00'), open('09:00','12:30'), cerrado),
  },
  {
    name: 'LEVELS',
    // Dom-Jue: 18–00 · Vie-Sáb: 18–3am (→ 23:59)
    openingHours: h(open('18:00','23:59'), open('18:00','23:59'), open('18:00','23:59'),
                    open('18:00','23:59'), open('18:00','23:59'), open('18:00','23:59'), open('18:00','23:59')),
  },
  {
    name: 'Antojitos libre de gluten',
    // Dom: cerrado · Lun-Sáb: 8:30–20
    openingHours: h(open('08:30','20:00'), open('08:30','20:00'), open('08:30','20:00'),
                    open('08:30','20:00'), open('08:30','20:00'), open('08:30','20:00'), cerrado),
  },
  {
    name: 'La Chipá',
    // Dom: 15:30–21 · Lun-Vie: 7:30–21 · Sáb: 8:30–21 (unificado)
    openingHours: h(open('07:30','21:00'), open('07:30','21:00'), open('07:30','21:00'),
                    open('07:30','21:00'), open('07:30','21:00'), open('08:30','21:00'), open('15:30','21:00')),
  },
  {
    name: 'La Franca – Panificación y Pastas sin TACC',
    // Dom: 17:30–21 · Lun: cerrado · Mar-Sáb: 17:30–21
    openingHours: h(cerrado, open('17:30','21:00'), open('17:30','21:00'),
                    open('17:30','21:00'), open('17:30','21:00'), open('17:30','21:00'), open('17:30','21:00')),
  },
  // ── Horarios cortados (actualizados con open2/close2) ──
  {
    name: 'AC SIN TACC',
    // Dom: cerrado · Lun-Sáb: 8–20
    openingHours: h(open('08:00','20:00'), open('08:00','20:00'), open('08:00','20:00'),
                    open('08:00','20:00'), open('08:00','20:00'), open('08:00','20:00'), cerrado),
  },
  {
    name: 'VIENTO DEL SOL – Tienda Orgánica Sin TACC',
    // Dom: 16–22 · Lun/Mar: cerrado · Mié-Jue: 17–21 · Vie: 17–22 · Sáb: 11–22:30 (unificado)
    openingHours: h(cerrado, cerrado, open('17:00','21:00'),
                    open('17:00','21:00'), open('17:00','22:00'), open('11:00','22:30'), open('16:00','22:00')),
  },
  {
    name: 'EntreSano – Bv. San Juan',
    // Dom: 10:30–19:30 · Lun-Vie: 8–23 · Sáb: 9–23
    openingHours: h(open('08:00','23:00'), open('08:00','23:00'), open('08:00','23:00'),
                    open('08:00','23:00'), open('08:00','23:00'), open('09:00','23:00'), open('10:30','19:30')),
  },
  {
    name: 'Panacea Bakery Gluten Free',
    // Dom: cerrado · Lun-Jue: 9–14 y 16–20 · Vie: 14–23:59 · Sáb: 12–14 y 16–20
    openingHours: h(open('09:00','14:00','16:00','20:00'), open('09:00','14:00','16:00','20:00'), open('09:00','14:00','16:00','20:00'),
                    open('09:00','14:00','16:00','20:00'), open('14:00','23:59'), open('12:00','14:00','16:00','20:00'), cerrado),
  },
  {
    name: 'La Casa del Celiaco',
    // Dom: cerrado · Lun-Vie: 9:30–13 y 16–19 · Sáb: 9:30–13
    openingHours: h(open('09:30','13:00','16:00','19:00'), open('09:30','13:00','16:00','19:00'), open('09:30','13:00','16:00','19:00'),
                    open('09:30','13:00','16:00','19:00'), open('09:30','13:00','16:00','19:00'), open('09:30','13:00'), cerrado),
  },
  {
    name: 'SIBARIS Restaurante',
    // Dom: cerrado · Lun-Vie: 12–16 y 20–23:59 · Sáb: 20–23:59
    openingHours: h(open('12:00','16:00','20:00','23:59'), open('12:00','16:00','20:00','23:59'), open('12:00','16:00','20:00','23:59'),
                    open('12:00','16:00','20:00','23:59'), open('12:00','16:00','20:00','23:59'), open('20:00','23:59'), cerrado),
  },
  {
    name: 'Cero Glut – Fábrica de alimentos sin gluten',
    // Lun-Sáb: 9–13:30 · Dom: cerrado
    openingHours: h(open('09:00','13:30'), open('09:00','13:30'), open('09:00','13:30'),
                    open('09:00','13:30'), open('09:00','13:30'), open('09:00','13:30'), cerrado),
  },
  {
    name: 'Mandarina',
    // Lun-Sáb: 9–21 (sin horario de cierre publicado) · Dom: cerrado
    openingHours: h(open('09:00','21:00'), open('09:00','21:00'), open('09:00','21:00'),
                    open('09:00','21:00'), open('09:00','21:00'), open('09:00','21:00'), cerrado),
  },
  {
    name: 'GLUTEN free – MARKET',
    // Dom: cerrado · Lun-Vie: 9:30–13 y 16:30–19:30 · Sáb: 9:30–13
    openingHours: h(open('09:30','13:00','16:30','19:30'), open('09:30','13:00','16:30','19:30'), open('09:30','13:00','16:30','19:30'),
                    open('09:30','13:00','16:30','19:30'), open('09:30','13:00','16:30','19:30'), open('09:30','13:00'), cerrado),
  },
]

async function run() {
  const col = db.collection('businesses')
  let updated = 0

  for (const { name, openingHours } of UPDATES) {
    const snap = await col.where('name', '==', name).get()
    if (snap.empty) {
      console.log(`⚠️  No encontrado: ${name}`)
      continue
    }
    for (const d of snap.docs) {
      await d.ref.update({ openingHours })
      console.log(`✓ ${name}`)
      updated++
    }
  }

  console.log(`\n✅ ${updated} comercios actualizados.`)
  process.exit(0)
}

run().catch((err) => { console.error(err.message); process.exit(1) })
