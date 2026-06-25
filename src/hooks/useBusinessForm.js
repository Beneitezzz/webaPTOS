import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { updateBusiness } from '../services/businessService'
import { uploadCertFile, uploadMenuFile, uploadBusinessPhoto } from '../services/storageService'
import { toggleItem } from '../utils/array'

const ALLOWED_MENU_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const ALLOWED_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_MENU_SIZE = 5 * 1024 * 1024
const MAX_PHOTO_SIZE = 5 * 1024 * 1024
const MAX_PHOTOS = 5

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

export function useBusinessForm(businessId = null) {
  const { addBusiness, businesses, businessesLoading } = useApp()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL_FORM)
  const [certFiles, setCertFiles] = useState({})
  const [menuFile, setMenuFile] = useState(null)
  const [existingMenuFileUrl, setExistingMenuFileUrl] = useState(null)
  const [menuFileError, setMenuFileError] = useState('')
  const [newPhotos, setNewPhotos] = useState([])
  const [existingPhotos, setExistingPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')
  const [editingBusinessId, setEditingBusinessId] = useState(null)
  const [isResubmission, setIsResubmission] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [editingApprovedBusiness, setEditingApprovedBusiness] = useState(false)
  const [editingSuspendedBusiness, setEditingSuspendedBusiness] = useState(false)
  const [initialCertifications, setInitialCertifications] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [coords, setCoords] = useState(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')
  const [geocodeId, setGeocodeId] = useState(0)
  const debounceRef = useRef(null)
  const initializedRef = useRef(false)
  const skipNextGeocodeRef = useRef(false)

  const certsChanged = useMemo(() => {
    if (!editingApprovedBusiness) return false
    const cur = [...form.certifications].sort().join(',')
    const orig = [...initialCertifications].sort().join(',')
    if (cur !== orig) return true
    return Object.keys(certFiles).length > 0
  }, [editingApprovedBusiness, form.certifications, initialCertifications, certFiles])

  useEffect(() => {
    if (skipNextGeocodeRef.current) {
      skipNextGeocodeRef.current = false
      return
    }
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
    if (!businessId || businessesLoading || initializedRef.current) return
    const existing = businesses.find((b) => b.id === businessId)
    if (!existing) return
    initializedRef.current = true
    /* eslint-disable react-hooks/set-state-in-effect */
    if (existing.status === 'aprobado') {
      setEditingApprovedBusiness(true)
      setInitialCertifications(existing.certifications ?? [])
    }
    if (existing.status === 'suspendido') {
      setEditingSuspendedBusiness(true)
    }
    if (existing.status === 'rechazado') {
      setIsResubmission(true)
    }
    setEditingBusinessId(existing.id)
    skipNextGeocodeRef.current = true
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
    if (existing.photos?.length) setExistingPhotos(existing.photos)
    setPhotoError('')
    if (existing.lat && existing.lng) setCoords({ lat: existing.lat, lng: existing.lng })
    setGeocodeId((n) => n + 1)
    setGeocodeError('')
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [businessId, businesses, businessesLoading])

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

  const handleAddPhotos = (files) => {
    const list = Array.from(files)
    const total = existingPhotos.length + newPhotos.length + list.length
    if (total > MAX_PHOTOS) {
      setPhotoError(`Máximo ${MAX_PHOTOS} fotos en total`)
      return
    }
    for (const f of list) {
      if (!ALLOWED_PHOTO_TYPES.has(f.type)) {
        setPhotoError('Solo se aceptan JPG, PNG o WebP')
        return
      }
      if (f.size > MAX_PHOTO_SIZE) {
        setPhotoError('Cada foto no puede superar los 5 MB')
        return
      }
    }
    setNewPhotos((prev) => [...prev, ...list])
    setPhotoError('')
  }

  const removeNewPhoto = (index) =>
    setNewPhotos((prev) => prev.filter((_, i) => i !== index))

  const removeExistingPhoto = (index) =>
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index))

  const isValidUrl = (url) => {
    try {
      const u = new URL(url)
      return u.protocol === 'https:' || u.protocol === 'http:'
    } catch {
      return false
    }
  }

  const toggleSecondShift = (i) => {
    setForm((prev) => {
      const openingHours = [...prev.openingHours]
      const day = { ...openingHours[i] }
      if (day.open2) { delete day.open2; delete day.close2 }
      else { day.open2 = '17:00'; day.close2 = '21:00' }
      openingHours[i] = day
      return { ...prev, openingHours }
    })
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
    const menuRequired = form.type === 'restaurante' || form.type === 'cafe'
    if (menuRequired && !menuFile && !existingMenuFileUrl) errs.menu = 'La carta/menú es requerida'
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
    setSubmitting(true)
    // Safety net: if Firebase hangs (e.g. bad network during file upload), unblock the button after 45s
    const submitTimeout = setTimeout(() => {
      setSubmitting(false)
      setErrors({ submit: 'La operación tardó demasiado. Verificá tu conexión e intentá de nuevo.' })
    }, 45000)
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
        if (editingApprovedBusiness) {
          const updateData = { ...businessData }
          if (certsChanged) {
            updateData.status = 'pendiente'
            updateData.pending = true
            updateData.verified = false
          }
          await updateBusiness(editingBusinessId, updateData)
        } else if (editingSuspendedBusiness) {
          await updateBusiness(editingBusinessId, {
            ...businessData,
            status: 'pendiente',
            pending: true,
            verified: false,
            suspensionReason: null,
          })
        } else {
          await updateBusiness(editingBusinessId, {
            ...businessData,
            status: 'pendiente',
            pending: true,
            verified: false,
            rejectionReason: null,
          })
        }
        businessId = editingBusinessId
      } else {
        const docRef = await addBusiness(businessData, currentUser?.uid, currentUser?.email)
        businessId = docRef.id
        // Set editing state immediately so a failed upload can be retried
        setEditingBusinessId(docRef.id)
      }

      try {
        const certEntries = Object.entries(certFiles)
        const results = await Promise.all([
          Promise.all(certEntries.map(async ([code, file]) => [code, await uploadCertFile(businessId, code, file)])),
          menuFile ? uploadMenuFile(businessId, menuFile) : Promise.resolve(null),
          ...newPhotos.map((photo, i) => uploadBusinessPhoto(businessId, photo, existingPhotos.length + i)),
        ])
        const [certPairs, menuUrl, ...uploadedPhotoUrls] = results
        const certUrls = Object.fromEntries(certPairs)
        const allPhotos = [...existingPhotos, ...uploadedPhotoUrls]
        await Promise.all([
          certEntries.length > 0 && updateBusiness(businessId, { certDocuments: certUrls }),
          menuUrl && updateBusiness(businessId, { menuFileUrl: menuUrl }),
          allPhotos.length > 0 && updateBusiness(businessId, { photos: allPhotos }),
        ].filter(Boolean))
      } catch (uploadErr) {
        console.error('Error subiendo archivos:', uploadErr)
        setErrors({
          submit: `Tu comercio fue registrado pero los archivos no se pudieron subir. Error: ${uploadErr?.code ?? uploadErr?.message ?? 'desconocido'}. Verificá tu conexión y volvé a intentarlo.`,
        })
        setSubmitting(false)
        return
      }

      if (editingApprovedBusiness) {
        const msg = certsChanged
          ? 'Tu comercio volvió a revisión. Te avisaremos cuando sea aprobado.'
          : 'Tu ficha fue actualizada. Los cambios ya son visibles en el mapa.'
        navigate('/mi-comercio', { state: { successMessage: msg } })
      } else if (editingSuspendedBusiness) {
        setSubmitted(true)
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Error al enviar comercio:', err)
      setErrors({ submit: `Error al enviar el comercio: ${err?.code ?? err?.message ?? 'intentá de nuevo'}.` })
      setSubmitting(false)
    } finally {
      clearTimeout(submitTimeout)
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
    setNewPhotos([])
    setExistingPhotos([])
    setPhotoError('')
  }

  const handleMarkerMove = async (lat, lng) => {
    setCoords({ lat, lng })
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      const road = data.address?.road ?? data.address?.pedestrian ?? data.address?.footway ?? ''
      const number = data.address?.house_number ?? ''
      const address = [road, number].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || ''
      if (address) {
        skipNextGeocodeRef.current = true
        setForm((prev) => ({ ...prev, address }))
        setErrors((prev) => ({ ...prev, address: '' }))
      }
    } catch {
      // reverse geocode is best-effort; coords already updated
    }
  }

  return {
    form,
    certFiles,
    menuFile,
    existingMenuFileUrl,
    setExistingMenuFileUrl,
    menuFileError,
    newPhotos,
    existingPhotos,
    photoError,
    handleAddPhotos,
    removeNewPhoto,
    removeExistingPhoto,
    editingBusinessId,
    isResubmission,
    editingApprovedBusiness,
    editingSuspendedBusiness,
    certsChanged,
    submitted,
    submitting,
    errors,
    coords,
    setCoords,
    geocoding,
    geocodeError,
    geocodeId,
    handleChange,
    handleMarkerMove,
    handleMenuFile,
    handleCertFile,
    addSocialLink,
    updateSocialLink,
    removeSocialLink,
    updateHourField,
    toggleSecondShift,
    toggleTag,
    toggleCert,
    handleSubmit,
    onSuccessReset,
  }
}
