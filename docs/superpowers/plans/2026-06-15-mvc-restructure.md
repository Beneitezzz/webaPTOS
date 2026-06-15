# MVC Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar el proyecto en capas MVC: servicios Firebase puros en `services/`, lógica de formulario en `hooks/`, vistas delgadas en `views/`, constantes en `models/`.

**Architecture:** Se crean primero los servicios y hooks (sin mover archivos), luego se actualizan los consumidores, y finalmente se mueven los archivos a su nueva ubicación. El build debe pasar después de cada tarea — nunca se rompe la app.

**Tech Stack:** React 19, Vite, Firebase (Firestore + Storage + Auth), react-router-dom v6

---

## Mapa de archivos

```
CREADOS
  src/services/businessService.js   ← addDoc/updateDoc de businesses
  src/services/authService.js       ← operaciones de Firebase Auth
  src/services/storageService.js    ← uploadBytes / getDownloadURL
  src/services/reviewService.js     ← onSnapshot + setDoc de reviews
  src/hooks/useBusinessForm.js      ← toda la lógica de RegistroComercio

MOVIDOS
  src/data/mockData.js              → src/models/mockData.js
  src/components/*                  → src/views/components/*
  src/pages/*                       → src/views/pages/*

SIMPLIFICADOS (misma ubicación)
  src/context/AppContext.jsx        ← delega CRUD a businessService
  src/context/AuthContext.jsx       ← delega auth a authService
  src/components/ReviewsSection.jsx ← delega Firebase a reviewService
  src/pages/RegistroComercio.jsx    ← delgado: solo JSX + useBusinessForm
```

---

## Task 1: Crear businessService.js y storageService.js

**Files:**
- Create: `src/services/businessService.js`
- Create: `src/services/storageService.js`

- [ ] **Step 1: Crear `src/services/businessService.js`**

```js
import {
  collection, onSnapshot, addDoc, updateDoc,
  doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const subscribeToBusinesses = (onData, onError) =>
  onSnapshot(
    collection(db, 'businesses'),
    (snapshot) => {
      onData(snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          ...data,
          socialLinks: data.socialLinks ?? [data.instagramUrl, data.websiteUrl].filter(Boolean),
          menuFileUrl: data.menuFileUrl ?? null,
        }
      }))
    },
    onError
  )

export const addBusiness = (data, ownerId, ownerEmail) =>
  addDoc(collection(db, 'businesses'), {
    ...data,
    verified: false,
    pending: true,
    status: 'pendiente',
    rating: null,
    ownerId: ownerId ?? null,
    ownerEmail: ownerEmail ?? null,
    createdAt: serverTimestamp(),
  })

export const updateBusiness = (id, data) =>
  updateDoc(doc(db, 'businesses', id), data)

export const approveBusiness = (id) =>
  updateDoc(doc(db, 'businesses', id), { verified: true, pending: false, status: 'aprobado' })

export const rejectBusiness = (id, reason) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false, pending: false, status: 'rechazado', rejectionReason: reason,
  })

export const suspendBusiness = (id) =>
  updateDoc(doc(db, 'businesses', id), {
    verified: false, pending: false, status: 'suspendido',
  })
```

- [ ] **Step 2: Crear `src/services/storageService.js`**

```js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

export const uploadCertFile = async (businessId, certCode, file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const fileRef = ref(storage, `certificados/${businessId}/${certCode}.${ext}`)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

export const uploadMenuFile = async (businessId, file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const menuRef = ref(storage, `menus/${businessId}/menu.${ext}`)
  await uploadBytes(menuRef, file)
  return getDownloadURL(menuRef)
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores. Los servicios aún no son usados por nadie; no hay cambios en la app.

- [ ] **Step 4: Commit**

```bash
git add src/services/businessService.js src/services/storageService.js
git commit -m "feat: add businessService and storageService"
```

---

## Task 2: Crear authService.js y reviewService.js

**Files:**
- Create: `src/services/authService.js`
- Create: `src/services/reviewService.js`

- [ ] **Step 1: Crear `src/services/authService.js`**

```js
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
```

- [ ] **Step 2: Crear `src/services/reviewService.js`**

```js
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export const subscribeToReviews = (businessId, onData, onError) =>
  onSnapshot(
    query(
      collection(db, 'businesses', businessId, 'reviews'),
      orderBy('createdAt', 'desc')
    ),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )

export const saveReview = (businessId, userId, reviewData, isUpdate) =>
  setDoc(
    doc(db, 'businesses', businessId, 'reviews', userId),
    {
      userId,
      userName: reviewData.userName,
      rating: reviewData.rating,
      comment: reviewData.comment || null,
      ...(isUpdate ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  )
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/services/authService.js src/services/reviewService.js
git commit -m "feat: add authService and reviewService"
```

---

## Task 3: Actualizar AppContext para delegar a businessService

**Files:**
- Modify: `src/context/AppContext.jsx`

- [ ] **Step 1: Reemplazar el contenido de `src/context/AppContext.jsx`**

```jsx
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
} from '../services/businessService'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { currentUser } = useAuth()

  const [businesses, setBusinesses] = useState([])
  const [businessesLoading, setBusinessesLoading] = useState(true)
  const [businessesError, setBusinessesError] = useState(null)
  const [userProfile, setUserProfile] = useState({ profileName: '', restrictions: [] })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => subscribeToBusinesses(
    (data) => { setBusinesses(data); setBusinessesLoading(false); setBusinessesError(null) },
    (err) => {
      console.error('businesses snapshot error:', err)
      setBusinessesLoading(false)
      setBusinessesError('No se pudieron cargar los comercios')
    }
  ), [])

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
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext)
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores. La app funciona igual que antes.

- [ ] **Step 3: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "refactor: AppContext delegates Firebase CRUD to businessService"
```

---

## Task 4: Actualizar AuthContext para delegar a authService

**Files:**
- Modify: `src/context/AuthContext.jsx`

- [ ] **Step 1: Reemplazar el contenido de `src/context/AuthContext.jsx`**

```jsx
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
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/context/AuthContext.jsx
git commit -m "refactor: AuthContext delegates Firebase auth ops to authService"
```

---

## Task 5: Actualizar ReviewsSection para usar reviewService

**Files:**
- Modify: `src/components/ReviewsSection.jsx`

- [ ] **Step 1: Reemplazar los imports de Firebase en `src/components/ReviewsSection.jsx`**

Cambiar las líneas 1-9 (imports) de:
```js
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import {
  collection, query, orderBy, onSnapshot,
  doc, setDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
```
Por:
```js
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { subscribeToReviews, saveReview } from '../services/reviewService'
import { useAuth } from '../context/AuthContext'
```

- [ ] **Step 2: Reemplazar el useEffect de onSnapshot (líneas 47-61)**

Cambiar de:
```js
useEffect(() => {
  const q = query(
    collection(db, 'businesses', businessId, 'reviews'),
    orderBy('createdAt', 'desc')
  )
  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    setReviews(data)
    setLoading(false)
  }, (err) => {
    console.error('reviews snapshot error:', err)
    setLoading(false)
  })
  return unsub
}, [businessId])
```
Por:
```js
useEffect(() => subscribeToReviews(
  businessId,
  (data) => { setReviews(data); setLoading(false) },
  (err) => { console.error('reviews snapshot error:', err); setLoading(false) }
), [businessId])
```

- [ ] **Step 3: Reemplazar el handleSubmit (líneas 81-99)**

Cambiar de:
```js
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!rating) return
  setSubmitting(true)
  setSubmitError('')
  try {
    await setDoc(doc(db, 'businesses', businessId, 'reviews', currentUser.uid), {
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
      rating,
      comment: comment.trim() || null,
      ...(myReview ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp() }),
    }, { merge: true })
  } catch {
    setSubmitError('No se pudo publicar la reseña. Intentá de nuevo.')
  } finally {
    setSubmitting(false)
  }
}
```
Por:
```js
const handleSubmit = async (e) => {
  e.preventDefault()
  if (!rating) return
  setSubmitting(true)
  setSubmitError('')
  try {
    await saveReview(
      businessId,
      currentUser.uid,
      {
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario',
        rating,
        comment: comment.trim(),
      },
      !!myReview
    )
  } catch {
    setSubmitError('No se pudo publicar la reseña. Intentá de nuevo.')
  } finally {
    setSubmitting(false)
  }
}
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/ReviewsSection.jsx
git commit -m "refactor: ReviewsSection delegates Firebase ops to reviewService"
```

---

## Task 6: Crear useBusinessForm hook

**Files:**
- Create: `src/hooks/useBusinessForm.js`

- [ ] **Step 1: Crear `src/hooks/useBusinessForm.js`**

```js
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { updateBusiness } from '../services/businessService'
import { uploadCertFile, uploadMenuFile } from '../services/storageService'
import { toggleItem } from '../utils/array'

const ALLOWED_MENU_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const MAX_MENU_SIZE = 5 * 1024 * 1024

const DEFAULT_OPENING_HOURS = [
  { day: 'lunes',     open: '09:00', close: '20:00', closed: false },
  { day: 'martes',    open: '09:00', close: '20:00', closed: false },
  { day: 'miércoles', open: '09:00', close: '20:00', closed: false },
  { day: 'jueves',    open: '09:00', close: '20:00', closed: false },
  { day: 'viernes',   open: '09:00', close: '20:00', closed: false },
  { day: 'sábado',    open: '09:00', close: '13:00', closed: false },
  { day: 'domingo',   open: '00:00', close: '00:00', closed: true  },
]

const INITIAL_FORM = {
  name: '',
  type: '',
  address: '',
  phone: '',
  openingHours: DEFAULT_OPENING_HOURS,
  description: '',
  tags: [],
  certifications: [],
  socialLinks: [''],
}

export function useBusinessForm() {
  const { addBusiness, businesses, businessesLoading } = useApp()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [certFiles, setCertFiles] = useState({})
  const [menuFile, setMenuFile] = useState(null)
  const [existingMenuFileUrl, setExistingMenuFileUrl] = useState(null)
  const [menuFileError, setMenuFileError] = useState('')
  const [editingBusinessId, setEditingBusinessId] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [coords, setCoords] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
  const [geocodeId, setGeocodeId] = useState(0)
  const debounceRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    const addr = form.address.trim()
    if (addr.length < 5) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setCoords(null)
      setGeocodeError('')
      setGeocoding(false)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }
    clearTimeout(debounceRef.current)
    let controller = new AbortController()
    debounceRef.current = setTimeout(async () => {
      setGeocoding(true)
      setGeocodeError('')
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr + ' Córdoba Argentina')}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'es' }, signal: controller.signal }
        )
        const data = await res.json()
        if (data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
          setGeocodeId((n) => n + 1)
        } else {
          setCoords(null)
          setGeocodeError('No se encontró la dirección. Intentá con más detalle.')
        }
        setGeocoding(false)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setCoords(null)
          setGeocodeError('Error al buscar la dirección. Verificá tu conexión.')
          setGeocoding(false)
        }
      }
    }, 800)
    return () => {
      clearTimeout(debounceRef.current)
      controller.abort()
    }
  }, [form.address])

  useEffect(() => {
    if (businessesLoading || !currentUser || initializedRef.current) return
    initializedRef.current = true
    const existing = businesses.find((b) => b.ownerId === currentUser.uid)
    if (!existing) return
    if (existing.status !== 'rechazado') {
      navigate('/mi-comercio', { replace: true })
      return
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setEditingBusinessId(existing.id)
    setForm({
      name: existing.name ?? '',
      type: existing.type ?? '',
      address: existing.address ?? '',
      phone: existing.phone ?? '',
      openingHours: existing.openingHours ?? DEFAULT_OPENING_HOURS,
      description: existing.description ?? '',
      tags: existing.tags ?? [],
      certifications: existing.certifications ?? [],
      socialLinks: existing.socialLinks?.length ? existing.socialLinks : [''],
    })
    if (existing.menuFileUrl) setExistingMenuFileUrl(existing.menuFileUrl)
    setMenuFileError('')
    if (existing.lat && existing.lng) setCoords({ lat: existing.lat, lng: existing.lng })
    setGeocodeId((n) => n + 1)
    setGeocodeError('')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [businesses, businessesLoading, currentUser, navigate])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    if (field === 'address') setCoords(null)
  }

  const toggleTag = (id) =>
    setForm((prev) => ({ ...prev, tags: toggleItem(prev.tags, id) }))

  const toggleCert = (cert) => {
    setForm((prev) => ({ ...prev, certifications: toggleItem(prev.certifications, cert) }))
    setCertFiles((prev) => { const next = { ...prev }; delete next[cert]; return next })
  }

  const handleCertFile = (cert, file) => {
    if (file) {
      setCertFiles((prev) => ({ ...prev, [cert]: file }))
    } else {
      setCertFiles((prev) => { const next = { ...prev }; delete next[cert]; return next })
    }
  }

  const addSocialLink = () =>
    setForm((prev) => ({ ...prev, socialLinks: [...prev.socialLinks, ''] }))

  const updateSocialLink = (i, value) => {
    setForm((prev) => {
      const socialLinks = [...prev.socialLinks]
      socialLinks[i] = value
      return { ...prev, socialLinks }
    })
    setErrors((prev) => { const next = { ...prev }; delete next[`socialLink_${i}`]; return next })
  }

  const removeSocialLink = (i) => {
    setForm((prev) => ({ ...prev, socialLinks: prev.socialLinks.filter((_, idx) => idx !== i) }))
    setErrors((prev) => { const next = { ...prev }; delete next[`socialLink_${i}`]; return next })
  }

  const handleMenuFile = (file) => {
    if (!file) { setMenuFile(null); setMenuFileError(''); return }
    if (!ALLOWED_MENU_TYPES.has(file.type)) {
      setMenuFileError('Solo se aceptan PDF, JPG o PNG')
      return
    }
    if (file.size > MAX_MENU_SIZE) {
      setMenuFileError('El archivo no puede superar los 5 MB')
      return
    }
    setMenuFile(file)
    setMenuFileError('')
    setExistingMenuFileUrl(null)
  }

  const isValidUrl = (url) => {
    try {
      const u = new URL(url)
      return u.protocol === 'https:' || u.protocol === 'http:'
    } catch {
      return false
    }
  }

  const updateHourField = (i, field, value) => {
    setForm((prev) => {
      const openingHours = [...prev.openingHours]
      openingHours[i] = { ...openingHours[i], [field]: value }
      return { ...prev, openingHours }
    })
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    if (!form.type) errs.type = 'Seleccioná un tipo de establecimiento'
    if (!form.address.trim()) errs.address = 'La dirección es requerida'
    else if (!coords) errs.address = 'No se pudo verificar la ubicación. Ajustá la dirección.'
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
    if (form.tags.length === 0) errs.tags = 'Seleccioná al menos una restricción alimentaria'
    if (form.certifications.length === 0) errs.certifications = 'Seleccioná al menos una certificación'
    form.socialLinks.forEach((url, i) => {
      if (url.trim() && !isValidUrl(url.trim()))
        errs[`socialLink_${i}`] = 'Ingresá una URL válida (ej: https://instagram.com/milocal)'
    })
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    try {
      const businessData = {
        ...form,
        lat: coords.lat,
        lng: coords.lng,
        whatsapp: form.phone.replace(/\D/g, ''),
        socialLinks: form.socialLinks.filter((u) => u.trim()),
      }

      let businessId
      if (editingBusinessId) {
        await updateBusiness(editingBusinessId, {
          ...businessData,
          status: 'pendiente',
          pending: true,
          verified: false,
          rejectionReason: null,
        })
        businessId = editingBusinessId
      } else {
        const docRef = await addBusiness(businessData)
        businessId = docRef.id
      }

      const certUrls = {}
      for (const [certCode, file] of Object.entries(certFiles)) {
        certUrls[certCode] = await uploadCertFile(businessId, certCode, file)
      }
      if (Object.keys(certUrls).length > 0) {
        await updateBusiness(businessId, { certDocuments: certUrls })
      }

      if (menuFile) {
        const menuUrl = await uploadMenuFile(businessId, menuFile)
        await updateBusiness(businessId, { menuFileUrl: menuUrl })
      }

      setSubmitted(true)
    } catch {
      setErrors({ submit: 'Error al enviar el comercio. Intentá de nuevo.' })
    }
  }

  const onSuccessReset = () => {
    setForm(INITIAL_FORM)
    setCoords(null)
    setGeocodeError('')
    setGeocoding(false)
    setSubmitted(false)
    setMenuFile(null)
    setMenuFileError('')
    setExistingMenuFileUrl(null)
  }

  return {
    form,
    certFiles,
    menuFile,
    existingMenuFileUrl,
    setExistingMenuFileUrl,
    menuFileError,
    editingBusinessId,
    submitted,
    errors,
    coords,
    setCoords,
    geocoding,
    geocodeError,
    geocodeId,
    handleChange,
    handleMenuFile,
    handleCertFile,
    addSocialLink,
    updateSocialLink,
    removeSocialLink,
    updateHourField,
    toggleTag,
    toggleCert,
    handleSubmit,
    onSuccessReset,
  }
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores. El hook existe pero aún no se usa.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBusinessForm.js
git commit -m "feat: extract useBusinessForm hook from RegistroComercio"
```

---

## Task 7: Adelgazar RegistroComercio para usar useBusinessForm

**Files:**
- Modify: `src/pages/RegistroComercio.jsx`

El archivo pasa de ~617 líneas a ~290 líneas. Solo se cambia la parte superior del archivo (imports + state + lógica). El JSX del formulario NO cambia.

- [ ] **Step 1: Reemplazar la sección de imports (líneas 1-11) y todo el bloque de estado/lógica (líneas 55-286) con el hook**

Reemplazar el archivo completo con este contenido — el JSX del formulario (líneas 288-617) se conserva exactamente igual, solo cambia lo que está antes del `return`:

```jsx
import { CheckCircle, Store } from 'lucide-react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS } from '../data/mockData'
import { useBusinessForm } from '../hooks/useBusinessForm'

const availableCerts = ['RNPA', 'ALG', 'RME', 'POES', 'ACA']

function DraggableMarker({ coords, onMove }) {
  return (
    <Marker
      position={[coords.lat, coords.lng]}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng()
          onMove(lat, lng)
        },
      }}
    />
  )
}

export default function RegistroComercio() {
  const {
    form, certFiles, menuFile, existingMenuFileUrl, setExistingMenuFileUrl,
    menuFileError, editingBusinessId, submitted, errors, coords, setCoords,
    geocoding, geocodeError, geocodeId,
    handleChange, handleMenuFile, handleCertFile,
    addSocialLink, updateSocialLink, removeSocialLink,
    updateHourField, toggleTag, toggleCert,
    handleSubmit, onSuccessReset,
  } = useBusinessForm()

  if (submitted) {
    return (
      <div className="page page-centered">
        <div className="container container-sm success-screen">
          <CheckCircle size={64} className="success-icon" />
          <h1>{editingBusinessId ? '¡Re-envío exitoso!' : '¡Registro enviado!'}</h1>
          <p>
            {editingBusinessId
              ? 'Tu comercio fue re-enviado y está nuevamente en revisión. Te avisaremos cuando haya novedades.'
              : 'Tu comercio fue enviado para revisión. Una vez aprobado por un administrador, aparecerá en el mapa.'}
          </p>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            ¿Sos administrador?{' '}
            <a href="/admin" className="link">Ir al panel de administración</a> para aprobar el comercio.
          </p>
          <button className="btn btn-primary" onClick={onSuccessReset}>
            Registrar otro comercio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container container-sm">
        <div className="page-header">
          <div className="page-icon">
            <Store size={28} />
          </div>
          <div>
            <h1>Registrá tu comercio</h1>
            <p className="text-muted">
              Conectá con miles de personas que buscan productos aptos en Córdoba.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card form-card">
          <div className="form-group">
            <label className="form-label">Nombre del comercio *</label>
            <input
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Ej: Dietética NaturAlma"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de establecimiento *</label>
            <select
              className={`form-select ${errors.type ? 'error' : ''}`}
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="">Seleccioná...</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            {errors.type && <span className="form-error">{errors.type}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Dirección *</label>
            <input
              className={`form-input ${errors.address ? 'error' : ''}`}
              placeholder="Ej: Av. Colón 1234, Córdoba"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
            {geocoding && (
              <p className="geocode-status"><span className="spinner-sm" /> Buscando ubicación...</p>
            )}
            {geocodeError && !geocoding && (
              <p className="geocode-error">{geocodeError}</p>
            )}
            {coords && !geocoding && (
              <div className="mini-map">
                <MapContainer
                  key={geocodeId}
                  center={[coords.lat, coords.lng]}
                  zoom={15}
                  zoomControl={false}
                  scrollWheelZoom={false}
                  style={{ height: '220px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <DraggableMarker
                    coords={coords}
                    onMove={(lat, lng) => setCoords({ lat, lng })}
                  />
                </MapContainer>
              </div>
            )}
            {errors.address && <span className="form-error">{errors.address}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Teléfono / WhatsApp *</label>
              <input
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="0351-123-4567"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Horarios de atención</label>
            <div className="hours-grid">
              {form.openingHours.map((h, i) => (
                <div key={h.day} className="hours-row">
                  <span className="hours-day">{h.day.charAt(0).toUpperCase() + h.day.slice(1)}</span>
                  <label className="hours-closed-label">
                    <input
                      type="checkbox"
                      checked={h.closed}
                      onChange={(e) => updateHourField(i, 'closed', e.target.checked)}
                    />
                    Cerrado
                  </label>
                  <input
                    type="time"
                    className="form-input time-input"
                    value={h.open}
                    disabled={h.closed}
                    onChange={(e) => updateHourField(i, 'open', e.target.value)}
                  />
                  <span className="hours-separator">–</span>
                  <input
                    type="time"
                    className="form-input time-input"
                    value={h.close}
                    disabled={h.closed}
                    onChange={(e) => updateHourField(i, 'close', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describí brevemente tu comercio y los servicios que ofrecés..."
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Links del comercio <span style={{ fontWeight: 400, color: '#888' }}>(opcional)</span></label>
            <p className="form-hint" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
              Agregá tu sitio web, Instagram, Facebook, TikTok, etc.
            </p>
            {form.socialLinks.map((url, i) => (
              <div key={i} className="social-link-row">
                <input
                  type="url"
                  className={`form-input ${errors[`socialLink_${i}`] ? 'error' : ''}`}
                  placeholder="https://instagram.com/milocal"
                  value={url}
                  onChange={(e) => updateSocialLink(i, e.target.value)}
                />
                {form.socialLinks.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeSocialLink(i)}>×</button>
                )}
                {errors[`socialLink_${i}`] && (
                  <span className="form-error">{errors[`socialLink_${i}`]}</span>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '0.5rem' }} onClick={addSocialLink}>
              + Agregar link
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Restricciones alimentarias que manejás *</label>
            {errors.tags && <span className="form-error">{errors.tags}</span>}
            <div className="restriction-grid">
              {RESTRICTIONS.map((r) => {
                const active = form.tags.includes(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`restriction-btn ${active ? 'active' : ''}`}
                    style={active ? { backgroundColor: r.color, borderColor: r.color } : { borderColor: r.color, color: r.color }}
                    onClick={() => toggleTag(r.id)}
                  >
                    {active && <CheckCircle size={14} />}
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Certificaciones que posee *</label>
            {errors.certifications && <span className="form-error">{errors.certifications}</span>}
            <div className="certs-grid">
              {availableCerts.map((cert) => {
                const active = form.certifications.includes(cert)
                return (
                  <label key={cert} className={`cert-checkbox ${active ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleCert(cert)}
                    />
                    {cert}
                  </label>
                )
              })}
            </div>
            <p className="form-hint">
              Podés adjuntar los archivos ahora o presentarlos durante la verificación.
            </p>
            {form.certifications.length > 0 && (
              <div className="cert-files-section">
                {form.certifications.map((cert) => (
                  <div key={cert} className="cert-file-row">
                    <label className="cert-file-label">
                      <span>{cert} — {CERTIFICATIONS[cert]}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleCertFile(cert, e.target.files[0] ?? null)}
                      />
                    </label>
                    {certFiles[cert] && (
                      <span className="cert-file-name">{certFiles[cert].name}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Carta / menú <span style={{ fontWeight: 400, color: '#888' }}>(opcional)</span>
            </label>
            <p className="form-hint" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
              Subí una foto o PDF de tu carta. Máx. 5 MB.
            </p>
            {existingMenuFileUrl && !menuFile && (
              <div className="menu-file-selected">
                <span>
                  📄 Archivo actual:{' '}
                  <a href={existingMenuFileUrl} target="_blank" rel="noopener noreferrer" className="link">
                    ver menú
                  </a>
                </span>
                <button type="button" className="btn-remove" onClick={() => setExistingMenuFileUrl(null)}>
                  ×
                </button>
              </div>
            )}
            {!existingMenuFileUrl && (
              menuFile ? (
                <div className="menu-file-selected">
                  <span>📄 {menuFile.name}</span>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => handleMenuFile(null)}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="menu-upload-zone">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => handleMenuFile(e.target.files[0] ?? null)}
                  />
                  📎 Hacé clic para seleccionar un archivo
                  <span className="menu-upload-hint">PDF · JPG · PNG</span>
                </label>
              )
            )}
            {menuFileError && <span className="form-error">{menuFileError}</span>}
          </div>

          {errors.submit && <div className="auth-error">{errors.submit}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={geocoding}>
            {geocoding
              ? 'Verificando ubicación...'
              : editingBusinessId
              ? 'Re-enviar para verificación'
              : 'Enviar para verificación'}
          </button>

          <p className="form-footer-note">
            Al enviar, aceptás que MapaApto pueda mostrar la información de tu comercio en la plataforma
            una vez verificada.
          </p>
        </form>
      </div>
    </div>
  )
}
```

Nota: `setCoords` es usado en el JSX para el DraggableMarker (`onMove={(lat, lng) => setCoords({ lat, lng })}`). Como el hook no lo expone directamente, exponer `coords` y usar el `onMove` del hook no sirve. Solución: exponer también `setCoords` en el return del hook. Agregar `setCoords` al return object de `useBusinessForm`:

```js
// En el return de useBusinessForm(), agregar:
setCoords,
```

Y en el destructuring del componente, agregar `setCoords`.

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/pages/RegistroComercio.jsx src/hooks/useBusinessForm.js
git commit -m "refactor: thin RegistroComercio — logic extracted to useBusinessForm hook"
```

---

## Task 8: Mover mockData → models/

**Files:**
- Move: `src/data/mockData.js` → `src/models/mockData.js`
- Modify: 10 archivos que importan mockData (ver lista abajo)

- [ ] **Step 1: Mover el archivo con git**

```bash
mkdir -p src/models
git mv src/data/mockData.js src/models/mockData.js
```

- [ ] **Step 2: Actualizar imports en componentes (aún en `src/components/`)**

En `src/components/RestrictionBadge.jsx`:
```js
// Cambiar:
import { RESTRICTION_MAP } from '../data/mockData'
// Por:
import { RESTRICTION_MAP } from '../models/mockData'
```

En `src/components/MapView.jsx`:
```js
// Cambiar:
import { BUSINESS_TYPE_MAP } from '../data/mockData'
// Por:
import { BUSINESS_TYPE_MAP } from '../models/mockData'
```

En `src/components/BusinessCard.jsx`:
```js
// Cambiar:
import { BUSINESS_TYPE_MAP } from '../data/mockData'
// Por:
import { BUSINESS_TYPE_MAP } from '../models/mockData'
```

- [ ] **Step 3: Actualizar imports en páginas (aún en `src/pages/`)**

En `src/pages/RegistroComercio.jsx`:
```js
// Cambiar:
import { RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS } from '../data/mockData'
// Por:
import { RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS } from '../models/mockData'
```

En `src/pages/Perfil.jsx`:
```js
// Cambiar:
import { RESTRICTIONS } from '../data/mockData'
// Por:
import { RESTRICTIONS } from '../models/mockData'
```

En `src/pages/AdminPanel.jsx`:
```js
// Cambiar:
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../data/mockData'
// Por:
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../models/mockData'
```

En `src/pages/Mapa.jsx`:
```js
// Cambiar:
import { RESTRICTIONS, BUSINESS_TYPES, BUSINESS_TYPE_MAP } from '../data/mockData'
// Por:
import { RESTRICTIONS, BUSINESS_TYPES, BUSINESS_TYPE_MAP } from '../models/mockData'
```

En `src/pages/Home.jsx`:
```js
// Cambiar:
import { RESTRICTIONS } from '../data/mockData'
// Por:
import { RESTRICTIONS } from '../models/mockData'
```

En `src/pages/DetalleComercio.jsx`:
```js
// Cambiar:
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../data/mockData'
// Por:
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../models/mockData'
```

En `src/pages/MiComercio.jsx`:
```js
// Cambiar:
import { BUSINESS_TYPE_MAP } from '../data/mockData'
// Por:
import { BUSINESS_TYPE_MAP } from '../models/mockData'
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores. Si hay "Cannot find module '../data/mockData'" en algún archivo, buscarlo con `grep -r "data/mockData" src/` y corregirlo.

- [ ] **Step 5: Eliminar la carpeta vacía**

```bash
rmdir src/data
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move mockData from data/ to models/"
```

---

## Task 9: Mover components → views/components/

**Files:**
- Move: `src/components/*` (7 archivos) → `src/views/components/`
- Modify: `src/App.jsx` (3 imports)
- Modify: 4 páginas que importan componentes

- [ ] **Step 1: Crear carpeta y mover archivos con git**

```bash
mkdir -p src/views/components
git mv src/components/AdminRoute.jsx src/views/components/AdminRoute.jsx
git mv src/components/BusinessCard.jsx src/views/components/BusinessCard.jsx
git mv src/components/MapView.jsx src/views/components/MapView.jsx
git mv src/components/Navbar.jsx src/views/components/Navbar.jsx
git mv src/components/PrivateRoute.jsx src/views/components/PrivateRoute.jsx
git mv src/components/RestrictionBadge.jsx src/views/components/RestrictionBadge.jsx
git mv src/components/ReviewsSection.jsx src/views/components/ReviewsSection.jsx
```

- [ ] **Step 2: Actualizar imports DENTRO de los componentes movidos**

`src/views/components/AdminRoute.jsx`:
```js
// Cambiar:
import { useAuth } from '../context/AuthContext'
// Por:
import { useAuth } from '../../context/AuthContext'
```

`src/views/components/BusinessCard.jsx`:
```js
// Cambiar:
import { BUSINESS_TYPE_MAP } from '../models/mockData'
// Por:
import { BUSINESS_TYPE_MAP } from '../../models/mockData'
```

`src/views/components/MapView.jsx`:
```js
// Cambiar:
import { BUSINESS_TYPE_MAP } from '../models/mockData'
// Por:
import { BUSINESS_TYPE_MAP } from '../../models/mockData'
```

`src/views/components/Navbar.jsx`:
```js
// Cambiar:
import { useAuth } from '../context/AuthContext'
// Por:
import { useAuth } from '../../context/AuthContext'
```

`src/views/components/PrivateRoute.jsx`:
```js
// Cambiar:
import { useAuth } from '../context/AuthContext'
// Por:
import { useAuth } from '../../context/AuthContext'
```

`src/views/components/RestrictionBadge.jsx`:
```js
// Cambiar:
import { RESTRICTION_MAP } from '../models/mockData'
// Por:
import { RESTRICTION_MAP } from '../../models/mockData'
```

`src/views/components/ReviewsSection.jsx`:
```js
// Cambiar:
import { subscribeToReviews, saveReview } from '../services/reviewService'
import { useAuth } from '../context/AuthContext'
// Por:
import { subscribeToReviews, saveReview } from '../../services/reviewService'
import { useAuth } from '../../context/AuthContext'
```

- [ ] **Step 3: Actualizar imports en App.jsx**

```js
// Cambiar:
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
// Por:
import Navbar from './views/components/Navbar'
import PrivateRoute from './views/components/PrivateRoute'
import AdminRoute from './views/components/AdminRoute'
```

- [ ] **Step 4: Actualizar imports en páginas que importan componentes (aún en `src/pages/`)**

`src/pages/Mapa.jsx`:
```js
// Cambiar:
import MapView from '../components/MapView'
import BusinessCard from '../components/BusinessCard'
// Por:
import MapView from '../views/components/MapView'
import BusinessCard from '../views/components/BusinessCard'
```

`src/pages/AdminPanel.jsx`:
```js
// Cambiar:
import RestrictionBadge from '../components/RestrictionBadge'
// Por:
import RestrictionBadge from '../views/components/RestrictionBadge'
```

`src/pages/DetalleComercio.jsx`:
```js
// Cambiar:
import RestrictionBadge from '../components/RestrictionBadge'
import ReviewsSection from '../components/ReviewsSection'
// Por:
import RestrictionBadge from '../views/components/RestrictionBadge'
import ReviewsSection from '../views/components/ReviewsSection'
```

`src/pages/MiComercio.jsx`:
```js
// Cambiar:
import RestrictionBadge from '../components/RestrictionBadge'
// Por:
import RestrictionBadge from '../views/components/RestrictionBadge'
```

- [ ] **Step 5: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores. Verificar también con `grep -r "from.*'../components" src/pages/` — debe retornar vacío.

- [ ] **Step 6: Eliminar carpeta vacía**

```bash
rmdir src/components
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: move components to views/components/"
```

---

## Task 10: Mover pages → views/pages/

**Files:**
- Move: `src/pages/*` (10 archivos) → `src/views/pages/`
- Modify: `src/App.jsx` (10 imports de páginas)
- Modify: todos los archivos de páginas movidos (imports internos)

- [ ] **Step 1: Crear carpeta y mover archivos con git**

```bash
mkdir -p src/views/pages
git mv src/pages/AdminPanel.jsx src/views/pages/AdminPanel.jsx
git mv src/pages/DetalleComercio.jsx src/views/pages/DetalleComercio.jsx
git mv src/pages/Home.jsx src/views/pages/Home.jsx
git mv src/pages/Login.jsx src/views/pages/Login.jsx
git mv src/pages/Mapa.jsx src/views/pages/Mapa.jsx
git mv src/pages/MiComercio.jsx src/views/pages/MiComercio.jsx
git mv src/pages/Perfil.jsx src/views/pages/Perfil.jsx
git mv src/pages/Register.jsx src/views/pages/Register.jsx
git mv src/pages/RegistroComercio.jsx src/views/pages/RegistroComercio.jsx
git mv src/pages/SelectRol.jsx src/views/pages/SelectRol.jsx
```

- [ ] **Step 2: Actualizar imports en App.jsx (10 cambios)**

```js
// Cambiar:
import Home from './pages/Home'
import Mapa from './pages/Mapa'
import Perfil from './pages/Perfil'
import DetalleComercio from './pages/DetalleComercio'
import RegistroComercio from './pages/RegistroComercio'
import MiComercio from './pages/MiComercio'
import AdminPanel from './pages/AdminPanel'
import Login from './pages/Login'
import Register from './pages/Register'
import SelectRol from './pages/SelectRol'
// Por:
import Home from './views/pages/Home'
import Mapa from './views/pages/Mapa'
import Perfil from './views/pages/Perfil'
import DetalleComercio from './views/pages/DetalleComercio'
import RegistroComercio from './views/pages/RegistroComercio'
import MiComercio from './views/pages/MiComercio'
import AdminPanel from './views/pages/AdminPanel'
import Login from './views/pages/Login'
import Register from './views/pages/Register'
import SelectRol from './views/pages/SelectRol'
```

- [ ] **Step 3: Actualizar imports en páginas movidas — contextos, utils, models, hooks**

Regla general al mover de `src/pages/` a `src/views/pages/`:
- `'../context/X'` → `'../../context/X'`
- `'../utils/X'` → `'../../utils/X'`
- `'../models/X'` → `'../../models/X'`
- `'../hooks/X'` → `'../../hooks/X'`
- `'../firebase'` → `'../../firebase'`
- `'../views/components/X'` → `'../components/X'` ← porque ahora son hermanos

Aplicar los siguientes cambios por archivo:

**`src/views/pages/AdminPanel.jsx`:**
```js
// Cambiar:
import { useApp } from '../context/AppContext'
import RestrictionBadge from '../views/components/RestrictionBadge'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../models/mockData'
import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailService'
import { formatOpeningHours } from '../utils/hours'
// Por:
import { useApp } from '../../context/AppContext'
import RestrictionBadge from '../components/RestrictionBadge'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../../models/mockData'
import { sendApprovalEmail, sendRejectionEmail } from '../../utils/emailService'
import { formatOpeningHours } from '../../utils/hours'
```

**`src/views/pages/DetalleComercio.jsx`:**
```js
// Cambiar:
import { useApp } from '../context/AppContext'
import RestrictionBadge from '../views/components/RestrictionBadge'
import ReviewsSection from '../views/components/ReviewsSection'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../models/mockData'
import { isOpenNow, formatOpeningHours } from '../utils/hours'
// Por:
import { useApp } from '../../context/AppContext'
import RestrictionBadge from '../components/RestrictionBadge'
import ReviewsSection from '../components/ReviewsSection'
import { BUSINESS_TYPE_MAP, CERTIFICATIONS } from '../../models/mockData'
import { isOpenNow, formatOpeningHours } from '../../utils/hours'
```

**`src/views/pages/Home.jsx`:**
```js
// Cambiar:
import { RESTRICTIONS } from '../models/mockData'
// Por:
import { RESTRICTIONS } from '../../models/mockData'
```

**`src/views/pages/Login.jsx`:**
```js
// Cambiar:
import { useAuth } from '../context/AuthContext'
import { googleProvider, appleProvider, facebookProvider, auth } from '../firebase'
import { getAuthError } from '../utils/authErrors'
// Por:
import { useAuth } from '../../context/AuthContext'
import { googleProvider, appleProvider, facebookProvider, auth } from '../../firebase'
import { getAuthError } from '../../utils/authErrors'
```

**`src/views/pages/Mapa.jsx`:**
```js
// Cambiar:
import MapView from '../views/components/MapView'
import BusinessCard from '../views/components/BusinessCard'
import { useApp } from '../context/AppContext'
import { RESTRICTIONS, BUSINESS_TYPES, BUSINESS_TYPE_MAP } from '../models/mockData'
import { toggleItem } from '../utils/array'
// Por:
import MapView from '../components/MapView'
import BusinessCard from '../components/BusinessCard'
import { useApp } from '../../context/AppContext'
import { RESTRICTIONS, BUSINESS_TYPES, BUSINESS_TYPE_MAP } from '../../models/mockData'
import { toggleItem } from '../../utils/array'
```

**`src/views/pages/MiComercio.jsx`:**
```js
// Cambiar:
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import RestrictionBadge from '../views/components/RestrictionBadge'
import { BUSINESS_TYPE_MAP } from '../models/mockData'
// Por:
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import RestrictionBadge from '../components/RestrictionBadge'
import { BUSINESS_TYPE_MAP } from '../../models/mockData'
```

**`src/views/pages/Perfil.jsx`:**
```js
// Cambiar:
import { useApp } from '../context/AppContext'
import { RESTRICTIONS } from '../models/mockData'
import { toggleItem } from '../utils/array'
// Por:
import { useApp } from '../../context/AppContext'
import { RESTRICTIONS } from '../../models/mockData'
import { toggleItem } from '../../utils/array'
```

**`src/views/pages/Register.jsx`:**
```js
// Cambiar:
import { useAuth } from '../context/AuthContext'
import { googleProvider, appleProvider, facebookProvider } from '../firebase'
import { getAuthError } from '../utils/authErrors'
// Por:
import { useAuth } from '../../context/AuthContext'
import { googleProvider, appleProvider, facebookProvider } from '../../firebase'
import { getAuthError } from '../../utils/authErrors'
```

**`src/views/pages/RegistroComercio.jsx`:**
```js
// Cambiar:
import { RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS } from '../models/mockData'
import { useBusinessForm } from '../hooks/useBusinessForm'
// Por:
import { RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS } from '../../models/mockData'
import { useBusinessForm } from '../../hooks/useBusinessForm'
```

**`src/views/pages/SelectRol.jsx`:**
```js
// Cambiar:
import { useAuth } from '../context/AuthContext'
// Por:
import { useAuth } from '../../context/AuthContext'
```

- [ ] **Step 4: Verificar build**

```bash
npm run build
```

Expected: Build completa sin errores. Verificar con:
```bash
grep -r "from.*'../pages\|from.*'./pages" src/
```
Debe retornar vacío.

- [ ] **Step 5: Eliminar carpeta vacía**

```bash
rmdir src/pages
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move pages to views/pages/"
```

---

## Task 11: Cleanup final y lint

**Files:**
- No new files

- [ ] **Step 1: Verificar que no quedan carpetas vacías**

```bash
ls src/data 2>/dev/null && echo "data/ aún existe" || echo "OK"
ls src/components 2>/dev/null && echo "components/ aún existe" || echo "OK"
ls src/pages 2>/dev/null && echo "pages/ aún existe" || echo "OK"
```

Expected: Los tres retornan "OK".

- [ ] **Step 2: Correr ESLint**

```bash
npm run lint
```

Si hay errores de imports no resueltos, buscar el archivo con `grep -r "from.*'../" src/views/` y corregir el path.

- [ ] **Step 3: Build final**

```bash
npm run build
```

Expected: Build completa sin warnings relevantes.

- [ ] **Step 4: Verificar estructura final**

```bash
find src -type f -name "*.jsx" -o -name "*.js" | grep -v node_modules | sort
```

Expected: los archivos deben estar bajo `src/models/`, `src/services/`, `src/hooks/`, `src/views/pages/`, `src/views/components/`, `src/context/`, `src/utils/`.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: MVC restructure complete — cleanup and lint"
```
