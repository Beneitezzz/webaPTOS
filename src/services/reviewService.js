import {
  collection, collectionGroup, query, where, orderBy, onSnapshot,
  doc, setDoc, getDocs, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const subscribeToUserReviews = (userId, onData, onError) =>
  onSnapshot(
    query(
      collectionGroup(db, 'reviews'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ),
    (snap) => onData(snap.docs.map((d) => ({
      id: d.id,
      businessId: d.ref.parent.parent.id,
      ...d.data(),
    }))),
    onError
  )

export const deleteReview = async (businessId, userId) => {
  await deleteDoc(doc(db, 'businesses', businessId, 'reviews', userId))
  const reviewsSnap = await getDocs(collection(db, 'businesses', businessId, 'reviews'))
  const ratings = reviewsSnap.docs.map((d) => d.data().rating).filter((r) => typeof r === 'number')
  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
    await updateDoc(doc(db, 'businesses', businessId), { rating: avg })
  } else {
    await updateDoc(doc(db, 'businesses', businessId), { rating: null })
  }
}

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
  await setDoc(
    doc(db, 'businesses', businessId, 'reviews', userId),
    {
      userId,
      userName: reviewData.userName,
      rating: reviewData.rating,
      comment: reviewData.comment || null,
      ...(isUpdate ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  )

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
