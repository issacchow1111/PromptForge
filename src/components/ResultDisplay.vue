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
            <div class="error-message">{{ error }}</div>
          </div>

          <div
            v-else-if="activePanel === 'diagnosis' && hasReport"
            class="diagnosis-panel"
          >
            <section v-if="score" class="score-section">
              <div class="score-overview">
                <div>
                  <div class="section-label">总评分</div>
                  <div class="score-summary">{{ overallScore }}</div>
                </div>
                <div class="score-bar" aria-hidden="true">
                  <span :style="{ width: `${overallScore}%` }"></span>
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
                    <span :style="{ width: `${dimension.score}%` }"></span>
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
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['save', 'copy', 'update:result'])

const activePanel = ref('result')
const viewMode = ref('markdown')
const copied = ref(false)
const isEditing = ref(false)
const editContent = ref('')
const editTextarea = ref(null)

const renderedContent = computed(() => {
  if (!props.result) return ''
  if (viewMode.value === 'markdown') {
    return DOMPurify.sanitize(marked.parse(props.result))
  }
  return props.result
})

const diagnosis = computed(() => props.optimizationResult?.diagnosis || null)
const score = computed(() => props.optimizationResult?.score || null)

const hasReport = computed(() => Boolean(diagnosis.value || score.value))

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
})

watch(() => props.optimizationResult, () => {
  activePanel.value = 'result'
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

function normalizeList (value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean)
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }
  return []
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
}
</style>
