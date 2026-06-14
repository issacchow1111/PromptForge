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
        :has-config="hasDirectConfig"
        :proxy-available="proxyAvailable"
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
        @retry="handleRetry"
      />
    </section>

    <!-- Unified Float Menu -->
    <FloatMenu
      ref="floatMenuRef"
      :config="config"
      :proxy-reachable="proxyReachable"
      :proxy-configured="proxyConfigured"
      :history="history"
      @update:config="handleConfigUpdate"
      @clear="handleConfigClear"
      @load="handleLoadHistory"
      @rename="handleRename"
      @delete="handleDelete"
      @copy="handleHistoryCopy"
      @openHistory="handleOpenHistory"
      @view="handleOpenHistoryItem"
      @export="handleExport"
      @import="handleImport"
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
          <div class="drawer-search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="historySearchKeyword"
              type="text"
              placeholder="搜索历史记录..."
              class="drawer-search-input"
            />
          </div>

          <div v-if="filteredHistory.length === 0" class="drawer-empty">
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
            <div v-for="item in filteredHistory" :key="item.id" class="drawer-item">
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
      :pending="modalPending"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
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

    <!-- Thinking Overlay -->
    <ThinkingOverlay :show="isThinking" :streaming-text="streamingText" @stop="handleStopThinking" />

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
          © 2026 PromptForge. Made with ❤️ by issacchow1111
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import PromptInput from './components/PromptInput.vue'
import ResultDisplay from './components/ResultDisplay.vue'
import FloatMenu from './components/FloatMenu.vue'
import Modal from './components/Modal.vue'
import Toast from './components/Toast.vue'
import HistoryModal from './components/HistoryModal.vue'
import PreconditionModal from './components/PreconditionModal.vue'
import ThinkingOverlay from './components/ThinkingOverlay.vue'
import { getConfig, saveConfig, clearConfig, getSelectedMode, saveSelectedMode, getHistory, addToHistory, updateHistoryItem, deleteFromHistory, getPrecondition, savePrecondition, clearPrecondition, searchHistory, exportData, importData } from './utils/storage.js'
import { hasCompleteOptimizationReport, streamOptimizeOrIterate, parseOptimizationResult } from './utils/api.js'
import { extractOptimizedPrompt } from './utils/streamParser.js'
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
const isThinking = ref(false)
const abortController = ref(null)
const streamingText = ref('')
const error = ref('')
const promptModes = PROMPT_MODES
const selectedMode = ref(DEFAULT_PROMPT_MODE_ID)
const resultDisplayRef = ref(null)
const promptInputRef = ref(null)
const floatMenuRef = ref(null)
const historyOpen = ref(false)
const historySearchKeyword = ref('')
const filteredHistory = ref([])
const proxyReachable = ref(false)
const proxyConfigured = ref(false)
const proxyAvailable = computed(() => proxyReachable.value && proxyConfigured.value)
const hasDirectConfig = computed(() => Boolean(config.value?.apiKey && config.value?.baseURL && config.value?.model))

// Initialize filtered history whenever history changes
watch(history, (newHistory) => {
  filteredHistory.value = newHistory
}, { immediate: true })

// Search history when keyword changes
watch(historySearchKeyword, async (keyword) => {
  const searchId = ++historySearchId
  const results = await searchHistory(keyword)
  if (searchId === historySearchId) {
    filteredHistory.value = results
  }
})

// Modal state
const showModal = ref(false)
const modalTitle = ref('')
const modalValue = ref('')
const modalPlaceholder = ref('')
const modalPending = ref(false)
let modalCallback = null
let historySearchId = 0

// Toast state
const toast = ref({ show: false, message: '', type: 'info' })

// History Modal state
const showHistoryModal = ref(false)
const historyModalItem = ref(null)

// Copied state
const copiedId = ref(null)

// Load config and history on mount
onMounted(async () => {
  try {
    const [cfg, hist, mode, pre] = await Promise.all([
      getConfig(),
      getHistory(),
      getSelectedMode(),
      getPrecondition()
    ])
    config.value = cfg
    history.value = hist
    selectedMode.value = getPromptMode(mode).id
    precondition.value = pre
  } catch (e) {
    console.error('加载数据失败:', e)
    showToast('加载数据失败，请刷新页面重试', 'error')
  }

  // Detect whether backend proxy service is running
  try {
    const res = await fetch('/api/health')
    if (res.ok) {
      const data = await res.json()
      proxyReachable.value = data.success === true
      proxyConfigured.value = data.proxyConfigured === true
    }
  } catch (e) {
    proxyReachable.value = false
    proxyConfigured.value = false
  }
})

watch(selectedMode, async (modeId) => {
  try {
    await saveSelectedMode(getPromptMode(modeId).id)
  } catch (e) {
    console.error('保存选中模式失败:', e)
  }
})

// Config handlers
let configSaveTimer = null

async function handleConfigUpdate (newConfig) {
  config.value = newConfig
  clearTimeout(configSaveTimer)
  configSaveTimer = setTimeout(async () => {
    configSaveTimer = null
    try {
      await saveConfig(config.value)
    } catch (e) {
      console.error('保存配置失败:', e)
      showToast('配置保存失败', 'error')
      return
    }
    showToast('配置已保存', 'success')
  }, 500)
}

async function handleConfigClear () {
  try {
    await clearConfig()
    config.value = null
    showToast('配置已清空', 'info')
  } catch (e) {
    console.error('清空配置失败:', e)
    showToast('配置清空失败', 'error')
  }
}

async function handlePreconditionSave (value) {
  try {
    await savePrecondition(value)
    precondition.value = value
    preconditionModalOpen.value = false
    showToast('前置条件已保存', 'success')
  } catch (e) {
    console.error('保存前置条件失败:', e)
    showToast('前置条件保存失败', 'error')
  }
}

async function handlePreconditionClear () {
  try {
    await clearPrecondition()
    precondition.value = ''
    preconditionModalOpen.value = false
    showToast('前置条件已清空', 'info')
  } catch (e) {
    console.error('清空前置条件失败:', e)
    showToast('前置条件清空失败', 'error')
  }
}

// Optimize handler
async function handleOptimize (prompt) {
  if (!hasDirectConfig.value && !proxyAvailable.value) {
    showToast(getMissingApiConfigMessage(), 'error')
    floatMenuRef.value?.openConfig?.()
    return
  }
  if (!prompt.trim()) {
    showToast('请输入待优化的提示词', 'error')
    return
  }

  const controller = new AbortController()
  abortController.value = controller
  isLoading.value = true
  isThinking.value = true
  streamingText.value = ''
  error.value = ''
  optimizedResult.value = ''
  optimizationResult.value = null
  originalPrompt.value = ''
  iterationHistory.value = []
  activeIterationId.value = null
  activePreconditionSnapshot.value = ''
  const preconditionSnapshot = precondition.value

  try {
    const rawContent = await streamOptimizeOrIterate(
      config.value,
      {
        type: 'optimize',
        modeId: selectedMode.value,
        userPrompt: prompt,
        precondition: preconditionSnapshot
      },
      (accumulatedText) => {
        streamingText.value = extractOptimizedPrompt(accumulatedText)
      },
      controller.signal
    )

    const result = parseOptimizationResult(rawContent)
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
    if (!hasCompleteOptimizationReport(result)) {
      showToast('模型返回内容未包含完整诊断/评分，已仅展示优化结果', 'info')
    }
    if (resultDisplayRef.value) {
      resultDisplayRef.value.viewMode = 'markdown'
    }
  } catch (e) {
    if (e.name === 'AbortError' || controller.signal.aborted) {
      error.value = ''
    } else {
      error.value = e.message
      showToast(e.message, 'error')
    }
  } finally {
    isThinking.value = false
    isLoading.value = false
    abortController.value = null
  }
}

function handleRetry () {
  if (originalPrompt.value) {
    handleOptimize(originalPrompt.value)
  } else if (promptInputRef.value?.promptText) {
    handleOptimize(promptInputRef.value.promptText)
  } else {
    showToast('没有可重试的提示词', 'error')
  }
}

// Stop thinking handler
function handleStopThinking () {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  streamingText.value = ''
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

  if (!hasDirectConfig.value && !proxyAvailable.value) {
    showToast(getMissingApiConfigMessage(), 'error')
    floatMenuRef.value?.openConfig?.()
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

  const controller = new AbortController()
  abortController.value = controller
  isIterating.value = true
  isThinking.value = true
  streamingText.value = ''
  error.value = ''

  try {
    const rawContent = await streamOptimizeOrIterate(
      config.value,
      {
        type: 'iteration',
        modeId: currentVersion.modeId || selectedMode.value,
        currentPrompt: currentVersion.optimizedPrompt,
        instruction: normalizedInstruction,
        originalPrompt: originalPrompt.value,
        precondition: activePreconditionSnapshot.value,
        diagnosis: currentVersion.diagnosis,
        score: currentVersion.score
      },
      (accumulatedText) => {
        streamingText.value = extractOptimizedPrompt(accumulatedText)
      },
      controller.signal
    )

    const result = parseOptimizationResult(rawContent)

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
    if (e.name === 'AbortError' || controller.signal.aborted) {
      // User-initiated stop, no error toast
    } else {
      showToast(e.message || '继续迭代失败，已保留当前版本', 'error')
    }
  } finally {
    isThinking.value = false
    isIterating.value = false
    abortController.value = null
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

  modalCallback = async (name) => {
    const mode = getPromptMode(selectedMode.value)
    const iterationSnapshot = cloneIterationHistory(iterationHistory.value)
    const saveVersion = getSaveVersion(iterationSnapshot)
    const savedContent = saveVersion?.optimizedPrompt || optimizedResult.value
    const item = {
      id: uuidv4(),
      name: name,
      content: savedContent,
      modeId: saveVersion?.modeId || mode.id,
      modeName: saveVersion?.modeName || mode.name,
      diagnosis: saveVersion?.diagnosis || optimizationResult.value?.diagnosis || null,
      score: saveVersion?.score || optimizationResult.value?.score || null,
      diagnosisStale: Boolean(saveVersion?.diagnosisStale || optimizationResult.value?.diagnosisStale),
      scoreStale: Boolean(saveVersion?.scoreStale || optimizationResult.value?.scoreStale),
      rawResult: saveVersion?.rawContent || optimizationResult.value?.rawContent || savedContent,
      originalPrompt: originalPrompt.value,
      precondition: saveVersion?.precondition || activePreconditionSnapshot.value,
      iterationHistory: iterationSnapshot,
      activeIterationId: saveVersion?.id || activeIterationId.value,
      createdAt: new Date().toISOString()
    }
    const saved = await addToHistory(item)
    if (!saved) {
      throw new Error('保存历史记录失败，请检查浏览器存储空间')
    }
    history.value = await getHistory()
    historyOpen.value = true
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

async function handleHistoryCopy (item) {
  const success = await copyToClipboard(item.content)
  if (success) {
    showToast('已复制到剪贴板', 'success')
  } else {
    showToast('复制失败，请手动复制', 'error')
  }
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

async function handleExport () {
  try {
    await exportData()
    showToast('备份已导出，未包含 API Key', 'success')
  } catch (e) {
    console.error('导出失败:', e)
    showToast('导出失败，请重试', 'error')
  }
}

async function handleImport (jsonString) {
  try {
    const success = await importData(jsonString)
    if (success) {
      history.value = await getHistory()
      const cfg = await getConfig()
      if (cfg) config.value = cfg
      const mode = await getSelectedMode()
      if (mode) selectedMode.value = getPromptMode(mode).id
      const pre = await getPrecondition()
      if (typeof pre === 'string') precondition.value = pre
      showToast('备份已导入', 'success')
    } else {
      showToast('导入失败，文件格式可能不正确', 'error')
    }
  } catch (e) {
    console.error('导入失败:', e)
    showToast('导入失败，请检查文件内容', 'error')
  }
}

async function handleHistoryModalSave (updatedItem) {
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
  try {
    await updateHistoryItem(updatedItem.id, updates)
    history.value = await getHistory()
    historyModalItem.value = { ...updatedItem, ...updates }
    showToast('已保存修改', 'success')
  } catch (e) {
    console.error('保存历史记录修改失败:', e)
    showToast('保存失败，请重试', 'error')
  }
}

function handleRename (item) {
  modalTitle.value = '重命名提示词'
  modalValue.value = item.name
  modalPlaceholder.value = '输入新名称'

  modalCallback = async (newName) => {
    await updateHistoryItem(item.id, { name: newName })
    history.value = await getHistory()
    showToast('已重命名', 'success')
  }

  showModal.value = true
}

async function handleDelete (item) {
  if (confirm(`确定要删除「${item.name}」吗？`)) {
    try {
      await deleteFromHistory(item.id)
      history.value = await getHistory()
      showToast('已删除', 'info')
    } catch (e) {
      console.error('删除历史记录失败:', e)
      showToast('删除失败', 'error')
    }
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
    structured: result.structured !== false,
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
      structured: version.structured !== false && Boolean(version.diagnosis && version.score),
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
    structured: Boolean(item.diagnosis && item.score),
    createdAt: item.createdAt || new Date().toISOString()
  }]
}

function getActiveIteration () {
  return iterationHistory.value.find(item => item.id === activeIterationId.value) || null
}

function getSaveVersion (versions) {
  if (versions.length === 0) return null
  return versions[versions.length - 1]
}

function cloneIterationHistory (versions) {
  return versions.map(version => ({
    ...version,
    diagnosis: cloneJsonValue(version.diagnosis),
    score: cloneJsonValue(version.score)
  }))
}

function cloneJsonValue (value) {
  if (value == null) return value
  return JSON.parse(JSON.stringify(value))
}

function syncResultFromVersion (version) {
  optimizedResult.value = version.optimizedPrompt || ''
  optimizationResult.value = {
    diagnosis: version.diagnosis || null,
    score: version.score || null,
    diagnosisStale: Boolean(version.diagnosisStale),
    scoreStale: Boolean(version.scoreStale),
    optimizedPrompt: version.optimizedPrompt || '',
    rawContent: version.rawContent || version.optimizedPrompt || '',
    structured: version.structured !== false
  }
}

// Modal confirm
async function handleModalConfirm (value) {
  if (modalPending.value) return
  if (modalCallback && value.trim()) {
    modalPending.value = true
    try {
      await modalCallback(value.trim())
    } catch (e) {
      console.error('Modal callback failed:', e)
      showToast('操作失败: ' + (e.message || '未知错误'), 'error')
      return
    } finally {
      modalPending.value = false
    }
  }
  showModal.value = false
}

function handleModalCancel () {
  if (modalPending.value) return
  showModal.value = false
}

function getMissingApiConfigMessage () {
  if (proxyReachable.value && !proxyConfigured.value) {
    return '服务端代理未配置，请填写 API Key 或配置代理服务'
  }
  return '请先配置 API 信息'
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
  height: 100dvh;
  background: var(--bg-elevated);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  z-index: 300;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.15);
  border-left: 1px solid var(--border);
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) 0;
}

@media (max-width: 480px) {
  .drawer-panel {
    width: 100vw;
    max-width: 100vw;
  }

  .drawer-header {
    padding: 16px 20px;
  }

  .drawer-content {
    padding: 16px;
  }
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

.drawer-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  color: var(--text-tertiary);
  transition: all 0.2s ease;
}

.drawer-search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
  color: var(--accent);
}

.drawer-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-family: inherit;
}

.drawer-search-input::placeholder {
  color: var(--text-tertiary);
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
