const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const localNodeModules = path.resolve(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
  localNodeModules,
  path.resolve(workspaceRoot, 'node_modules'),
];

// Packages with native code that MUST resolve to a single version.
// Pin them to the local node_modules so we never get duplicate native registrations.
const nativePackagesToPin = [
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-gesture-handler',
  'react-native-reanimated',
  '@react-native-async-storage/async-storage',
  'react-native-svg',
];

// expo-font@14 (workspace root) calls getLoadedFonts() which Expo Go SDK 50 doesn't support.
// Force it to resolve to the SDK-50-compatible version bundled inside the `expo` package.
const expoFontSdk50Path = path.resolve(
  workspaceRoot,
  'node_modules/expo/node_modules/expo-font'
);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Pin expo-font to the SDK 50 compatible version (11.x) bundled inside expo itself
  if (moduleName === 'expo-font' || moduleName.startsWith('expo-font/')) {
    const suffix = moduleName.slice('expo-font'.length);
    const target = path.resolve(expoFontSdk50Path + suffix);
    return { filePath: require.resolve(target), type: 'sourceFile' };
  }

  // Force axios to use the browser build instead of the Node.js build
  if (moduleName === 'axios') {
    return {
      filePath: path.resolve(workspaceRoot, 'node_modules/axios/dist/browser/axios.cjs'),
      type: 'sourceFile',
    };
  }

  // Pin native packages to the local node_modules to avoid duplicate registrations
  const pinnedPkg = nativePackagesToPin.find(
    pkg => moduleName === pkg || moduleName.startsWith(pkg + '/')
  );
  if (pinnedPkg) {
    const suffix = moduleName.slice(pinnedPkg.length);
    const localPath = path.resolve(localNodeModules, pinnedPkg + suffix);
    if (fs.existsSync(localPath)) {
      return { filePath: require.resolve(localPath), type: 'sourceFile' };
    }
  }

  return (originalResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
