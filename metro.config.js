const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase v10 exports .cjs files — Metro needs to know about them
config.resolver.sourceExts.push('cjs');

// Firebase v10 uses private class fields (#field) that require Babel to transpile.
// By default Metro skips node_modules; this pattern forces Firebase through Babel.
config.transformer.transformIgnorePatterns = [
  'node_modules/(?!(react-native|@react-native|@react-native-community|expo|@expo|@unimodules|react-navigation|@react-navigation|firebase|@firebase)/)',
];

module.exports = config;
