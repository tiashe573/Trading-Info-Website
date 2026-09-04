import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

const SEC_UA = 'FlowStateApp/1.0 (test@example.com)'
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

function withHeaders(target: string, rewritePrefix: string, userAgent: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(new RegExp(`^${rewritePrefix}`), ''),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('User-Agent', userAgent)
        proxyReq.setHeader('Accept-Encoding', 'identity')
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api/sec': withHeaders('https://data.sec.gov', '/api/sec', SEC_UA),
      '/api/edgar': withHeaders('https://www.sec.gov', '/api/edgar', SEC_UA),
      '/api/yahoo': withHeaders('https://query1.finance.yahoo.com', '/api/yahoo', BROWSER_UA),
      '/api/fmp': withHeaders('https://financialmodelingprep.com', '/api/fmp', BROWSER_UA),
      '/api/clerk': withHeaders('https://disclosures-clerk.house.gov', '/api/clerk', BROWSER_UA),
    },
  },
})
