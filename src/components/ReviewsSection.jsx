import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

function StarDisplay({ rating, size = 16 }) {
  return (
    <span className="star-display">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= rating ? '#ffc107' : 'none'}
          color="#ffc107"
        />
      ))}
    </span>
  )
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`
  return d.toLocaleDateString('es-AR')
}

export default function ReviewsSection({ businessId }) {
  const { currentUser, userRole } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [myReview, setMyReview] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, 'businesses', businessId, 'reviews'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setReviews(data)
      if (currentUser) {
        const mine = data.find((r) => r.id === currentUser.uid)
        if (mine) {
          setMyReview(mine)
          setRating(mine.rating)
          setComment(mine.comment ?? '')
        } else {
          setMyReview(null)
        }
      }
      setLoading(false)
    })
    return unsub
  }, [businessId, currentUser])

  const average = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) return
    setSubmitting(true)
    try {
      await setDoc(doc(db, 'businesses', businessId, 'reviews', currentUser.uid), {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        rating,
        comment: comment.trim() || null,
        createdAt: serverTimestamp(),
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="card reviews-card">
      <h2>Valoraciones</h2>

      {average ? (
        <div className="reviews-summary">
          <div className="reviews-average">
            <span className="reviews-score">{average}</span>
            <StarDisplay rating={Math.round(average)} size={18} />
            <span className="reviews-count">
              {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="reviews-bars">
            {distribution.map(({ star, count }) => (
              <div key={star} className="reviews-bar-row">
                <span className="reviews-bar-label">{star}★</span>
                <div className="reviews-bar-track">
                  <div
                    className="reviews-bar-fill"
                    style={{ width: `${(count / reviews.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted">Todavía no hay reseñas. ¡Sé el primero!</p>
      )}

      {userRole === 'user' ? (
        <form onSubmit={handleSubmit} className="reviews-form">
          <div className="form-label">
            {myReview ? 'Tu reseña' : 'Dejá tu valoración'}
          </div>
          <div className="star-picker">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className="star-picker-btn"
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
              >
                <Star
                  size={30}
                  fill={(hover || rating) >= s ? '#ffc107' : 'none'}
                  color="#ffc107"
                />
              </button>
            ))}
          </div>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Contá tu experiencia... (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!rating || submitting}
          >
            {submitting
              ? 'Publicando...'
              : myReview
              ? 'Actualizar reseña'
              : 'Publicar reseña'}
          </button>
        </form>
      ) : (
        <p className="text-muted reviews-login-prompt">
          <Link to="/login" className="link">Iniciá sesión</Link> como usuario para dejar una reseña.
        </p>
      )}

      {reviews.length > 0 && (
        <div className="reviews-list">
          {reviews.map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-header">
                <div className="review-meta">
                  <span className="review-author">{r.userName}</span>
                  <StarDisplay rating={r.rating} size={13} />
                </div>
                <span className="review-date">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
