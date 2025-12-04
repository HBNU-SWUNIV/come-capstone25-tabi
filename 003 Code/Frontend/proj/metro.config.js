// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname; // ✅ projectRoot 선언
const defaultConfig = getDefaultConfig(projectRoot);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    assetExts: [
      ...defaultConfig.resolver.assetExts,
      'obj',
      'mtl',
      'JPG',
      'vrx',
      'hdr',
      'gltf',
      'glb',
      'bin',
      'arobject',
      'gif',
      'png',
    ],
  },
});
