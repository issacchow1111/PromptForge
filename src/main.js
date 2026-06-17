import { createApp } from 'vue'
import App from './App.vue'
import { migrateFromLocalStorage } from './utils/migrate.js'
import { initThemeBeforeMount } from './composables/useTheme.js'
import './style.css'

initThemeBeforeMount()

async function init () {
  try {
    const migrated = await migrateFromLocalStorage()
    if (migrated) {
      console.log('[PromptForge] 数据已从 localStorage 迁移到 IndexedDB')
    }
  } catch (e) {
    console.warn('[PromptForge] IndexedDB 初始化失败，将使用 localStorage:', e)
  }

  createApp(App).mount('#app')
}

init()
