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
      <div class="mode-selector">
        <div class="mode-selector-top">
          <label class="mode-label" for="prompt-mode">优化模式</label>
          <select
            id="prompt-mode"
            class="mode-select"
            :value="selectedMode"
            @change="handleModeChange"
          >
            <option v-for="mode in modes" :key="mode.id" :value="mode.id">
              {{ mode.name }}
            </option>
          </select>
        </div>
        <p class="mode-description">{{ currentMode.description }}</p>
      </div>

      <div class="precondition-summary">
        <div class="precondition-info">
          <span class="precondition-label">
            {{ hasPrecondition ? "已设置前置条件" : "未设置前置条件" }}
          </span>
          <p v-if="hasPrecondition" class="precondition-preview">
            {{ preconditionSummary }}
          </p>
        </div>
        <div class="precondition-actions">
          <button
            class="btn btn-ghost btn-small"
            @click="emit('open-precondition')"
          >
            {{ hasPrecondition ? "查看 / 修改" : "设置前置条件" }}
          </button>
          <button
            v-if="hasPrecondition"
            class="btn btn-ghost btn-small"
            @click="emit('clear-precondition')"
          >
            清空
          </button>
        </div>
      </div>

      <textarea
        v-model="promptText"
        class="prompt-textarea"
        placeholder="在此输入您希望优化的提示词内容..."
        @keydown="handleKeydown"
      ></textarea>

      <div class="input-footer">
        <div class="input-hint">
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
            <path d="M9 10l-3 3 3 3M15 10l3 3-3 3" />
          </svg>
          <span>Cmd + Enter 快速优化</span>
        </div>
        <div class="input-actions">
          <button class="btn btn-ghost btn-small" @click="handleClear">
            清空
          </button>
          <button
            class="btn btn-ghost btn-small"
            @click="emit('open-precondition')"
          >
            设置前置条件
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
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              开始优化
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
  proxyAvailable: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  modes: {
    type: Array,
    default: () => []
  },
  selectedMode: {
    type: String,
    default: 'general'
  },
  precondition: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['optimize', 'clear', 'open-precondition', 'clear-precondition', 'update:selectedMode'])

const promptText = ref('')

const charCount = computed(() => promptText.value.length)

const hasPrecondition = computed(() => props.precondition.trim().length > 0)

const preconditionSummary = computed(() => {
  const summary = props.precondition.replace(/\s+/g, ' ').trim()
  return summary.length > 110 ? `${summary.slice(0, 110)}...` : summary
})

const currentMode = computed(() => {
  return props.modes.find(mode => mode.id === props.selectedMode) || props.modes[0] || {
    name: '通用优化',
    description: '适合大多数普通任务表达优化'
  }
})

const canOptimize = computed(() => {
  return (props.hasConfig || props.proxyAvailable) && promptText.value.trim().length > 0 && !props.isLoading
})

function handleKeydown (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    if (canOptimize.value) {
      handleOptimize()
    }
  }
}

function handleOptimize () {
  if (canOptimize.value) {
    emit('optimize', promptText.value)
  }
}

function handleModeChange (e) {
  emit('update:selectedMode', e.target.value)
}

function handleClear () {
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
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--accent) 0%,
    var(--accent-hover) 100%
  );
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

.mode-selector {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
}

.mode-selector-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mode-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.mode-select {
  min-width: 150px;
  max-width: 220px;
  width: 44%;
  padding: 9px 36px 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}

.mode-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.mode-description {
  margin-top: 8px;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.precondition-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.precondition-info {
  min-width: 0;
}

.precondition-label {
  display: block;
  color: var(--text-primary);
  font-size: 0.86rem;
  font-weight: 600;
}

.precondition-preview {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
  word-break: break-word;
}

.precondition-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
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

@media (max-width: 640px) {
  .mode-selector-top {
    align-items: stretch;
    flex-direction: column;
  }

  .mode-select {
    width: 100%;
    max-width: none;
  }

  .input-footer {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .input-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .precondition-summary {
    align-items: stretch;
    flex-direction: column;
  }

  .precondition-actions,
  .precondition-actions .btn,
  .input-actions .btn {
    width: 100%;
  }
}
</style>
