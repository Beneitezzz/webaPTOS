import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, serverTimestamp,
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

export const saveReview = (businessId, userId, reviewData, isUpdate) =>
  setDoc(
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
