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
  textarea.readOnly = true
  textarea.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none;'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, text.length)

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
