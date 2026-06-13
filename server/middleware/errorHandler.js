export function errorHandler (err, req, res, _next) {
  console.error('[Proxy Error]', err)

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: { code: 'PAYLOAD_TOO_LARGE', message: '请求体过大，请缩短输入内容' }
    })
  }

  if (err.name === 'AbortError' || err.message?.includes('timeout') || err.cause?.name === 'ConnectTimeoutError' || err.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
    return res.status(504).json({
      success: false,
      error: { code: 'UPSTREAM_TIMEOUT', message: '请求超时，请检查网络或稍后重试' }
    })
  }

  if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('fetch failed') || err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
    return res.status(502).json({
      success: false,
      error: { code: 'UPSTREAM_NETWORK_ERROR', message: '网络连接失败，请检查网络或 API 地址是否正确' }
    })
  }

  const status = err.status || err.statusCode || 500
  const message = err.message || '服务器内部错误，请稍后重试'

  if (status === 401) {
    return res.status(401).json({
      success: false,
      error: { code: 'UPSTREAM_UNAUTHORIZED', message: 'API Key 无效或已过期' }
    })
  }

  if (status === 429) {
    return res.status(429).json({
      success: false,
      error: { code: 'UPSTREAM_RATE_LIMITED', message: '上游请求过于频繁，请稍后重试' }
    })
  }

  if (status >= 500) {
    return res.status(status).json({
      success: false,
      error: { code: 'UPSTREAM_ERROR', message: '服务器内部错误，请稍后重试' }
    })
  }

  res.status(status).json({
    success: false,
    error: { code: 'PROXY_ERROR', message }
  })
}
