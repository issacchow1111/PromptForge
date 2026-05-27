<template>
  <div class="workspace-card input-card">
    <div class="card-header">
      <h2 class="card-title">
        <span class="card-title-icon">✏️</span>
        待优化提示词
      </h2>
      <span v-if="charCount > 0" class="char-badge">{{ charCount }} 字</span>
    </div>
    <div class="card-body">
      <textarea
        v-model="promptText"
        class="prompt-textarea"
        placeholder="在此输入您希望优化的提示词内容..."
        @keydown="handleKeydown"
      ></textarea>

      <div class="input-footer">
        <div class="input-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 10l-3 3 3 3M15 10l3 3-3 3"/>
          </svg>
          <span>Cmd + Enter 快速优化</span>
        </div>
        <div class="input-actions">
          <button
            class="btn btn-ghost btn-small"
            @click="handleClear"
          >
            清空
          </button>
          <button
            class="btn btn-primary"
            :disabled="!canOptimize"
            @click="handleOptimize"
          >
            <span v-if="isLoading" class="loading">
              <span class="spinner"></span>
              优化中...
            </span>
            <span v-else class="btn-content">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              优化提示词
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  hasConfig: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['optimize', 'clear'])

const promptText = ref('')

const charCount = computed(() => promptText.value.length)

const canOptimize = computed(() => {
  return props.hasConfig && promptText.value.trim().length > 0 && !props.isLoading
})

function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    if (canOptimize.value) {
      handleOptimize()
    }
  }
}

function handleOptimize() {
  if (canOptimize.value) {
    emit('optimize', promptText.value)
  }
}

function handleClear() {
  promptText.value = ''
  emit('clear')
}

defineExpose({
  promptText,
  clear: handleClear
})
</script>

<style scoped>
.input-card {
  position: relative;
}

.input-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 100%);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  opacity: 0.6;
}

.char-badge {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-tertiary);
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
}

.input-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.input-hint svg {
  opacity: 0.5;
}

.btn-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
