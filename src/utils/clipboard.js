/**
 * 安全的剪贴板写入工具
 * 优先使用现代 Clipboard API，降级使用 document.execCommand
 */

export async function copyToClipboard(text) {
  if (!text) return false

  // 优先使用现代 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('Clipboard API failed, falling back:', err)
    }
  }

  // 降级方案：使用 execCommand
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch (err) {
    document.body.removeChild(textarea)
    console.error('execCommand copy failed:', err)
    return false
  }
}
