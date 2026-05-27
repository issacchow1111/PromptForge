<template>
  <Teleport to="body">
    <!-- Floating Button -->
    <button 
      class="config-float-btn"
      :class="{ 'configured': hasConfig }"
      @click="isOpen = true"
    >
      <span class="config-icon">⚙️</span>
      <span class="config-text">{{ hasConfig ? '已配置' : '配置API' }}</span>
      <span v-if="hasConfig" class="config-dot"></span>
    </button>

    <!-- Modal Overlay -->
    <Transition name="fade">
      <div v-if="isOpen" class="modal-overlay" @click="handleClose">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">⚙️ API 配置</h2>
            <button class="modal-close" @click="handleClose">✕</button>
          </div>

          <div class="modal-body">
            <div class="config-grid">
              <div class="form-group">
                <label>模型厂商</label>
                <select v-model="localConfig.provider" @change="emitUpdate">
                  <option value="">选择厂商</option>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Anthropic">Anthropic</option>
                  <option value="Google">Google</option>
                  <option value="Meta">Meta</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              <div class="form-group">
                <label>模型名称</label>
                <input 
                  v-model="localConfig.model" 
                  type="text" 
                  placeholder="如：gpt-4o-mini"
                  @input="emitUpdate"
                />
              </div>

              <div class="form-group full">
                <label>Base URL</label>
                <input 
                  v-model="localConfig.baseURL" 
                  type="text" 
                  placeholder="如：https://api.openai.com/v1"
                  @input="emitUpdate"
                />
              </div>

              <div class="form-group full">
                <label>API Key</label>
                <input 
                  v-model="localConfig.apiKey" 
                  type="password" 
                  placeholder="sk-xxxxxxxx"
                  @input="emitUpdate"
                />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button v-if="hasConfig" class="btn btn-danger btn-small" @click="handleClear">
              清空配置
            </button>
            <button class="btn btn-primary" @click="handleClose">
              完成
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:config', 'clear'])

const isOpen = ref(false)
const emptyConfig = {
  provider: '',
  model: '',
  baseURL: '',
  apiKey: ''
}
const localConfig = ref({ ...emptyConfig })

const hasConfig = computed(() => {
  return !!(localConfig.value.apiKey && localConfig.value.baseURL && localConfig.value.model)
})

watch(() => props.config, (newConfig) => {
  if (newConfig) {
    localConfig.value = { ...newConfig }
  } else {
    localConfig.value = { ...emptyConfig }
  }
}, { immediate: true, deep: true })

function emitUpdate() {
  emit('update:config', { ...localConfig.value })
}

function handleClose() {
  isOpen.value = false
}

function handleClear() {
  if (confirm('确定要清空所有 API 配置吗？')) {
    localConfig.value = { ...emptyConfig }
    emit('clear')
  }
}

// Only auto show if no config exists - use nextTick to wait for props to update
async function checkShouldShow() {
  await nextTick()
  if (!props.config || !props.config.apiKey) {
    isOpen.value = true
  }
}

defineExpose({
  checkShouldShow
})
</script>

<style scoped>
/* Floating Button */
.config-float-btn {
  position: fixed;
  top: 24px;
  right: 90px;
  height: 44px;
  padding: 0 16px;
  border-radius: 22px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.config-float-btn:hover {
  background: var(--bg-secondary);
  border-color: var(--accent);
}

.config-float-btn.configured {
  background: #34c759;
  border-color: #34c759;
  color: white;
}

.config-float-btn.configured:hover {
  background: #2dbd4e;
}

.config-icon {
  font-size: 1.1rem;
}

.config-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
}

/* Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal */
.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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

.modal-body {
  padding: 24px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 500px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group select {
  padding: 12px 14px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
}

.form-group input::placeholder {
  color: #a1a1a6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
