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
  const skipNextGeocodeRef = useRef(false)

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
    editingBusinessId,
    submitted,
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
    toggleTag,
    toggleCert,
    handleSubmit,
    onSuccessReset,
  }
}
