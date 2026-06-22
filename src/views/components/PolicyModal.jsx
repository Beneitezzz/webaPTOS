import { useEffect } from 'react'
import { X, ShieldCheck } from 'lucide-react'

const SECTIONS = {
  terminos: {
    title: 'Términos y Condiciones de Uso',
    content: (
      <>
        <p>Al registrarte en PuntoSano aceptás los presentes Términos y Condiciones. El uso de la plataforma implica la aceptación total de las disposiciones aquí descritas.</p>
        <ul className="politica-list">
          <li>PuntoSano es una plataforma informativa sin fines de lucro destinada a conectar usuarios con comercios aptos para distintas restricciones alimentarias.</li>
          <li>El servicio se provee "tal como está". PuntoSano no garantiza disponibilidad ininterrumpida y puede modificar o discontinuar funcionalidades sin previo aviso.</li>
          <li>Queda prohibido el uso de la plataforma para fines ilícitos, spam, o cualquier actividad que vulnere los derechos de terceros.</li>
          <li>PuntoSano se reserva el derecho de suspender o eliminar cuentas que incumplan estos términos.</li>
          <li>Estos términos se rigen por la legislación vigente en la República Argentina.</li>
        </ul>
      </>
    ),
  },
  privacidad: {
    title: 'Política de Privacidad',
    content: (
      <>
        <p>PuntoSano recopila y trata datos personales conforme a la <strong>Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina.</p>
        <h3 className="politica-subtitle">Datos que recopilamos</h3>
        <ul className="politica-list">
          <li><strong>Datos de registro:</strong> nombre, dirección de correo electrónico y contraseña cifrada.</li>
          <li><strong>Datos de perfil:</strong> restricciones alimentarias que el usuario declara voluntariamente.</li>
          <li><strong>Datos de comercio</strong> (solo para cuentas de comercio): nombre del negocio, dirección, teléfono, certificaciones y tipo de establecimiento.</li>
          <li><strong>Datos de uso:</strong> registros de acceso e interacciones para mejorar el servicio.</li>
        </ul>
        <h3 className="politica-subtitle">Cómo usamos tus datos</h3>
        <ul className="politica-list">
          <li>Para personalizar tu experiencia y mostrarte comercios relevantes a tu perfil.</li>
          <li>Para contactarte en relación al estado de tu cuenta o tu registro de comercio.</li>
          <li>Para mejorar la plataforma mediante análisis estadísticos anonimizados.</li>
          <li>No vendemos ni cedemos datos personales a terceros con fines comerciales.</li>
        </ul>
        <h3 className="politica-subtitle">Tus derechos</h3>
        <p>Podés acceder, rectificar, actualizar o solicitar la eliminación de tus datos en cualquier momento escribiendo a <a href="mailto:contacto@puntosano.com.ar" className="link">contacto@puntosano.com.ar</a>.</p>
      </>
    ),
  },
  usuarios: {
    title: 'Aviso para Usuarios',
    content: (
      <>
        <p className="politica-aviso">
          PuntoSano es una <strong>herramienta informativa</strong>. La información sobre comercios y productos aptos es provista por los propios establecimientos y no ha sido verificada médicamente.
        </p>
        <ul className="politica-list">
          <li>La plataforma <strong>no reemplaza</strong> diagnósticos, tratamientos ni consejos médicos o nutricionales profesionales.</li>
          <li>PuntoSano <strong>no se responsabiliza</strong> por reacciones alérgicas, intolerancias u otros efectos adversos derivados del consumo de productos adquiridos en comercios listados.</li>
          <li>Siempre consultá con tu médico o nutricionista ante dudas sobre tu alimentación.</li>
          <li>En caso de emergencia médica, contactá al sistema de salud correspondiente.</li>
        </ul>
      </>
    ),
  },
  comercios: {
    title: 'Condiciones para Comercios',
    content: (
      <>
        <p>Los comercios que se registren en PuntoSano asumen los siguientes compromisos:</p>
        <ul className="politica-list">
          <li><strong>Veracidad:</strong> la información proporcionada debe ser exacta y vigente.</li>
          <li><strong>Actualización:</strong> el comercio es responsable de mantener sus datos actualizados y notificar cambios relevantes.</li>
          <li><strong>Certificaciones:</strong> solo se pueden declarar certificaciones que el establecimiento posea efectivamente.</li>
          <li><strong>Verificación:</strong> el registro será revisado por el equipo de PuntoSano, que se reserva el derecho de rechazar listados que no cumplan los requisitos.</li>
          <li><strong>Responsabilidad:</strong> el comercio es responsable ante sus clientes por la calidad e inocuidad de los productos que ofrece.</li>
        </ul>
      </>
    ),
  },
}

export default function PolicyModal({ section, onClose }) {
  const data = SECTIONS[section]

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!data) return null

  return (
    <div className="policy-modal-overlay" onClick={onClose}>
      <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="policy-modal-header">
          <div className="policy-modal-title">
            <ShieldCheck size={20} />
            <span>{data.title}</span>
          </div>
          <button className="policy-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="policy-modal-body">
          {data.content}
        </div>
      </div>
    </div>
  )
}
