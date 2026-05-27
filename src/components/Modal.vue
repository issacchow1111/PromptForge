<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal-content">
      <h3 class="modal-title">{{ title }}</h3>
      <input
        ref="inputRef"
        v-model="inputValue"
        class="modal-input"
        :placeholder="placeholder"
        @keyup.enter="handleConfirm"
        @keyup.escape="emit('cancel')"
      />
      <div class="modal-actions">
        <button class="btn btn-ghost" @click="emit('cancel')">
          取消
        </button>
        <button class="btn btn-primary" @click="handleConfirm">
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  value: { type: String, default: '' },
  placeholder: { type: String, default: '' }
})

const emit = defineEmits(['confirm', 'cancel'])

const inputRef = ref(null)
const inputValue = ref('')

watch(() => props.value, (newVal) => {
  inputValue.value = newVal
}, { immediate: true })

watch(inputRef, async (el) => {
  if (el) {
    await nextTick()
    el.focus()
    el.select()
  }
})

function handleConfirm() {
  emit('confirm', inputValue.value)
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
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: var(--bg-elevated);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  border-radius: var(--radius-xl);
  padding: 28px;
  width: 90%;
  max-width: 420px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border);
  animation: scaleIn 0.3s var(--ease-spring);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.modal-input {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  background: var(--bg-primary);
  color: var(--text-primary);
  margin-bottom: 20px;
  transition: all 0.2s ease;
}

.modal-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-glow);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
