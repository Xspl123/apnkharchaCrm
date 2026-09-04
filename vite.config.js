import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // .env.development / .env.production load करेगा
  const env = loadEnv(mode, process.cwd(), '')

  const edition = (env.VITE_APP_EDITION || process.env.VITE_APP_EDITION || 'full').toLowerCase()

  let target = null

  // CRM और Main दोनों common routes इस्तेमाल करेंगे
  if (edition === 'crm' || edition === 'main') {
    target = path.resolve(__dirname, 'src/config/appRoutes.jsx')
  } else if (edition === 'expense') {
    target = path.resolve(__dirname, 'src/config/appRoutes.expense.jsx')
  }

  const alias = target
    ? {
        './config/appRoutes': target,
        '../config/appRoutes': target,
      }
    : {}

  return {
    plugins: [react()],

    resolve: { alias },

    // Environment variable frontend में उपलब्ध रहेगी
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_BASE_URL),
    },

    build: {
      chunkSizeWarningLimit: 800,

      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined

            if (id.includes('html2pdf.js')) return 'html2pdf'
            if (id.includes('jspdf')) return 'jspdf'
            if (id.includes('html2canvas')) return 'html2canvas'
            if (id.includes('file-saver')) return 'file-saver'
            if (id.includes('recharts')) return 'recharts'
            if (id.includes('@mui/icons-material')) return 'mui-icons'
            if (id.includes('@mui/x-date-pickers')) return 'mui-pickers'
            if (id.includes('@mui')) return 'mui-core'
            if (id.includes('framer-motion')) return 'motion'
            if (
              id.includes('react-redux') ||
              id.includes('@reduxjs/toolkit') ||
              id.includes('/redux/')
            ) return 'redux'
            if (
              id.includes('/node_modules/react/') ||
              id.includes('react-dom') ||
              id.includes('/node_modules/scheduler/')
            ) return 'react-core'

            return 'vendor'
          },
        },
      },
    },
  }
})