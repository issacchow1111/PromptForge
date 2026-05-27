<template>
  <div id="app">
    <!-- Hero Section -->
    <section class="hero">
      <p class="hero-eyebrow">AI 提示词工具</p>
      <h1 class="hero-title">PromptForge</h1>
      <p class="hero-subtitle">智能优化提示词结构与表达，让 AI 更懂你的意图</p>
      <div class="hero-links">
        <a href="#workspace">开始优化</a>
      </div>
    </section>

    <!-- Main Workspace -->
    <section id="workspace" class="workspace">
      <PromptInput
        ref="promptInputRef"
        :has-config="!!config"
        :is-loading="isLoading"
        @optimize="handleOptimize"
        @clear="handleClearPrompt"
      />

      <ResultDisplay
        ref="resultDisplayRef"
        :result="optimizedResult"
        :is-loading="isLoading"
        :error="error"
        @save="handleSave"
        @copy="handleCopy"
        @update:result="optimizedResult = $event"
      />
    </section>

    <!-- Unified Float Menu -->
    <FloatMenu
      ref="floatMenuRef"
      :config="config"
      :history="history"
      @update:config="handleConfigUpdate"
      @clear="handleConfigClear"
      @load="handleLoadHistory"
      @rename="handleRename"
      @delete="handleDelete"
      @copy="handleHistoryCopy"
      @openHistory="handleOpenHistory"
      @view="handleOpenHistoryItem"
    />

    <!-- Full History Drawer -->
    <Transition name="fade">
      <div v-if="historyOpen" class="drawer-overlay" @click="historyOpen = false"></div>
    </Transition>

    <Transition name="slide-left">
      <div v-if="historyOpen" class="drawer-panel">
        <div class="drawer-header">
          <h2 class="drawer-title">📜 历史记录</h2>
          <button class="drawer-close" @click="historyOpen = false">✕</button>
        </div>

        <div class="drawer-content">
          <div v-if="history.length === 0" class="drawer-empty">
            暂无保存的提示词
          </div>

          <div
            v-for="item in history"
            :key="item.id"
            class="drawer-item"
          >
            <div class="drawer-item-header">
              <div class="drawer-item-name">{{ item.name }}</div>
              <div class="drawer-item-time">{{ formatTime(item.createdAt) }}</div>
            </div>

            <div class="drawer-item-preview">
              {{ item.content.substring(0, 100) }}{{ item.content.length > 100 ? '...' : '' }}
            </div>

            <div class="drawer-item-actions">
              <button class="btn btn-primary btn-small" @click="handleOpenHistoryItem(item)">
                👁 查看
              </button>
              <button class="btn btn-ghost btn-small" @click="handleLoadHistory(item)">
                📤 加载
              </button>
              <button class="btn btn-ghost btn-small" @click="handleCopyItem(item)">
                {{ copiedId === item.id ? '✓ 已复制' : '📋 复制' }}
              </button>
              <button class="btn btn-ghost btn-small" @click="handleRename(item)">
                ✏️
              </button>
              <button class="btn btn-danger btn-small" @click="handleDelete(item)">
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal -->
    <Modal
      v-if="showModal"
      :title="modalTitle"
      :value="modalValue"
      :placeholder="modalPlaceholder"
      @confirm="handleModalConfirm"
      @cancel="showModal = false"
    />

    <!-- Toast -->
    <Toast
      v-if="toast.show"
      :message="toast.message"
      :type="toast.type"
      @close="toast.show = false"
    />

    <!-- History Modal -->
    <HistoryModal
      :show="showHistoryModal"
      :item="historyModalItem"
      @close="showHistoryModal = false"
      @save="handleHistoryModalSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import PromptInput from './components/PromptInput.vue'
import ResultDisplay from './components/ResultDisplay.vue'
import FloatMenu from './components/FloatMenu.vue'
import Modal from './components/Modal.vue'
import Toast from './components/Toast.vue'
import HistoryModal from './components/HistoryModal.vue'
import { getConfig, saveConfig, clearConfig, getHistory, addToHistory, updateHistoryItem, deleteFromHistory } from './utils/storage.js'
import { optimizePrompt } from './utils/api.js'
import { copyToClipboard } from './utils/clipboard.js'

const config = ref(null)
const history = ref([])
const optimizedResult = ref('')
const isLoading = ref(false)
const error = ref('')
const resultDisplayRef = ref(null)
const promptInputRef = ref(null)
const floatMenuRef = ref(null)
const historyOpen = ref(false)

// Modal state
const showModal = ref(false)
const modalTitle = ref('')
const modalValue = ref('')
const modalPlaceholder = ref('')
let modalCallback = null

// Toast state
const toast = ref({ show: false, message: '', type: 'info' })

// History Modal state
const showHistoryModal = ref(false)
const historyModalItem = ref(null)

// Copied state
const copiedId = ref(null)

// Load config and history on mount
onMounted(() => {
  config.value = getConfig()
  history.value = getHistory()

  if (floatMenuRef.value) {
    floatMenuRef.value.checkShouldShow()
  }
})

// Config handlers
function handleConfigUpdate(newConfig) {
  config.value = newConfig
  saveConfig(newConfig)
  showToast('配置已保存', 'success')
}

function handleConfigClear() {
  if (clearConfig()) {
    config.value = null
    showToast('配置已清空', 'info')
  }
}

// Optimize handler
async function handleOptimize(prompt) {
  if (!config.value) {
    showToast('请先配置 API 信息', 'error')
    if (floatMenuRef.value) {
      floatMenuRef.value.isOpen = true
    }
    return
  }
  if (!prompt.trim()) {
    showToast('请输入待优化的提示词', 'error')
    return
  }

  isLoading.value = true
  error.value = ''
  optimizedResult.value = ''

  try {
    optimizedResult.value = await optimizePrompt(config.value, prompt)
    if (resultDisplayRef.value) {
      resultDisplayRef.value.viewMode = 'markdown'
    }
  } catch (e) {
    error.value = e.message
    showToast(e.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// Clear prompt handler
function handleClearPrompt() {
  optimizedResult.value = ''
  error.value = ''
  if (promptInputRef.value) {
    promptInputRef.value.promptText = ''
  }
}

// Save handler
function handleSave() {
  if (!optimizedResult.value) return

  modalTitle.value = '保存提示词'
  const now = new Date()
  modalValue.value = `提示词_${now.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-').replace(/\s/, ' ')}`
  modalPlaceholder.value = '输入提示词名称'

  modalCallback = (name) => {
    const item = {
      id: uuidv4(),
      name: name,
      content: optimizedResult.value,
      createdAt: new Date().toISOString()
    }
    addToHistory(item)
    history.value = getHistory()
    showToast('已保存到历史记录', 'success')
  }

  showModal.value = true
}

// Copy handlers
async function handleCopy(text) {
  const success = await copyToClipboard(text)
  if (success) {
    showToast('已复制到剪贴板', 'success')
  } else {
    showToast('复制失败，请手动复制', 'error')
  }
}

async function handleCopyItem(item) {
  const success = await copyToClipboard(item.content)
  if (success) {
    copiedId.value = item.id
    showToast('已复制到剪贴板', 'success')
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } else {
    showToast('复制失败，请手动复制', 'error')
  }
}

function handleHistoryCopy(item) {
  showToast('已复制到剪贴板', 'success')
}

// History handlers
function handleLoadHistory(item) {
  optimizedResult.value = item.content
  error.value = ''
  historyOpen.value = false
  showToast('已加载历史提示词', 'info')
}

function handleOpenHistory() {
  historyOpen.value = true
}

function handleOpenHistoryItem(item) {
  historyModalItem.value = item
  showHistoryModal.value = true
}

function handleHistoryModalSave(updatedItem) {
  updateHistoryItem(updatedItem.id, { content: updatedItem.content })
  history.value = getHistory()
  historyModalItem.value = { ...updatedItem }
  showToast('已保存修改', 'success')
}

function handleRename(item) {
  modalTitle.value = '重命名提示词'
  modalValue.value = item.name
  modalPlaceholder.value = '输入新名称'

  modalCallback = (newName) => {
    updateHistoryItem(item.id, { name: newName })
    history.value = getHistory()
    showToast('已重命名', 'success')
  }

  showModal.value = true
}

function handleDelete(item) {
  if (confirm(`确定要删除「${item.name}」吗？`)) {
    deleteFromHistory(item.id)
    history.value = getHistory()
    showToast('已删除', 'info')
  }
}

function formatTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Modal confirm
function handleModalConfirm(value) {
  if (modalCallback && value.trim()) {
    modalCallback(value.trim())
  }
  showModal.value = false
}

// Toast helper
function showToast(message, type = 'info') {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}
</script>

<style scoped>
/* Drawer Overlay */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 200;
}

/* Drawer Panel */
.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  max-width: 90vw;
  height: 100vh;
  background: var(--bg-primary);
  z-index: 300;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,0.15);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.drawer-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.drawer-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drawer-close:hover {
  background: var(--border-light);
  color: var(--text-primary);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.drawer-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.drawer-item {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.drawer-item:hover {
  background: var(--border-light);
}

.drawer-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.drawer-item-name {
  font-weight: 600;
  font-size: 1rem;
}

.drawer-item-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.drawer-item-preview {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
  word-break: break-word;
}

.drawer-item-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
}
</style>