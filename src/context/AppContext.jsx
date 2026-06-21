import { createContext, useContext, useState, useEffect } from 'react'
import { getDoc, setDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import {
  subscribeToBusinesses,
  addBusiness as createBusiness,
  approveBusiness as approveInFirestore,
  rejectBusiness as rejectInFirestore,
  suspendBusiness as suspendInFirestore,
  deleteBusiness as deleteInFirestore,
} from '../services/businessService'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth()

  const [businesses, setBusinesses] = useState([])
  const [businessesLoading, setBusinessesLoading] = useState(true)
  const [businessesError, setBusinessesError] = useState(null)
  const [userProfile, setUserProfile] = useState({ profileName: '', restrictions: [] })
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => subscribeToBusinesses(
    (data) => { setBusinesses(data); setBusinessesLoading(false); setBusinessesError(null) },
    (err) => {
      console.error('businesses snapshot error:', err)
      setBusinessesLoading(false)
      setBusinessesError('No se pudieron cargar los comercios')
    }
  ), [])

  useEffect(() => {
    if (authLoading) return
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
  }, [currentUser, authLoading])

  const updateProfile = async (updates) => {
    await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true })
    setUserProfile((prev) => ({ ...prev, ...updates }))
  }

  const addBusiness = (data) =>
    createBusiness(data, currentUser?.uid, currentUser?.email)

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
        approveBusiness: approveInFirestore,
        rejectBusiness: rejectInFirestore,
        suspendBusiness: suspendInFirestore,
        deleteBusiness: deleteInFirestore,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext)
