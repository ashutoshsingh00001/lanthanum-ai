import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { generateClaudeText, streamClaudeText } from './server/claude-proxy.js'

function claudeDevApiPlugin(mode) {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    name: 'claude-dev-api',
    configureServer(server) {
      // Streaming endpoint
      server.middlewares.use('/api/generate-stream', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let rawBody = ''
        req.on('data', chunk => rawBody += chunk)

        req.on('end', async () => {
          try {
            const body = rawBody ? JSON.parse(rawBody) : {}
            const stream = await streamClaudeText({
              systemPrompt: body.systemPrompt || '',
              userMessage: body.userMessage || '',
              conversationHistory: body.conversationHistory || [],
              model: env.CLAUDE_MODEL || 'claude-sonnet-4-6',
              baseUrl: env.CLAUDE_PROXY_URL || 'http://localhost:8080',
            })

            res.statusCode = 200
            res.setHeader('Content-Type', 'text/event-stream')
            res.setHeader('Cache-Control', 'no-cache')
            res.setHeader('Connection', 'keep-alive')

            const reader = stream.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) { res.end(); break; }
              res.write(value);
            }
          } catch (error) {
            console.error('Streaming error:', error);
            res.statusCode = 500
            res.end(JSON.stringify({ error: error.message || 'Unexpected server error' }))
          }
        })
      });

      // Non-streaming endpoint
      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let rawBody = ''
        req.on('data', chunk => rawBody += chunk)

        req.on('end', async () => {
          try {
            const body = rawBody ? JSON.parse(rawBody) : {}
            const text = await generateClaudeText({
              systemPrompt: body.systemPrompt || '',
              userMessage: body.userMessage || '',
              conversationHistory: body.conversationHistory || [],
              model: env.CLAUDE_MODEL || 'claude-sonnet-4-6',
              baseUrl: env.CLAUDE_PROXY_URL || 'http://localhost:8080',
            })

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ text }))
          } catch (error) {
            console.error('Generation error:', error);
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message || 'Unexpected server error' }))
          }
        })
      });
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), claudeDevApiPlugin(mode)],
}))
