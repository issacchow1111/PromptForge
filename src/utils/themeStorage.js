import { db } from './db.js'

const THEME_KEY = 'promptforge_theme'
const VALID_THEMES = ['light', 'dark', 'auto']

let idbAvailable = true

db.open().catch(e => {
  console.warn('IndexedDB 不可用，主题将回退到 localStorage:', e)
  idbAvailable = false
})

function isValidTheme (value) {
  return VALID_THEMES.includes(value)
}

export async function getTheme () {
  let theme = null

  if (idbAvailable) {
    try {
      const record = await db.kv.get(THEME_KEY)
      if (record?.value) theme = record.value
    } catch (e) {
      console.warn('getTheme from IndexedDB failed:', e)
    }
  }

  if (!theme) {
    try {
      theme = localStorage.getItem(THEME_KEY)
    } catch (e) {
      console.warn('getTheme from localStorage failed:', e)
    }
  }

  return isValidTheme(theme) ? theme : 'auto'
}

export async function saveTheme (theme) {
  if (!isValidTheme(theme)) return

  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (e) {
    console.warn('localStorage 写入主题失败:', e)
  }

  if (!idbAvailable) return
  try {
    await db.kv.put({ key: THEME_KEY, value: theme })
  } catch (e) {
    console.warn('IndexedDB 写入主题失败:', e)
  }
}

export function getSystemPrefersDark () {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveEffectiveTheme (theme) {
  if (theme === 'dark') return 'dark'
  if (theme === 'light') return 'light'
  return getSystemPrefersDark() ? 'dark' : 'light'
}
