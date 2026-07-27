import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Tools/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg'],
      manifest: {
        name: 'Anush Cuidarte Tools',
        short_name: 'Anush Tools',
        description: 'Herramientas para maternidad, lactancia y crianza',
        theme_color: '#C97B84',
        background_color: '#FDF8F5',
        display: 'standalone',
        scope: '/Tools/',
        start_url: '/Tools/',
        icons: [
          { src: '/Tools/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/Tools/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  build: {
    outDir: 'docs',
  },
})
