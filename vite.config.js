import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { generateGeminiText } from './server/gemini.js'

function geminiDevApiPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    name: 'gemini-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let rawBody = ''
        req.on('data', (chunk) => {
          rawBody += chunk
        })

        req.on('end', async () => {
          try {
            const body = rawBody ? JSON.parse(rawBody) : {}
            const text = await generateGeminiText({
              systemPrompt: body.systemPrompt || '',
              userMessage: body.userMessage || '',
              conversationHistory: body.conversationHistory || [],
              model: env.GEMINI_MODEL || 'gemini-2.5-flash',
              apiKey: env.GEMINI_API_KEY,
            })

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ text }))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message || 'Unexpected server error' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), geminiDevApiPlugin(mode)],
}))
