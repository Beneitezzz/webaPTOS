import {
  collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const favCol = (uid) => collection(db, 'users', uid, 'favorites')

export const subscribeToFavorites = (uid, onData, onError) =>
  onSnapshot(
    favCol(uid),
    (snap) => onData(snap.docs.map((d) => d.id)),
    onError
  )

export const addFavorite = (uid, businessId) =>
  setDoc(doc(db, 'users', uid, 'favorites', String(businessId)), {
    addedAt: serverTimestamp(),
  })

export const removeFavorite = (uid, businessId) =>
  deleteDoc(doc(db, 'users', uid, 'favorites', String(businessId)))
