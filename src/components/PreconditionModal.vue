<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleCancel">
      <div class="precondition-panel">
        <div class="precondition-header">
          <h2 class="precondition-title">设置前置条件</h2>
          <button class="modal-close" @click="handleCancel">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="precondition-body">
          <p class="precondition-desc">
            这些内容会作为全局背景参与后续提示词优化，可留空。
          </p>
          <textarea
            ref="textareaRef"
            v-model="localValue"
            class="precondition-textarea"
            placeholder="例如：当前项目是 Vue 3 + Vite 架构。已有 agent：产品规划 agent、前端实现 agent、审查 agent。要求所有输出使用中文，不要引入新的 UI 框架。"
          ></textarea>
        </div>

        <div class="precondition-actions">
          <button class="btn btn-ghost" @click="handleCancel">取消</button>
          <button
            class="btn btn-ghost"
            :disabled="!localValue"
            @click="handleClear"
          >
            清空
          </button>
          <button class="btn btn-primary" @click="handleSave">保存</button>
        </div>
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
  value: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['save', 'clear', 'cancel'])

const localValue = ref('')
const textareaRef = ref(null)

watch(() => props.show, (visible) => {
  if (!visible) return
  localValue.value = props.value || ''
  nextTick(() => {
    textareaRef.value?.focus()
  })
})

watch(() => props.value, (value) => {
  if (props.show) {
    localValue.value = value || ''
  }
})

function handleSave () {
  emit('save', localValue.value)
}

function handleClear () {
  localValue.value = ''
  emit('clear')
}

function handleCancel () {
  emit('cancel')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.precondition-panel {
  width: 100%;
  max-width: 720px;
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.precondition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.precondition-title {
  color: var(--text-primary);
  font-size: 1.15rem;
  font-weight: 600;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--border);
  color: var(--text-primary);
}

.precondition-body {
  padding: 22px 24px;
  overflow-y: auto;
}

.precondition-desc {
  margin-bottom: 14px;
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.6;
}

.precondition-textarea {
  width: 100%;
  min-height: 320px;
  padding: 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.7;
  resize: vertical;
}

.precondition-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-glow);
}

.precondition-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border-light);
}

@media (max-width: 640px) {
  .precondition-header,
  .precondition-body,
  .precondition-actions {
    padding-left: 18px;
    padding-right: 18px;
  }

  .precondition-textarea {
    min-height: 260px;
  }

  .precondition-actions {
    flex-wrap: wrap;
  }

  .precondition-actions .btn {
    flex: 1;
  }
}
</style>