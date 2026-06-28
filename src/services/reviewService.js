import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, getDocs, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// Perfil del usuario: lee desde users/{userId}/reviews (sin índice compuesto)
export const subscribeToUserReviews = (userId, onData, onError) =>
  onSnapshot(
    collection(db, 'users', userId, 'reviews'),
    (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, businessId: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      onData(data)
    },
    onError
  )

export const deleteReview = async (businessId, userId) => {
  await Promise.all([
    deleteDoc(doc(db, 'businesses', businessId, 'reviews', userId)),
    deleteDoc(doc(db, 'users', userId, 'reviews', businessId)),
  ])
  const reviewsSnap = await getDocs(collection(db, 'businesses', businessId, 'reviews'))
  const ratings = reviewsSnap.docs.map((d) => d.data().rating).filter((r) => typeof r === 'number')
  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
    await updateDoc(doc(db, 'businesses', businessId), { rating: avg })
  } else {
    await updateDoc(doc(db, 'businesses', businessId), { rating: null })
  }
}

// Página del comercio: lee desde businesses/{businessId}/reviews
export const subscribeToReviews = (businessId, onData, onError) =>
  onSnapshot(
    query(
      collection(db, 'businesses', businessId, 'reviews'),
      orderBy('createdAt', 'desc')
    ),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )

export const saveReview = async (businessId, userId, reviewData, isUpdate) => {
  const reviewFields = {
    userId,
    userName: reviewData.userName,
    rating: reviewData.rating,
    comment: reviewData.comment || null,
    ...(isUpdate ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
  }

  await Promise.all([
    setDoc(doc(db, 'businesses', businessId, 'reviews', userId), reviewFields, { merge: true }),
    setDoc(doc(db, 'users', userId, 'reviews', businessId), { ...reviewFields, businessId }, { merge: true }),
  ])

  try {
    const reviewsSnap = await getDocs(collection(db, 'businesses', businessId, 'reviews'))
    const ratings = reviewsSnap.docs
      .map((d) => d.data().rating)
      .filter((r) => typeof r === 'number')
    if (ratings.length > 0) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
      await updateDoc(doc(db, 'businesses', businessId), { rating: avg })
    }
  } catch {
    // El rating promedio es best-effort; la reseña ya fue guardada correctamente
  }
}
