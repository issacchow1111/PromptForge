const CONFIG_KEY = 'prompt_optimizer_config'
const HISTORY_KEY = 'prompt_optimizer_history'

export function getConfig() {
  try {
    const data = localStorage.getItem(CONFIG_KEY)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Failed to get config:', e)
    return null
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    return true
  } catch (e) {
    console.error('Failed to save config:', e)
    return false
  }
}

export function clearConfig() {
  try {
    localStorage.removeItem(CONFIG_KEY)
    return true
  } catch (e) {
    console.error('Failed to clear config:', e)
    return false
  }
}

export function getHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Failed to get history:', e)
    return []
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    return true
  } catch (e) {
    console.error('Failed to save history:', e)
    return false
  }
}

export function addToHistory(item) {
  const history = getHistory()
  history.unshift(item)
  return saveHistory(history)
}

export function updateHistoryItem(id, updates) {
  const history = getHistory()
  const index = history.findIndex(item => item.id === id)
  if (index !== -1) {
    history[index] = { ...history[index], ...updates }
    return saveHistory(history)
  }
  return false
}

export function deleteFromHistory(id) {
  const history = getHistory()
  const filtered = history.filter(item => item.id !== id)
  return saveHistory(filtered)
}
