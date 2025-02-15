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
      // Core Node.js modules needed for Solana
      buffer: true,
      crypto: true,
      stream: true,
      events: true,
      util: true,
      assert: true,
      
      // Additional required polyfills
      http: true,
      https: true,
      zlib: true,
      url: true,
      string_decoder: true,
    },
  },

  serverDependenciesToBundle: [
    // UI dependencies
    "@phosphor-icons/react",
    "@icons-pack/react-simple-icons",
    "@remixicon/react",
    
    // Core Web3 dependencies
    "@solana/web3.js",
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    
    // Essential utilities
    "bs58",
    "tweetnacl",
  ],
}
