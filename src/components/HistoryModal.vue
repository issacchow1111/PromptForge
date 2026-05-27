<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel">
        <div class="modal-header">
          <h2 class="modal-title">📜 {{ item?.name }}</h2>
          <div class="modal-header-actions">
            <button class="btn btn-ghost btn-small" @click="handleModeToggle">
              {{ viewMode === 'markdown' ? '📝 切换纯文本' : '📋 切换Markdown' }}
            </button>
            <button class="modal-close" @click="handleClose">✕</button>
          </div>
        </div>

        <div class="modal-meta">
          <span class="meta-time">📅 {{ formatTime(item?.createdAt) }}</span>
        </div>

        <div class="modal-body">
          <div v-if="isEditing" class="edit-area">
            <textarea 
              ref="editTextarea"
              v-model="editContent"
              class="edit-textarea"
              placeholder="编辑提示词内容..."
            ></textarea>
          </div>
          <div v-else class="content-display" :class="viewMode === 'markdown' ? 'html' : 'plain'">
            <div v-if="viewMode === 'markdown'" v-html="renderedContent"></div>
            <pre v-else class="plain-content">{{ item?.content }}</pre>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-left">
            <button v-if="!isEditing" class="btn btn-secondary" @click="isEditing = true">
              ✏️ 编辑内容
            </button>
            <template v-else>
              <button class="btn btn-ghost" @click="handleCancelEdit">取消</button>
              <button class="btn btn-primary" @click="handleSaveEdit">保存修改</button>
            </template>
          </div>
          <div class="footer-right">
            <button class="btn btn-ghost" @click="handleCopy">
              {{ copied ? '✓ 已复制' : '📋 复制' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

// Default to markdown mode
const viewMode = ref('markdown')
const isEditing = ref(false)
const editContent = ref('')
const copied = ref(false)
const editTextarea = ref(null)

const renderedContent = computed(() => {
  if (!props.item?.content) return ''
  if (viewMode.value === 'markdown') {
    return DOMPurify.sanitize(marked.parse(props.item.content))
  }
  return props.item.content
})

// Reset state when item changes
watch(() => props.item, () => {
  viewMode.value = 'markdown'
  isEditing.value = false
  editContent.value = ''
  copied.value = false
})

// Focus textarea when entering edit mode
watch(isEditing, (editing) => {
  if (editing) {
    editContent.value = props.item?.content || ''
    nextTick(() => {
      if (editTextarea.value) {
        editTextarea.value.focus()
        editTextarea.value.style.height = 'auto'
        editTextarea.value.style.height = editTextarea.value.scrollHeight + 'px'
      }
    })
  }
})

function handleModeToggle() {
  viewMode.value = viewMode.value === 'markdown' ? 'plain' : 'markdown'
}

function handleClose() {
  if (isEditing.value) {
    if (confirm('编辑未保存，确定要关闭吗？')) {
      isEditing.value = false
      emit('close')
    }
  } else {
    emit('close')
  }
}

function handleCancelEdit() {
  if (confirm('编辑未保存，确定要取消吗？')) {
    isEditing.value = false
    editContent.value = ''
  }
}

function handleSaveEdit() {
  if (editContent.value.trim()) {
    emit('save', { ...props.item, content: editContent.value })
    isEditing.value = false
  }
}

function handleCopy() {
  navigator.clipboard.writeText(props.item?.content || '')
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.modal-panel {
  background: var(--bg-primary);
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-close {
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

.modal-close:hover {
  background: var(--border-light);
  color: var(--text-primary);
}

.modal-meta {
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
}

.meta-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-height: 300px;
}

.content-display {
  line-height: 1.7;
}

.content-display.html {
  color: var(--text-primary);
}

.content-display.html :deep(h1),
.content-display.html :deep(h2),
.content-display.html :deep(h3) {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.content-display.html :deep(p) {
  margin-bottom: 1em;
}

.content-display.html :deep(ul),
.content-display.html :deep(ol) {
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.content-display.html :deep(code) {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}

.content-display.html :deep(pre) {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1em;
}

.content-display.html :deep(pre code) {
  background: none;
  padding: 0;
}

.plain-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  margin: 0;
}

.edit-area {
  height: 100%;
}

.edit-textarea {
  width: 100%;
  min-height: 300px;
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

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-secondary);
}

.footer-left,
.footer-right {
  display: flex;
  gap: 8px;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: scale(0.95);
  opacity: 0;
}
</style>
