<template>
  <div id="app">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-badge">
        <span class="pulse-dot"></span>
        AI 提示词工具
      </div>
      <h1 class="hero-title">
        <span>PromptForge</span>
      </h1>
      <p class="hero-subtitle">智能优化提示词结构与表达，让 AI 更懂你的意图</p>
      <div class="hero-links">
        <a href="#workspace">
          开始优化
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
      <div class="hero-scroll-hint">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>

    <!-- Main Workspace -->
    <section id="workspace" class="workspace">
      <PromptInput
        ref="promptInputRef"
        :has-config="!!config"
        :is-loading="isLoading"
        :modes="promptModes"
        :precondition="precondition"
        v-model:selected-mode="selectedMode"
        @optimize="handleOptimize"
        @clear="handleClearPrompt"
        @open-precondition="preconditionModalOpen = true"
        @clear-precondition="handlePreconditionClear"
      />

      <ResultDisplay
        ref="resultDisplayRef"
        :result="optimizedResult"
        :optimization-result="optimizationResult"
        :is-loading="isLoading"
        :is-iterating="isIterating"
        :error="error"
        :iteration-history="iterationHistory"
        :active-iteration-id="activeIterationId"
        @save="handleSave"
        @copy="handleCopy"
        @iterate="handleIterate"
        @switch-version="handleSwitchIteration"
        @update:result="handleResultUpdate"
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
      <div
        v-if="historyOpen"
        class="drawer-overlay"
        @click="historyOpen = false"
      ></div>
    </Transition>

    <Transition name="slide-left">
      <div v-if="historyOpen" class="drawer-panel">
        <div class="drawer-header">
          <h2 class="drawer-title">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            历史记录
          </h2>
          <button class="drawer-close" @click="historyOpen = false">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="drawer-content">
          <div v-if="history.length === 0" class="drawer-empty">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="margin-bottom: 16px; opacity: 0.3"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div>暂无保存的提示词</div>
          </div>

          <TransitionGroup name="slide-up">
            <div v-for="item in history" :key="item.id" class="drawer-item">
              <div class="drawer-item-header">
                <div class="drawer-item-name">{{ item.name }}</div>
                <div class="drawer-item-time">
                  {{ formatTime(item.createdAt) }}
                </div>
              </div>

              <div class="drawer-item-preview">
                {{ item.content.substring(0, 100)
                }}{{ item.content.length > 100 ? "..." : "" }}
              </div>

              <div class="drawer-item-actions">
                <button
                  class="btn btn-primary btn-small"
                  @click="handleOpenHistoryItem(item)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  查看
                </button>
                <button
                  class="btn btn-ghost btn-small"
                  @click="handleLoadHistory(item)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  加载
                </button>
                <button
                  class="btn btn-ghost btn-small"
                  @click="handleCopyItem(item)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path
                      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                    />
                  </svg>
                  {{ copiedId === item.id ? "已复制" : "复制" }}
                </button>
                <button
                  class="btn btn-ghost btn-small"
                  @click="handleRename(item)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    />
                  </svg>
                </button>
                <button
                  class="btn btn-danger btn-small"
                  @click="handleDelete(item)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </TransitionGroup>
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
      :show="toast.show"
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

    <PreconditionModal
      :show="preconditionModalOpen"
      :value="precondition"
      @save="handlePreconditionSave"
      @clear="handlePreconditionClear"
      @cancel="preconditionModalOpen = false"
    />

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          PromptForge
        </div>
        <div class="footer-divider"></div>
        <div class="footer-links">
          <a
            href="https://github.com/issacchow1111/PromptForge"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
            GitHub 仓库
          </a>
        </div>
        <div class="footer-copyright">
          © 2026 PromptForge. Made with by issacchow1111
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import PromptInput from './components/PromptInput.vue'
import ResultDisplay from './components/ResultDisplay.vue'
import FloatMenu from './components/FloatMenu.vue'
import Modal from './components/Modal.vue'
import Toast from './components/Toast.vue'
import HistoryModal from './components/HistoryModal.vue'
import PreconditionModal from './components/PreconditionModal.vue'
import { getConfig, saveConfig, clearConfig, getSelectedMode, saveSelectedMode, getHistory, addToHistory, updateHistoryItem, deleteFromHistory, getPrecondition, savePrecondition, clearPrecondition } from './utils/storage.js'
import { hasCompleteOptimizationReport, iteratePrompt, optimizePrompt } from './utils/api.js'
import { copyToClipboard } from './utils/clipboard.js'
import { DEFAULT_PROMPT_MODE_ID, PROMPT_MODES, getPromptMode } from './utils/promptModes.js'

const config = ref(null)
const history = ref([])
const optimizedResult = ref('')
const optimizationResult = ref(null)
const originalPrompt = ref('')
const iterationHistory = ref([])
const activeIterationId = ref(null)
const precondition = ref('')
const preconditionModalOpen = ref(false)
const activePreconditionSnapshot = ref('')
const isLoading = ref(false)
const isIterating = ref(false)
const error = ref('')
const promptModes = PROMPT_MODES
const selectedMode = ref(DEFAULT_PROMPT_MODE_ID)
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
  selectedMode.value = getPromptMode(getSelectedMode()).id
  precondition.value = getPrecondition()

  if (floatMenuRef.value) {
    floatMenuRef.value.checkShouldShow()
  }
})

watch(selectedMode, (modeId) => {
  saveSelectedMode(getPromptMode(modeId).id)
})

// Config handlers
function handleConfigUpdate (newConfig) {
  config.value = newConfig
  saveConfig(newConfig)
  showToast('配置已保存', 'success')
}

function handleConfigClear () {
  if (clearConfig()) {
    config.value = null
    showToast('配置已清空', 'info')
  }
}

function handlePreconditionSave (value) {
  if (savePrecondition(value)) {
    precondition.value = value
    preconditionModalOpen.value = false
    showToast('前置条件已保存', 'success')
  } else {
    showToast('前置条件保存失败', 'error')
  }
}

function handlePreconditionClear () {
  if (clearPrecondition()) {
    precondition.value = ''
    preconditionModalOpen.value = false
    showToast('前置条件已清空', 'info')
  } else {
    showToast('前置条件清空失败', 'error')
  }
}

// Optimize handler
async function handleOptimize (prompt) {
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
  optimizationResult.value = null
  originalPrompt.value = ''
  iterationHistory.value = []
  activeIterationId.value = null
  activePreconditionSnapshot.value = ''
  const preconditionSnapshot = precondition.value

  try {
    const result = await optimizePrompt(config.value, prompt, selectedMode.value, preconditionSnapshot)
    const mode = getPromptMode(selectedMode.value)
    const version = createIterationVersion({
      type: 'initial',
      instruction: '初始版本',
      modeId: mode.id,
      modeName: mode.name,
      result,
      precondition: preconditionSnapshot,
      index: 0
    })
    originalPrompt.value = prompt
    activePreconditionSnapshot.value = preconditionSnapshot
    iterationHistory.value = [version]
    activeIterationId.value = version.id
    syncResultFromVersion(version)
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
function handleClearPrompt () {
  optimizedResult.value = ''
  optimizationResult.value = null
  originalPrompt.value = ''
  iterationHistory.value = []
  activeIterationId.value = null
  activePreconditionSnapshot.value = ''
  error.value = ''
  if (promptInputRef.value) {
    promptInputRef.value.promptText = ''
  }
}

async function handleIterate (instruction) {
  const currentVersion = getActiveIteration()
  const normalizedInstruction = String(instruction || '').trim()

  if (!config.value) {
    showToast('请先配置 API 信息', 'error')
    if (floatMenuRef.value) {
      floatMenuRef.value.isOpen = true
    }
    return
  }
  if (!currentVersion || !currentVersion.optimizedPrompt) {
    showToast('请先完成一次优化', 'error')
    return
  }
  if (!normalizedInstruction) {
    showToast('请输入迭代要求', 'error')
    return
  }

  isIterating.value = true
  error.value = ''

  try {
    const result = await iteratePrompt(config.value, {
      modeId: currentVersion.modeId || selectedMode.value,
      originalPrompt: originalPrompt.value,
      currentPrompt: currentVersion.optimizedPrompt,
      instruction: normalizedInstruction,
      diagnosis: currentVersion.diagnosis,
      score: currentVersion.score,
      precondition: activePreconditionSnapshot.value
    })

    if (!hasCompleteOptimizationReport(result)) {
      throw new Error('模型返回的迭代结果缺少诊断报告或评分，已保留当前版本')
    }

    const version = createIterationVersion({
      type: 'iteration',
      instruction: normalizedInstruction,
      modeId: currentVersion.modeId || selectedMode.value,
      modeName: currentVersion.modeName || getPromptMode(selectedMode.value).name,
      result,
      precondition: activePreconditionSnapshot.value,
      index: iterationHistory.value.length
    })
    iterationHistory.value = [...iterationHistory.value, version]
    activeIterationId.value = version.id
    syncResultFromVersion(version)
    showToast('已生成新版本', 'success')
  } catch (e) {
    showToast(e.message || '继续迭代失败，已保留当前版本', 'error')
  } finally {
    isIterating.value = false
  }
}

function handleSwitchIteration (id) {
  const version = iterationHistory.value.find(item => item.id === id)
  if (!version) return
  activeIterationId.value = id
  syncResultFromVersion(version)
}

// Save handler
function handleSave () {
  if (!optimizedResult.value) return

  modalTitle.value = '保存提示词'
  const now = new Date()
  modalValue.value = `提示词_${now.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-').replace(/\s/, ' ')}`
  modalPlaceholder.value = '输入提示词名称'

  modalCallback = (name) => {
    const mode = getPromptMode(selectedMode.value)
    const item = {
      id: uuidv4(),
      name: name,
      content: optimizedResult.value,
      modeId: mode.id,
      modeName: mode.name,
      diagnosis: optimizationResult.value?.diagnosis || null,
      score: optimizationResult.value?.score || null,
      diagnosisStale: Boolean(optimizationResult.value?.diagnosisStale),
      scoreStale: Boolean(optimizationResult.value?.scoreStale),
      rawResult: optimizationResult.value?.rawContent || null,
      originalPrompt: originalPrompt.value,
      precondition: activePreconditionSnapshot.value,
      iterationHistory: iterationHistory.value,
      activeIterationId: activeIterationId.value,
      createdAt: new Date().toISOString()
    }
    addToHistory(item)
    history.value = getHistory()
    showToast('已保存到历史记录', 'success')
  }

  showModal.value = true
}

// Copy handlers
async function handleCopy (text) {
  const success = await copyToClipboard(text)
  if (success) {
    showToast('已复制到剪贴板', 'success')
  } else {
    showToast('复制失败，请手动复制', 'error')
  }
}

async function handleCopyItem (item) {
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

function handleHistoryCopy (item) {
  showToast('已复制到剪贴板', 'success')
}

// History handlers
function handleLoadHistory (item) {
  const versions = normalizeIterationHistory(item)
  originalPrompt.value = item.originalPrompt || ''
  iterationHistory.value = versions
  activeIterationId.value = versions.find(version => version.id === item.activeIterationId)?.id || versions[versions.length - 1]?.id || null

  const activeVersion = getActiveIteration()
  if (activeVersion) {
    activePreconditionSnapshot.value = item.precondition || activeVersion.precondition || ''
    selectedMode.value = getPromptMode(activeVersion.modeId).id
    syncResultFromVersion(activeVersion)
  } else {
    activePreconditionSnapshot.value = item.precondition || ''
    optimizedResult.value = item.content
    optimizationResult.value = {
      diagnosis: item.diagnosis || null,
      score: item.score || null,
      optimizedPrompt: item.content,
      rawContent: item.rawResult || item.content
    }
  }
  error.value = ''
  historyOpen.value = false
  showToast('已加载历史提示词', 'info')
}

function handleResultUpdate (value) {
  optimizedResult.value = value
  if (optimizationResult.value) {
    optimizationResult.value = {
      ...optimizationResult.value,
      diagnosisStale: Boolean(optimizationResult.value.diagnosis),
      scoreStale: Boolean(optimizationResult.value.score),
      optimizedPrompt: value,
      rawContent: value
    }
  }
  iterationHistory.value = iterationHistory.value.map(version => {
    if (version.id !== activeIterationId.value) return version
    return {
      ...version,
      diagnosisStale: Boolean(version.diagnosis),
      scoreStale: Boolean(version.score),
      optimizedPrompt: value,
      rawContent: value
    }
  })
}

function handleOpenHistory () {
  historyOpen.value = true
}

function handleOpenHistoryItem (item) {
  historyModalItem.value = item
  showHistoryModal.value = true
}

function handleHistoryModalSave (updatedItem) {
  const updatedIterationHistory = Array.isArray(updatedItem.iterationHistory)
    ? updatedItem.iterationHistory.map(version => {
      if (version.id !== updatedItem.activeIterationId) return version
      return {
        ...version,
        diagnosisStale: Boolean(version.diagnosis),
        scoreStale: Boolean(version.score),
        optimizedPrompt: updatedItem.content,
        rawContent: updatedItem.content
      }
    })
    : null
  const updates = {
    content: updatedItem.content,
    diagnosis: updatedItem.diagnosis || null,
    score: updatedItem.score || null,
    diagnosisStale: Boolean(updatedItem.diagnosis),
    scoreStale: Boolean(updatedItem.score),
    rawResult: updatedItem.content,
    precondition: updatedItem.precondition || '',
    iterationHistory: updatedIterationHistory,
    activeIterationId: updatedItem.activeIterationId || null
  }
  updateHistoryItem(updatedItem.id, updates)
  history.value = getHistory()
  historyModalItem.value = { ...updatedItem, ...updates }
  showToast('已保存修改', 'success')
}

function handleRename (item) {
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

function handleDelete (item) {
  if (confirm(`确定要删除「${item.name}」吗？`)) {
    deleteFromHistory(item.id)
    history.value = getHistory()
    showToast('已删除', 'info')
  }
}

function formatTime (isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function createIterationVersion ({ type, instruction, modeId, modeName, result, precondition, index }) {
  const versionNumber = index + 1
  return {
    id: uuidv4(),
    type,
    instruction,
    title: type === 'initial' ? '版本 1：初始版本' : `版本 ${versionNumber}：${instruction}`,
    modeId,
    modeName,
    precondition: precondition || '',
    diagnosis: result.diagnosis || null,
    score: result.score || null,
    diagnosisStale: false,
    scoreStale: false,
    optimizedPrompt: result.optimizedPrompt || '',
    rawContent: result.rawContent || result.optimizedPrompt || '',
    createdAt: new Date().toISOString()
  }
}

function normalizeIterationHistory (item) {
  if (Array.isArray(item.iterationHistory) && item.iterationHistory.length > 0) {
    return item.iterationHistory.map((version, index) => ({
      id: version.id || uuidv4(),
      type: version.type === 'iteration' ? 'iteration' : 'initial',
      instruction: version.instruction || (index === 0 ? '初始版本' : '继续优化'),
      title: version.title || `版本 ${index + 1}：${version.instruction || (index === 0 ? '初始版本' : '继续优化')}`,
      modeId: version.modeId || item.modeId || DEFAULT_PROMPT_MODE_ID,
      modeName: version.modeName || item.modeName || getPromptMode(item.modeId).name,
      precondition: version.precondition || item.precondition || '',
      diagnosis: version.diagnosis || null,
      score: version.score || null,
      diagnosisStale: Boolean(version.diagnosisStale),
      scoreStale: Boolean(version.scoreStale),
      optimizedPrompt: version.optimizedPrompt || version.content || item.content || '',
      rawContent: version.rawContent || version.rawResult || version.optimizedPrompt || version.content || item.content || '',
      createdAt: version.createdAt || item.createdAt || new Date().toISOString()
    }))
  }

  return [{
    id: uuidv4(),
    type: 'initial',
    instruction: '初始版本',
    title: '版本 1：初始版本',
    modeId: item.modeId || DEFAULT_PROMPT_MODE_ID,
    modeName: item.modeName || getPromptMode(item.modeId).name,
    precondition: item.precondition || '',
    diagnosis: item.diagnosis || null,
    score: item.score || null,
    diagnosisStale: Boolean(item.diagnosisStale),
    scoreStale: Boolean(item.scoreStale),
    optimizedPrompt: item.content || '',
    rawContent: item.rawResult || item.content || '',
    createdAt: item.createdAt || new Date().toISOString()
  }]
}

function getActiveIteration () {
  return iterationHistory.value.find(item => item.id === activeIterationId.value) || null
}

function syncResultFromVersion (version) {
  optimizedResult.value = version.optimizedPrompt || ''
  optimizationResult.value = {
    diagnosis: version.diagnosis || null,
    score: version.score || null,
    diagnosisStale: Boolean(version.diagnosisStale),
    scoreStale: Boolean(version.scoreStale),
    optimizedPrompt: version.optimizedPrompt || '',
    rawContent: version.rawContent || version.optimizedPrompt || ''
  }
}

// Modal confirm
function handleModalConfirm (value) {
  if (modalCallback && value.trim()) {
    modalCallback(value.trim())
  }
  showModal.value = false
}

// Toast helper
function showToast (message, type = 'info') {
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
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 200;
}

/* Drawer Panel */
.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 440px;
  max-width: 90vw;
  height: 100vh;
  background: var(--bg-elevated);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  z-index: 300;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.15);
  border-left: 1px solid var(--border);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid var(--border-light);
}

.drawer-title {
  font-size: 1.15rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
}

.drawer-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-close:hover {
  background: var(--border);
  color: var(--text-primary);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.drawer-empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-tertiary);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drawer-item {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
  margin-bottom: 12px;
  transition: all 0.25s var(--ease-out);
  border: 1px solid var(--border-light);
}

.drawer-item:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.drawer-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.drawer-item-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.drawer-item-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.drawer-item-preview {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 14px;
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
  transition: transform 0.35s var(--ease-out);
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s var(--ease-out);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(15px);
}
</style>
