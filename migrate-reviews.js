/**
 * Migración de reseñas: businesses/{id}/reviews/{uid} → users/{uid}/reviews/{id}
 *
 * Pasos:
 *   1. Firebase console → Project settings → Service accounts → Generate new private key
 *   2. Guardar el archivo JSON como serviceAccountKey.json en esta misma carpeta
 *   3. npm install firebase-admin
 *   4. node migrate-reviews.js
 *   5. Borrar serviceAccountKey.json cuando termine
 */

import { readFileSync } from 'fs'
import admin from 'firebase-admin'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

async function migrate() {
  const businesses = await db.collection('businesses').get()
  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const biz of businesses.docs) {
    const businessId = biz.id
    const reviews = await db.collection('businesses').doc(businessId).collection('reviews').get()

    for (const rev of reviews.docs) {
      const userId = rev.id
      const data = rev.data()

      const destRef = db.collection('users').doc(userId).collection('reviews').doc(businessId)
      const existing = await destRef.get()

      if (existing.exists) {
        console.log(`  skip  users/${userId}/reviews/${businessId}`)
        skipped++
        continue
      }

      try {
        await destRef.set({ ...data, businessId })
        console.log(`  ok    users/${userId}/reviews/${businessId}`)
        migrated++
      } catch (err) {
        console.error(`  error users/${userId}/reviews/${businessId}:`, err.message)
        errors++
      }
    }
  }

  console.log(`\nListo. Migradas: ${migrated} | Salteadas: ${skipped} | Errores: ${errors}`)
}

migrate().catch((err) => { console.error(err); process.exit(1) })
