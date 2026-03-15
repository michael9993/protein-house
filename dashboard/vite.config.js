import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { CodeInspectorPlugin } from "code-inspector-plugin";
import { copyFileSync, mkdirSync } from "fs";
import path from "path";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { defineConfig, loadEnv, searchForWorkspaceRoot } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";

const copyNoopSW = () => ({
  name: "copy-noop-sw",
  apply: "build",
  writeBundle: () => {
    mkdirSync(path.resolve("build", "dashboard"), { recursive: true });
    copyFileSync(path.resolve("assets", "sw.js"), path.resolve("build", "dashboard", "sw.js"));
  },
});

const copyOgImage = () => ({
  name: "copy-og-image",
  apply: "build",
  writeBundle: () => {
    mkdirSync(path.resolve("build", "dashboard"), { recursive: true });
    copyFileSync(path.resolve("assets", "og.png"), path.resolve("build", "dashboard", "og.png"));
  },
});

// Plugin to bypass host checking and fix HMR for tunnel URLs
// This works around Vite 6.x issues with allowedHosts and HMR WebSocket connections
const bypassHostCheckPlugin = () => ({
  name: "bypass-host-check-dev",
  apply: "serve", // Only in dev server
  configureServer(server) {
    // Override the checkOrigin function to allow all hosts in development
    const originalCheckOrigin = server.config.server.checkOrigin;
    if (originalCheckOrigin) {
      server.config.server.checkOrigin = () => true;
    }
    // Also modify the middleware to bypass host checks
    server.middlewares.stack = server.middlewares.stack.filter((layer) => {
      // Remove Vite's host check middleware if it exists
      return !(layer.handle && layer.handle.toString().includes("Invalid Host header"));
    });

    // Fix HMR WebSocket connection for tunnel URLs
    // The WebSocket server needs to handle connections from tunnel URLs
    // Vite's HMR will automatically use the request's host when host is undefined
  },
});

/** @type {import('vite').UserConfig} */

export default defineConfig(({ command, mode }) => {
  const isDev = command !== "build";
  // Load environment variables from process.env (Docker) or .env file
  // In Docker, env vars are passed directly via docker-compose, so loadEnv will read from process.env
  // envDir: ".." is for local development when .env is in parent directory
  const env = loadEnv(mode, process.cwd(), "");
  /*
    Using explicit env variables, there is no need to expose all of them (security).
  */
  const {
    NODE_ENV,
    API_URL,
    VITE_API_URL, // Vite-prefixed env vars are automatically exposed to client
    VITE_DISABLE_STRICT_MODE, // Set to "true" to disable React StrictMode (helps EditorJS/Combobox in dev and is baked in at build time)
    DASHBOARD_TUNNEL_URL,
    SW_INTERVAL,
    IS_CLOUD_INSTANCE,
    APP_MOUNT_URI,
    SENTRY_DSN,
    SENTRY_RELEASE,
    ENVIRONMENT,
    STATIC_URL,
    APPS_MARKETPLACE_API_URL,
    EXTENSIONS_API_URL,
    APPS_TUNNEL_URL_KEYWORDS,
    SKIP_SOURCEMAPS,
    CUSTOM_VERSION,
    FLAGS_SERVICE_ENABLED,
    LOCALE_CODE,
    POSTHOG_KEY,
    POSTHOG_EXCLUDED_DOMAINS,
    POSTHOG_HOST,
    SENTRY_AUTH_TOKEN,
    SENTRY_ORG,
    SENTRY_PROJECT,
    ENABLED_SERVICE_NAME_HEADER,
    ONBOARDING_USER_JOINED_DATE_THRESHOLD,
    // Multi-schema support
    FF_USE_STAGING_SCHEMA,

    npm_package_version,
  } = env;

  const base = STATIC_URL ?? "/";
  // Strip protocol from tunnel URL for Vite allowedHosts (needs hostname only)
  const dashboardTunnelHost = DASHBOARD_TUNNEL_URL
    ? DASHBOARD_TUNNEL_URL.replace(/^https?:\/\//, "")
    : "";
  const featureFlagsEnvs = Object.fromEntries(
    Object.entries(env).filter(([flagKey]) => flagKey.startsWith("FF_")),
  );

  const sourcemap = !SKIP_SOURCEMAPS;

  const plugins = [
    react(),
    CodeInspectorPlugin({
      bundler: "vite",
    }),
    ...(isDev ? [bypassHostCheckPlugin()] : []),
    createHtmlPlugin({
      entry: path.resolve(__dirname, "src", "index.tsx"),
      template: "index.html",
      inject: {
        data: {
          API_URL,
          DASHBOARD_TUNNEL_URL,
          APP_MOUNT_URI,
          APPS_MARKETPLACE_API_URL,
          EXTENSIONS_API_URL,
          APPS_TUNNEL_URL_KEYWORDS,
          IS_CLOUD_INSTANCE,
          LOCALE_CODE,
          POSTHOG_KEY,
          POSTHOG_EXCLUDED_DOMAINS,
          POSTHOG_HOST,
          ONBOARDING_USER_JOINED_DATE_THRESHOLD,
          ENABLED_SERVICE_NAME_HEADER,
        },
      },
    }),
    copyOgImage(),
    copyNoopSW(),
  ];

  if (!isDev) {
    console.log("Enabling service worker...");

    plugins.push(
      sentryVitePlugin({
        authToken: SENTRY_AUTH_TOKEN,
        org: SENTRY_ORG,
        project: SENTRY_PROJECT,
      }),
    );
  }

  const globals = {
    /*
      "qs" package uses 'get-intrinsic' whish refers to the global object, we need to recreate it.
      Issue presents only on development mode.
    */
    ...(isDev ? { global: {} } : {}),
    FLAGS_SERVICE_ENABLED: FLAGS_SERVICE_ENABLED === "true",
    // Keep all feature flags from env in global variable
    FLAGS: JSON.stringify(featureFlagsEnvs),
  };

  return {
    root: "src",
    base,
    // envDir: ".." - Look for .env in parent directory (for local dev)
    // In Docker, environment variables are passed directly via docker-compose,
    // so loadEnv will read from process.env automatically
    envDir: "..",
    server: {
      port: 9000, // Must match the port in docker-compose.dev.yml
      host: "0.0.0.0", // Allow external connections (required for Docker)
      // In development, allow all hosts to support dynamic tunnel URLs
      // For Vite 6.x, we use multiple approaches:
      // 1. allowedHosts: true (may have bugs in some versions)
      // 2. Plugin to bypass host check (see bypassHostCheckPlugin above)
      // 3. If still blocked, explicitly add the domain to this array
      allowedHosts: [
            "localhost",
            "127.0.0.1",
            dashboardTunnelHost, // hostname only, e.g. dash.pawzenpets.shop
          ].filter(Boolean),
      // Enable HMR (Hot Module Replacement) for development
      // When using tunnel URLs, HMR needs to use the tunnel host, not localhost
      // Cloudflare tunnels forward HTTPS to HTTP, so we need to handle this carefully
      hmr: isDev
        ? {
            // Auto-detect host from request (will use tunnel URL)
            host: undefined,
            // Auto-detect port from request
            port: undefined,
            // Use the page's protocol (https -> wss, http -> ws)
            // This is handled automatically by Vite's client, but we ensure it's set
            protocol: undefined, // Vite will use the page's protocol automatically
          }
        : undefined,
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd()), "../.."],
      },
      // Watch configuration for better file watching in Docker
      watch: {
        usePolling: true, // Required for Docker volumes on Windows
        interval: 2000, // Poll every 2 seconds
        ignored: [
          "**/node_modules/**",
          "**/build/**",
          "**/.next/**",
          "**/.git/**",
          "**/dist/**",
          "**/*.log",
          "**/coverage/**",
        ],
      },
    },
    preview: {
      port: 9000,
      host: "0.0.0.0",
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        dashboardTunnelHost, // hostname only, e.g. dash.pawzenpets.shop
      ].filter(Boolean),
    },
    define: {
      ...globals,

      /*
        We still have references to process.env, we need to peserve them as workaround.
      */
      "process.env": {
        NODE_ENV,
        API_URL,
        DASHBOARD_TUNNEL_URL,
        SW_INTERVAL,
        IS_CLOUD_INSTANCE,
        APP_MOUNT_URI,
        SENTRY_DSN,
        ENVIRONMENT,
        CUSTOM_VERSION,
        LOCALE_CODE,
        SENTRY_RELEASE,
        STATIC_URL,
        POSTHOG_KEY,
        POSTHOG_EXCLUDED_DOMAINS,
        POSTHOG_HOST,
        ENABLED_SERVICE_NAME_HEADER,
        ONBOARDING_USER_JOINED_DATE_THRESHOLD,
        // Multi-schema support
        FF_USE_STAGING_SCHEMA,

        RELEASE_NAME: npm_package_version,
      },
    },
    build: {
      sourcemap,
      minify: true,
      emptyOutDir: true,
      outDir: "../build/dashboard",
      assetsDir: ".",
      // Enable module preloading for faster navigation
      modulePreload: {
        polyfill: true,
      },
      commonjsOptions: {
        /*
          Fix dynamic imports by "require", Necessary for react-editor-js
          Ref: https://github.com/Jungwoo-An/react-editor-js/blob/e58b7ba5e66d07912bb78f65ac911e4018d363e1/packages/react-editor-js/src/factory.ts#L5
         */
        transformMixedEsModules: true,
      },
      rollupOptions: {
        plugins: [nodePolyfills()],
        maxParallelFileOps: 2,
        cache: false,
        onwarn(warning, warn) {
          // Suppress "dynamic import will not move module into another chunk" when a module
          // is both lazy-loaded (e.g. Auth, Configuration) and statically imported elsewhere
          // (e.g. useUser from @dashboard/auth). The build is correct; the dynamic import
          // just doesn't create a separate chunk because the module is already in the main bundle.
          if (warning.message?.includes("dynamic import will not move module into another chunk")) {
            return;
          }
          warn(warning);
        },
        output: {
          sourcemap,
          manualChunks: id => {
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        "esm-dep > cjs-dep",
        "@saleor/macaw-ui-next",
        "react",
        "react-dom",
        "react-router-dom",
        "@apollo/client",
        "graphql",
        "react-intl",
        "lodash",
      ],
      entries: ["src/index.tsx"], // Optimize entry point for faster startup
      // Disable force to prevent cache corruption
      // Clear cache manually if needed: rm -rf node_modules/.vite
      force: false,
      // Disable cache to prevent corruption issues in Docker
      // Cache will be rebuilt on each restart but prevents missing chunk errors
      holdUntilCrawlEnd: false,
      esbuildOptions: {
        // Ensure all exports are preserved
        preserveSymlinks: false,
      },
    },
    resolve: {
      dedupe: ["react", "react-dom", "clsx"],
      alias: {
        "@assets": path.resolve(__dirname, "./assets"),
        "@locale": path.resolve(__dirname, "./locale"),
        "@dashboard": path.resolve(__dirname, "./src"),
        src: path.resolve(__dirname, "./src"),
      },
    },
    plugins,
    esbuild: { jsx: "automatic" },
  };
});
















