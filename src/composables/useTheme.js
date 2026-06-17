import { ref, computed, watch } from 'vue'
import { getTheme, saveTheme, resolveEffectiveTheme } from '../utils/themeStorage.js'

const storedTheme = ref('auto')
const effectiveTheme = computed(() => resolveEffectiveTheme(storedTheme.value))
const isDark = computed(() => effectiveTheme.value === 'dark')

let initialized = false

export function useTheme () {
  if (!initialized) {
    initialized = true
    getTheme().then(theme => {
      storedTheme.value = theme
      applyTheme(effectiveTheme.value)
    })

    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (storedTheme.value === 'auto') {
          applyTheme(effectiveTheme.value)
        }
      }
      mediaQuery.addEventListener?.('change', handleChange)
    }
  }

  watch(effectiveTheme, (theme) => {
    applyTheme(theme)
  })

  return {
    theme: storedTheme,
    effectiveTheme,
    isDark,
    toggleTheme,
    setTheme
  }
}

export function applyTheme (theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

function toggleTheme () {
  const next = isDark.value ? 'light' : 'dark'
  setTheme(next)
}

function setTheme (theme) {
  storedTheme.value = theme
  saveTheme(theme)
}

export function initThemeBeforeMount () {
  const saved = localStorage.getItem('promptforge_theme')
  const theme = saved === 'dark' || saved === 'light' || saved === 'auto' ? saved : 'auto'
  applyTheme(resolveEffectiveTheme(theme))
}
