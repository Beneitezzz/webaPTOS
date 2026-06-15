import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import {
  signInWithEmail,
  registerWithEmail,
  signInWithProvider,
  signOut,
  getUserRole,
} from '../services/authService'

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
            const role = await getUserRole(user.uid)
            if (!cancelled) { setCurrentUser(user); setUserRole(role) }
          } catch {
            if (!cancelled) { setCurrentUser(user); setUserRole('user') }
          }
        } else {
          if (!cancelled) { setCurrentUser(null); setUserRole(null) }
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
