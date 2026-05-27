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
