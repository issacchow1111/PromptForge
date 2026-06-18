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

const CLARIFICATION_AWARE_REQUIREMENTS = `补充要求：
1. 如果上下文中包含“用户补充信息”，你必须将其用于完善最终结果。
2. 对标记为“由 AI 合理假设”的问题，你可以做合理假设，但不要在最终 optimizedPrompt 中暴露澄清过程。
3. 最终 optimizedPrompt 不要出现“根据你的回答”“你刚才选择了”等过程性表达，除非用户任务本身要求展示该过程。`

const CLARIFICATION_FOCUS_BY_MODE = {
  general: '目标、受众、使用场景、输出形式、限制条件',
  code: '技术栈、运行环境、文件范围、已有代码约束、验收标准',
  image: '主体、风格、画面比例、镜头/构图、色彩、负面提示词',
  writing: '平台、目标读者、语气风格、篇幅、转化目标',
  data: '数据来源、时间范围、指标定义、分析目标、输出图表',
  role: '角色身份、服务对象、行为边界、语气、禁止事项',
  structured: '目标格式、字段定义、字段类型、示例、校验规则'
}

const CLARIFICATION_MODE_NAME_BY_ID = {
  general: '通用优化',
  code: '代码生成',
  image: '图像生成',
  writing: '内容写作',
  data: '数据分析',
  role: '角色设定',
  structured: '结构化输出'
}

const CLARIFICATION_SYSTEM_PROMPT = `你是一个专业的 AI 提示词分析师。你的职责是判断当前输入是否已经足够进入最终提示词优化，而不是直接输出优化结果。

输出要求：
1. 必须只返回合法 JSON，不要返回 Markdown 代码块，不要在 JSON 前后添加解释。
2. 不要因为提示词较短就默认追问；如果只是轻微缺失，请直接判定为不需要追问。
3. needsClarification=false 时，questions 必须返回空数组。
4. needsClarification=true 时，questions 必须返回 1 到 5 个问题，能少问就少问，只问最影响最终优化结果的关键问题。
5. 每个问题必须包含 id、question、type、options、required 字段。
6. type 固定为 single_choice。
7. 每题 options 数量控制在 2 到 5 个，最后一个选项固定为 {"label":"其他/自定义","value":"__custom__"}。
8. 不要把“跳过，由 AI 合理假设”放进 options，这个按钮由前端提供。

JSON 结构必须符合：
{
  "needsClarification": true,
  "reason": "说明为什么需要或不需要澄清",
  "questions": [
    {
      "id": "question_id",
      "question": "问题内容",
      "type": "single_choice",
      "options": [
        { "label": "选项 1", "value": "value_1" },
        { "label": "其他/自定义", "value": "__custom__" }
      ],
      "required": false
    }
  ]
}`

function hasCompleteDirectConfig (config) {
  return Boolean(config?.apiKey && config?.baseURL && config?.model)
}

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

function repairJson (text) {
  // Fix missing opening quotes on keys:  key": → "key":
  let fixed = text.replace(/([,\{\[])\s*([a-zA-Z_]\w*)\s*":/g, '$1"$2":')
  // Fix leading missing quote on first key
  fixed = fixed.replace(/^(\s*)([a-zA-Z_]\w*)\s*":/gm, '$1"$2":')
  return fixed
}

/**
 * 从无法被 JSON.parse 的原始文本中，尝试提取 optimizedPrompt 字段的内容。
 * 用于模型返回损坏 JSON 时的最后兜底，避免把整个原始 JSON 显示在结果窗口。
 */
function extractOptimizedPromptFromRawText (content) {
  const jsonLike = extractJsonContent(content)

  // 匹配 optimizedPrompt 键，允许键名缺少开头引号
  const keyMatch = jsonLike.match(/"?optimizedPrompt"\s*:\s*"/)
  if (!keyMatch) return null

  const startIndex = keyMatch.index + keyMatch[0].length
  let result = ''
  let i = startIndex

  while (i < jsonLike.length) {
    const char = jsonLike[i]

    if (char === '\\') {
      const next = jsonLike[i + 1]
      if (next === 'n') result += '\n'
      else if (next === 't') result += '\t'
      else if (next === 'r') result += '\r'
      else if (next === '"') result += '"'
      else if (next === '\\') result += '\\'
      else if (next === 'u' && /[0-9a-fA-F]{4}/.test(jsonLike.slice(i + 2, i + 6))) {
        const code = parseInt(jsonLike.slice(i + 2, i + 6), 16)
        result += String.fromCharCode(code)
        i += 4
      } else {
        result += next || ''
      }
      i += 2
    } else if (char === '"') {
      break
    } else {
      result += char
      i++
    }
  }

  return result.trim() || null
}

export function parseOptimizationResult (content) {
  const rawContent = String(content || '')
  const jsonContent = extractJsonContent(rawContent)

  const attempts = [
    jsonContent,
    repairJson(jsonContent)
  ]

  for (const text of attempts) {
    try {
      const parsed = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object') {
        continue
      }
      const optimizedPrompt = typeof parsed.optimizedPrompt === 'string'
        ? parsed.optimizedPrompt
        : typeof parsed.optimized === 'string'
          ? parsed.optimized
          : null
      if (!optimizedPrompt) {
        continue
      }
      return {
        diagnosis: parsed.diagnosis && typeof parsed.diagnosis === 'object' ? parsed.diagnosis : null,
        score: parsed.score && typeof parsed.score === 'object' ? parsed.score : null,
        optimizedPrompt,
        rawContent,
        structured: true
      }
    } catch {
      // try next repair
    }
  }

  const extractedPrompt = extractOptimizedPromptFromRawText(rawContent)
  if (extractedPrompt) {
    return {
      diagnosis: null,
      score: null,
      optimizedPrompt: extractedPrompt,
      rawContent,
      structured: false
    }
  }

  return createFallbackResult(rawContent)
}

export function hasCompleteOptimizationReport (result) {
  const optimizedPrompt = result?.optimizedPrompt || result?.optimized
  return Boolean(
    result &&
    result.structured !== false &&
    typeof optimizedPrompt === 'string' &&
    optimizedPrompt.trim() &&
    result.diagnosis &&
    typeof result.diagnosis === 'object' &&
    result.score &&
    typeof result.score === 'object' &&
    typeof result.score.overall !== 'undefined' &&
    result.score.dimensions &&
    typeof result.score.dimensions === 'object'
  )
}

function formatClarifications (clarifications = []) {
  if (!Array.isArray(clarifications) || clarifications.length === 0) {
    return ''
  }

  return clarifications
    .map((item, index) => {
      const question = String(item?.question || '').trim()
      const answer = item?.answerType === 'skip'
        ? '由 AI 合理假设'
        : String(item?.answerLabel || item?.answerValue || '').trim()
      if (!question || !answer) return ''
      return `${index + 1}. ${question}\n回答：${answer}`
    })
    .filter(Boolean)
    .join('\n\n')
}

function createUserPromptWithClarifications (userPrompt, clarifications = []) {
  const normalizedPrompt = String(userPrompt || '')
  const clarificationBlock = formatClarifications(clarifications)

  if (!clarificationBlock) {
    return normalizedPrompt
  }

  return `${normalizedPrompt}\n\n【澄清补充信息】\n${clarificationBlock}`
}

function createPromptMessage (userPrompt, precondition = '', clarifications = []) {
  const normalizedPrecondition = String(precondition || '').trim()
  const normalizedPrompt = createUserPromptWithClarifications(userPrompt, clarifications)

  if (!normalizedPrecondition) return normalizedPrompt

  return `【全局前置条件】\n${normalizedPrecondition}\n\n【待优化提示词】\n${normalizedPrompt}`
}

export function shouldUseProxy (config) {
  return !hasCompleteDirectConfig(config)
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
  const content = extractAssistantMessageContent(data)
  return parseOptimizationResult(content)
}

function extractAssistantMessageContent (data) {
  if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('代理返回数据格式异常，请检查服务端配置')
  }
  return data.choices[0].message.content || ''
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

function createRequestSession (config) {
  const transportMode = shouldUseProxy(config) ? 'proxy' : 'direct'

  return {
    transportMode,
    configSnapshot: transportMode === 'direct'
      ? {
          baseURL: config.baseURL,
          apiKey: config.apiKey,
          model: config.model
        }
      : null
  }
}

function resolveRequestSession (config, session = null) {
  return session || createRequestSession(config)
}

function getDirectRequestConfig (session, fallbackConfig = null) {
  return session?.configSnapshot || fallbackConfig || {}
}

function getClarificationFocus (modeId = DEFAULT_PROMPT_MODE_ID) {
  return CLARIFICATION_FOCUS_BY_MODE[modeId] || CLARIFICATION_FOCUS_BY_MODE.general
}

function getDirectClarificationSystemPrompt (modeId = DEFAULT_PROMPT_MODE_ID) {
  const modeName = CLARIFICATION_MODE_NAME_BY_ID[modeId] || CLARIFICATION_MODE_NAME_BY_ID.general
  return `${CLARIFICATION_SYSTEM_PROMPT}\n\n当前优化模式：${modeName}\n当前模式优先关注的补充信息：${getClarificationFocus(modeId)}\n问题必须与当前优化模式相关，避免泛泛追问。`
}

function getDirectOptimizationSystemPrompt (modeId = DEFAULT_PROMPT_MODE_ID, includeClarifications = false) {
  const basePrompt = getSystemPrompt(modeId)
  return includeClarifications ? `${basePrompt}\n\n${CLARIFICATION_AWARE_REQUIREMENTS}` : basePrompt
}

function createClarifyUserMessage (payload) {
  return createPromptMessage(payload.userPrompt, payload.precondition)
}

function createEmptyClarificationResult (reason = '') {
  return {
    needsClarification: false,
    reason,
    questions: []
  }
}

function normalizeClarificationOption (option) {
  if (typeof option === 'string') {
    const label = option.trim()
    if (!label) return null
    return {
      label,
      value: label === '其他/自定义' ? '__custom__' : label
    }
  }

  if (!option || typeof option !== 'object') {
    return null
  }

  const label = String(option.label || '').trim()
  const value = String(option.value || '').trim()
  if (!label || !value) {
    return null
  }

  return { label, value }
}

function ensureCustomOptionAtEnd (options) {
  const normalized = options.filter(Boolean)
  const regularOptions = normalized.filter(option => option.value !== '__custom__' && option.label !== '其他/自定义')
  const customOption = normalized.find(option => option.value === '__custom__' || option.label === '其他/自定义') || { label: '其他/自定义', value: '__custom__' }
  return [...regularOptions.slice(0, 4), customOption]
}

function normalizeClarificationQuestions (questions) {
  if (!Array.isArray(questions)) {
    return []
  }

  return questions
    .map((item, index) => {
      const id = typeof item?.id === 'string' && item.id.trim()
        ? item.id.trim()
        : `clarification_${index + 1}`
      const question = typeof item === 'string'
        ? item.trim()
        : typeof item?.question === 'string'
          ? item.question.trim()
          : ''
      const rawOptions = Array.isArray(item?.options)
        ? item.options
        : Array.isArray(item?.choices)
          ? item.choices
          : []
      const options = ensureCustomOptionAtEnd(rawOptions
        .map(normalizeClarificationOption)
        .filter(Boolean))

      if (!question) {
        return null
      }

      return {
        id,
        question,
        type: 'single_choice',
        options,
        required: Boolean(item?.required)
      }
    })
    .filter(Boolean)
    .slice(0, 5)
}

function parseClarificationResult (content) {
  const rawContent = String(content || '')
  const jsonContent = extractJsonContent(rawContent)
  const attempts = [jsonContent, repairJson(jsonContent)]

  for (const text of attempts) {
    try {
      const parsed = JSON.parse(text)
      const questions = normalizeClarificationQuestions(parsed?.questions)
      const needsClarification = Boolean(parsed?.needsClarification) && questions.length > 0
      return {
        needsClarification,
        reason: typeof parsed?.reason === 'string' ? parsed.reason : '',
        questions: needsClarification ? questions : []
      }
    } catch {
      // try next repair
    }
  }

  return createEmptyClarificationResult()
}

export async function clarifyPrompt (config, payload, signal = null, requestSession = null) {
  const session = resolveRequestSession(config, requestSession)
  const modeId = payload.modeId || DEFAULT_PROMPT_MODE_ID

  if (session.transportMode === 'direct') {
    const { baseURL, apiKey, model } = getDirectRequestConfig(session)
    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: getDirectClarificationSystemPrompt(modeId) },
          { role: 'user', content: createClarifyUserMessage(payload) }
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
    return parseClarificationResult(extractAssistantMessageContent(data))
  }

  const response = await fetchWithTimeout('/api/proxy/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modeId,
      type: 'clarify',
      userPrompt: payload.userPrompt || '',
      precondition: payload.precondition || ''
    }),
    signal
  })

  if (!response.ok) {
    await handleProxyError(response)
  }

  const result = await response.json()
  return parseClarificationResult(extractAssistantMessageContent(result.data))
}

export async function streamOptimizeWithClarifications (config, payload, handlers = {}, signal = null) {
  try {
    const session = createRequestSession(config)
    handlers.onPhaseChange?.('thinking')

    const clarification = await clarifyPrompt(config, payload, signal, session)
    const clarificationResult = clarification.needsClarification
      ? await handlers.onClarifications?.(clarification.questions)
      : []
    const clarifications = Array.isArray(clarificationResult) ? clarificationResult : []

    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }

    handlers.onPhaseChange?.('generating')

    const rawContent = await streamOptimizeOrIterate(
      getDirectRequestConfig(session, config),
      {
        ...payload,
        clarifications
      },
      handlers.onChunk,
      signal,
      session
    )

    return {
      rawContent,
      clarification,
      clarifications,
      transportMode: session.transportMode,
      configSnapshot: session.configSnapshot ? { ...session.configSnapshot } : null
    }
  } catch (error) {
    handleNetworkError(error)
  }
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
export async function streamOptimizeOrIterate (config, payload, onChunk, signal = null, requestSession = null) {
  try {
    const session = resolveRequestSession(config, requestSession)
    const useProxy = session.transportMode === 'proxy'
    const isIteration = payload.type === 'iteration'
    const hasClarifications = Array.isArray(payload.clarifications) && payload.clarifications.length > 0

    if (!useProxy) {
      const { baseURL, apiKey, model } = getDirectRequestConfig(session, config)
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
            { role: 'system', content: getDirectOptimizationSystemPrompt(payload.modeId || DEFAULT_PROMPT_MODE_ID, hasClarifications) },
            { role: 'user', content: createPromptMessage(payload.userPrompt, payload.precondition, payload.clarifications) }
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
          clarifications: hasClarifications ? payload.clarifications : undefined,
          type: hasClarifications ? 'optimizeWithClarifications' : 'optimize'
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
  } catch (error) {
    handleNetworkError(error)
  }
}

/**
 * Parse SSE stream from a Response object
 */
async function streamFromResponse (response, onChunk) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `请求失败: ${response.status}`)
  }

  if (!response.body) {
    throw new Error('模型未返回内容，请检查模型或稍后重试')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let lineBuffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        // Flush remaining bytes in the decoder buffer
        const tail = decoder.decode()
        if (tail) {
          lineBuffer += tail
        }
        processSseLine(lineBuffer)
        break
      }

      lineBuffer += decoder.decode(value, { stream: true })
      const lines = lineBuffer.split('\n')
      lineBuffer = lines.pop() // last line may be incomplete, keep for next chunk

      for (const line of lines) {
        processSseLine(line)
      }
    }
  } finally {
    reader.releaseLock()
  }

  if (!fullContent.trim()) {
    throw new Error('模型未返回内容，请检查模型或稍后重试')
  }

  return fullContent

  function processSseLine (line) {
    const normalizedLine = line.trim()
    if (!normalizedLine.startsWith('data: ')) return

    const data = normalizedLine.slice(6)
    if (data === '[DONE]') return

    try {
      const parsed = JSON.parse(data)
      if (parsed.error) {
        throw new Error(parsed.error.message || parsed.error.code || '模型流式返回错误')
      }
      const content = parsed.choices?.[0]?.delta?.content
      if (content) {
        fullContent += content
        onChunk?.(fullContent)
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.warn('忽略无法解析的 SSE 数据:', data)
        return
      }
      throw e
    }
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
      if (done) {
        // Flush remaining bytes in the decoder buffer
        fullContent += decoder.decode()
        break
      }

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
