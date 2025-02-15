import { flatRoutes } from 'remix-flat-routes';

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  tailwind: true,
  postcss: true,
  ignoredRouteFiles: ["**/.*"],
  
  routes: async (defineRoutes) => {
    return flatRoutes('routes', defineRoutes);
  },

  browserNodeBuiltinsPolyfill: {
    modules: {
      // Essential for Solana wallet
      buffer: true,
      crypto: true,
      stream: true,
      http: true,
      https: true,
      zlib: true,
      
      // Required for web3 functionality
      events: true,
      string_decoder: true,
      util: true,
      
      // Optional but recommended for better compatibility
      assert: true,
      url: true,

      // Add bigint support
      'bigint-buffer': true,
    },
  },

  serverDependenciesToBundle: [
    // Existing dependencies
    "@phosphor-icons/react",
    "@icons-pack/react-simple-icons",
    "@remixicon/react",
    
    // Solana and related dependencies
    "@solana/web3.js",
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "bs58",
    "bigint-buffer",
    "superstruct",
    "rpc-websockets",
    // Bundle the entire jayson package instead of specific paths
    "jayson",
    "bn.js",
    "borsh",
  ],
}
