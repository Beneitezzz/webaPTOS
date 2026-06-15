import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const subscribeToBusinesses = (onData, onError) =>
  onSnapshot(
    collection(db, 'businesses'),
    (snapshot) => {
      onData(snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
          socialLinks: data.socialLinks ?? [data.instagramUrl, data.websiteUrl].filter(Boolean),
          menuFileUrl: data.menuFileUrl ?? null,
        }
      }))
    },
    onError
  )

export const addBusiness = (data, ownerId, ownerEmail) =>
  addDoc(collection(db, 'businesses'), {
    ...data,
    verified: false,
    pending: true,
    status: 'pendiente',
    rating: null,
    ownerId: ownerId ?? null,
    ownerEmail: ownerEmail ?? null,
    createdAt: serverTimestamp(),
  })

export const updateBusiness = (id, data) =>
  updateDoc(doc(db, 'businesses', id), data)

export const approveBusiness = (id) =>
  updateDoc(doc(db, 'businesses', id), { verified: true, pending: false, status: 'aprobado' })

export const rejectBusiness = (id, reason) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false, pending: false, status: 'rechazado', rejectionReason: reason,
  })

export const suspendBusiness = (id) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false, pending: false, status: 'suspendido',
  })
