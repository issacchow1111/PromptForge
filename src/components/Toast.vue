<template>
  <div class="toast-container">
    <div class="toast" :class="type" @click="emit('close')">
      <span>{{ icon }}</span>
      <span>{{ message }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }
})

const emit = defineEmits(['close'])

const icon = computed(() => {
  switch (props.type) {
    case 'success': return '✓'
    case 'error': return '✕'
    default: return 'ℹ'
  }
})
</script>
