/**
 * Extract the current optimizedPrompt value from accumulated streaming JSON text.
 * Used to show only the prompt content on the thinking overlay, not raw JSON.
 */
export function extractOptimizedPrompt (accumulatedText) {
  if (!accumulatedText) return ''

  // Find the optimizedPrompt key in the text
  const keyMatch = accumulatedText.match(/"optimizedPrompt"\s*:\s*"/)
  if (!keyMatch) return ''

  // Everything after the opening quote of the optimizedPrompt value
  const contentStart = keyMatch.index + keyMatch[0].length
  let content = accumulatedText.slice(contentStart)

  // Check if the JSON is complete (optimizedPrompt string is closed)
  // Look for the closing quote followed by optional } or ,}
  const closeMatch = content.match(/(?<!\\)(?:\\\\)*"/)
  if (closeMatch) {
    // JSON is likely complete for this field - trim to content only
    content = content.slice(0, closeMatch.index)
  } else {
    // Still streaming - remove trailing partial escape sequences
    content = content.replace(/(?<!\\)(?:\\\\)*\\$/, '')
  }

  // Handle JSON escape sequences (order matters: \\ must be first)
  return content
    .replace(/\\\\/g, '\x00')           // \\ → placeholder
    .replace(/\\"/g, '"')               // \" → "
    .replace(/\\n/g, '\n')              // \n → newline
    .replace(/\\t/g, '\t')              // \t → tab
    .replace(/\\r/g, '\r')              // \r → carriage return
    .replace(/\\u[\da-fA-F]{4}/g, '')   // unicode escapes (removed)
    .replace(/\x00/g, '\\')             // placeholder → \
}
