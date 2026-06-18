<template>
  <Transition name="thinking">
    <div v-if="show" class="thinking-overlay">
      <div class="thinking-content" :class="{ 'has-text': streamingText, 'is-clarifying': phase === 'clarifying' }">
        <p class="thinking-label">{{ phaseLabel }}</p>

        <div v-if="phase === 'clarifying' && clarifyQuestion" class="clarify-panel">
          <div class="clarify-progress">第 {{ clarifyIndex }} / {{ clarifyTotal }} 个问题</div>
          <p class="clarify-question">{{ clarifyQuestion.question }}</p>

          <div v-if="clarifyOptions.length" class="clarify-options">
            <button
              v-for="option in clarifyOptions"
              :key="option.value"
              class="clarify-option"
              :class="{ active: clarifySelection === option.value }"
              @click="$emit('select-clarify-option', option)"
            >
              {{ option.label }}
            </button>
          </div>

          <div v-if="showCustomInput" class="clarify-custom">
            <textarea
              class="clarify-textarea"
              rows="4"
              :value="clarifyCustomValue"
              placeholder="请输入你的补充说明"
              @input="$emit('update:clarify-custom-value', $event.target.value)"
            ></textarea>
          </div>

          <div class="clarify-actions">
            <button class="clarify-action ghost" @click="$emit('skip-clarify')">
              跳过，由 AI 合理假设
            </button>
            <button class="clarify-action primary" :disabled="nextDisabled" @click="$emit('next-clarify')">
              {{ clarifyIndex === clarifyTotal ? '开始生成' : '下一题' }}
            </button>
          </div>
        </div>

        <!-- Streaming text area -->
        <div v-else-if="streamingText" ref="textArea" class="thinking-stream">
          <pre class="thinking-stream-content">{{ streamingText }}</pre>
        </div>

        <!-- Loading dots when no text yet -->
        <div v-else class="thinking-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>

        <button class="thinking-stop-btn" @click="$emit('stop')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
          停止思考
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  phase: {
    type: String,
    default: 'thinking'
  },
  streamingText: {
    type: String,
    default: ''
  },
  clarifyQuestion: {
    type: Object,
    default: null
  },
  clarifyIndex: {
    type: Number,
    default: 1
  },
  clarifyTotal: {
    type: Number,
    default: 0
  },
  clarifySelection: {
    type: String,
    default: ''
  },
  clarifyCustomValue: {
    type: String,
    default: ''
  }
})

defineEmits(['stop', 'select-clarify-option', 'update:clarify-custom-value', 'next-clarify', 'skip-clarify'])

const textArea = ref(null)
const clarifyOptions = computed(() => Array.isArray(props.clarifyQuestion?.options) ? props.clarifyQuestion.options : [])
const showCustomInput = computed(() => {
  if (clarifyOptions.value.length === 0) {
    return props.phase === 'clarifying'
  }

  return props.clarifySelection === clarifyOptions.value[clarifyOptions.value.length - 1]?.value
})
const nextDisabled = computed(() => {
  if (props.phase !== 'clarifying') {
    return false
  }

  if (clarifyOptions.value.length > 0 && !props.clarifySelection) {
    return true
  }

  if (showCustomInput.value) {
    return !props.clarifyCustomValue.trim()
  }

  return false
})
const phaseLabel = computed(() => {
  if (props.phase === 'clarifying') {
    return 'AI 需要你补充关键信息'
  }
  if (props.phase === 'generating') {
    return 'AI 正在生成优化结果...'
  }
  return 'AI 正在分析提示词...'
})

watch(() => props.streamingText, async () => {
  await nextTick()
  if (textArea.value) {
    textArea.value.scrollTop = textArea.value.scrollHeight
  }
})
</script>

<style scoped>
.thinking-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.thinking-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 720px;
  max-height: 80vh;
  padding: 0 20px;
}

.thinking-content.has-text {
  align-items: stretch;
}

.thinking-content.is-clarifying {
  align-items: stretch;
}

.thinking-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.92rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-align: center;
  margin: 0;
}

.thinking-dots {
  display: flex;
  gap: 8px;
}

.clarify-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 24px;
  border-radius: 20px;
  background: rgba(16, 24, 40, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.24);
}

.clarify-progress {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.85rem;
  letter-spacing: 0.04em;
}

.clarify-question {
  margin: 0;
  color: #fff;
  font-size: 1rem;
  line-height: 1.7;
}

.clarify-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.clarify-option {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.88);
  font: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clarify-option:hover,
.clarify-option.active {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.clarify-custom {
  width: 100%;
}

.clarify-textarea {
  width: 100%;
  resize: vertical;
  min-height: 112px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(0, 0, 0, 0.22);
  color: rgba(255, 255, 255, 0.92);
  font: inherit;
  line-height: 1.6;
}

.clarify-textarea::placeholder {
  color: rgba(255, 255, 255, 0.42);
}

.clarify-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.clarify-action {
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  font: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clarify-action.ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
}

.clarify-action.primary {
  background: rgba(255, 255, 255, 0.92);
  color: #101828;
  border-color: transparent;
}

.clarify-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  animation: dotPulse 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.thinking-stream {
  flex: 1;
  overflow-y: auto;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 20px;
  max-height: 50vh;
  scroll-behavior: smooth;
}

.thinking-stream-content {
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 0.88rem;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.thinking-stop-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-full, 9999px);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.8);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.thinking-stop-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

@media (max-width: 640px) {
  .clarify-panel {
    padding: 20px;
  }

  .clarify-actions {
    flex-direction: column;
  }

  .clarify-action {
    width: 100%;
  }
}

/* Transition */
.thinking-enter-active {
  transition: opacity 0.3s ease;
}

.thinking-leave-active {
  transition: opacity 0.2s ease;
}

.thinking-enter-from,
.thinking-leave-to {
  opacity: 0;
}
</style>
