import { getPromptMode } from './promptModes.js'

const CONFIG_KEY = 'prompt_optimizer_config'
const HISTORY_KEY = 'prompt_optimizer_history'
const SELECTED_MODE_KEY = 'promptforge_selected_mode'
const STORAGE_VERSION = '1'
const MAX_HISTORY_ITEMS = 100
const MAX_ITEM_LENGTH = 50000 // 单个提示词最大字符数

/**
 * 检查 localStorage 是否可用
 */
function isStorageAvailable () {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * 获取存储的元数据
 */
function getStorageMeta () {
  try {
    const meta = localStorage.getItem('prompt_optimizer_meta')
    return meta ? JSON.parse(meta) : { version: '0' }
  } catch {
    return { version: '0' }
  }
}

/**
 * 保存存储元数据
 */
function setStorageMeta (meta) {
  localStorage.setItem('prompt_optimizer_meta', JSON.stringify(meta))
}

/**
 * 数据迁移：旧版本数据格式升级
 */
function migrateData () {
  const meta = getStorageMeta()
  if (meta.version === STORAGE_VERSION) return

  // 版本 0 -> 1：添加 createdAt 字段（如果缺失）
  if (meta.version < '1') {
    try {
      const history = getHistory()
      const migrated = history.map(item => ({
        ...item,
        createdAt: item.createdAt || new Date().toISOString()
      }))
      saveHistory(migrated)
    } catch {
      // 迁移失败不影响使用
    }
  }

  setStorageMeta({ version: STORAGE_VERSION, updatedAt: new Date().toISOString() })
}

/**
 * 检查并清理存储空间
 */
function checkStorageQuota () {
  try {
    const history = getHistory()
    if (history.length > MAX_HISTORY_ITEMS) {
      const trimmed = history.slice(0, MAX_HISTORY_ITEMS)
      saveHistory(trimmed)
      console.warn(`历史记录超过 ${MAX_HISTORY_ITEMS} 条，已自动清理旧数据`)
    }
  } catch {
    // 清理失败不阻断
  }
}

/**
 * 验证历史记录项格式
 */
function validateHistoryItem (item) {
  if (!item || typeof item !== 'object') return false
  if (!item.id || typeof item.id !== 'string') return false
  if (!item.name || typeof item.name !== 'string') return false
  if (!item.content || typeof item.content !== 'string') return false
  if (item.content.length > MAX_ITEM_LENGTH) {
    console.warn(`提示词内容过长 (${item.content.length} 字符)，已截断至 ${MAX_ITEM_LENGTH} 字符`)
    item.content = item.content.slice(0, MAX_ITEM_LENGTH)
  }
  return true
}

// 初始化：执行迁移和清理
if (isStorageAvailable()) {
  migrateData()
  checkStorageQuota()
}

export function getConfig () {
  if (!isStorageAvailable()) return null
  try {
    const data = localStorage.getItem(CONFIG_KEY)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Failed to get config:', e)
    return null
  }
}

export function saveConfig (config) {
  if (!isStorageAvailable()) return false
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    return true
  } catch (e) {
    console.error('Failed to save config:', e)
    return false
  }
}

export function clearConfig () {
  if (!isStorageAvailable()) return false
  try {
    localStorage.removeItem(CONFIG_KEY)
    return true
  } catch (e) {
    console.error('Failed to clear config:', e)
    return false
  }
}

export function getSelectedMode () {
  if (!isStorageAvailable()) return null
  try {
    const modeId = localStorage.getItem(SELECTED_MODE_KEY)
    if (!modeId) return null

    const validModeId = getPromptMode(modeId).id
    if (validModeId !== modeId) {
      localStorage.setItem(SELECTED_MODE_KEY, validModeId)
    }
    return validModeId
  } catch (e) {
    console.error('Failed to get selected mode:', e)
    return null
  }
}

export function saveSelectedMode (modeId) {
  if (!isStorageAvailable()) return false
  try {
    localStorage.setItem(SELECTED_MODE_KEY, getPromptMode(modeId).id)
    return true
  } catch (e) {
    console.error('Failed to save selected mode:', e)
    return false
  }
}

export function getHistory () {
  if (!isStorageAvailable()) return []
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Failed to get history:', e)
    return []
  }
}

export function saveHistory (history) {
  if (!isStorageAvailable()) return false
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    return true
  } catch (e) {
    // 存储空间不足时自动清理
    if (e.name === 'QuotaExceededError') {
      console.warn('存储空间不足，正在清理旧数据...')
      const trimmed = history.slice(0, Math.floor(history.length * 0.7))
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
        return true
      } catch {
        console.error('清理后仍无法保存')
        return false
      }
    }
    console.error('Failed to save history:', e)
    return false
  }
}

export function addToHistory (item) {
  if (!validateHistoryItem(item)) {
    console.error('Invalid history item:', item)
    return false
  }
  const history = getHistory()
  // 避免重复添加相同内容
  const duplicate = history.find(h => h.content === item.content)
  if (duplicate) {
    // 更新名称和时间
    updateHistoryItem(duplicate.id, {
      name: item.name,
      createdAt: item.createdAt,
      modeId: item.modeId,
      modeName: item.modeName,
      diagnosis: item.diagnosis,
      score: item.score,
      rawResult: item.rawResult
    })
    return true
  }
  history.unshift(item)
  // 限制数量
  if (history.length > MAX_HISTORY_ITEMS) {
    history.length = MAX_HISTORY_ITEMS
  }
  return saveHistory(history)
}

export function updateHistoryItem (id, updates) {
  const history = getHistory()
  const index = history.findIndex(item => item.id === id)
  if (index !== -1) {
    history[index] = { ...history[index], ...updates }
    return saveHistory(history)
  }
  return false
}

export function deleteFromHistory (id) {
  const history = getHistory()
  const filtered = history.filter(item => item.id !== id)
  return saveHistory(filtered)
}

/**
 * 导出所有数据为 JSON 文件
 */
export function exportData () {
  const data = {
    config: getConfig(),
    selectedMode: getSelectedMode(),
    history: getHistory(),
    exportedAt: new Date().toISOString(),
    version: STORAGE_VERSION
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `promptforge-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 从 JSON 文件导入数据
 */
export function importData (jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.config) saveConfig(data.config)
    if (data.selectedMode) saveSelectedMode(data.selectedMode)
    if (data.history && Array.isArray(data.history)) {
      const valid = data.history.filter(validateHistoryItem)
      saveHistory(valid)
    }
    return true
  } catch (e) {
    console.error('Failed to import data:', e)
    return false
  }
}
