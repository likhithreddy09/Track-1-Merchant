import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sarvamKey = env.SARVAM_API_KEY || ''
  const googleKey = env.GOOGLE_PLACES_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/sarvam': {
          target: 'https://api.sarvam.ai',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/sarvam/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (sarvamKey) {
                proxyReq.setHeader('api-subscription-key', sarvamKey)
              }
            })
          },
        },
        '/api/google': {
          target: 'https://maps.googleapis.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/google/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (!googleKey) return
              try {
                const u = new URL(proxyReq.path || '', 'https://maps.googleapis.com')
                u.searchParams.set('key', googleKey)
                proxyReq.path = `${u.pathname}${u.search}`
              } catch {
                /* ignore */
              }
            })
          },
        },
      },
    },
  }
})
