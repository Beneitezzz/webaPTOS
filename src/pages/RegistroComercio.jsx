import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Store } from 'lucide-react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc } from 'firebase/firestore'
import { storage, db } from '../firebase'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS } from '../data/mockData'
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

const initialForm = {
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
  const { addBusiness, businesses, businessesLoading } = useApp()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    if (field === 'address') setCoords(null)
  }

  const toggleTag = (id) => setForm((prev) => ({ ...prev, tags: toggleItem(prev.tags, id) }))
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
        await updateDoc(doc(db, 'businesses', editingBusinessId), {
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
        const ext = file.name.split('.').pop().toLowerCase()
        const fileRef = ref(storage, `certificados/${businessId}/${certCode}.${ext}`)
        await uploadBytes(fileRef, file)
        certUrls[certCode] = await getDownloadURL(fileRef)
      }
      if (Object.keys(certUrls).length > 0) {
        await updateDoc(doc(db, 'businesses', businessId), { certDocuments: certUrls })
      }

      if (menuFile) {
        const ext = menuFile.name.split('.').pop().toLowerCase()
        const menuRef = ref(storage, `menus/${businessId}/menu.${ext}`)
        await uploadBytes(menuRef, menuFile)
        const menuUrl = await getDownloadURL(menuRef)
        await updateDoc(doc(db, 'businesses', businessId), { menuFileUrl: menuUrl })
      }

      setSubmitted(true)
    } catch {
      setErrors({ submit: 'Error al enviar el comercio. Intentá de nuevo.' })
    }
  }

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
          <button
            className="btn btn-primary"
            onClick={() => { setForm(initialForm); setCoords(null); setGeocodeError(''); setGeocoding(false); setSubmitted(false) }}
          >
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
                    onClick={() => { setMenuFile(null); setMenuFileError('') }}
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
                  📎 Arrastrá o hacé clic para seleccionar
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
