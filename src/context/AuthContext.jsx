import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        const snap = await getDoc(doc(db, 'users', user.uid))
        setUserRole(snap.exists() ? snap.data().role : 'user')
      } else {
        setCurrentUser(null)
        setUserRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const registerWithEmail = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName })
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      displayName,
      role: 'user',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    })
    return credential
  }

  const signInWithProvider = async (provider) => {
    const credential = await signInWithPopup(auth, provider)
    const userRef = doc(db, 'users', credential.user.uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: credential.user.email,
        displayName: credential.user.displayName,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })
    } else {
      await updateDoc(userRef, { lastLogin: serverTimestamp() })
    }
    return credential
  }

  const signOut = () => firebaseSignOut(auth)

  return (
    <AuthContext.Provider
      value={{ currentUser, userRole, loading, signInWithEmail, registerWithEmail, signInWithProvider, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
