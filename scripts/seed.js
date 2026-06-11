/* global process */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { mockBusinesses } from '../src/data/mockData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8')
)

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()

async function seed() {
  const force = process.argv.includes('--force')
  const col = db.collection('businesses')
  const snapshot = await col.limit(1).get()

  if (!snapshot.empty) {
    if (!force) {
      console.log('Ya existen comercios en Firestore. Seed omitido.')
      console.log('Usá --force para borrar los datos existentes y re-seedear.')
      process.exit(0)
    }
    const allDocs = await col.get()
    const deleteBatch = db.batch()
    allDocs.docs.forEach((d) => deleteBatch.delete(d.ref))
    await deleteBatch.commit()
    console.log(`Borrados ${allDocs.size} comercios existentes.`)
  }

  const batch = db.batch()
  for (const { id: _id, ...business } of mockBusinesses) {
    const ref = col.doc()
    batch.set(ref, {
      ...business,
      ownerId: null,
      createdAt: Timestamp.now(),
    })
  }

  await batch.commit()
  console.log(`Seed completado: ${mockBusinesses.length} comercios creados.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Error en seed:', err.message)
  process.exit(1)
})
