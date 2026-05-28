<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-panel">
        <div class="modal-header">
          <h2 class="modal-title">
            <svg
              width="18"
              height="18"
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
            </svg>
            {{ item?.name }}
          </h2>
          <div class="modal-header-actions">
            <button class="btn btn-ghost btn-small" @click="handleModeToggle">
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
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              {{ viewMode === "markdown" ? "纯文本" : "Markdown" }}
            </button>
            <button class="modal-close" @click="handleClose">
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
        </div>

        <div class="modal-meta">
          <span class="meta-time">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ formatTime(item?.createdAt) }}
          </span>
        </div>

        <div class="modal-body">
          <section v-if="hasPrecondition" class="history-precondition">
            <h3>本次使用的前置条件</h3>
            <pre>{{ item.precondition }}</pre>
          </section>

          <div v-if="isEditing" class="edit-area">
            <textarea
              ref="editTextarea"
              v-model="editContent"
              class="edit-textarea"
              placeholder="编辑提示词内容..."
            ></textarea>
          </div>
          <div
            v-else
            class="content-display"
            :class="viewMode === 'markdown' ? 'html' : 'plain'"
          >
            <div v-if="viewMode === 'markdown'" v-html="renderedContent"></div>
            <pre v-else class="plain-content">{{ item?.content }}</pre>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-left">
            <button
              v-if="!isEditing"
              class="btn btn-secondary"
              @click="isEditing = true"
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
              编辑内容
            </button>
            <template v-else>
              <button class="btn btn-ghost" @click="handleCancelEdit">
                取消
              </button>
              <button class="btn btn-primary" @click="handleSaveEdit">
                保存修改
              </button>
            </template>
          </div>
          <div class="footer-right">
            <button class="btn btn-ghost" @click="handleCopy">
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
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                />
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
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { copyToClipboard } from '../utils/clipboard.js'

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

const hasPrecondition = computed(() => Boolean(props.item?.precondition?.trim()))

watch(() => props.item, () => {
  viewMode.value = 'markdown'
  isEditing.value = false
  editContent.value = ''
  copied.value = false
})

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

function handleModeToggle () {
  viewMode.value = viewMode.value === 'markdown' ? 'plain' : 'markdown'
}

function handleClose () {
  if (isEditing.value) {
    if (confirm('编辑未保存，确定要关闭吗？')) {
      isEditing.value = false
      emit('close')
    }
  } else {
    emit('close')
  }
}

function handleCancelEdit () {
  if (confirm('编辑未保存，确定要取消吗？')) {
    isEditing.value = false
    editContent.value = ''
  }
}

function handleSaveEdit () {
  if (editContent.value.trim()) {
    emit('save', { ...props.item, content: editContent.value })
    isEditing.value = false
  }
}

async function handleCopy () {
  const success = await copyToClipboard(props.item?.content || '')
  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function formatTime (isoString) {
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
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.modal-panel {
  background: var(--bg-elevated);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid var(--border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-close {
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

.modal-close:hover {
  background: var(--border);
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-height: 300px;
}

.history-precondition {
  margin-bottom: 18px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.history-precondition h3 {
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 0.92rem;
  font-weight: 600;
}

.history-precondition pre {
  margin: 0;
  color: var(--text-secondary);
  font: inherit;
  font-size: 0.86rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
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
  font-family: "SF Mono", monospace;
  font-size: 0.9em;
}

.content-display.html :deep(pre) {
  background: #1c1c1e;
  padding: 16px;
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin-bottom: 1em;
}

.content-display.html :deep(pre code) {
  background: none;
  padding: 0;
  color: #e0e0e0;
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
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 0.9rem;
  line-height: 1.7;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-glow);
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
  transition: transform 0.3s var(--ease-spring), opacity 0.3s ease;
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
