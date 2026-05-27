<template>
  <div class="toast-container">
    <Transition name="toast">
      <div v-if="show" class="toast" :class="type" @click="emit('close')">
        <svg v-if="type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else-if="type === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>{{ message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' },
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
}

.toast {
  padding: 14px 24px;
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  white-space: nowrap;
}

.toast.success {
  background: rgba(52, 199, 89, 0.92);
  color: white;
}

.toast.error {
  background: rgba(255, 59, 48, 0.92);
  color: white;
}

.toast.info {
  background: rgba(28, 28, 30, 0.88);
  color: white;
}

/* Toast Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s var(--ease-spring);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
</style>
