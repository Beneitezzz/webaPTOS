import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, getDocs, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

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

  const reviewsSnap = await getDocs(collection(db, 'businesses', businessId, 'reviews'))
  const ratings = reviewsSnap.docs
    .map((d) => d.data().rating)
    .filter((r) => typeof r === 'number')
  if (ratings.length > 0) {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
    await updateDoc(doc(db, 'businesses', businessId), { rating: avg })
  }
}
