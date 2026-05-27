<template>
  <div class="workspace-card">
    <div class="card-header">
      <h2 class="card-title">
        <span class="card-title-icon">✏️</span>
        待优化提示词
      </h2>
    </div>
    <div class="card-body">
      <textarea
        v-model="promptText"
        class="prompt-textarea"
        placeholder="在此输入您希望优化的提示词内容..."
        @keydown="handleKeydown"
      ></textarea>

      <div class="input-footer">
        <span class="char-count">{{ charCount }} 字</span>
        <div class="input-actions">
          <button 
            class="btn btn-ghost btn-small" 
            @click="handleClear"
          >
            清空提示词
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
            <span v-else>优化提示词</span>
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
</script>
