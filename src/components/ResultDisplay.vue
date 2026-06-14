<template>
  <div class="workspace-card result-card">
    <div class="card-header">
      <h2 class="card-title">
        <span class="card-title-icon">✨</span>
        优化结果
      </h2>
      <div v-if="result || error" class="result-controls">
        <div class="result-tabs">
          <button
            class="tab-btn"
            :class="{ active: viewMode === 'plain' }"
            :disabled="activePanel !== 'result' || isEditing"
            @click="viewMode = 'plain'"
          >
            纯文本
          </button>
          <button
            class="tab-btn"
            :class="{ active: viewMode === 'markdown' }"
            :disabled="activePanel !== 'result' || isEditing"
            @click="viewMode = 'markdown'"
          >
            Markdown
          </button>
        </div>
        <button
          v-if="!isEditing && result"
          class="btn btn-ghost btn-small"
          @click="startEditing"
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
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          编辑
        </button>
      </div>
    </div>
    <div class="card-body">
      <!-- Editing Mode -->
      <div v-if="isEditing" class="edit-area">
        <textarea
          ref="editTextarea"
          v-model="editContent"
          class="edit-textarea"
          placeholder="编辑优化结果..."
        ></textarea>
        <div class="edit-actions">
          <button class="btn btn-ghost btn-small" @click="cancelEditing">
            取消
          </button>
          <button class="btn btn-primary btn-small" @click="saveEditing">
            保存
          </button>
        </div>
      </div>

      <!-- Display Mode -->
      <template v-else>
        <template v-if="result || error">
          <div v-if="result && hasReport" class="result-panel-tabs">
            <button
              class="tab-btn"
              :class="{ active: activePanel === 'diagnosis' }"
              @click="activePanel = 'diagnosis'"
            >
              诊断报告
            </button>
            <button
              class="tab-btn"
              :class="{ active: activePanel === 'result' }"
              @click="activePanel = 'result'"
            >
              优化结果
            </button>
          </div>

          <div v-if="error" class="result-content plain">
            <div class="error-message">
              <div>{{ error }}</div>
              <button class="btn btn-primary btn-small retry-btn" @click="emit('retry')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                重试
              </button>
            </div>
          </div>

          <div
            v-else-if="activePanel === 'diagnosis' && hasReport"
            class="diagnosis-panel"
          >
            <div v-if="isReportStale" class="report-stale-notice">
              当前结果已被编辑，诊断内容基于编辑前版本，仅供参考；旧评分已失效。
            </div>

            <section v-if="score && !scoreStale" class="score-section">
              <div class="score-overview">
                <div>
                  <div class="section-label">总评分</div>
                  <div class="score-summary">{{ overallScore }}</div>
                </div>
                <div class="score-bar" aria-hidden="true">
                  <span
                    :style="{ width: `${overallScore}%` }"
                    :class="getScoreBarClass(overallScore)"
                    :title="`总评分：${overallScore} 分`"
                  ></span>
                </div>
              </div>

              <div class="score-grid">
                <div
                  v-for="dimension in scoreDimensions"
                  :key="dimension.key"
                  class="score-item"
                >
                  <div class="score-item-header">
                    <span>{{ dimension.label }}</span>
                    <strong>{{ dimension.score }}</strong>
                  </div>
                  <div class="score-mini-bar" aria-hidden="true">
                    <span
                      :style="{ width: `${dimension.score}%` }"
                      :class="getScoreBarClass(dimension.score)"
                      :title="dimension.comment || '暂无评价'"
                    ></span>
                  </div>
                  <p>{{ dimension.comment || "暂无评价" }}</p>
                </div>
              </div>
            </section>

            <section v-if="diagnosis" class="diagnosis-section">
              <div v-if="diagnosis.summary" class="diagnosis-summary">
                {{ diagnosis.summary }}
              </div>

              <div class="diagnosis-grid">
                <div
                  v-for="block in diagnosisBlocks"
                  :key="block.key"
                  class="diagnosis-block"
                >
                  <h3>{{ block.title }}</h3>
                  <ul v-if="block.items.length > 0">
                    <li v-for="item in block.items" :key="item">{{ item }}</li>
                  </ul>
                  <p v-else>暂无明显问题</p>
                </div>
              </div>
            </section>
          </div>

          <div
            v-else
            class="result-content"
            :class="viewMode === 'markdown' ? 'html' : 'plain'"
          >
            <div v-if="viewMode === 'markdown'" v-html="renderedContent"></div>
            <pre v-else>{{ result }}</pre>
          </div>
        </template>

        <div v-else class="result-content result-placeholder">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="margin-bottom: 16px; opacity: 0.25"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <div>优化后的提示词将显示在这里</div>
        </div>
      </template>

      <div v-if="result && !isEditing" class="result-actions">
        <button class="btn btn-secondary btn-small" @click="emit('save')">
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
              d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
            />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          保存
        </button>
        <button class="btn btn-ghost btn-small" @click="handleCopy">
          <svg
            v-if="!copied"
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
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <svg
            v-else
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {{ copied ? "已复制" : "复制" }}
        </button>
      </div>

      <div v-if="result && !isEditing" class="iteration-toolbar">
        <div class="iteration-toolbar-main">
          <div class="current-version">
            <span>当前版本：</span>
            <strong>{{ activeVersionTitle }}</strong>
            <span v-if="activeVersion?.createdAt" class="version-time">
              {{ formatVersionTime(activeVersion.createdAt) }}
            </span>
            <span v-if="isIterating" class="iteration-status">迭代中...</span>
          </div>
          <div class="iteration-toolbar-actions">
            <button
              class="btn btn-ghost btn-small"
              :disabled="isLoading"
              @click="toggleIterationExpanded"
            >
              {{ iterationExpanded ? "收起迭代" : "继续迭代" }}
            </button>
            <button
              class="btn btn-ghost btn-small"
              :disabled="isIterating || iterationHistory.length === 0"
              @click="toggleVersionsExpanded"
            >
              {{ versionsExpanded ? "收起版本" : "版本记录" }}
            </button>
          </div>
        </div>

        <div v-if="iterationExpanded" class="iteration-expanded">
          <div class="custom-section">
            <label class="iteration-label" for="iteration-instruction"
              >自定义要求</label
            >
            <textarea
              id="iteration-instruction"
              v-model="customInstruction"
              class="iteration-textarea"
              placeholder="例如：补充边界条件，并把输出格式固定为 JSON。"
              :disabled="isLoading || isIterating"
            ></textarea>
            <div class="custom-actions">
              <button
                class="btn btn-primary btn-small"
                :disabled="!canSubmitCustomIteration"
                @click="handleCustomIterate"
              >
                <span v-if="isIterating" class="loading">
                  <span class="spinner"></span>
                  迭代中...
                </span>
                <span v-else>继续优化</span>
              </button>
            </div>
          </div>

          <div class="quick-section">
            <div class="iteration-label">快捷优化</div>
            <div class="quick-actions">
              <button
                v-for="instruction in quickInstructions"
                :key="instruction"
                class="btn btn-ghost btn-small"
                :disabled="isLoading || isIterating"
                @click="handleQuickIterate(instruction)"
              >
                {{ instruction }}
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="versionsExpanded && iterationHistory.length > 0"
          class="version-expanded"
        >
          <div class="iteration-label">版本记录</div>
          <div class="version-list" role="tablist" aria-label="版本记录">
            <button
              v-for="version in iterationHistory"
              :key="version.id"
              class="tab-btn version-tab"
              :class="{ active: version.id === activeIterationId }"
              :disabled="isIterating"
              @click="handleSwitchVersion(version.id)"
            >
              {{ version.title || versionLabel(version) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { copyToClipboard } from '../utils/clipboard.js'

const props = defineProps({
  result: {
    type: String,
    default: ''
  },
  optimizationResult: {
    type: Object,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isIterating: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  iterationHistory: {
    type: Array,
    default: () => []
  },
  activeIterationId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['save', 'copy', 'iterate', 'switch-version', 'update:result', 'retry'])

const activePanel = ref('result')
const viewMode = ref('markdown')
const copied = ref(false)
const isEditing = ref(false)
const editContent = ref('')
const editTextarea = ref(null)
const customInstruction = ref('')
const iterationExpanded = ref(false)
const versionsExpanded = ref(false)
const quickInstructions = [
  '更精简',
  '更专业',
  '更严格',
  '加入输出格式',
  '加入示例',
  '改成英文',
  '改成中文',
  '适配 GPT',
  '适配 Claude',
  '适配 Gemini'
]

const renderedContent = computed(() => {
  if (!props.result) return ''
  if (viewMode.value === 'markdown') {
    return DOMPurify.sanitize(marked.parse(props.result))
  }
  return props.result
})

const diagnosis = computed(() => props.optimizationResult?.diagnosis || null)
const score = computed(() => props.optimizationResult?.score || null)
const diagnosisStale = computed(() => Boolean(props.optimizationResult?.diagnosisStale))
const scoreStale = computed(() => Boolean(props.optimizationResult?.scoreStale))
const isReportStale = computed(() => diagnosisStale.value || scoreStale.value)

const hasReport = computed(() => Boolean(diagnosis.value || score.value))

const activeVersion = computed(() => {
  return props.iterationHistory.find(version => version.id === props.activeIterationId) || null
})

const activeVersionTitle = computed(() => {
  if (activeVersion.value) {
    return activeVersion.value.title || versionLabel(activeVersion.value)
  }
  return '版本 1：初始版本'
})

const canSubmitCustomIteration = computed(() => {
  return customInstruction.value.trim().length > 0 && !props.isLoading && !props.isIterating
})

const overallScore = computed(() => normalizeScore(score.value?.overall))

const scoreDimensions = computed(() => {
  const dimensions = score.value?.dimensions || {}
  return [
    { key: 'clarity', label: '清晰度' },
    { key: 'context', label: '上下文完整度' },
    { key: 'constraints', label: '约束完整度' },
    { key: 'outputControl', label: '输出可控性' },
    { key: 'actionability', label: '可执行性' }
  ].map(item => ({
    ...item,
    score: normalizeScore(dimensions[item.key]?.score),
    comment: dimensions[item.key]?.comment || ''
  }))
})

const diagnosisBlocks = computed(() => {
  const current = diagnosis.value || {}
  return [
    { key: 'mainIssues', title: '原提示词主要问题', items: normalizeList(current.mainIssues) },
    { key: 'semanticGaps', title: '语义缺口', items: normalizeList(current.semanticGaps) },
    { key: 'missingConstraints', title: '约束缺失', items: normalizeList(current.missingConstraints) },
    { key: 'possibleMisunderstandings', title: '潜在误解点', items: normalizeList(current.possibleMisunderstandings) },
    { key: 'improvements', title: '本次优化补强', items: normalizeList(current.improvements) }
  ]
})

watch([() => props.result, () => props.optimizationResult], () => {
  copied.value = false
  isEditing.value = false
  if (!hasReport.value || !props.result) {
    activePanel.value = 'result'
  }
  if (!props.result) {
    iterationExpanded.value = false
    versionsExpanded.value = false
  }
})

watch(() => props.optimizationResult, () => {
  activePanel.value = 'result'
})

watch(() => props.activeIterationId, () => {
  customInstruction.value = ''
  iterationExpanded.value = false
  versionsExpanded.value = false
})

watch(activePanel, (panel) => {
  if (panel === 'diagnosis' && !hasReport.value) {
    activePanel.value = 'result'
  }
})

function normalizeScore (value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.min(100, Math.max(0, Math.round(score)))
}

function getScoreBarClass (score) {
  if (score >= 75) return 'score-bar-high'
  if (score >= 50) return 'score-bar-medium'
  return 'score-bar-low'
}

function normalizeList (value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
}

function handleQuickIterate (instruction) {
  emit('iterate', instruction)
}

function toggleIterationExpanded () {
  iterationExpanded.value = !iterationExpanded.value
  if (iterationExpanded.value) {
    versionsExpanded.value = false
  }
}

function toggleVersionsExpanded () {
  versionsExpanded.value = !versionsExpanded.value
  if (versionsExpanded.value) {
    iterationExpanded.value = false
  }
}

function handleSwitchVersion (id) {
  emit('switch-version', id)
  versionsExpanded.value = false
}

function handleCustomIterate () {
  const instruction = customInstruction.value.trim()
  if (!instruction) return
  emit('iterate', instruction)
}

function versionLabel (version) {
  const index = props.iterationHistory.findIndex(item => item.id === version.id)
  if (version.type === 'initial') return '版本 1：初始版本'
  return `版本 ${index + 1}：${version.instruction || '继续优化'}`
}

function formatVersionTime (isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function handleCopy () {
  const success = await copyToClipboard(props.result)
  if (success) {
    copied.value = true
    emit('copy', props.result)
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } else {
    emit('copy', props.result)
  }
}

function startEditing () {
  editContent.value = props.result
  isEditing.value = true
  nextTick(() => {
    if (editTextarea.value) {
      editTextarea.value.focus()
      editTextarea.value.style.height = 'auto'
      editTextarea.value.style.height = editTextarea.value.scrollHeight + 'px'
    }
  })
}

function cancelEditing () {
  if (editContent.value !== props.result) {
    if (!confirm('编辑未保存，确定要取消吗？')) {
      return
    }
  }
  isEditing.value = false
  editContent.value = ''
}

function saveEditing () {
  if (editContent.value.trim()) {
    emit('update:result', editContent.value)
    isEditing.value = false
  }
}

defineExpose({
  viewMode,
  activePanel
})
</script>

<style scoped>
.result-card {
  position: relative;
}

.result-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #d4a843 0%, #e8c87a 100%);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  opacity: 0.6;
}

.result-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.result-tabs .tab-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.result-panel-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
}

.diagnosis-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 380px;
  max-height: 560px;
  min-width: 0;
  padding: 24px;
  overflow-y: auto;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
}

.score-section,
.diagnosis-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-stale-notice {
  padding: 12px 14px;
  color: var(--accent-dark);
  background: rgba(0, 113, 227, 0.08);
  border: 1px solid rgba(0, 113, 227, 0.16);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  line-height: 1.6;
}

.score-overview {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: center;
  padding: 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.section-label {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.score-summary {
  font-size: 2.4rem;
  line-height: 1;
  font-weight: 700;
  color: var(--accent);
}

.score-bar,
.score-mini-bar {
  height: 8px;
  background: rgba(0, 113, 227, 0.1);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.score-bar span,
.score-mini-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent) 0%, #48a3ff 100%);
  border-radius: inherit;
}

.score-bar span.score-bar-high,
.score-mini-bar span.score-bar-high {
  background: linear-gradient(90deg, #34c759 0%, #66d887 100%);
}

.score-bar span.score-bar-medium,
.score-mini-bar span.score-bar-medium {
  background: linear-gradient(90deg, #ff9500 0%, #ffbc5c 100%);
}

.score-bar span.score-bar-low,
.score-mini-bar span.score-bar-low {
  background: linear-gradient(90deg, #ff3b30 0%, #ff6b63 100%);
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.score-item,
.diagnosis-block,
.diagnosis-summary {
  padding: 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  min-width: 0;
}

.score-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 600;
}

.score-item-header strong {
  color: var(--accent);
}

.score-item p,
.diagnosis-block p,
.diagnosis-summary {
  color: var(--text-secondary);
  line-height: 1.7;
  word-break: break-word;
}

.score-item p {
  margin-top: 8px;
  font-size: 0.92rem;
}

.diagnosis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.diagnosis-block h3 {
  font-size: 0.95rem;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.diagnosis-block ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
}

.diagnosis-block li {
  margin: 6px 0;
  line-height: 1.7;
  word-break: break-word;
}

.result-content.plain pre {
  white-space: pre-wrap;
  word-break: break-word;
  font: inherit;
}

.result-content.plain .error-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.retry-btn {
  flex-shrink: 0;
}

.iteration-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.iteration-toolbar-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.current-version {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--text-secondary);
  font-size: 0.86rem;
  word-break: break-word;
}

.current-version strong {
  color: var(--text-primary);
  font-weight: 600;
}

.version-time {
  color: var(--text-tertiary);
}

.iteration-toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.iteration-status {
  flex-shrink: 0;
  padding: 4px 10px;
  color: var(--accent);
  background: rgba(0, 113, 227, 0.08);
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
}

.iteration-expanded,
.version-expanded {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.quick-section,
.custom-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.iteration-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
}

.version-list,
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.version-tab {
  max-width: 100%;
  white-space: normal;
  text-align: left;
  word-break: break-word;
}

.version-tab:disabled,
.quick-actions .btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.iteration-textarea {
  width: 100%;
  min-height: 92px;
  padding: 14px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.92rem;
  line-height: 1.6;
  resize: vertical;
}

.iteration-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.iteration-textarea:disabled {
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.custom-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .result-controls,
  .score-overview {
    align-items: stretch;
  }

  .score-overview,
  .score-grid {
    grid-template-columns: 1fr;
  }

  .result-panel-tabs,
  .result-tabs {
    width: 100%;
  }

  .result-panel-tabs .tab-btn,
  .result-tabs .tab-btn {
    flex: 1;
  }

  .iteration-toolbar-main,
  .custom-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .iteration-toolbar-actions {
    justify-content: stretch;
    width: 100%;
  }

  .iteration-toolbar-actions .btn {
    flex: 1;
  }

  .quick-actions .btn,
  .custom-actions .btn {
    width: 100%;
  }
}
</style>
