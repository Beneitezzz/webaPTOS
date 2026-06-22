import { useEffect, useRef } from 'react'

export default function HowItWorks() {
  const flowWrapRef = useRef(null)
  const step1Ref = useRef(null)
  const step2Ref = useRef(null)
  const step3Ref = useRef(null)
  const pathRef = useRef(null)
  const travelerRef = useRef(null)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const steps = [step1Ref.current, step2Ref.current, step3Ref.current]

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in-view')
      })
    }, { threshold: 0.25 })

    steps.forEach(el => el && observer.observe(el))
    if (flowWrapRef.current) observer.observe(flowWrapRef.current)

    const flowLine = pathRef.current
    const traveler = travelerRef.current
    if (flowLine && traveler) {
      const pathLen = flowLine.getTotalLength()
      flowLine.style.strokeDasharray = pathLen
      flowLine.style.strokeDashoffset = pathLen

      let travelStart = null
      const DURATION = 3200
      const DELAY = 900

      function animateTravel(ts) {
        if (travelStart === null) travelStart = ts + DELAY
        const elapsed = ts - travelStart
        if (elapsed >= 0) {
          const t = (elapsed % DURATION) / DURATION
          const point = flowLine.getPointAtLength(t * pathLen)
          traveler.setAttribute('cx', point.x)
          traveler.setAttribute('cy', point.y)
        }
        animFrameRef.current = requestAnimationFrame(animateTravel)
      }
      animFrameRef.current = requestAnimationFrame(animateTravel)
    }

    return () => {
      observer.disconnect()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const chips = ['Celiaquía', 'Diabetes', 'SIBO', 'Sin lactosa']

  return (
    <section id="como-funciona" className="how-section">
      <div className="how-head">
        <div className="hiw-eyebrow">🧭 Guía rápida</div>
        <h2>¿Cómo funciona?</h2>
        <p>Tres pasos simples para empezar a comer tranquilo. Configurás tu perfil una sola vez y la plataforma hace el resto.</p>
      </div>

      <div className="hiw-flow-wrap" ref={flowWrapRef}>
        <svg className="hiw-flow-path" viewBox="0 0 900 40" preserveAspectRatio="none">
          <path ref={pathRef} d="M 110 20 C 280 20, 280 20, 450 20 C 620 20, 620 20, 790 20" />
          <circle ref={travelerRef} className="hiw-traveler" r="4" />
        </svg>

        <div className="hiw-steps">

          {/* Step 1 */}
          <div className="hiw-step" ref={step1Ref}>
            <div className="hiw-illustration">
              <div>
                <div className="hiw-card1">
                  <div className="hiw-card1-head">
                    <div className="hiw-avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <circle cx="12" cy="8" r="3.2" />
                        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
                      </svg>
                    </div>
                    <div className="hiw-line" />
                  </div>
                  {chips.map(label => (
                    <div key={label} className="hiw-chip">
                      <span className="hiw-tick"><CheckIcon /></span>
                      <span className="hiw-chip-label">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="hiw-badge-num">1</div>
            <h3>Creá tu perfil</h3>
            <p>Indicá tus restricciones alimentarias una sola vez: celiaquía, diabetes, SIBO o intolerancia a la lactosa. Podés combinar varias a la vez.</p>
            <span className="hiw-tip">Tarda menos de 1 minuto</span>
          </div>

          {/* Step 2 */}
          <div className="hiw-step" ref={step2Ref}>
            <div className="hiw-illustration">
              <div>
                <div className="hiw-card2">
                  <div className="hiw-road" style={{ left: 0, top: '62%', width: '100%', height: '5px' }} />
                  <div className="hiw-road" style={{ left: '30%', top: 0, width: '5px', height: '100%' }} />
                  <div className="hiw-pin hiw-pin-faded" style={{ left: '14%', top: '18%' }}>
                    <svg viewBox="0 0 24 24" fill="#9FB8AA">
                      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8Z" />
                      <circle cx="12" cy="10" r="3" fill="#EAF5EE" />
                    </svg>
                  </div>
                  <div className="hiw-pin hiw-pin-faded" style={{ left: '74%', top: '58%' }}>
                    <svg viewBox="0 0 24 24" fill="#9FB8AA">
                      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8Z" />
                      <circle cx="12" cy="10" r="3" fill="#EAF5EE" />
                    </svg>
                  </div>
                  <div className="hiw-pin hiw-pin-main">
                    <div className="hiw-ring" />
                    <svg viewBox="0 0 24 24" fill="#296148">
                      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8Z" />
                      <circle cx="12" cy="10" r="3" fill="#fff" />
                    </svg>
                  </div>
                  <div className="hiw-tag-apto">100% apto</div>
                </div>
              </div>
            </div>
            <div className="hiw-badge-num">2</div>
            <h3>Explorá el mapa</h3>
            <p>El mapa resalta automáticamente los comercios que se adaptan a tu perfil y atenúa los que no cumplen con tus restricciones.</p>
            <span className="hiw-tip">Filtrado en tiempo real</span>
          </div>

          {/* Step 3 */}
          <div className="hiw-step" ref={step3Ref}>
            <div className="hiw-illustration">
              <div>
                <div className="hiw-card3">
                  <div className="hiw-photo3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                      <path d="M3 8h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
                      <path d="M16 9h2a2.5 2.5 0 0 1 0 5h-2" />
                    </svg>
                    <div className="hiw-verified">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="hiw-line3 w60" />
                  <div className="hiw-stars-mini">
                    {[1, 2, 3, 4, 5].map(i => <span key={i} />)}
                  </div>
                  <div className="hiw-line3 w40" />
                  <div className="hiw-whatsapp-btn">
                    <svg viewBox="0 0 24 24" fill="#fff" style={{ width: '11px', height: '11px' }}>
                      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.4 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.7-2.8-1.1-4.6-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.7 1.9.8 2 .1.2.1.3 0 .5-.1.2-.1.3-.3.5-.1.2-.3.4-.4.5-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.2.1.7-.1 1.2Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="hiw-badge-num">3</div>
            <h3>Visitá con confianza</h3>
            <p>Cada ficha incluye menú, horarios, restricciones cubiertas y contacto directo por WhatsApp, para resolver cualquier duda antes de ir.</p>
            <span className="hiw-tip">Información verificada</span>
          </div>

        </div>
      </div>
    </section>
  )
}
