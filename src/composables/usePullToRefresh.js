import { ref } from 'vue'
import { useSwipe } from './useSwipe.js'

export function usePullToRefresh (elementRef, options = {}) {
  const {
    threshold = 80,
    onRefresh,
    enabled = () => true,
    getScrollTop = () => 0
  } = options

  const pullDistance = ref(0)
  const isPulling = ref(false)
  const isRefreshing = ref(false)

  useSwipe(elementRef, {
    threshold: 0,
    enabled: () => enabled() && !isRefreshing.value && getScrollTop() <= 0,
    onSwipeStart: () => {
      if (getScrollTop() <= 0) {
        isPulling.value = true
        pullDistance.value = 0
      }
    },
    onSwipeMove: ({ deltaY }) => {
      if (!isPulling.value) return
      if (deltaY > 0) {
        pullDistance.value = Math.min(deltaY * 0.5, threshold * 1.5)
      }
    },
    onSwipeEnd: ({ deltaY, cancelled }) => {
      if (!isPulling.value || cancelled) {
        isPulling.value = false
        pullDistance.value = 0
        return
      }

      isPulling.value = false

      if (deltaY >= threshold && getScrollTop() <= 0) {
        isRefreshing.value = true
        Promise.resolve(onRefresh?.()).finally(() => {
          isRefreshing.value = false
          pullDistance.value = 0
        })
      } else {
        pullDistance.value = 0
      }
    }
  })

  return {
    pullDistance,
    isPulling,
    isRefreshing
  }
}
