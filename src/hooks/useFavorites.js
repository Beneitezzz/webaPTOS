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
      (err) => { console.error('favorites subscription:', err); setLoading(false) }
    )
  }, [currentUser])

  const toggleFavorite = async (businessId) => {
    if (!currentUser) return
    const id = String(businessId)
    const wasFav = favoriteIds.has(id)

    // Optimistic update so the button responds immediately
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (wasFav) next.delete(id)
      else next.add(id)
      return next
    })

    try {
      if (wasFav) {
        await removeFavorite(currentUser.uid, id)
      } else {
        await addFavorite(currentUser.uid, id)
      }
    } catch (err) {
      console.error('Error al guardar favorito:', err)
      // Revert optimistic update on failure
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (wasFav) next.add(id)
        else next.delete(id)
        return next
      })
    }
  }

  return { favoriteIds, toggleFavorite, loading }
}
