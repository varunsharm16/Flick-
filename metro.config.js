const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-reanimated/lib/module/Animated': path.resolve(
    __dirname,
    'shims/react-native-reanimated-animated.js'
  )
};

module.exports = config;
