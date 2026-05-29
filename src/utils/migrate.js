import { db } from './db.js'

const LEGACY_KEYS = {
  config: 'prompt_optimizer_config',
  history: 'prompt_optimizer_history',
  selectedMode: 'promptforge_selected_mode',
  precondition: 'promptforge_precondition',
  meta: 'prompt_optimizer_meta'
}

export async function migrateFromLocalStorage () {
  const migrated = await db.kv.get('migratedFromLocalStorage')
  if (migrated?.value === true) return false

  const historyCount = await db.history.count()
  if (historyCount > 0) {
    await db.kv.put({ key: 'migratedFromLocalStorage', value: true })
    return false
  }

  let hasData = false

  await db.transaction('rw', [db.config, db.kv, db.history], async () => {
    const configData = localStorage.getItem(LEGACY_KEYS.config)
    if (configData) {
      await db.config.put({ key: 'main', value: JSON.parse(configData) })
      hasData = true
    }

    const modeData = localStorage.getItem(LEGACY_KEYS.selectedMode)
    if (modeData) {
      await db.kv.put({ key: 'selectedMode', value: modeData })
      hasData = true
    }

    const preData = localStorage.getItem(LEGACY_KEYS.precondition)
    if (preData) {
      await db.kv.put({ key: 'precondition', value: preData })
      hasData = true
    }

    const historyData = localStorage.getItem(LEGACY_KEYS.history)
    if (historyData) {
      const history = JSON.parse(historyData)
      if (history.length > 0) {
        await db.history.bulkAdd(history)
        hasData = true
      }
    }

    if (hasData) {
      await db.kv.put({ key: 'migratedFromLocalStorage', value: true })
    }
  })

  return hasData
}

export function clearLegacyStorage () {
  Object.values(LEGACY_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}
