# Fase 2 — Migración de datos a Firestore
**Fecha:** 2026-05-29
**Proyecto:** MapaApto
**Scope:** Migrar comercios y perfil de usuario de localStorage/mockData.js a Firestore. RF02 (parcial), RF03, RF04, RF06, RNF06.

---

## Resumen

Reemplazar el almacenamiento local (`localStorage` + `mockData.js`) por Cloud Firestore. La API pública de `AppContext` (`useApp()`) no cambia — todos los componentes existentes siguen funcionando sin modificaciones. Los comercios se sincronizan en tiempo real con `onSnapshot`. El perfil del usuario (nombre + restricciones) se persiste en `users/{uid}`.

---

## Enfoque elegido

**Enfoque A — AppContext mantiene su API, reemplaza localStorage por Firestore internamente.**
Cambio mínimo para los componentes consumidores. `mockData.js` se conserva solo para las constantes (`RESTRICTIONS`, `BUSINESS_TYPES`, `CERTIFICATIONS`).

---

## Estructura de Firestore

### Colección `businesses/{id}`

```
name:           string
type:           string   (restaurante | dietetica | supermercado | cafe)
address:        string
lat:            number
lng:            number
phone:          string
whatsapp:       string
hours:          string
description:    string
tags:           string[]
certifications: string[]
verified:       boolean
pending:        boolean
rating:         number | null
menu:           { name: string, price: number | null }[]
ownerId:        string | null
createdAt:      Timestamp
```

### Colección `users/{uid}` (extiende Fase 1)

```
email:          string        (Fase 1)
displayName:    string        (Fase 1)
role:           string        (Fase 1)
createdAt:      Timestamp     (Fase 1)
lastLogin:      Timestamp     (Fase 1)
profileName:    string        (nuevo en Fase 2)
restrictions:   string[]      (nuevo en Fase 2)
```

---

## Reglas de seguridad de Firestore

Reemplazar las reglas actuales en Firebase Console → Firestore → Reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }

    match /businesses/{businessId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
                            && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## Archivos nuevos

```
scripts/seed.js         ← carga los 10 comercios de mockData.js a Firestore (una sola vez)
```

## Archivos modificados

```
src/context/AppContext.jsx   ← reemplaza localStorage/mockData por Firestore + onSnapshot
src/pages/Perfil.jsx         ← usa profileName en lugar de name (campo renombrado)
```

## Archivos sin cambios

```
src/data/mockData.js              ← conserva RESTRICTIONS, BUSINESS_TYPES, CERTIFICATIONS, mockBusinesses (para seed)
src/pages/Mapa.jsx                ← sin cambios (sigue usando useApp())
src/pages/AdminPanel.jsx          ← sin cambios (sigue usando approveBusiness/rejectBusiness)
src/pages/RegistroComercio.jsx    ← sin cambios (AppContext agrega ownerId internamente)
src/pages/DetalleComercio.jsx     ← sin cambios
```

---

## AppContext — nueva implementación interna

### Estado

```js
const [businesses, setBusinesses] = useState([])
const [businessesLoading, setBusinessesLoading] = useState(true)
const [userProfile, setUserProfile] = useState({ profileName: '', restrictions: [] })
const [profileLoading, setProfileLoading] = useState(false)
```

### Suscripción a comercios (onSnapshot)

```
Al montar AppContext:
  → onSnapshot(collection(db, 'businesses'))
  → setBusinesses(docs) en cada actualización
  → setBusinessesLoading(false) al recibir primer resultado
  → cleanup al desmontar: cancela la suscripción
```

### Carga del perfil de usuario

```
Cuando currentUser cambia (useEffect dependiente de currentUser):
  → Si currentUser existe:
      → getDoc(users/{uid})
      → setUserProfile({ profileName, restrictions })
  → Si currentUser es null:
      → setUserProfile({ profileName: '', restrictions: [] })
```

### Funciones públicas

```js
updateProfile({ profileName, restrictions })
  → updateDoc(users/{uid}, { profileName, restrictions })
  → setUserProfile local solo si updateDoc resuelve sin error

addBusiness(data)
  → addDoc(businesses, { ...data, verified: false, pending: true,
                         ownerId: currentUser?.uid ?? null,
                         rating: null, createdAt: serverTimestamp() })

approveBusiness(id)
  → updateDoc(businesses/{id}, { verified: true, pending: false })

rejectBusiness(id)
  → deleteDoc(businesses/{id})
```

### API pública (sin cambios para los consumidores)

```js
const {
  businesses,           // array — igual que antes
  businessesLoading,    // nuevo: true mientras carga por primera vez
  userProfile,          // { profileName, restrictions } — antes era { name, restrictions }
  updateProfile,
  addBusiness,
  approveBusiness,
  rejectBusiness,
} = useApp()
```

**Nota de naming:** El campo `name` del perfil pasa a llamarse `profileName` para no colisionar con `displayName` de Firebase Auth. `Perfil.jsx` se actualiza para usar `profileName`.

---

## Script de seed

**Archivo:** `scripts/seed.js`

**Ejecución:** `node scripts/seed.js`

**Comportamiento:**
1. Conecta a Firestore usando las variables de entorno del proyecto
2. Verifica si la colección `businesses` ya tiene documentos
   - Si tiene datos → imprime "Ya existen comercios. Seed omitido." y termina
   - Si está vacía → inserta los 10 comercios de `mockData.js`
3. Agrega `ownerId: null` y `createdAt` a cada comercio
4. Imprime cuántos documentos se crearon

**Idempotente:** puede correrse múltiples veces sin duplicar datos.

---

## Migración de localStorage

No hay migración automática. Al iniciar, `AppContext` ignora completamente `localStorage`. Los datos anteriores quedan en el browser del usuario pero no se usan.

---

## Estados de carga y errores

### Carga

| Estado | Descripción |
|---|---|
| `businessesLoading = true` | Mapa muestra spinner hasta recibir primer snapshot |
| `profileLoading = true` | Perfil muestra spinner hasta que se lee users/{uid} |

### Errores

| Situación | Comportamiento |
|---|---|
| `onSnapshot` falla (sin conexión) | `businesses = []` + mensaje en Mapa: "No se pudieron cargar los comercios" |
| `addBusiness` falla | Error inline en RegistroComercio, formulario no se resetea |
| `approveBusiness` / `rejectBusiness` falla | Alerta en AdminPanel |
| `updateProfile` falla | Error en Perfil, datos locales no cambian (el estado solo se actualiza si Firestore confirma) |

### Cleanup

```
AppContext desmontado → cancela onSnapshot para evitar memory leaks
currentUser logout → limpia userProfile ({ profileName: '', restrictions: [] })
```

---

## Fuera de scope (Fase 2)

- Subida de documentos/fotos → Fase 3 (Firebase Storage)
- Deploy → Fase 3 (Firebase Hosting)
- Paginación de comercios (no necesaria para el MVP de 50 comercios — RNF06)
