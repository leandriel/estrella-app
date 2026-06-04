# Setup Guide — Estrella del Sur App

## 1. Requisitos previos

- Node.js 18+
- npm o yarn
- Expo CLI: `npm install -g expo-cli eas-cli`
- Firebase CLI: `npm install -g firebase-tools`
- Cuenta Firebase (gratuita)
- Cuenta MercadoPago del club (con acceso a API)

---

## 2. Firebase — Configuración

### 2.1 Crear proyecto Firebase
1. Ir a https://console.firebase.google.com
2. "Agregar proyecto" → nombre: `estrella-del-sur`
3. Habilitar Google Analytics (opcional)

### 2.2 Habilitar servicios
- **Authentication** → Email/Password
- **Firestore Database** → Modo producción
- **Storage** → Para fotos de jugadores/noticias
- **Cloud Functions** → Requiere plan Blaze (pago por uso, muy bajo costo)

### 2.3 Obtener credenciales
Configuración del proyecto (ícono ⚙️) → Tus apps → Agregar app → Web

Copiar el `firebaseConfig` y pegarlo en:
`src/config/firebase.ts`

### 2.4 Android — google-services.json
- Configuración → Android → Descargar `google-services.json`
- Colocarlo en la raíz del proyecto

### 2.5 iOS — GoogleService-Info.plist
- Configuración → iOS → Descargar `GoogleService-Info.plist`
- Se usa en el build con EAS

---

## 3. Reglas de Firestore

Ir a Firestore → Reglas, pegar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if isAdmin() || isOwner(userId);
    }
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    match /trainings/{trainingId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    match /news/{newsId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    match /championships/{champId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    match /standings/{standingId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    match /fees/{feeId} {
      allow read: if isAdmin() || isOwner(resource.data.userId);
      allow write: if isAdmin();
    }
    match /notifications/{notifId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

---

## 4. Crear el primer usuario Admin

1. En Firebase Auth → Agregar usuario manualmente (email + contraseña)
2. En Firestore → Colección `users` → Nuevo documento con ID = UID del usuario:
```json
{
  "id": "UID_DEL_ADMIN",
  "email": "admin@estrelladelsur.com",
  "displayName": "Administrador",
  "role": "admin",
  "createdAt": 1700000000000
}
```

---

## 5. Crear usuarios normales (socios)

Por cada socio/jugador:
1. Crear en Firebase Auth
2. Crear documento en Firestore `users/{uid}`:
```json
{
  "id": "UID",
  "email": "jugador@email.com",
  "displayName": "Nombre Apellido",
  "role": "user",
  "divisionId": "futsal_adeful_primera",
  "playerProfile": {
    "userId": "UID",
    "divisionId": "futsal_adeful_primera",
    "jerseyNumber": 10,
    "position": "Delantero",
    "totalGoals": 0,
    "isActive": true
  },
  "createdAt": 1700000000000
}
```

---

## 6. MercadoPago — Cloud Functions

### 6.1 Obtener Access Token
1. Ir a https://www.mercadopago.com.ar/developers/panel
2. Mis aplicaciones → Crear aplicación
3. Copiar el **Access Token de producción**

### 6.2 Configurar Firebase Functions
```bash
cd functions
npm install
firebase login
firebase use --add   # seleccionar tu proyecto

# Configurar el access token (no hardcodear en el código)
firebase functions:config:set mercadopago.access_token="APP_USR-xxxx"

# Deploy de functions
npm run deploy
```

### 6.3 Configurar webhook en MercadoPago
En el panel de MP → Webhooks:
- URL: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/mercadopagoWebhook`
- Eventos: `payment`

---

## 7. Instalar y correr la app

```bash
cd "Estrella del Sur"
npm install

# Desarrollo
npx expo start

# Escanear QR con Expo Go (Android/iOS)
```

---

## 8. Assets — Íconos y splash

Colocar en `assets/`:
- `logo.png` — Logo del club (PNG transparente)
- `icon.png` — 1024×1024px (fondo rojo #C8102E)
- `splash.png` — 1284×2778px (fondo rojo, logo centrado)
- `adaptive-icon.png` — 1024×1024px
- `notification-icon.png` — 96×96px blanco s/fondo

---

## 9. Build para tiendas (EAS)

```bash
# Configurar EAS
eas init

# Build Android (.aab para Play Store)
eas build --platform android --profile production

# Build iOS (.ipa para App Store)
eas build --platform ios --profile production
```

---

## 10. Estructura de datos Firestore

### Colección `matches`
```
matchId: {
  divisionId: string,        // "futsal_adeful_primera"
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  status: "upcoming"|"live"|"finished"|"suspended"|"postponed",
  scheduledAt: timestamp,
  venue: string,
  round: string,             // "Fecha 1"
  goals: Goal[],
  championshipId: string,
  tournamentGroup: string,   // "group_0" para fase de grupos
  isHomeEstrella: boolean,
  suspensionReason: string
}
```

### Colección `championships`
```
champId: {
  name: string,
  season: string,
  divisionId: string,
  phase: "league"|"group"|"knockout",
  teams: string[],
  groups: [{id, name, teams, qualifyCount}],
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  isActive: boolean,
  startDate: timestamp
}
```

---

## 11. Divisiones disponibles

| ID | Descripción |
|---|---|
| futsal_adeful_primera | Futsal ADEFUL - Primera |
| futsal_adeful_paralelo | Futsal ADEFUL - Paralelo |
| futsal_adeful_2016 | Futsal ADEFUL - Cat. 2016 |
| futsal_adeful_sub16 | Futsal ADEFUL - Sub 16 |
| futsal_lifuba_primera | Futsal LIFUBA - Primera |
| futsal_lifuba_tercera | Futsal LIFUBA - Tercera |
| futsal_lifuba_cuarta | Futsal LIFUBA - Cuarta |
| futsal_lifuba_quinta | Futsal LIFUBA - Quinta |
| futsal_lifuba_sexta | Futsal LIFUBA - Sexta |
| campo_adeful_primera | Campo ADEFUL - Primera |
| campo_adeful_sub16 | Campo ADEFUL - Sub 16 |
| campo_lifuba_primera | Campo LIFUBA - Primera |
| campo_lifuba_tercera | Campo LIFUBA - Tercera |
| campo_lifuba_cuarta | Campo LIFUBA - Cuarta |
| campo_lifuba_quinta | Campo LIFUBA - Quinta |
| campo_lifuba_sexta | Campo LIFUBA - Sexta |
