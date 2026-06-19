import { CheckCircle, Store } from 'lucide-react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS } from '../../models/mockData'
import { useBusinessForm } from '../../hooks/useBusinessForm'

const availableCerts = ['RNPA', 'ALG', 'RME', 'POES', 'ACA']

const DRAGGABLE_ICON = L.divIcon({
  html: `<img src="data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="38">
      <path fill="#2d6a4f" stroke="white" stroke-width="1.5"
        d="M12 0C7.58 0 4 3.58 4 8c0 6.67 8 16 8 16s8-9.33 8-16c0-4.42-3.58-8-8-8z"/>
      <circle cx="12" cy="8" r="3.5" fill="white"/>
    </svg>`
  )}" width="28" height="38" />`,
  className: '',
  iconSize: [28, 38],
  iconAnchor: [14, 38],
})

function DraggableMarker({ coords, onMove }) {
  return (
    <Marker
      position={[coords.lat, coords.lng]}
      draggable
      icon={DRAGGABLE_ICON}
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
    menuFileError, editingBusinessId, submitted, errors, coords,
    geocoding, geocodeError, geocodeId,
    handleChange, handleMarkerMove, handleMenuFile, handleCertFile,
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
                    onMove={handleMarkerMove}
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
