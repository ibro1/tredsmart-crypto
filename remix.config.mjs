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
      punycode: true,
    },
  },

  serverDependenciesToBundle: [
    "@phosphor-icons/react",
    "@icons-pack/react-simple-icons",
    "@remixicon/react",
    "zod"
  ],
}
