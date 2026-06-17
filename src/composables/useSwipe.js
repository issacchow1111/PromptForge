import { ref, onMounted, onUnmounted } from 'vue'

export function useSwipe (elementRef, options = {}) {
  const {
    threshold = 60,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeStart,
    onSwipeMove,
    onSwipeEnd,
    enabled = () => true
  } = options

  const startX = ref(0)
  const startY = ref(0)
  const currentX = ref(0)
  const currentY = ref(0)
  const isActive = ref(false)
  const pointerId = ref(null)

  function getTarget () {
    return typeof elementRef === 'function' ? elementRef() : elementRef.value
  }

  function handlePointerDown (e) {
    if (!enabled()) return
    const target = getTarget()
    if (!target || !target.contains(e.target)) return

    isActive.value = true
    pointerId.value = e.pointerId
    startX.value = e.clientX
    startY.value = e.clientY
    currentX.value = e.clientX
    currentY.value = e.clientY

    target.setPointerCapture?.(e.pointerId)
    onSwipeStart?.()
  }

  function handlePointerMove (e) {
    if (!isActive.value || e.pointerId !== pointerId.value) return

    currentX.value = e.clientX
    currentY.value = e.clientY

    const deltaX = currentX.value - startX.value
    const deltaY = currentY.value - startY.value

    onSwipeMove?.({ deltaX, deltaY })
  }

  function handlePointerUp (e) {
    if (!isActive.value || e.pointerId !== pointerId.value) return

    const deltaX = currentX.value - startX.value
    const deltaY = currentY.value - startY.value
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    isActive.value = false
    pointerId.value = null

    if (Math.max(absX, absY) < threshold) {
      onSwipeEnd?.({ cancelled: true })
      return
    }

    if (absX > absY) {
      if (deltaX > 0) {
        onSwipeRight?.({ distance: absX })
      } else {
        onSwipeLeft?.({ distance: absX })
      }
    } else {
      if (deltaY > 0) {
        onSwipeDown?.({ distance: absY })
      } else {
        onSwipeUp?.({ distance: absY })
      }
    }

    onSwipeEnd?.({ deltaX, deltaY })
  }

  function handlePointerCancel (e) {
    if (e.pointerId !== pointerId.value) return
    isActive.value = false
    pointerId.value = null
    onSwipeEnd?.({ cancelled: true })
  }

  onMounted(() => {
    const target = getTarget()
    if (!target) return
    target.addEventListener('pointerdown', handlePointerDown)
    target.addEventListener('pointermove', handlePointerMove)
    target.addEventListener('pointerup', handlePointerUp)
    target.addEventListener('pointercancel', handlePointerCancel)
  })

  onUnmounted(() => {
    const target = getTarget()
    if (!target) return
    target.removeEventListener('pointerdown', handlePointerDown)
    target.removeEventListener('pointermove', handlePointerMove)
    target.removeEventListener('pointerup', handlePointerUp)
    target.removeEventListener('pointercancel', handlePointerCancel)
  })

  return {
    isActive,
    startX,
    startY,
    currentX,
    currentY
  }
}
