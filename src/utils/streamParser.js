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

  // Find the first unescaped closing quote without regex lookbehind
  // (Safari < 16.4 does not support negative lookbehind)
  const closeIndex = findUnescapedQuote(content)
  if (closeIndex !== -1) {
    // JSON is likely complete for this field - trim to content only
    content = content.slice(0, closeIndex)
  } else {
    // Still streaming - remove trailing partial escape sequence
    content = stripTrailingPartialEscape(content)
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

function findUnescapedQuote (str) {
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++ // skip the escaped character
      continue
    }
    if (str[i] === '"') {
      return i
    }
  }
  return -1
}

function stripTrailingPartialEscape (str) {
  // If the string ends with an odd number of consecutive backslashes,
  // the last one is an incomplete escape sequence and should be removed.
  let backslashCount = 0
  for (let i = str.length - 1; i >= 0 && str[i] === '\\'; i--) {
    backslashCount++
  }
  if (backslashCount % 2 === 1) {
    return str.slice(0, -1)
  }
  return str
}
