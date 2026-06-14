import { db } from './db.js'
import { getPromptMode } from './promptModes.js'

const MAX_HISTORY_ITEMS = 100
const MAX_ITEM_LENGTH = 50000 // 单个提示词最大字符数

let idbAvailable = true

db.open().catch(e => {
  console.warn('IndexedDB 不可用，回退到 localStorage:', e)
  idbAvailable = false
})

function safeJsonParse (value, fallback, label = 'JSON') {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch (e) {
    console.warn(`${label} 解析失败，已使用默认值:`, e)
    return fallback
  }
}

function readLocalJson (key, fallback) {
  return safeJsonParse(localStorage.getItem(key), fallback, key)
}

function getLocalHistory () {
  const history = readLocalJson('prompt_optimizer_history', [])
  return Array.isArray(history) ? history : []
}

function writeLocalHistory (history) {
  localStorage.setItem('prompt_optimizer_history', JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)))
}

function sanitizeConfigForExport (config) {
  if (!config || typeof config !== 'object') return config
  const { apiKey, ...safeConfig } = config
  return {
    ...safeConfig,
    apiKey: ''
  }
}

async function mirrorIdbHistoryToLocalStorage () {
  if (!idbAvailable) return
  try {
    const history = await db.history
      .orderBy('createdAt')
      .reverse()
      .limit(MAX_HISTORY_ITEMS)
      .toArray()
    writeLocalHistory(history)
  } catch (e) {
    console.warn('同步历史记录到 localStorage 失败:', e)
  }
}

// ========== 配置 ==========
export async function getConfig () {
  // Try IndexedDB first
  if (idbAvailable) {
    try {
      const record = await db.config.get('main')
      if (record?.value) return record.value
    } catch (e) {
      console.warn('getConfig from IndexedDB failed, trying localStorage:', e)
    }
  }
  // Fall back to localStorage
  try {
    const data = localStorage.getItem('prompt_optimizer_config')
    return data ? safeJsonParse(data, null, 'prompt_optimizer_config') : null
  } catch (e) {
    console.error('getConfig failed:', e)
    return null
  }
}

export async function saveConfig (config) {
  // Always write to localStorage as safety net
  try {
    localStorage.setItem('prompt_optimizer_config', JSON.stringify(config))
  } catch (e) {
    console.warn('localStorage 写入配置失败:', e)
  }
  if (!idbAvailable) return
  try {
    await db.config.put({ key: 'main', value: config })
  } catch (e) {
    console.warn('IndexedDB 写入配置失败，已通过 localStorage 保存:', e)
  }
}

export async function clearConfig () {
  localStorage.removeItem('prompt_optimizer_config')
  if (!idbAvailable) return
  try {
    await db.config.delete('main')
  } catch (e) {
    console.warn('IndexedDB 清除配置失败:', e)
  }
}

// ========== 选中模式 ==========
export async function getSelectedMode () {
  const getLocalSelectedMode = () => {
    const modeId = localStorage.getItem('promptforge_selected_mode')
    if (!modeId) return null
    const validModeId = getPromptMode(modeId).id
    if (validModeId !== modeId) {
      localStorage.setItem('promptforge_selected_mode', validModeId)
    }
    return validModeId
  }
  if (!idbAvailable) return getLocalSelectedMode()
  try {
    const record = await db.kv.get('selectedMode')
    if (!record?.value) return null
    const validModeId = getPromptMode(record.value).id
    if (validModeId !== record.value) {
      await db.kv.put({ key: 'selectedMode', value: validModeId })
    }
    return validModeId
  } catch (e) {
    console.error('getSelectedMode failed, trying localStorage:', e)
    return getLocalSelectedMode()
  }
}

export async function saveSelectedMode (modeId) {
  const validModeId = getPromptMode(modeId).id
  localStorage.setItem('promptforge_selected_mode', validModeId)
  if (!idbAvailable) {
    return true
  }
  try {
    await db.kv.put({ key: 'selectedMode', value: validModeId })
    return true
  } catch (e) {
    console.error('saveSelectedMode failed:', e)
    return false
  }
}

// ========== 前置条件 ==========
export async function getPrecondition () {
  const getLocalPrecondition = () => localStorage.getItem('promptforge_precondition') || ''
  if (!idbAvailable) return getLocalPrecondition()
  try {
    const record = await db.kv.get('precondition')
    return record?.value || ''
  } catch (e) {
    console.error('getPrecondition failed, trying localStorage:', e)
    return getLocalPrecondition()
  }
}

export async function savePrecondition (value) {
  localStorage.setItem('promptforge_precondition', String(value || ''))
  if (!idbAvailable) {
    return true
  }
  try {
    await db.kv.put({ key: 'precondition', value: String(value || '') })
    return true
  } catch (e) {
    console.error('savePrecondition failed:', e)
    return false
  }
}

export async function clearPrecondition () {
  localStorage.removeItem('promptforge_precondition')
  if (!idbAvailable) {
    return true
  }
  try {
    await db.kv.delete('precondition')
    return true
  } catch (e) {
    console.error('clearPrecondition failed:', e)
    return false
  }
}

// ========== 历史记录 ==========
export async function getHistory () {
  if (!idbAvailable) {
    return getLocalHistory()
  }
  try {
    return await db.history
      .orderBy('createdAt')
      .reverse()
      .limit(MAX_HISTORY_ITEMS)
      .toArray()
  } catch (e) {
    console.error('getHistory failed, trying localStorage:', e)
    return getLocalHistory()
  }
}

export async function saveHistory (history) {
  try {
    writeLocalHistory(history)
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      const trimmed = history.slice(0, Math.floor(history.length * 0.7))
      writeLocalHistory(trimmed)
    } else if (!idbAvailable) {
      return false
    }
  }
  if (!idbAvailable) {
    return true
  }
  try {
    await db.transaction('rw', db.history, async () => {
      await db.history.clear()
      await db.history.bulkAdd(history.slice(0, MAX_HISTORY_ITEMS))
    })
    return true
  } catch (e) {
    console.error('saveHistory failed:', e)
    return false
  }
}

export async function addToHistory (item) {
  if (!validateHistoryItem(item)) {
    console.error('Invalid history item:', item)
    return false
  }
  if (!idbAvailable) {
    const history = getLocalHistory()
    history.unshift(item)
    if (history.length > MAX_HISTORY_ITEMS) {
      history.length = MAX_HISTORY_ITEMS
    }
    return saveHistory(history)
  }
  try {
    await db.history.add(item)
    const count = await db.history.count()
    if (count > MAX_HISTORY_ITEMS) {
      const oldest = await db.history
        .orderBy('createdAt')
        .limit(count - MAX_HISTORY_ITEMS)
        .primaryKeys()
      await db.history.bulkDelete(oldest)
    }
    await mirrorIdbHistoryToLocalStorage()
    return true
  } catch (e) {
    if (e.name === 'ConstraintError') {
      await db.history.put(item)
      await mirrorIdbHistoryToLocalStorage()
      return true
    }
    console.error('addToHistory failed:', e)
    return false
  }
}

export async function updateHistoryItem (id, updates) {
  if (!idbAvailable) {
    const history = getLocalHistory()
    const index = history.findIndex(item => item.id === id)
    if (index !== -1) {
      history[index] = { ...history[index], ...updates }
      return saveHistory(history)
    }
    return false
  }
  try {
    await db.history.update(id, updates)
    await mirrorIdbHistoryToLocalStorage()
    return true
  } catch (e) {
    console.error('updateHistoryItem failed:', e)
    return false
  }
}

export async function deleteFromHistory (id) {
  if (!idbAvailable) {
    const history = getLocalHistory()
    const filtered = history.filter(item => item.id !== id)
    return saveHistory(filtered)
  }
  try {
    await db.history.delete(id)
    await mirrorIdbHistoryToLocalStorage()
    return true
  } catch (e) {
    console.error('deleteFromHistory failed:', e)
    return false
  }
}

// ========== 搜索（新增）==========
export async function searchHistory (keyword) {
  if (!keyword.trim()) return getHistory()
  const lower = keyword.toLowerCase()
  if (!idbAvailable) {
    const all = getLocalHistory()
    return all
      .filter(item =>
        String(item.name || '').toLowerCase().includes(lower) ||
        String(item.content || '').toLowerCase().includes(lower)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50)
  }
  try {
    const all = await db.history.toArray()
    return all
      .filter(item =>
        String(item.name || '').toLowerCase().includes(lower) ||
        String(item.content || '').toLowerCase().includes(lower)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50)
  } catch (e) {
    console.error('searchHistory failed:', e)
    return []
  }
}

// ========== 导入/导出 ==========
export async function exportData () {
  const [config, selectedMode, precondition, history] = await Promise.all([
    getConfig(),
    idbAvailable ? db.kv.get('selectedMode') : { value: localStorage.getItem('promptforge_selected_mode') },
    idbAvailable ? db.kv.get('precondition') : { value: localStorage.getItem('promptforge_precondition') },
    getHistory()
  ])

  const data = {
    config: sanitizeConfigForExport(config),
    selectedMode: selectedMode?.value || null,
    precondition: precondition?.value || '',
    history,
    exportedAt: new Date().toISOString(),
    version: '1'
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `promptforge-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  // Delay revoke to ensure Safari/Firefox can start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function importData (jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (data.config) await saveConfig(data.config)
    if (data.selectedMode) await saveSelectedMode(data.selectedMode)
    if (typeof data.precondition === 'string') await savePrecondition(data.precondition)
    if (data.history && Array.isArray(data.history)) {
      const valid = normalizeImportedHistory(data.history)
      if (idbAvailable) {
        await db.transaction('rw', db.history, async () => {
          await db.history.clear()
          await db.history.bulkAdd(valid)
        })
        writeLocalHistory(valid)
      } else {
        await saveHistory(valid)
      }
    }
    return true
  } catch (e) {
    console.error('Failed to import data:', e)
    return false
  }
}

// ========== 工具函数 ==========
function validateHistoryItem (item) {
  if (!item || typeof item !== 'object') return false
  if (!item.id || typeof item.id !== 'string') return false
  if (!item.name || typeof item.name !== 'string') return false
  if (!item.content || typeof item.content !== 'string') return false
  if (item.content.length > MAX_ITEM_LENGTH) {
    item.content = item.content.slice(0, MAX_ITEM_LENGTH)
  }
  return true
}

function normalizeImportedHistory (history) {
  const byId = new Map()
  history
    .filter(validateHistoryItem)
    .forEach(item => {
      const existing = byId.get(item.id)
      if (!existing || new Date(item.createdAt || 0) >= new Date(existing.createdAt || 0)) {
        byId.set(item.id, item)
      }
    })

  return Array.from(byId.values())
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, MAX_HISTORY_ITEMS)
}
