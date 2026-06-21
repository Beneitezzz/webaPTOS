import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToFavorites, addFavorite, removeFavorite,
} from '../services/favoriteService'

export function useFavorites() {
  const { currentUser } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setFavoriteIds(new Set())
      setLoading(false)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }
    setLoading(true)
    return subscribeToFavorites(
      currentUser.uid,
      (ids) => { setFavoriteIds(new Set(ids)); setLoading(false) },
      () => setLoading(false)
    )
  }, [currentUser])

  const toggleFavorite = async (businessId) => {
    if (!currentUser) return
    const id = String(businessId)
    if (favoriteIds.has(id)) {
      await removeFavorite(currentUser.uid, id)
    } else {
      await addFavorite(currentUser.uid, id)
    }
  }

  return { favoriteIds, toggleFavorite, loading }
}
