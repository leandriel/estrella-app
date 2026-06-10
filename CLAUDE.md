# Estrella del Sur — App

App móvil para el Club Social y Deportivo Estrella del Sur de Bariloche.
Plataformas: Android + iOS. Backend: Firebase. Pagos: MercadoPago.

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Expo (managed) | ~56.0.9 |
| Runtime | React Native | 0.86.0 |
| Lenguaje | React + TypeScript | 19.2.7 / ~5.8.3 |
| Navegación | expo-router (file-based) | ~56.2.9 |
| Splash nativo | expo-splash-screen | ~56.0.10 |

## Comandos

```bash
npm start            # Metro bundler (escanear QR con Expo Go)
npm run android      # Emulador Android
npm run ios          # Simulador iOS (requiere Mac)
npx expo start --tunnel  # Tunnel para dispositivo físico
```

## Arquitectura de rutas (expo-router)

```
app/
  _layout.tsx     # Root layout — Stack navigation, previene auto-hide del splash nativo
  index.tsx       # Splash animado: logo fade-in + scale → auto-navega a /login a los 2.8s
  login.tsx       # Login: email + password → navega a /dashboard (TODO: Firebase Auth)
  dashboard.tsx   # Pantalla principal post-login
```

## Tema / Colores

Definidos en `constants/Colors.ts`:

| Variable | Hex | Uso |
|----------|-----|-----|
| `primary` | `#CC0A20` | Rojo del club — botones, acentos |
| `secondary` | `#1B4FA8` | Azul del escudo — banners, links |
| `gold` | `#F5B800` | Estrella dorada — badges |

## Assets

- `assets/images/logo.jpg` — Escudo del club (fuente: `escudo estrella del sur.jpg`)

## New Architecture

`newArchEnabled: true` en app.json. Usar siempre `useNativeDriver: true` en animaciones Animated.

## Pendiente / Roadmap

- [ ] Firebase Auth (email/password)
- [ ] Firebase Firestore (socios, noticias)
- [ ] MercadoPago — pago de cuotas
- [ ] Push notifications (expo-notifications)
- [ ] Pantalla de perfil del socio
- [ ] Sección de fixtures / resultados

## EAS Build

```bash
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

Bundle IDs:
- Android: `com.estrelladelsur.app`
- iOS: `com.estrelladelsur.app`
