<template>
  <Teleport to="body">
    <!-- Menu Button -->
    <button
      class="menu-btn"
      :class="{ 'active': isOpen }"
      @click="toggleMenu"
    >
      <svg v-if="!isOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.67 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.67a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span class="menu-section-title">API 配置</span>
            <span
              v-if="hasUserKey"
              class="menu-status configured"
            >已配置</span>
            <span
              v-else-if="hasConfig"
              class="menu-status proxy"
            >代理模式</span>
            <span
              v-else
              class="menu-status unconfigured"
            >未配置</span>
            <svg class="chevron" :class="{ expanded: configExpanded || !hasConfig }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          <Transition name="expand">
            <div v-if="configExpanded || !hasConfig" class="menu-form">
              <div class="form-row">
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

              <div class="form-row">
                <label>模型名称</label>
                <input
                  v-model="localConfig.model"
                  type="text"
                  placeholder="如：gpt-4o-mini"
                  @input="emitUpdate"
                />
              </div>

              <div class="form-row">
                <label>Base URL</label>
                <input
                  v-model="localConfig.baseURL"
                  type="text"
                  placeholder="如：https://api.openai.com/v1"
                  @input="emitUpdate"
                />
              </div>

              <div class="form-row">
                <label>API Key</label>
                <input
                  v-model="localConfig.apiKey"
                  type="password"
                  placeholder="sk-xxxxxxxx"
                  @input="emitUpdate"
                />
              </div>

              <p v-if="props.proxyAvailable && !hasUserKey" class="proxy-hint">
                未填写 API Key，将使用服务端代理发送请求
              </p>

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button class="icon-btn" @click.stop="handleCopy(item)" title="复制">
                  <svg v-if="copiedId !== item.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
                <button class="icon-btn" @click.stop="handleRename(item)" title="重命名">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="icon-btn danger" @click.stop="handleDelete(item)" title="删除">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { copyToClipboard } from '../utils/clipboard.js'

const props = defineProps({
  config: {
    type: Object,
    default: null
  },
  proxyAvailable: {
    type: Boolean,
    default: false
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
  return !!(localConfig.value.baseURL && localConfig.value.model)
})

const hasUserKey = computed(() => {
  return !!localConfig.value.apiKey
})

watch(() => props.config, (newConfig) => {
  if (newConfig) {
    localConfig.value = { ...newConfig }
  } else {
    localConfig.value = { ...emptyConfig }
  }
}, { immediate: true, deep: true })

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

async function handleCopy(item) {
  const success = await copyToClipboard(item.content)
  if (success) {
    copiedId.value = item.id
    emit('copy', item)
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  }
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

function handleKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function checkShouldShow() {
  if (!props.proxyAvailable && !hasConfig.value) {
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
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-elevated);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s var(--ease-out);
  color: var(--text-primary);
}

.menu-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-hover);
}

.menu-btn.active {
  background: var(--text-primary);
  color: white;
  border-color: var(--text-primary);
}

/* Dropdown */
.menu-dropdown {
  position: fixed;
  top: 80px;
  right: 24px;
  width: 380px;
  max-height: 80vh;
  background: var(--bg-elevated);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 200;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
}

.menu-section {
  padding: 20px;
}

.menu-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.menu-section-header.clickable {
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 0;
  user-select: none;
}

.menu-section-header.clickable:hover {
  opacity: 0.7;
}

.menu-section-icon {
  font-size: 1.1rem;
}

.menu-section-title {
  font-weight: 600;
  font-size: 0.95rem;
  flex: 1;
}

.menu-status {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.menu-status.configured {
  background: rgba(52, 199, 89, 0.12);
  color: #2e7d32;
}

.menu-status.unconfigured {
  background: rgba(255, 149, 0, 0.12);
  color: #ef6c00;
}

.menu-status.proxy {
  background: rgba(0, 113, 227, 0.12);
  color: #005bb5;
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
  color: var(--text-tertiary);
  transition: transform 0.25s var(--ease-out);
}

.chevron.expanded {
  transform: rotate(180deg);
}

/* Form */
.menu-form {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-row input,
.form-row select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-family: inherit;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.form-row input::placeholder {
  color: var(--text-tertiary);
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
  font-weight: 500;
}

.btn-clear:hover {
  text-decoration: underline;
}

.proxy-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  margin: 0;
}

/* Divider */
.menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 0 20px;
}

/* History */
.menu-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-tertiary);
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
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.menu-history-item:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
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
  color: var(--text-primary);
}

.menu-history-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.menu-history-actions {
  display: flex;
  gap: 2px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.icon-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.icon-btn.danger:hover {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.btn-more {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 10px;
  text-align: center;
  font-family: inherit;
  width: 100%;
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.btn-more:hover {
  background: rgba(0, 113, 227, 0.05);
}

/* Overlay */
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.15);
  z-index: 150;
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

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s var(--ease-out);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s var(--ease-out);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
}
</style>
