import { Link, useSearchParams } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export default function Politicas() {
  const [searchParams] = useSearchParams()
  const section = searchParams.get('seccion')

  return (
    <div className="page page-centered">
      <div className="container container-md">
        <div className="page-header">
          <div className="page-icon"><ShieldCheck size={28} /></div>
          <div>
            <h1>Políticas de PuntoSano</h1>
            <p className="text-muted">Última actualización: junio 2025</p>
          </div>
        </div>

        <div className="card form-card politicas-card">

          {/* Términos y Condiciones */}
          <section id="terminos" className={`politica-section${section === 'terminos' ? ' politica-highlight' : ''}`}>
            <h2 className="politica-title">Términos y Condiciones de Uso</h2>
            <p>Al registrarte en PuntoSano aceptás los presentes Términos y Condiciones. El uso de la plataforma implica la aceptación total de las disposiciones aquí descritas.</p>
            <ul className="politica-list">
              <li>PuntoSano es una plataforma informativa sin fines de lucro destinada a conectar usuarios con comercios aptos para distintas restricciones alimentarias.</li>
              <li>El servicio se provee "tal como está". PuntoSano no garantiza disponibilidad ininterrumpida y puede modificar o discontinuar funcionalidades sin previo aviso.</li>
              <li>Queda prohibido el uso de la plataforma para fines ilícitos, spam, o cualquier actividad que vulnere los derechos de terceros.</li>
              <li>PuntoSano se reserva el derecho de suspender o eliminar cuentas que incumplan estos términos.</li>
              <li>Estos términos se rigen por la legislación vigente en la República Argentina.</li>
            </ul>
          </section>

          <hr className="politica-divider" />

          {/* Política de Privacidad */}
          <section id="privacidad" className={`politica-section${section === 'privacidad' ? ' politica-highlight' : ''}`}>
            <h2 className="politica-title">Política de Privacidad</h2>
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
          </section>

          <hr className="politica-divider" />

          {/* Para usuarios */}
          <section id="usuarios" className={`politica-section${section === 'usuarios' ? ' politica-highlight' : ''}`}>
            <h2 className="politica-title">Aviso para Usuarios</h2>
            <p className="politica-aviso">
              PuntoSano es una <strong>herramienta informativa</strong>. La información sobre comercios y productos aptos
              es provista por los propios establecimientos y no ha sido verificada médicamente.
            </p>
            <ul className="politica-list">
              <li>La plataforma <strong>no reemplaza</strong> diagnósticos, tratamientos ni consejos médicos o nutricionales profesionales.</li>
              <li>PuntoSano <strong>no se responsabiliza</strong> por reacciones alérgicas, intolerancias u otros efectos adversos derivados del consumo de productos adquiridos en comercios listados.</li>
              <li>Siempre consultá con tu médico o nutricionista ante dudas sobre tu alimentación.</li>
              <li>En caso de emergencia médica, contactá al sistema de salud correspondiente.</li>
            </ul>
          </section>

          <hr className="politica-divider" />

          {/* Para comercios */}
          <section id="comercios" className={`politica-section${section === 'comercios' ? ' politica-highlight' : ''}`}>
            <h2 className="politica-title">Condiciones para Comercios</h2>
            <p>Los comercios que se registren en PuntoSano asumen los siguientes compromisos:</p>
            <ul className="politica-list">
              <li><strong>Veracidad:</strong> la información proporcionada (nombre, dirección, restricciones que atienden, certificaciones) debe ser exacta y vigente.</li>
              <li><strong>Actualización:</strong> el comercio es responsable de mantener sus datos actualizados y notificar cambios relevantes.</li>
              <li><strong>Certificaciones:</strong> solo se pueden declarar certificaciones que el establecimiento posea efectivamente. PuntoSano podrá solicitar documentación respaldatoria.</li>
              <li><strong>Verificación:</strong> el registro será revisado por el equipo de PuntoSano. Nos reservamos el derecho de rechazar o dar de baja listados que no cumplan con los requisitos o que contengan información falsa.</li>
              <li><strong>Responsabilidad:</strong> el comercio es responsable ante sus clientes por la calidad e inocuidad de los productos que ofrece. PuntoSano actúa exclusivamente como canal de difusión.</li>
            </ul>
          </section>

          <div className="politica-back">
            <Link to="/register/tipo" className="btn btn-outline">Volver al registro</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
