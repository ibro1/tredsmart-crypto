import { flatRoutes } from 'remix-flat-routes';

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  tailwind: true,
  postcss: true,
  ignoredRouteFiles: ["**/.*"],
  
  routes: async (defineRoutes) => {
    return flatRoutes('routes', defineRoutes);
  },

  // Modern browser polyfill configuration
  browserNodeBuiltinsPolyfill: {
    modules: {
      buffer: true,
      crypto: true,
      stream: true,
      events: true,
      util: true,
      assert: true,
      http: true,
      https: true,
      zlib: true,
      url: true,
      string_decoder: true,
      os: true, // Added for Solana dependencies
      path: true // Needed for some crypto modules
    },
  },

  // Critical server-side bundling configuration
  serverDependenciesToBundle: [
    // UI dependencies
    "@phosphor-icons/react",
    "@icons-pack/react-simple-icons",
    "@remixicon/react",
    /^jayson/,
    /^@noble\/.*/,
    /^@scure\/.*/,
    'ed25519-hd-key',

    'bn.js',
    /^bn\.js/,
    // Core Web3 dependencies
    "@solana/web3.js",
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/buffer-layout",
    
    // Cryptography dependencies
    "bs58",
    "tweetnacl",
    "superstruct",
    "jayson",
    "@noble/hashes",
    "@noble/curves",
    "@noble/curves/ed25519",
    "@scure/bip39",
    "ed25519-hd-key",
    
    // Additional required polyfills
    "buffer-from",
    "process",
    "stream-browserify",
    "path-browserify"
  ],
  serverMainFields: ['module', 'main'],
  serverConditions: ['worker', 'browser', 'development'],

  // Modern ES module compatibility
  serverModuleFormat: "esm",
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true
  }
}