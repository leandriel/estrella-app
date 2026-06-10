// These packages are excluded from Android auto-linking because their
// codegen paths exceed Windows MAX_PATH (260 chars) with this project directory depth.
// They are not used in the current screens (splash, login, dashboard).
//
// To remove these exclusions permanently, enable Windows Long Paths (requires admin):
//   reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f
// Then delete this file and run `expo run:android` again.
module.exports = {
  dependencies: {
    'react-native-gesture-handler': {
      platforms: { android: null },
    },
    'react-native-reanimated': {
      platforms: { android: null },
    },
    'react-native-worklets': {
      platforms: { android: null },
    },
  },
};
