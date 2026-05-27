const SYSTEM_PROMPT = `你是一个专业的AI提示词工程师。请对用户输入的提示词进行优化，使其更加清晰、准确、有效。

优化方向：
1. 补全指令逻辑，填补语义空白
2. 规范提示词结构，使其层次分明
3. 明确AI角色与任务
4. 强化输出约束，明确格式要求

请直接输出优化后的提示词，不要添加任何解释说明。`

export async function optimizePrompt(config, userPrompt) {
  const { baseURL, apiKey, model } = config
  
  const url = `${baseURL.replace(/\/$/, '')}/chat/completions`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ]
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `请求失败: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('API返回数据格式异常')
  }
  
  return data.choices[0].message.content
}
