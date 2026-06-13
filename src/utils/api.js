import { DEFAULT_PROMPT_MODE_ID, getSystemPrompt } from './promptModes.js'

const REQUEST_TIMEOUT = 60000 // 60秒超时

const ITERATION_SYSTEM_PROMPT = `你是一个专业的 AI 提示词迭代工程师。你需要基于当前已经优化后的提示词继续改进，而不是回到原始输入重新生成。

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

function createFallbackResult (rawContent = '') {
  return {
    diagnosis: null,
    score: null,
    optimizedPrompt: rawContent,
    rawContent,
    structured: false
  }
}

function extractJsonContent (content) {
  const trimmed = String(content || '').trim()
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fencedMatch ? fencedMatch[1].trim() : trimmed
}

export function parseOptimizationResult (content) {
  const rawContent = String(content || '')
  const jsonContent = extractJsonContent(rawContent)

  try {
    const parsed = JSON.parse(jsonContent)
    if (!parsed || typeof parsed !== 'object' || typeof parsed.optimizedPrompt !== 'string') {
      return createFallbackResult(rawContent)
    }

    return {
      diagnosis: parsed.diagnosis && typeof parsed.diagnosis === 'object' ? parsed.diagnosis : null,
      score: parsed.score && typeof parsed.score === 'object' ? parsed.score : null,
      optimizedPrompt: parsed.optimizedPrompt,
      rawContent,
      structured: true
    }
  } catch {
    return createFallbackResult(rawContent)
  }
}

export function hasCompleteOptimizationReport (result) {
  return Boolean(
    result &&
    result.structured !== false &&
    typeof result.optimizedPrompt === 'string' &&
    result.optimizedPrompt.trim() &&
    result.diagnosis &&
    typeof result.diagnosis === 'object' &&
    result.score &&
    typeof result.score === 'object' &&
    typeof result.score.overall !== 'undefined' &&
    result.score.dimensions &&
    typeof result.score.dimensions === 'object'
  )
}

function createPromptMessage (userPrompt, precondition = '') {
  const normalizedPrecondition = String(precondition || '').trim()
  if (!normalizedPrecondition) return userPrompt

  return `【全局前置条件】\n${normalizedPrecondition}\n\n【待优化提示词】\n${userPrompt}`
}

export function shouldUseProxy (config) {
  return !config?.apiKey
}

function validateDirectConfig (config) {
  const { baseURL, apiKey, model } = config || {}
  if (!baseURL || !apiKey || !model) {
    throw new Error('API 配置不完整，请检查 Base URL、API Key 和模型名称')
  }
}

/**
 * 带超时的 fetch 封装
 */
async function fetchWithTimeout (url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const externalSignal = options.signal

  // Combine timeout signal with external signal
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort())
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    if (error.name === 'AbortError' && !externalSignal?.aborted) {
      throw new Error('请求超时，请检查网络或稍后重试')
    }
    throw error
  }
}

function handleNetworkError (error) {
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    throw new Error('网络连接失败，请检查网络或 API 地址是否正确')
  }
  if (error.message?.includes('CORS')) {
    throw new Error('跨域请求被阻止，请确认 API 服务支持跨域访问')
  }
  throw error
}

function parseProxyResponse (data) {
  if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('代理返回数据格式异常，请检查服务端配置')
  }
  return parseOptimizationResult(data.choices[0].message.content)
}

async function handleProxyError (response) {
  let message = `请求失败 (${response.status})`
  try {
    const errorData = await response.json()
    message = errorData.error?.message || errorData.error?.code || errorData.message || message
  } catch {
    // ignore parse error
  }
  throw new Error(message)
}

/**
 * 优化提示词
 * @param {Object} config - API 配置
 * @param {string} userPrompt - 用户输入的提示词
 * @param {string} modeId - 优化模式 ID
 * @param {string} precondition - 全局前置条件
 * @returns {Promise<Object>} 结构化优化结果
 */
export async function optimizePrompt (config, userPrompt, modeId = DEFAULT_PROMPT_MODE_ID, precondition = '', signal = null) {
  const useProxy = shouldUseProxy(config)

  if (!useProxy) {
    validateDirectConfig(config)
  }

  if (!useProxy) {
    const { baseURL, apiKey, model } = config
    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: getSystemPrompt(modeId) },
            { role: 'user', content: createPromptMessage(userPrompt, precondition) }
          ]
        }),
        signal
      })

      if (!response.ok) {
        let errorMessage = `请求失败: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message
            || errorData.error?.code
            || errorData.message
            || `请求失败 (${response.status})`
        } catch {
          if (response.status === 401) errorMessage = 'API Key 无效或已过期'
          else if (response.status === 429) errorMessage = '请求过于频繁，请稍后重试'
          else if (response.status === 500) errorMessage = '服务器内部错误，请稍后重试'
          else if (response.status === 503) errorMessage = '服务暂不可用，请稍后重试'
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 返回数据格式异常，请检查模型是否兼容 OpenAI 格式')
      }

      return parseOptimizationResult(data.choices[0].message.content)
    } catch (error) {
      handleNetworkError(error)
    }
  }

  // Proxy mode
  const response = await fetchWithTimeout('/api/proxy/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modeId,
      userPrompt,
      precondition,
      type: 'optimize'
    }),
    signal
  })

  if (!response.ok) {
    await handleProxyError(response)
  }

  const result = await response.json()
  return parseProxyResponse(result.data)
}

/**
 * 基于当前优化结果继续迭代提示词
 * @param {Object} config - API 配置
 * @param {Object} payload - 迭代上下文
 * @returns {Promise<Object>} 结构化优化结果
 */
export async function iteratePrompt (config, payload, signal = null) {
  const useProxy = shouldUseProxy(config)

  if (!useProxy) {
    validateDirectConfig(config)
  }

  if (!payload?.currentPrompt || !payload?.instruction) {
    throw new Error('迭代信息不完整，请检查当前版本和迭代要求')
  }

  const iterationContext = {
    modeId: payload.modeId || DEFAULT_PROMPT_MODE_ID,
    originalPrompt: payload.originalPrompt || '',
    precondition: payload.precondition || '',
    currentPrompt: payload.currentPrompt,
    iterationInstruction: payload.instruction,
    diagnosis: payload.diagnosis || null,
    score: payload.score || null
  }

  if (!useProxy) {
    const { baseURL, apiKey, model } = config
    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: ITERATION_SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(iterationContext, null, 2) }
          ]
        }),
        signal
      })

      if (!response.ok) {
        let errorMessage = `请求失败: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message
            || errorData.error?.code
            || errorData.message
            || `请求失败 (${response.status})`
        } catch {
          if (response.status === 401) errorMessage = 'API Key 无效或已过期'
          else if (response.status === 429) errorMessage = '请求过于频繁，请稍后重试'
          else if (response.status === 500) errorMessage = '服务器内部错误，请稍后重试'
          else if (response.status === 503) errorMessage = '服务暂不可用，请稍后重试'
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 返回数据格式异常，请检查模型是否兼容 OpenAI 格式')
      }

      return parseOptimizationResult(data.choices[0].message.content)
    } catch (error) {
      handleNetworkError(error)
    }
  }

  // Proxy mode
  const response = await fetchWithTimeout('/api/proxy/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modeId: iterationContext.modeId,
      type: 'iteration',
      currentPrompt: iterationContext.currentPrompt,
      instruction: iterationContext.iterationInstruction,
      originalPrompt: iterationContext.originalPrompt,
      precondition: iterationContext.precondition,
      diagnosis: iterationContext.diagnosis,
      score: iterationContext.score
    }),
    signal
  })

  if (!response.ok) {
    await handleProxyError(response)
  }

  const result = await response.json()
  return parseProxyResponse(result.data)
}

/**
 * 统一的流式调用（支持 optimize 和 iteration）
 * @param {Object} config - API 配置
 * @param {Object} payload - { type, modeId, userPrompt, precondition, currentPrompt, instruction, originalPrompt, diagnosis, score }
 * @param {Function} onChunk - 回调 (accumulatedText)，每次收到新 chunk 时调用
 * @param {AbortSignal} [signal] - 外部中断信号
 * @returns {Promise<string>} 完整的原始响应文本
 */
export async function streamOptimizeOrIterate (config, payload, onChunk, signal = null) {
  const useProxy = shouldUseProxy(config)
  const isIteration = payload.type === 'iteration'

  if (!useProxy) {
    const { baseURL, apiKey, model } = config || {}
    if (!baseURL || !apiKey || !model) {
      throw new Error('API 配置不完整')
    }

    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`
    const messages = isIteration
      ? [
          { role: 'system', content: ITERATION_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify({
              modeId: payload.modeId || DEFAULT_PROMPT_MODE_ID,
              originalPrompt: payload.originalPrompt || '',
              precondition: payload.precondition || '',
              currentPrompt: payload.currentPrompt,
              iterationInstruction: payload.instruction,
              diagnosis: payload.diagnosis || null,
              score: payload.score || null
            }, null, 2) }
        ]
      : [
          { role: 'system', content: getSystemPrompt(payload.modeId || DEFAULT_PROMPT_MODE_ID) },
          { role: 'user', content: createPromptMessage(payload.userPrompt, payload.precondition) }
        ]

    return streamFromResponse(
      await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ model, messages, stream: true }),
        signal
      }),
      onChunk
    )
  }

  // Proxy mode
  const body = isIteration
    ? JSON.stringify({
        modeId: payload.modeId || DEFAULT_PROMPT_MODE_ID,
        type: 'iteration',
        currentPrompt: payload.currentPrompt,
        instruction: payload.instruction,
        originalPrompt: payload.originalPrompt || '',
        precondition: payload.precondition || '',
        diagnosis: payload.diagnosis || null,
        score: payload.score || null
      })
    : JSON.stringify({
        modeId: payload.modeId || DEFAULT_PROMPT_MODE_ID,
        userPrompt: payload.userPrompt,
        precondition: payload.precondition || '',
        type: 'optimize'
      })

  return streamFromResponse(
    await fetchWithTimeout('/api/proxy/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal
    }),
    onChunk
  )
}

/**
 * Parse SSE stream from a Response object
 */
async function streamFromResponse (response, onChunk) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `请求失败: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullContent += content
              onChunk?.(fullContent)
            }
          } catch {
            // ignore parse failures
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullContent
}

/**
 * 流式优化提示词（实验性功能）
 * @param {Object} config - API 配置
 * @param {string} userPrompt - 用户输入的提示词
 * @param {string} modeId - 优化模式 ID
 * @param {Function} onChunk - 每次收到数据时的回调
 * @returns {Promise<string>} 完整的优化结果
 */
export async function optimizePromptStream (config, userPrompt, modeId = DEFAULT_PROMPT_MODE_ID, onChunk) {
  if (typeof modeId === 'function') {
    onChunk = modeId
    modeId = DEFAULT_PROMPT_MODE_ID
  }

  const useProxy = shouldUseProxy(config)
  const { baseURL, apiKey, model } = config || {}

  if (!useProxy) {
    if (!baseURL || !apiKey || !model) {
      throw new Error('API 配置不完整')
    }
  }

  const url = useProxy ? '/api/proxy/chat/stream' : `${baseURL.replace(/\/$/, '')}/chat/completions`
  const headers = useProxy
    ? { 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }
  const body = useProxy
    ? JSON.stringify({ modeId, userPrompt })
    : JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: getSystemPrompt(modeId) },
          { role: 'user', content: userPrompt }
        ],
        stream: true
      })

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers,
    body
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `请求失败: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullContent += content
              onChunk?.(content, fullContent)
            }
          } catch {
            // 忽略解析失败的行
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullContent
}
