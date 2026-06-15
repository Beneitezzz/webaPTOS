import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const registerWithEmail = async (email, password, displayName, role = 'user') => {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName })
  try {
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    })
  } catch (err) {
    await credential.user.delete()
    throw err
  }
  return credential
}

export const signInWithProvider = async (provider, role = 'user') => {
  const credential = await signInWithPopup(auth, provider)
  const userRef = doc(db, 'users', credential.user.uid)
  try {
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: credential.user.email,
        displayName: credential.user.displayName,
        role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })
    } else {
      await updateDoc(userRef, { lastLogin: serverTimestamp() })
    }
  } catch {
    // Firestore write failed but auth succeeded — user is logged in
  }
  return credential
}

export const signOut = () => firebaseSignOut(auth)

export const getUserRole = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data().role : 'user'
}
