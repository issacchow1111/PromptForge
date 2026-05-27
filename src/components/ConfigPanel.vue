<template>
  <section class="config-section">
    <div class="config-wrapper">
      <div class="config-header" @click="isExpanded = !isExpanded">
        <div class="config-header-left">
          <div class="config-icon">⚙</div>
          <div class="config-status">
            <span class="status-dot" :class="{ inactive: !hasConfig }"></span>
            <span>{{ hasConfig ? '已配置 API' : '未配置 API' }}</span>
          </div>
        </div>
        <span class="config-toggle-icon" :class="{ expanded: isExpanded }">▼</span>
      </div>

      <div v-if="isExpanded" class="config-form">
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

        <div v-if="hasConfig" class="config-actions">
          <button class="btn btn-danger btn-small" @click="handleClear">
            清空配置
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:config', 'clear'])

const isExpanded = ref(true)
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

function handleClear() {
  if (confirm('确定要清空所有 API 配置吗？')) {
    localConfig.value = { ...emptyConfig }
    emit('clear')
  }
}
</script>
