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
    let cancelled = false

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const resolve = async () => {
        if (user) {
          try {
            const snap = await getDoc(doc(db, 'users', user.uid))
            if (!cancelled) {
              setCurrentUser(user)
              setUserRole(snap.exists() ? snap.data().role : 'user')
            }
          } catch {
            if (!cancelled) {
              setCurrentUser(user)
              setUserRole('user')
            }
          }
        } else {
          if (!cancelled) {
            setCurrentUser(null)
            setUserRole(null)
          }
        }
        if (!cancelled) setLoading(false)
      }
      resolve()
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const signInWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const registerWithEmail = async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName })
    try {
      await setDoc(doc(db, 'users', credential.user.uid), {
        email,
        displayName,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })
    } catch (err) {
      await credential.user.delete()
      throw err
    }
    return credential
  }

  const signInWithProvider = async (provider) => {
    const credential = await signInWithPopup(auth, provider)
    const userRef = doc(db, 'users', credential.user.uid)
    try {
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
    } catch {
      // Firestore write failed but auth succeeded — user is logged in
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
