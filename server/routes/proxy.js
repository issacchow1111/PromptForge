import express from 'express'
import { getSystemPrompt } from '../utils/promptModes.js'

const router = express.Router()

const REQUEST_TIMEOUT = 60_000

function getUpstreamConfig () {
  const baseURL = process.env.PROXY_BASE_URL
  const apiKey = process.env.PROXY_API_KEY
  const model = process.env.PROXY_MODEL

  if (!baseURL || !apiKey || !model) {
    const error = new Error('服务端未配置上游模型接口')
    error.status = 500
    throw error
  }

  return { baseURL, apiKey, model }
}

function createPromptMessage (userPrompt, precondition = '') {
  const normalizedPrecondition = String(precondition || '').trim()
  if (!normalizedPrecondition) return userPrompt
  return `【全局前置条件】\n${normalizedPrecondition}\n\n【待优化提示词】\n${userPrompt}`
}

function createIterationContext (payload) {
  return {
    modeId: payload.modeId || 'general',
    originalPrompt: payload.originalPrompt || '',
    precondition: payload.precondition || '',
    currentPrompt: payload.currentPrompt,
    iterationInstruction: payload.instruction,
    diagnosis: payload.diagnosis || null,
    score: payload.score || null
  }
}

function buildOptimizeBody (modeId, userPrompt, precondition) {
  return {
    model: getUpstreamConfig().model,
    messages: [
      { role: 'system', content: getSystemPrompt(modeId) },
      { role: 'user', content: createPromptMessage(userPrompt, precondition) }
    ]
  }
}

function buildIterateBody (payload) {
  return {
    model: getUpstreamConfig().model,
    messages: [
      {
        role: 'system',
        content: `你是一个专业的 AI 提示词迭代工程师。你需要基于当前已经优化后的提示词继续改进，而不是回到原始输入重新生成。

迭代要求：
1. 必须严格遵守用户本次迭代指令。
2. 保留当前版本中仍然有效的结构、约束、上下文和输出要求。
3. 不要无故删除重要背景、边界条件、验收标准或禁止事项。
4. 如果用户要求“更精简”，应压缩表达但保留核心约束。
5. 如果用户要求“更严格”，应补强边界、验收标准和禁止事项。
6. 如果用户要求适配某模型，应针对该模型常见交互风格调整提示词。
7. 诊断和评分应说明本次迭代后的提示词质量与改进点。
8. 如果迭代上下文包含全局前置条件，请将其作为背景上下文参考；不要机械复制全部前置条件到最终提示词中。
9. 必须只返回合法 JSON，不要返回 Markdown 代码块，不要在 JSON 前后添加解释。

JSON 结构必须符合：
{
  "diagnosis": {
    "summary": "一句话总结本次迭代后的提示词质量",
    "mainIssues": ["当前版本仍然存在的主要问题"],
    "semanticGaps": ["当前版本仍然存在的语义缺口"],
    "missingConstraints": ["当前版本仍然缺失的约束"],
    "possibleMisunderstandings": ["当前版本仍可能导致的误解点"],
    "improvements": ["本次迭代补强点"]
  },
  "score": {
    "overall": 0,
    "dimensions": {
      "clarity": { "score": 0, "comment": "清晰度评价" },
      "context": { "score": 0, "comment": "上下文完整度评价" },
      "constraints": { "score": 0, "comment": "约束完整度评价" },
      "outputControl": { "score": 0, "comment": "输出可控性评价" },
      "actionability": { "score": 0, "comment": "可执行性评价" }
    }
  },
  "optimizedPrompt": "迭代后的提示词正文"
}`
      },
      { role: 'user', content: JSON.stringify(createIterationContext(payload), null, 2) }
    ]
  }
}

async function fetchWithTimeout (url, options, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    if (error.name === 'AbortError') {
      const timeoutError = new Error('请求超时')
      timeoutError.status = 504
      throw timeoutError
    }
    throw error
  }
}

async function forwardToUpstream (body) {
  const { baseURL, apiKey } = getUpstreamConfig()
  const url = `${baseURL.replace(/\/$/, '')}/chat/completions`

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    let message = `请求失败 (${response.status})`
    try {
      const errorData = await response.json()
      message = errorData.error?.message || errorData.error?.code || errorData.message || message
    } catch {
      // ignore parse error
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return response
}

router.post('/chat', async (req, res, next) => {
  try {
    const { modeId, userPrompt, precondition, type, currentPrompt, instruction, originalPrompt, diagnosis, score } = req.body

    let body
    if (type === 'iteration') {
      body = buildIterateBody({ modeId, currentPrompt, instruction, originalPrompt, diagnosis, score, precondition })
    } else {
      body = buildOptimizeBody(modeId, userPrompt, precondition)
    }

    const upstreamResponse = await forwardToUpstream(body)
    const data = await upstreamResponse.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      const error = new Error('API 返回数据格式异常')
      error.status = 502
      throw error
    }

    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
})

router.post('/chat/stream', async (req, res, next) => {
  try {
    const { modeId, userPrompt, precondition } = req.body
    const body = buildOptimizeBody(modeId, userPrompt, precondition)
    body.stream = true

    const upstreamResponse = await forwardToUpstream(body)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = upstreamResponse.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
        if (res.flush) res.flush()
      }
    } finally {
      reader.releaseLock()
    }

    res.end()
  } catch (err) {
    next(err)
  }
})

export default router
