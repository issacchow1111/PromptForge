<template>
  <Transition name="thinking">
    <div v-if="show" class="thinking-overlay">
      <div class="thinking-content" :class="{ 'has-text': streamingText }">
        <p class="thinking-label">AI正在思考...</p>

        <!-- Streaming text area -->
        <div v-if="streamingText" ref="textArea" class="thinking-stream">
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
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  streamingText: {
    type: String,
    default: ''
  }
})

defineEmits(['stop'])

const textArea = ref(null)

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
