import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 10

export const rateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: '请求过于频繁，请稍后重试' }
    })
  }
})

export const speedLimiter = slowDown({
  windowMs,
  delayAfter: Math.max(1, Math.floor(maxRequests / 2)),
  delayMs: (hits) => hits * 200,
  maxDelayMs: 5000,
  keyGenerator: (req) => req.ip
})
