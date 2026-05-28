import { DEFAULT_PROMPT_MODE_ID, getSystemPrompt } from './promptModes.js'

const REQUEST_TIMEOUT = 60000 // 60秒超时

function createFallbackResult (rawContent = '') {
  return {
    diagnosis: null,
    score: null,
    optimizedPrompt: rawContent,
    rawContent
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
      rawContent
    }
  } catch {
    return createFallbackResult(rawContent)
  }
}

/**
 * 带超时的 fetch 封装
 */
async function fetchWithTimeout (url, options = {}, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络或稍后重试')
    }
    throw error
  }
}

/**
 * 优化提示词
 * @param {Object} config - API 配置
 * @param {string} userPrompt - 用户输入的提示词
 * @param {string} modeId - 优化模式 ID
 * @returns {Promise<Object>} 结构化优化结果
 */
export async function optimizePrompt (config, userPrompt, modeId = DEFAULT_PROMPT_MODE_ID) {
  const { baseURL, apiKey, model } = config

  if (!baseURL || !apiKey || !model) {
    throw new Error('API 配置不完整，请检查 Base URL、API Key 和模型名称')
  }

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
          { role: 'user', content: userPrompt }
        ]
      })
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
        // 解析失败，使用默认错误信息
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
    // 网络错误分类
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('网络连接失败，请检查网络或 API 地址是否正确')
    }
    if (error.message?.includes('CORS')) {
      throw new Error('跨域请求被阻止，请确认 API 服务支持跨域访问')
    }
    throw error
  }
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

  const { baseURL, apiKey, model } = config

  if (!baseURL || !apiKey || !model) {
    throw new Error('API 配置不完整')
  }

  const url = `${baseURL.replace(/\/$/, '')}/chat/completions`

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
        { role: 'user', content: userPrompt }
      ],
      stream: true
    })
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
