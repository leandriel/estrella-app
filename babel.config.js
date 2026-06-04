module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Explicitly transform private class fields (#field) and methods (#method())
      // so they work regardless of the Hermes version on the device.
      // All three must use the same loose setting.
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      // Reanimated plugin must be last
      'react-native-reanimated/plugin',
    ],
  };
};
