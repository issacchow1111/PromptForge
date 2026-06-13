import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { rateLimiter, speedLimiter } from './middleware/rateLimiter.js'
import { requestValidator, MAX_BODY_BYTES } from './middleware/requestValidator.js'
import { errorHandler } from './middleware/errorHandler.js'
import proxyRoutes from './routes/proxy.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

const app = express()
const PORT = Number(process.env.PORT) || 3000
const CORS_ORIGIN = process.env.CORS_ORIGIN

app.use(helmet())
app.use(cors({
  origin: CORS_ORIGIN || true,
  credentials: false
}))
app.use(express.json({ limit: MAX_BODY_BYTES }))

app.get('/api/health', (_req, res) => {
  const configured = !!(process.env.PROXY_BASE_URL && process.env.PROXY_API_KEY && process.env.PROXY_MODEL)
  res.json({ success: true, proxyConfigured: configured })
})

app.use('/api/proxy', rateLimiter, speedLimiter, requestValidator, proxyRoutes)

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: '接口不存在' }
  })
})

app.use(errorHandler)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PromptForge Server] 运行在 http://0.0.0.0:${PORT}`)
})
