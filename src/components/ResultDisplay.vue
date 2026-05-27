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
            @click="viewMode = 'plain'"
          >
            纯文本
          </button>
          <button
            class="tab-btn"
            :class="{ active: viewMode === 'markdown' }"
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
          <button class="btn btn-ghost btn-small" @click="cancelEditing">取消</button>
          <button class="btn btn-primary btn-small" @click="saveEditing">保存</button>
        </div>
      </div>

      <!-- Display Mode -->
      <template v-else>
        <div v-if="result || error" class="result-content" :class="viewMode === 'markdown' ? 'html' : 'plain'">
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-else-if="result" v-html="renderedContent"></div>
        </div>

        <div v-else class="result-content result-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.25;">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <div>优化后的提示词将显示在这里</div>
        </div>
      </template>

      <div v-if="result && !isEditing" class="result-actions">
        <button class="btn btn-secondary btn-small" @click="emit('save')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          保存
        </button>
        <button class="btn btn-ghost btn-small" @click="handleCopy">
          <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ copied ? '已复制' : '复制' }}
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

watch(() => props.result, () => {
  copied.value = false
  isEditing.value = false
})

async function handleCopy() {
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

function startEditing() {
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

function cancelEditing() {
  if (editContent.value !== props.result) {
    if (!confirm('编辑未保存，确定要取消吗？')) {
      return
    }
  }
  isEditing.value = false
  editContent.value = ''
}

function saveEditing() {
  if (editContent.value.trim()) {
    emit('update:result', editContent.value)
    isEditing.value = false
  }
}

defineExpose({
  viewMode
})
</script>

<style scoped>
.result-card {
  position: relative;
}

.result-card::before {
  content: '';
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
}
</style>
