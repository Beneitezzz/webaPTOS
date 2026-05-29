import { useState } from 'react'
import { CheckCircle, Store } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { RESTRICTIONS, BUSINESS_TYPES } from '../data/mockData'
import { toggleItem } from '../utils/array'

const initialForm = {
  name: '',
  type: '',
  address: '',
  phone: '',
  hours: '',
  description: '',
  tags: [],
  certifications: [],
  menu: [{ name: '', price: '' }],
}

const availableCerts = ['RNPA', 'ALG', 'RME', 'POES', 'ACA']

export default function RegistroComercio() {
  const { addBusiness } = useApp()
  const [form, setForm] = useState(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const toggleTag = (id) => setForm((prev) => ({ ...prev, tags: toggleItem(prev.tags, id) }))
  const toggleCert = (cert) => setForm((prev) => ({ ...prev, certifications: toggleItem(prev.certifications, cert) }))

  const addMenuItem = () => {
    setForm((prev) => ({ ...prev, menu: [...prev.menu, { name: '', price: '' }] }))
  }

  const updateMenuItem = (i, field, value) => {
    setForm((prev) => {
      const menu = [...prev.menu]
      menu[i] = { ...menu[i], [field]: value }
      return { ...prev, menu }
    })
  }

  const removeMenuItem = (i) => {
    setForm((prev) => ({ ...prev, menu: prev.menu.filter((_, idx) => idx !== i) }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    if (!form.type) errs.type = 'Seleccioná un tipo de establecimiento'
    if (!form.address.trim()) errs.address = 'La dirección es requerida'
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
    if (form.tags.length === 0) errs.tags = 'Seleccioná al menos una restricción alimentaria'
    if (form.certifications.length === 0) errs.certifications = 'Seleccioná al menos una certificación'
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
      await addBusiness({
        ...form,
        lat: -31.4201 + (Math.random() - 0.5) * 0.04,
        lng: -64.1888 + (Math.random() - 0.5) * 0.04,
        whatsapp: form.phone.replace(/\D/g, ''),
        menu: form.menu
          .filter((m) => m.name.trim())
          .map((m) => ({ name: m.name, price: m.price ? Number(m.price) : null })),
      })
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
          <h1>¡Registro enviado!</h1>
          <p>
            Tu comercio fue enviado para revisión. Una vez aprobado por un administrador,
            aparecerá en el mapa.
          </p>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            ¿Sos administrador?{' '}
            <a href="/admin" className="link">Ir al panel de administración</a> para aprobar el comercio.
          </p>
          <button className="btn btn-primary" onClick={() => { setForm(initialForm); setSubmitted(false) }}>
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
            <div className="form-group">
              <label className="form-label">Horario de atención</label>
              <input
                className="form-input"
                placeholder="Lun-Vie: 9:00-20:00"
                value={form.hours}
                onChange={(e) => handleChange('hours', e.target.value)}
              />
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
              Deberás presentar los certificados físicos o digitales durante el proceso de verificación.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Productos / Menú</label>
            {form.menu.map((item, i) => (
              <div key={i} className="menu-input-row">
                <input
                  className="form-input"
                  placeholder="Nombre del producto"
                  value={item.name}
                  onChange={(e) => updateMenuItem(i, 'name', e.target.value)}
                />
                <input
                  className="form-input price-input"
                  placeholder="Precio ($)"
                  type="number"
                  value={item.price}
                  onChange={(e) => updateMenuItem(i, 'price', e.target.value)}
                />
                {form.menu.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeMenuItem(i)}>×</button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addMenuItem}>
              + Agregar producto
            </button>
          </div>

          {errors.submit && <div className="auth-error">{errors.submit}</div>}
          <button type="submit" className="btn btn-primary btn-full">
            Enviar para verificación
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
