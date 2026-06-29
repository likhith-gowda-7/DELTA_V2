import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const manifest = {
  name: "DELTA Chat",
  short_name: "DELTA",
  description: "Modern real-time communication platform",
  theme_color: "#6366f1",
  background_color: "#ffffff",
  display: "standalone",
  orientation: "portrait",
  scope: "/",
  start_url: "/",
  icons: [
    {
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
  },
});
