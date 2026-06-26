# Stack Tecnológico — MapaApto

Descripción de cada tecnología usada en el proyecto, con el rol que cumple y el motivo de su elección.

---

## Frontend Core

### React 19
**Rol:** Librería principal de UI.  
**Por qué:** Permite construir interfaces declarativas basadas en componentes reutilizables. La versión 19 trae mejoras de rendimiento y el nuevo compilador de React. Es el estándar de la industria para SPAs complejas con estado dinámico.

### Vite 7
**Rol:** Bundler y servidor de desarrollo.  
**Por qué:** Arranca instantáneamente gracias a ESModules nativos, sin necesidad de empaquetar todo el proyecto antes de servir. El HMR (Hot Module Replacement) es casi inmediato, lo que acelera mucho el desarrollo. Reemplaza a Create React App, que está deprecado.

### React Router DOM 7
**Rol:** Enrutamiento del lado del cliente.  
**Por qué:** Permite navegar entre páginas sin recargar el browser, manteniendo la experiencia de SPA. Maneja rutas como `/mapa`, `/comercio/:id`, `/admin`, etc. Es la solución de routing más madura del ecosistema React.

---

## Backend as a Service — Firebase

### Firebase Authentication
**Rol:** Gestión de usuarios y sesiones.  
**Por qué:** Provee autenticación lista para usar con múltiples proveedores (Google, Apple, Facebook, email/password) sin necesidad de construir ni mantener un servidor de autenticación propio. Maneja tokens, sesiones y seguridad de forma transparente.

### Cloud Firestore
**Rol:** Base de datos principal.  
**Por qué:** Base de datos NoSQL en tiempo real, serverless. Permite escalar sin administrar infraestructura. Las reglas de seguridad (`firestore.rules`) permiten controlar el acceso directamente desde la base de datos según el rol del usuario (dueño de comercio vs. admin vs. visitante).

### Firebase Storage
**Rol:** Almacenamiento de archivos (certificados, menús, fotos de comercios).  
**Por qué:** Se integra nativamente con Firebase Auth para validar permisos antes de subir archivos. Evita montar un servidor propio para el manejo de uploads.

### Firebase Hosting
**Rol:** Deploy y hosting de la app en producción.  
**Por qué:** Se integra directamente con el build de Vite (`dist/`). Soporta SPA rewrites (todas las rutas apuntan a `index.html`), CDN global, HTTPS automático y deploys instantáneos.

### Firebase Admin SDK (`firebase-admin`)
**Rol:** Acceso privilegiado a Firestore desde scripts Node.js.  
**Por qué:** Usado en los scripts de seed (`scripts/seed.js`, `scripts/seed-from-pdf.js`) para poblar la base de datos en masa sin pasar por las reglas de seguridad del cliente. Corre solo en entornos de servidor/local, nunca en el browser.

---

## Mapa

### Leaflet + React Leaflet
**Rol:** Renderizado del mapa interactivo con marcadores de comercios.  
**Por qué:** Leaflet es la librería de mapas open-source más usada. Es liviana, no requiere API key (a diferencia de Google Maps), y usa tiles de OpenStreetMap de forma gratuita. `react-leaflet` provee los wrappers de React para integrarla sin manejar el DOM manualmente.

---

## HTTP y Comunicaciones

### Axios
**Rol:** Cliente HTTP para llamadas a APIs externas.  
**Por qué:** API más ergonómica que `fetch` nativo: maneja automáticamente la serialización JSON, interceptores, y errores HTTP con mensajes claros. Usado para integraciones con servicios externos (por ejemplo, geocodificación).

### EmailJS (`@emailjs/browser`)
**Rol:** Envío de emails transaccionales desde el cliente.  
**Por qué:** Permite enviar emails (notificaciones a admins, confirmaciones a dueños de comercios) sin necesidad de un servidor backend propio. Se conecta directamente desde el browser usando templates configurados en el dashboard de EmailJS.

---

## UI y Componentes

### Lucide React
**Rol:** Librería de íconos SVG.  
**Por qué:** Íconos limpios, consistentes y bien mantenidos. Se importan como componentes React individuales, lo que permite tree-shaking (solo se incluyen en el bundle los íconos que realmente se usan).

### React Datepicker
**Rol:** Selector de fechas en formularios.  
**Por qué:** Componente accesible y personalizable para seleccionar fechas sin construirlo desde cero. Usado en los formularios de registro y edición de comercios.

---

## Calidad de Código

### ESLint 9
**Rol:** Linter estático de JavaScript/JSX.  
**Por qué:** Detecta errores y malas prácticas antes de que lleguen a producción. Configurado con los plugins `eslint-plugin-react-hooks` (previene errores comunes con hooks) y `eslint-plugin-react-refresh` (compatibilidad con HMR de Vite).

### TypeScript Types (`@types/react`, `@types/react-dom`)
**Rol:** Definiciones de tipos para autocompletado en el editor.  
**Por qué:** El proyecto usa JavaScript puro (no TypeScript), pero tener los tipos instalados permite que editores como VS Code ofrezcan autocompletado e inferencia de props de React sin migrar el codebase.

---

## Herramientas de Desarrollo

### Scripts Node.js (`scripts/`)
**Rol:** Utilidades de mantenimiento y seed de datos.  
**Por qué:** `seed.js` y `seed-from-pdf.js` permiten cargar datos de comercios en masa a Firestore desde archivos locales. `update-hours.js` permite actualizar horarios de forma programática. Evitan hacer cambios manuales en la base de datos.

---

## Resumen Visual

| Capa | Tecnología |
|---|---|
| UI | React 19 |
| Build | Vite 7 |
| Routing | React Router DOM 7 |
| Auth | Firebase Authentication |
| Base de datos | Cloud Firestore |
| Archivos | Firebase Storage |
| Hosting | Firebase Hosting |
| Mapa | Leaflet + React Leaflet |
| HTTP | Axios |
| Emails | EmailJS |
| Íconos | Lucide React |
| Fechas | React Datepicker |
| Linting | ESLint 9 |
