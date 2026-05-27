<template>
  <div class="workspace-card">
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
          ✏️ 编辑
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

        <div v-else class="result-placeholder">
          优化后的提示词将显示在这里
        </div>
      </template>

      <div v-if="result && !isEditing" class="result-actions">
        <button class="btn btn-ghost btn-small" @click="emit('save')">
          💾 保存
        </button>
        <button class="btn btn-ghost btn-small" @click="handleCopy">
          {{ copied ? '✓ 已复制' : '📋 复制' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

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

// Default to markdown mode
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

function handleCopy() {
  navigator.clipboard.writeText(props.result)
  copied.value = true
  emit('copy', props.result)
  setTimeout(() => {
    copied.value = false
  }, 2000)
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

// Expose viewMode for parent control
defineExpose({
  viewMode
})
</script>

<style scoped>
.error-message {
  color: #ff3b30;
  padding: 16px;
  background: rgba(255, 59, 48, 0.05);
  border-radius: 8px;
  white-space: pre-wrap;
}

.result-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-textarea {
  width: 100%;
  min-height: 200px;
  padding: 16px;
  border: 2px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: 'Fira Code', 'Noto Sans SC', monospace;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--accent-gold);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
