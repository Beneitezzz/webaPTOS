import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { RESTRICTIONS } from '../data/mockData'
import { toggleItem } from '../utils/array'
import { CheckCircle, User } from 'lucide-react'

export default function Perfil() {
  const { userProfile, updateProfile } = useApp()
  const [name, setName] = useState(userProfile.name)
  const [restrictions, setRestrictions] = useState(userProfile.restrictions)
  const [saved, setSaved] = useState(false)

  const toggleRestriction = (id) => {
    setRestrictions((prev) => toggleItem(prev, id))
    setSaved(false)
  }

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile({ name, restrictions })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="page page-centered">
      <div className="container container-sm">
        <div className="page-header">
          <div className="page-icon">
            <User size={28} />
          </div>
          <div>
            <h1>Mi Perfil</h1>
            <p className="text-muted">
              Configurá tus restricciones y el mapa se filtrará automáticamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="card form-card">
          <div className="form-group">
            <label className="form-label">Tu nombre (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: María"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSaved(false)
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mis restricciones alimentarias</label>
            <p className="form-hint">
              Seleccioná todas las que correspondan. El mapa mostrará solo los comercios que
              cumplen con todas tus restricciones activas.
            </p>
            <div className="restriction-grid">
              {RESTRICTIONS.map((r) => {
                const active = restrictions.includes(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`restriction-btn ${active ? 'active' : ''}`}
                    style={active ? { backgroundColor: r.color, borderColor: r.color } : { borderColor: r.color, color: r.color }}
                    onClick={() => toggleRestriction(r.id)}
                  >
                    {active && <CheckCircle size={16} />}
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {restrictions.length > 0 && (
            <div className="profile-summary">
              <p>
                Vas a ver comercios aptos para:{' '}
                {restrictions.map((id) => {
                  const r = RESTRICTIONS.find((x) => x.id === id)
                  return (
                    <span
                      key={id}
                      className="badge badge-sm"
                      style={{ backgroundColor: r?.color }}
                    >
                      {r?.label}
                    </span>
                  )
                })}
              </p>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full">
            Guardar perfil
          </button>

          {saved && (
            <div className="save-success">
              <CheckCircle size={16} /> Perfil guardado correctamente
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
