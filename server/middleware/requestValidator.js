const MAX_BODY_SIZE_KB = Number(process.env.MAX_BODY_SIZE_KB) || 100
const MAX_BODY_BYTES = MAX_BODY_SIZE_KB * 1024
const MAX_PROMPT_LENGTH = 10_000

export function requestValidator (req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_BODY', message: '请求体格式错误' }
    })
  }

  const { modeId, userPrompt, currentPrompt, instruction } = req.body

  if (modeId && typeof modeId !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_MODE_ID', message: '模式 ID 格式错误' }
    })
  }

  const text = userPrompt || currentPrompt || instruction || ''
  if (text.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      success: false,
      error: { code: 'PROMPT_TOO_LONG', message: '输入内容过长，请控制在 10000 字符以内' }
    })
  }

  next()
}

export { MAX_BODY_BYTES }
