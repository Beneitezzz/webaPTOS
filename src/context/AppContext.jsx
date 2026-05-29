import { createContext, useContext, useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { currentUser } = useAuth()

  const [businesses, setBusinesses] = useState([])
  const [businessesLoading, setBusinessesLoading] = useState(true)
  const [businessesError, setBusinessesError] = useState(null)
  const [userProfile, setUserProfile] = useState({ profileName: '', restrictions: [] })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        setBusinesses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setBusinessesLoading(false)
        setBusinessesError(null)
      },
      (err) => {
        console.error('businesses snapshot error:', err)
        setBusinessesLoading(false)
        setBusinessesError('No se pudieron cargar los comercios')
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!currentUser) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setUserProfile({ profileName: '', restrictions: [] })
      setProfileLoading(false)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }
    let cancelled = false
    setProfileLoading(true)
    getDoc(doc(db, 'users', currentUser.uid))
      .then((snap) => {
        if (cancelled) return
        if (snap.exists()) {
          const data = snap.data()
          setUserProfile({
            profileName: data.profileName ?? '',
            restrictions: data.restrictions ?? [],
          })
        }
      })
      .catch((err) => console.error('profile load error:', err))
      .finally(() => { if (!cancelled) setProfileLoading(false) })
    return () => { cancelled = true }
  }, [currentUser])

  const updateProfile = async (updates) => {
    await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true })
    setUserProfile((prev) => ({ ...prev, ...updates }))
  }

  const addBusiness = (data) =>
    addDoc(collection(db, 'businesses'), {
      ...data,
      verified: false,
      pending: true,
      rating: null,
      ownerId: currentUser?.uid ?? null,
      createdAt: serverTimestamp(),
    })

  const approveBusiness = (id) =>
    updateDoc(doc(db, 'businesses', id), { verified: true, pending: false })

  const rejectBusiness = (id) =>
    deleteDoc(doc(db, 'businesses', id))

  return (
    <AppContext.Provider
      value={{
        businesses,
        businessesLoading,
        businessesError,
        userProfile,
        profileLoading,
        updateProfile,
        addBusiness,
        approveBusiness,
        rejectBusiness,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext)
