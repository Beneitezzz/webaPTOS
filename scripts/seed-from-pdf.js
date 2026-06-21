/* global process */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8')
)

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function geocode(address) {
  if (!address) return { lat: -31.4201 + (Math.random() - 0.5) * 0.04, lng: -64.1888 + (Math.random() - 0.5) * 0.04 }
  await sleep(1200)
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ' Argentina')}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'MapaApto-seed/1.0' } })
  const data = await res.json()
  if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  return { lat: -31.4201 + (Math.random() - 0.5) * 0.04, lng: -64.1888 + (Math.random() - 0.5) * 0.04 }
}

const DEFAULT_HOURS = [
  { day: 'lunes',     open: '09:00', close: '20:00', closed: false },
  { day: 'martes',    open: '09:00', close: '20:00', closed: false },
  { day: 'miércoles', open: '09:00', close: '20:00', closed: false },
  { day: 'jueves',    open: '09:00', close: '20:00', closed: false },
  { day: 'viernes',   open: '09:00', close: '20:00', closed: false },
  { day: 'sábado',    open: '09:00', close: '13:00', closed: false },
  { day: 'domingo',   open: '00:00', close: '00:00', closed: true  },
]

const PDF_BUSINESSES = [
  { name: 'La Sintaqueria SIN TACC',                       type: 'dietetica',    address: 'Crisol 14, Córdoba',                         tags: ['sin-tacc'],                                              rating: 4.8 },
  { name: 'Antojitos libre de gluten',                     type: 'dietetica',    address: 'Rondeau 640, Córdoba',                        tags: ['sin-tacc'],                                              rating: 4.6 },
  { name: 'Panacea Bakery Gluten Free',                    type: 'dietetica',    address: 'Buenos Aires 425, Córdoba',                   tags: ['sin-tacc', 'sin-lactosa'],                               rating: 4.0 },
  { name: 'La Chipá',                                      type: 'dietetica',    address: 'Rondeau 114, Córdoba',                        tags: ['sin-tacc'],                                              rating: 4.3 },
  { name: 'La Gran Chipa',                                 type: 'dietetica',    address: 'Gral. Simón Bolívar 37, Córdoba',             tags: ['sin-tacc', 'sin-lactosa'],                               rating: 4.7 },
  { name: 'AC SIN TACC',                                   type: 'restaurante',  address: 'Maestro Vidal 532, Córdoba',                  tags: ['sin-tacc'],                                              rating: 4.4 },
  { name: 'AC Sin TACC Sin gluten',                        type: 'restaurante',  address: 'Av. Duarte Quirós 53, Córdoba',               tags: ['sin-tacc'],                                              rating: 3.9 },
  { name: 'Lo de Jacinto SIN GLUTEN',                      type: 'restaurante',  address: 'Buenos Aires 811, Córdoba',                   tags: ['sin-tacc'],                                              rating: 4.6 },
  { name: 'La Franca – Panificación y Pastas sin TACC',    type: 'dietetica',    address: 'Santa Ana 2117, Córdoba',                     tags: ['sin-tacc'],                                              rating: 4.8 },
  { name: 'Angá Chipa',                                    type: 'cafe',         address: 'Emilio Lamarca 4096, Córdoba',                tags: ['sin-tacc'],                                              rating: 5.0 },
  { name: 'LEVELS',                                        type: 'restaurante',  address: 'Dr. T. Achaval Rodríguez 249, Córdoba',       tags: ['sin-tacc', 'apto-sibo'],                                 rating: 4.6 },
  { name: 'Santa Calma',                                   type: 'restaurante',  address: 'Deodoro Roca, Córdoba',                       tags: ['sin-tacc', 'apto-diabeticos'],                           rating: 4.7 },
  { name: 'Mandarina',                                     type: 'restaurante',  address: 'Obispo Trejo 171, Córdoba',                   tags: ['sin-tacc'],                                              rating: 4.1 },
  { name: 'SIBARIS Restaurante',                           type: 'restaurante',  address: 'Buenos Aires 214, Córdoba',                   tags: ['sin-tacc', 'apto-sibo'],                                 rating: 4.8 },
  { name: 'VIP Delicias',                                  type: 'dietetica',    address: 'Rivera Indarte 21, Córdoba',                  tags: ['sin-tacc'],                                              rating: 4.5 },
  { name: 'Dulce Miga – Pastelería libre de gluten',       type: 'dietetica',    address: 'Lima 816, Córdoba',                           tags: ['sin-tacc'],                                              rating: 4.8 },
  { name: 'Celiacor',                                      type: 'dietetica',    address: 'Justo José de Urquiza 1982, Córdoba',         tags: ['sin-tacc', 'sin-lactosa'],                               rating: 4.3 },
  { name: 'Cero Glut – Fábrica de alimentos sin gluten',  type: 'dietetica',    address: 'Av. Duarte Quirós 2743, Córdoba',             tags: ['sin-tacc'],                                              rating: 4.2 },
  { name: 'GLUTEN free – MARKET',                          type: 'dietetica',    address: 'Ovidio Lagos 195, Córdoba',                   tags: ['sin-tacc', 'sin-lactosa'],                               rating: 4.7 },
  { name: 'La Casa del Celiaco',                           type: 'dietetica',    address: 'Gral. Bernardo O\'Higgins 2896, Córdoba',     tags: ['sin-tacc', 'sin-lactosa'],                               rating: 4.5 },
  { name: 'Celisano comidas sin TACC',                     type: 'dietetica',    address: 'Av. Recta Martinolli 6973, Córdoba',          tags: ['sin-tacc'],                                              rating: 4.5 },
  { name: 'Mandala Cakes',                                 type: 'dietetica',    address: 'Obispo Salguero 479, Córdoba',                tags: ['sin-tacc', 'sin-lactosa'],                               rating: 4.7 },
  { name: 'De a Deveras Mercado y Café',                   type: 'cafe',         address: 'Obispo Salguero 599, Córdoba',                tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.6 },
  { name: 'EntreSano – Av. Colón',                         type: 'dietetica',    address: 'Av. Colón 376, Córdoba',                     tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa', 'apto-sibo'], rating: 4.5 },
  { name: 'EntreSano – Bv. San Juan',                      type: 'dietetica',    address: 'Blvd. San Juan 85, Córdoba',                  tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.6 },
  { name: 'EntreSano – Av. Estrada',                       type: 'supermercado', address: 'Juan José M. Estrada 174, Córdoba',           tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.5 },
  { name: 'EntreSano – Supermercado General Paz',          type: 'supermercado', address: 'Av. 24 de Septiembre 705, Córdoba',           tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.4 },
  { name: 'VIENTO DEL SOL – Tienda Orgánica Sin TACC',     type: 'dietetica',    address: 'Achával Rodríguez 260, Córdoba',              tags: ['sin-tacc', 'sin-lactosa', 'apto-sibo'],                  rating: 5.0 },
  { name: 'Tiendas Green',                                 type: 'dietetica',    address: 'Rondeau 26, Córdoba',                         tags: ['sin-tacc', 'sin-lactosa', 'apto-sibo'],                  rating: 4.4 },
  { name: 'Granola – Almacén Saludable',                   type: 'dietetica',    address: 'Obispo Oro 252, Córdoba',                     tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.5 },
  { name: 'CUOCA, RICO Y CHULO',                           type: 'cafe',         address: 'Rondeau 452, Córdoba',                        tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.3 },
  { name: 'Espacio Light',                                 type: 'dietetica',    address: 'Belgrano 183, Córdoba',                       tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.6 },
  { name: 'Punto Natural',                                 type: 'dietetica',    address: 'Blvd. San Juan 271, Córdoba',                 tags: ['sin-tacc', 'apto-diabeticos'],                           rating: 4.4 },
  { name: 'HÁBITOS',                                       type: 'dietetica',    address: 'Juan A. Lavalleja 45, Córdoba',               tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa', 'apto-sibo'], rating: 4.6 },
  { name: 'NATURAL MARKET',                                type: 'dietetica',    address: 'Blvd. San Juan 620, Córdoba',                 tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa', 'apto-sibo'], rating: 4.9 },
  { name: 'Mundo Verde',                                   type: 'dietetica',    address: 'Av. Emilio Olmos 189, Córdoba',               tags: ['sin-tacc', 'apto-diabeticos'],                           rating: 4.6 },
  { name: 'Dietetica Equilibrium',                         type: 'dietetica',    address: 'Av. Ciudad de Valparaíso 3091, Córdoba',      tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.5 },
  { name: 'TODO Libre De Gluten',                          type: 'dietetica',    address: null,                                          tags: ['sin-tacc'],                                              rating: 4.6, phone: '0351 315-6999' },
  { name: 'Mercado Natural Cofico',                        type: 'dietetica',    address: 'José Antonio de Sucre 1473, Córdoba',         tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.6 },
  { name: 'JENGI – Mercado consciente',                    type: 'dietetica',    address: 'Obispo Salguero 470, Córdoba',                tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa', 'apto-sibo'], rating: 4.8 },
  { name: 'Orgánica Almacén Saludable',                    type: 'dietetica',    address: 'Fray Mamerto Esquiú 134, Córdoba',            tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa', 'apto-sibo'], rating: 4.6 },
  { name: 'Dietética Amarillis',                           type: 'dietetica',    address: 'Santa Fe 1170, Córdoba',                      tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.8 },
  { name: 'Saludable Dietética',                           type: 'dietetica',    address: 'Av. Fuerza Aérea Argentina 2578, Córdoba',    tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.8 },
  { name: 'Don Almacén',                                   type: 'dietetica',    address: 'Rivadavia 580, Córdoba',                      tags: ['sin-tacc', 'apto-diabeticos'],                           rating: 4.2 },
  { name: 'SANTA ANA – natural [Mercado Norte]',           type: 'dietetica',    address: 'Rivadavia 535, Córdoba',                      tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.4 },
  { name: 'SANTA ANA – natural [Centro]',                  type: 'dietetica',    address: 'Gral. Paz 31, Córdoba',                       tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: null },
  { name: 'Apunto Almacén Saludable',                      type: 'dietetica',    address: 'Av. Pablo Ricchieri 3256, Córdoba',           tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.6 },
  { name: 'El Mercadito Natural',                          type: 'dietetica',    address: 'Friuli 1996, Córdoba',                        tags: ['sin-tacc', 'apto-diabeticos'],                           rating: 3.9 },
  { name: 'Veganus (sin tacc)',                            type: 'restaurante',  address: 'San Martín 799, Córdoba',                     tags: ['sin-tacc', 'sin-lactosa', 'apto-sibo'],                  rating: 5.0 },
  { name: 'Dietética (Buenos Aires)',                      type: 'dietetica',    address: 'Buenos Aires 480, Córdoba',                   tags: ['sin-tacc', 'apto-diabeticos', 'sin-lactosa'],            rating: 4.4 },
]

async function seed() {
  const col = db.collection('businesses')

  console.log(`Iniciando seed de ${PDF_BUSINESSES.length} comercios del PDF...`)
  console.log('Geocodificando direcciones via Nominatim (esto tarda ~1 min)...\n')

  const batch = db.batch()

  for (let i = 0; i < PDF_BUSINESSES.length; i++) {
    const b = PDF_BUSINESSES[i]
    process.stdout.write(`[${i + 1}/${PDF_BUSINESSES.length}] ${b.name}... `)

    const coords = await geocode(b.address)
    const ref = col.doc()
    batch.set(ref, {
      name: b.name,
      type: b.type,
      address: b.address ?? '',
      phone: b.phone ?? '',
      lat: coords.lat,
      lng: coords.lng,
      openingHours: DEFAULT_HOURS,
      description: '',
      tags: b.tags,
      certifications: [],
      socialLinks: [],
      verified: true,
      pending: false,
      status: 'aprobado',
      rating: b.rating ?? null,
      ownerId: null,
      ownerEmail: null,
      createdAt: Timestamp.now(),
    })

    console.log(`✓ (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`)
  }

  await batch.commit()
  console.log(`\n✅ Seed completado: ${PDF_BUSINESSES.length} comercios creados en Firestore.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Error en seed:', err.message)
  process.exit(1)
})
