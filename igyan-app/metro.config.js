// Fast Metro setup for iGyan (Expo SDK 54, Metro 0.83).
//
// Why this file exists: `npx expo run:ios|android` recompiles all native
// code on every run. The daily loop should be `npm run ios` / `npm run android`,
// which reuse one dev-client build and only rebundle JS. This config makes
// that JS rebundle as cheap as possible:
//
// - hermesParser: faster transform path (matches the Hermes engine we ship).
// - unstable_enablePackageExports: lets Metro use packages' `exports` maps,
//   which shortens resolution for ESM-heavy deps (verified in Metro 0.83).
//
// Lazy bundling (only bundle the route you open) is a CLI flag, not a config
// key, so the npm scripts pass `--lazy`. Do not add `resetCache: true` here.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  hermesParser: true,
};

config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
};

module.exports = config;
