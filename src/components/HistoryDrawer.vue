<template>
  <Teleport to="body">
    <!-- Floating Button -->
    <button 
      class="drawer-float-btn" 
      :class="{ 'has-items': history.length > 0 }"
      @click="isOpen = true"
    >
      <span class="drawer-icon">📜</span>
      <span v-if="history.length > 0" class="drawer-badge">{{ history.length }}</span>
    </button>

    <!-- Drawer Overlay -->
    <Transition name="fade">
      <div v-if="isOpen" class="drawer-overlay" @click="isOpen = false"></div>
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide">
      <div v-if="isOpen" class="drawer-panel">
        <div class="drawer-header">
          <h2 class="drawer-title">📜 历史记录</h2>
          <button class="drawer-close" @click="isOpen = false">✕</button>
        </div>

        <div class="drawer-content">
          <div v-if="history.length === 0" class="drawer-empty">
            暂无保存的提示词
          </div>

          <div 
            v-for="item in history" 
            :key="item.id" 
            class="drawer-item"
          >
            <div class="drawer-item-header">
              <div class="drawer-item-name">{{ item.name }}</div>
              <div class="drawer-item-time">{{ formatTime(item.createdAt) }}</div>
            </div>

            <div class="drawer-item-preview">
              {{ item.content.substring(0, 100) }}{{ item.content.length > 100 ? '...' : '' }}
            </div>

            <div class="drawer-item-actions">
              <button 
                class="btn btn-ghost btn-small" 
                @click="handleLoad(item)"
              >
                加载
              </button>
              <button 
                class="btn btn-ghost btn-small" 
                @click="handleCopy(item)"
              >
                {{ copiedId === item.id ? '✓ 已复制' : '📋 复制' }}
              </button>
              <button 
                class="btn btn-ghost btn-small" 
                @click="emit('rename', item)"
              >
                ✏️
              </button>
              <button 
                class="btn btn-danger btn-small" 
                @click="handleDelete(item)"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { copyToClipboard } from '../utils/clipboard.js'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['load', 'rename', 'delete', 'copy'])

const isOpen = ref(false)
const copiedId = ref(null)

function formatTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
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

function handleDelete(item) {
  if (confirm(`确定要删除「${item.name}」吗？`)) {
    emit('delete', item)
  }
}

// 键盘事件：ESC 关闭抽屉
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
</script>

<style scoped>
/* Floating Button */
.drawer-float-btn {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg-primary);
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.drawer-float-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(0,0,0,0.2);
}

.drawer-float-btn.has-items {
  background: var(--accent);
  color: white;
}

.drawer-icon {
  font-size: 1.5rem;
}

.drawer-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff3b30;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

/* Overlay */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 200;
}

/* Panel */
.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  max-width: 90vw;
  height: 100vh;
  background: var(--bg-primary);
  z-index: 300;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,0.15);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.drawer-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.drawer-close {
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

.drawer-close:hover {
  background: var(--border-light);
  color: var(--text-primary);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.drawer-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.drawer-item {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.drawer-item:hover {
  background: var(--border-light);
}

.drawer-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.drawer-item-name {
  font-weight: 600;
  font-size: 1rem;
}

.drawer-item-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.drawer-item-preview {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
  word-break: break-word;
}

.drawer-item-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
