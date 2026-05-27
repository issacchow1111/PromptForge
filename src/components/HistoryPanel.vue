<template>
  <section class="history-section">
    <div class="history-wrapper">
      <div class="history-header" @click="isExpanded = !isExpanded">
        <div class="history-header-left">
          📜 历史记录
          <span v-if="history.length > 0" class="history-count-badge">
            {{ history.length }}
          </span>
        </div>
        <span class="config-toggle-icon" :class="{ expanded: isExpanded }">▼</span>
      </div>

      <div v-if="isExpanded" class="history-list">
        <div v-if="history.length === 0" class="history-empty">
          暂无保存的提示词
        </div>

        <div 
          v-for="item in history" 
          :key="item.id" 
          class="history-item"
        >
          <div class="history-item-header">
            <div>
              <div class="history-item-name">{{ item.name }}</div>
              <div class="history-item-time">{{ formatTime(item.createdAt) }}</div>
            </div>
            <div class="history-item-actions">
              <button 
                class="btn btn-ghost btn-small" 
                @click="toggleExpand(item.id)"
              >
                {{ expandedId === item.id ? '收起' : '查看' }}
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

          <div v-if="expandedId === item.id" class="history-expanded">
            {{ item.content }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['load', 'rename', 'delete', 'copy'])

const isExpanded = ref(true)
const expandedId = ref(null)
const copiedId = ref(null)

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

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

function handleCopy(item) {
  navigator.clipboard.writeText(item.content)
  copiedId.value = item.id
  emit('copy', item)
  setTimeout(() => {
    copiedId.value = null
  }, 2000)
}

function handleDelete(item) {
  if (confirm(`确定要删除「${item.name}」吗？`)) {
    emit('delete', item)
  }
}
</script>
