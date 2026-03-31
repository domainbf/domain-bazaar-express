import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/data\/domain-listings(\?.*)?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-listings-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 },
              networkTimeoutSeconds: 4,
            },
          },
          {
            urlPattern: /\/api\/data\/site-settings$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-settings-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /\/api\/data\/domain-listings\/[^/]+\/detail$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-detail-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 90 },
              networkTimeoutSeconds: 4,
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/trqxaizkwuizuhlfmdup\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: '域见•你 NIC.BN — 域名交易平台',
        short_name: '域见•你',
        description: '专业域名交易市场，买卖优质域名，安全托管，实时竞拍',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'zh-CN',
        categories: ['business', 'finance', 'shopping'],
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/og-image.png', sizes: '1200x630', type: 'image/png', label: '域见•你 域名交易平台首页' },
        ],
        shortcuts: [
          { name: '浏览域名', short_name: '浏览', url: '/marketplace', icons: [{ src: '/icons/pwa-192x192.png', sizes: '192x192' }] },
          { name: '我的中心', short_name: '我的', url: '/user-center', icons: [{ src: '/icons/pwa-192x192.png', sizes: '192x192' }] },
          { name: '域名拍卖', short_name: '拍卖', url: '/auction', icons: [{ src: '/icons/pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          charts: ['recharts'],
          i18n: ['i18next', 'react-i18next'],
          motion: ['framer-motion'],
          radix: [
            '@radix-ui/react-tabs',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-accordion',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'framer-motion'],
  },
}));
