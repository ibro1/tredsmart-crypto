import { flatRoutes } from 'remix-flat-routes';

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  tailwind: true,
  postcss: true,

  ignoredRouteFiles: ["**/.*"],
  routes: async (defineRoutes) => {
    return flatRoutes('routes', defineRoutes);
  },
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",

 
  browserNodeBuiltinsPolyfill: {
    modules: {
      // Core modules
      punycode: true,
      http: true,
      https: true,
      url: true,
      buffer: true,
      stream: true,
      crypto: true,
      
      // Additional required modules
      string_decoder: true,
      assert: true,
      zlib: true,
      util: true,
      events: true,
      
      // Common dependencies
      os: true,
      path: true,
      fs: true,
      vm: true,
    },
  },

  serverDependenciesToBundle: [
    "@phosphor-icons/react",
    "@icons-pack/react-simple-icons",
    "@remixicon/react",
  ],
}
