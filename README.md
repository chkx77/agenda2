# Agenda Pro — Sistema completo (propietario + clientes)

## Cómo funciona

| Ruta | Quién la usa | Auth requerida |
|------|-------------|----------------|
| `/` | Propietario | Sí (email/pass) |
| `/turno/{uid}` | Clientes | No |

El propietario se loguea, configura su disponibilidad y comparte
el link `/turno/{su-uid}` con sus clientes. Los clientes entran,
eligen fecha y hora, y dejan nombre + teléfono. Sin registro.

---

## Setup Firebase (10 min)

### 1. Crear proyecto
- https://console.firebase.google.com → Agregar proyecto → desactivar Analytics

### 2. Registrar app web
- Panel → ícono `</>` → copiar `firebaseConfig` → pegarlo en `src/firebase.js`

### 3. Authentication
- Authentication → Comenzar → Email/Contraseña → Habilitar → Guardar

### 4. Firestore
- Firestore Database → Crear base de datos → Modo producción → us-east1

### 5. Reglas de seguridad (IMPORTANTE)
Firestore → Reglas → reemplazar todo con esto y publicar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // El propietario puede leer/escribir TODO su espacio
    match /propietarios/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Los clientes pueden LEER config y turnos del propietario (para ver disponibilidad)
    match /propietarios/{uid} {
      allow read: if true;
    }
    match /propietarios/{uid}/turnos/{turnoId} {
      allow read: if true;
      // Solo pueden CREAR turnos nuevos (no modificar ni eliminar los ajenos)
      allow create: if request.auth == null
                    && request.resource.data.keys().hasAll(['clienteNombre','clienteTel','fecha','hora','estado'])
                    && request.resource.data.estado == 'pendiente';
    }
    match /propietarios/{uid}/bloqueos/{fecha} {
      allow read: if true;
    }
  }
}
```

---

## Correr localmente

```bash
npm install
npm run dev
# → http://localhost:3000         (panel propietario)
# → http://localhost:3000/turno/{uid}  (vista cliente)
```

---

## Deploy en Vercel

```bash
# Opción 1: desde GitHub (recomendado)
# Subir a repo → vercel.com → New Project → importar → Deploy

# Opción 2: CLI
npm install -g vercel
npm run build
vercel --prod
```

El archivo `vercel.json` ya está configurado para que las rutas
`/turno/:uid` no den 404.

---

## Flujo del propietario

1. Entra a `tu-dominio.com` → se registra (primera vez) o loguea
2. Va a **Configuración** → define horarios, duración, días hábiles
3. Copia el **Link público** y lo comparte (WhatsApp, Instagram, etc.)
4. En la agenda ve todos los turnos en tiempo real
5. Puede bloquear fechas desde la vista Mes (ícono del candado)
6. Puede agregar turnos manualmente, cambiar estado, marcar como cobrado

## Flujo del cliente

1. Recibe el link → abre en cualquier dispositivo
2. Ve el calendario con días disponibles resaltados
3. Elige fecha → ve los horarios disponibles de ese día
4. Elige hora → pone nombre y teléfono → confirma
5. Recibe un **código de cancelación** (6 letras) — debe guardarlo
6. Para cancelar: botón "Cancelar turno" → ingresa ID del turno + código

---

## Archivos del proyecto

```
src/
├── main.jsx        # Entry point
├── Root.jsx        # Router: /turno/:uid vs panel propietario
├── firebase.js     # ← EDITÁ ESTE con tu config
├── db.js           # Todas las ops de Firestore
├── helpers.js      # Constantes, utilidades, fechas
├── ui.jsx          # Componentes compartidos (Btn, Modal, icons...)
├── AuthScreen.jsx  # Login/registro del propietario
├── OwnerApp.jsx    # Panel completo del propietario
└── BookingView.jsx # Vista pública para clientes
vercel.json         # Routing SPA para Vercel
```
