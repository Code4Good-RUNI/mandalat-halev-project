const path = require('path');
const dotenvx = require('@dotenvx/dotenvx');

const mobileDir = __dirname;
// Load order (later wins with overload): shared .env.mobile → optional localhost preset → gitignored .env.mobile.local
// Use `EXPO_APP_TARGET=local npm run mobile:start:local` (see root package.json) to point at a dev machine API.
// iOS simulator: `npm run mobile:start:ios` (or `mobile:start:ios:local`). Physical phone: `npm run mobile:start` then scan the QR code in Expo Go (same Wi‑Fi as your computer, or use Dev Tools → tunnel).
const envPaths = [path.join(mobileDir, '.env.mobile')];
if (process.env.EXPO_APP_TARGET === 'local') {
  envPaths.push(path.join(mobileDir, '.env.mobile.local'));
}

dotenvx.config({
  path: envPaths,
  envKeysFile: path.join(mobileDir, '.env.mobile.keys'),
  ignore: ['MISSING_ENV_FILE'],
  overload: true,
  quiet: true,
});

const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('@expo/metro-config');
const { mergeConfig } = require('metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: 'mobile',
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
};

module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // Change this to true to see debugging info.
  // Useful if you have issues resolving modules
  debug: false,
  // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
  extensions: [],
  // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
  watchFolders: [],
});
