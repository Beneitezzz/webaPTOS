import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { mockBusinesses } from '../data/mockData'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('mapaApto_profile')
      return saved ? JSON.parse(saved) : { name: '', restrictions: [] }
    } catch {
      return { name: '', restrictions: [] }
    }
  })

  const [businesses, setBusinesses] = useState(() => {
    try {
      const saved = localStorage.getItem('mapaApto_businesses')
      return saved ? JSON.parse(saved) : mockBusinesses
    } catch {
      return mockBusinesses
    }
  })

  const isMounted = useRef(false)
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    localStorage.setItem('mapaApto_profile', JSON.stringify(userProfile))
  }, [userProfile])

  useEffect(() => {
    localStorage.setItem('mapaApto_businesses', JSON.stringify(businesses))
  }, [businesses])

  const updateProfile = (updates) => {
    setUserProfile((prev) => ({ ...prev, ...updates }))
  }

  const approveBusiness = (id) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, verified: true, pending: false } : b))
    )
  }

  const rejectBusiness = (id) => {
    setBusinesses((prev) => prev.filter((b) => b.id !== id))
  }

  const addBusiness = (newBusiness) => {
    setBusinesses((prev) => [
      ...prev,
      { ...newBusiness, id: crypto.randomUUID(), verified: false, pending: true, rating: null },
    ])
  }

  return (
    <AppContext.Provider
      value={{ userProfile, updateProfile, businesses, approveBusiness, rejectBusiness, addBusiness }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
