# Club Estrella del Sur — App React Native

## Proyecto
App móvil para el **Club Social y Deportivo Estrella del Sur** (Bariloche, desde 1958).
Cross-platform iOS/Android con Expo SDK 54.

## Stack
- **Framework:** Expo SDK 54 + React Native 0.81.5 + React 19
- **Lenguaje:** TypeScript (strict)
- **Backend:** Firebase (Auth + Firestore + Cloud Functions + Storage)
- **Estado:** Redux Toolkit (slices: `auth`, `app`)
- **Navegación:** React Navigation v6 (Stack + BottomTabs)
- **Notificaciones:** expo-notifications 0.32 (API nueva: `shouldShowBanner`/`shouldShowList`)
- **Pagos:** MercadoPago API (via Firebase Cloud Functions)
- **Íconos:** @expo/vector-icons (Ionicons)

## Colores del club
```
primary:   #C8102E  (rojo)
secondary: #003087  (azul navy)
white:     #FFFFFF
```
Todos los colores en `src/constants/colors.ts`

## Estructura de carpetas
```
src/
├── components/
│   ├── common/      Card, Badge, SectionHeader
│   └── dashboard/   MatchCard, NewsCard, TrainingCard, FeeCard
├── config/          firebase.ts  ← credenciales ya configuradas
├── constants/       colors.ts, divisions.ts
├── navigation/      AppNavigator, AuthNavigator, UserNavigator, AdminNavigator
├── screens/
│   ├── auth/        LoginScreen
│   ├── user/        Dashboard, Matches, News, Training, Fixture, Championships, Fees, Profile
│   └── admin/       AdminDashboard, ManageMatches, EditMatch, Players, StandingsAdmin, TournamentSetup
├── services/        authService, matchService, notificationService, mercadopagoService
├── store/           index.ts + slices/authSlice, appSlice
├── types/           index.ts  ← todos los tipos TypeScript
└── utils/           standings.ts, fixtures.ts
functions/           Firebase Cloud Functions (cuotas MP, webhooks, notifs broadcast)
scripts/             generate-assets.js (generador de íconos con jimp)
assets/              logo.png, icon.png, splash.png, adaptive-icon.png, etc. (YA GENERADOS)
```

## Divisiones del club (16 en total)
Definidas en `src/constants/divisions.ts`. IDs formato: `{sport}_{league}_{division}`.
- **Futsal ADEFUL:** primera, paralelo, 2016, sub16
- **Futsal LIFUBA:** primera, tercera, cuarta, quinta, sexta
- **Campo ADEFUL:** primera, sub16
- **Campo LIFUBA:** primera, tercera, cuarta, quinta, sexta

## Roles de usuario
- `user` → navega Dashboard, Matches, News, Training, Fixture, Championships, **Fees**
- `admin` → todo lo anterior + edición de partidos en vivo, registro de goles, gestión de torneos

## Firestore — colecciones
`users`, `matches`, `trainings`, `news`, `championships`, `standings`, `fees`, `notifications`

## Cloud Functions (functions/src/index.ts)
1. `generateMonthlyFees` — cron día 1 de cada mes, genera cuotas MP para todos los usuarios
2. `sendFeeReminders` — cron diario, recordatorios de vencimiento (días 5, 3, 1, 0, -1, -2, -3, -5)
3. `mercadopagoWebhook` — HTTP, recibe confirmación de pago y actualiza Firestore
4. `sendBroadcastNotification` — callable, admin envía notif masiva

## Errores conocidos y sus fixes
- **`babel-preset-expo` not found** → ya instalado como devDep, `babel.config.js` simplificado
- **`private properties not supported`** → `metro.config.js` creado para forzar transpilación de Firebase
- **`shouldShowAlert` deprecated** → cambiado a `shouldShowBanner` + `shouldShowList` en App.tsx y notificationService.ts

## Estado actual del proyecto
- ✅ Código completo y funcional
- ✅ Assets generados (logo, icon, splash, etc.)
- ✅ Firebase credenciales configuradas en `src/config/firebase.ts`
- ⏳ Pendiente: crear usuarios en Firebase Auth + documentos Firestore
- ⏳ Pendiente: configurar MercadoPago access token en Cloud Functions
- ⏳ Pendiente: deploy Cloud Functions (`cd functions && npm run deploy`)

## Comandos útiles
```bash
npx expo start --clear          # iniciar con caché limpia
cd functions && npm run deploy   # deploy cloud functions
node scripts/generate-assets.js # regenerar íconos
```

## Preferencias y notas
- Comentarios y mensajes de UI en **español**
- No agregar comentarios obvios en el código, solo los necesarios
- Imports con rutas relativas (no alias `@/`)
- Expo Go versión 54.0.8 en el dispositivo de prueba Android
