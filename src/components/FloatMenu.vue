<template>
  <Teleport to="body">
    <!-- Menu Button -->
    <button 
      class="menu-btn"
      :class="{ 'active': isOpen }"
      @click="toggleMenu"
    >
      <span class="menu-icon">{{ isOpen ? '✕' : '☰' }}</span>
    </button>

    <!-- Menu Dropdown -->
    <Transition name="dropdown">
      <div v-if="isOpen" class="menu-dropdown">
        <!-- Config Section -->
        <div class="menu-section">
          <div 
            class="menu-section-header clickable"
            @click="configExpanded = !configExpanded"
          >
            <span class="menu-section-icon">⚙️</span>
            <span class="menu-section-title">API 配置</span>
            <span v-if="hasConfig" class="menu-status configured">已配置</span>
            <span v-else class="menu-status unconfigured">未配置</span>
            <span class="chevron" :class="{ expanded: configExpanded || !hasConfig }">
              {{ configExpanded || !hasConfig ? '▼' : '▶' }}
            </span>
          </div>
          
          <Transition name="expand">
            <div v-if="configExpanded || !hasConfig" class="menu-form">
              <div class="form-row">
                <select v-model="localConfig.provider" @change="emitUpdate">
                  <option value="">选择厂商</option>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Anthropic">Anthropic</option>
                  <option value="Google">Google</option>
                  <option value="Meta">Meta</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              
              <div class="form-row">
                <input 
                  v-model="localConfig.model" 
                  type="text" 
                  placeholder="模型名称，如：gpt-4o-mini"
                  @input="emitUpdate"
                />
              </div>
              
              <div class="form-row">
                <input 
                  v-model="localConfig.baseURL" 
                  type="text" 
                  placeholder="Base URL，如：https://api.openai.com/v1"
                  @input="emitUpdate"
                />
              </div>
              
              <div class="form-row">
                <input 
                  v-model="localConfig.apiKey" 
                  type="password" 
                  placeholder="API Key"
                  @input="emitUpdate"
                />
              </div>
              
              <button v-if="hasConfig" class="btn-clear" @click="handleClear">
                清空配置
              </button>
            </div>
          </Transition>
        </div>

        <!-- Divider -->
        <div class="menu-divider"></div>

        <!-- History Section -->
        <div class="menu-section">
          <div class="menu-section-header">
            <span class="menu-section-icon">📜</span>
            <span class="menu-section-title">历史记录</span>
            <span v-if="history.length > 0" class="menu-badge">{{ history.length }}</span>
          </div>

          <div v-if="history.length === 0" class="menu-empty">
            暂无保存的记录
          </div>

          <div v-else class="menu-history-list">
            <div 
              v-for="item in history.slice(0, 5)" 
              :key="item.id" 
              class="menu-history-item"
            >
              <div class="menu-history-info" @click="handleLoad(item)">
                <div class="menu-history-name">{{ item.name }}</div>
                <div class="menu-history-time">{{ formatTime(item.createdAt) }}</div>
              </div>
              <div class="menu-history-actions">
                <button class="icon-btn" @click.stop="handleView(item)" title="查看">
                  👁
                </button>
                <button class="icon-btn" @click.stop="handleCopy(item)" title="复制">
                  {{ copiedId === item.id ? '✓' : '📋' }}
                </button>
                <button class="icon-btn" @click.stop="handleRename(item)" title="重命名">
                  ✏️
                </button>
                <button class="icon-btn danger" @click.stop="handleDelete(item)" title="删除">
                  🗑
                </button>
              </div>
            </div>
            
            <button v-if="history.length > 5" class="btn-more" @click="emit('openHistory')">
              查看全部 {{ history.length }} 条 →
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Overlay -->
    <Transition name="fade">
      <div v-if="isOpen" class="menu-overlay" @click="closeMenu"></div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    default: null
  },
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:config', 
  'clear', 
  'load', 
  'rename', 
  'delete', 
  'copy',
  'openHistory',
  'view'
])

const isOpen = ref(false)
const configExpanded = ref(false)
const copiedId = ref(null)
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

// Auto-close menu when config becomes valid
watch(hasConfig, (valid) => {
  if (valid && isOpen.value) {
    isOpen.value = false
  }
})

function toggleMenu() {
  isOpen.value = !isOpen.value
  if (isOpen.value && hasConfig.value) {
    configExpanded.value = false
  }
}

function closeMenu() {
  isOpen.value = false
}

function emitUpdate() {
  emit('update:config', { ...localConfig.value })
}

function handleClear() {
  if (confirm('确定要清空所有 API 配置吗？')) {
    localConfig.value = { ...emptyConfig }
    emit('clear')
  }
}

function formatTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleLoad(item) {
  emit('load', item)
  isOpen.value = false
}

function handleCopy(item) {
  navigator.clipboard.writeText(item.content)
  copiedId.value = item.id
  emit('copy', item)
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

function handleRename(item) {
  emit('rename', item)
}

function handleView(item) {
  emit('view', item)
}

function handleDelete(item) {
  if (confirm(`确定要删除「${item.name}」吗？`)) {
    emit('delete', item)
  }
}

// Expose for auto show
function checkShouldShow() {
  if (!props.config || !props.config.apiKey) {
    isOpen.value = true
    configExpanded.value = true
  }
}

defineExpose({
  checkShouldShow
})
</script>

<style scoped>
/* Menu Button */
.menu-btn {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1.2rem;
}

.menu-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 28px rgba(0,0,0,0.2);
}

.menu-btn.active {
  background: var(--text-primary);
  color: white;
}

/* Dropdown */
.menu-dropdown {
  position: fixed;
  top: 84px;
  right: 24px;
  width: 360px;
  max-height: 80vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.2);
  z-index: 200;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.menu-section {
  padding: 20px;
}

.menu-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.menu-section-header.clickable {
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 0;
}

.menu-section-header.clickable:hover {
  opacity: 0.8;
}

.menu-section-icon {
  font-size: 1.1rem;
}

.menu-section-title {
  font-weight: 600;
  font-size: 1rem;
  flex: 1;
}

.menu-status {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 10px;
}

.menu-status.configured {
  background: #e8f5e9;
  color: #2e7d32;
}

.menu-status.unconfigured {
  background: #fff3e0;
  color: #ef6c00;
}

.menu-badge {
  background: var(--accent);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.chevron {
  font-size: 0.65rem;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.chevron.expanded {
  transform: rotate(0deg);
}

.chevron:not(.expanded) {
  transform: rotate(-90deg);
}

/* Form */
.menu-form {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row input,
.form-row select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: var(--accent);
  background: white;
}

.form-row input::placeholder {
  color: #a1a1a6;
}

.btn-clear {
  background: none;
  border: none;
  color: #ff3b30;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 8px 0;
  text-align: left;
  font-family: inherit;
}

.btn-clear:hover {
  text-decoration: underline;
}

/* Divider */
.menu-divider {
  height: 1px;
  background: var(--border-light);
}

/* History */
.menu-empty {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.menu-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.menu-history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.menu-history-item:hover {
  background: var(--border-light);
}

.menu-history-info {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.menu-history-name {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-history-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.menu-history-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(0,0,0,0.08);
}

.icon-btn.danger:hover {
  background: rgba(255,59,48,0.1);
}

.btn-more {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 8px 12px;
  text-align: center;
  font-family: inherit;
}

.btn-more:hover {
  text-decoration: underline;
}

/* Overlay */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.2);
  z-index: 150;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.25s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 400px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
