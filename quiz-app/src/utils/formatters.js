/**
 * Formatting utilities
 */

/**
 * Format date for display
 * @param {string|Date} dateString - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format percentage for display
 * @param {number} value - Numeric value
 * @param {number} total - Total for percentage calculation
 * @returns {number} - Rounded percentage
 */
export function calculatePercentage(value, total) {
  if (!total || total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Format score as fraction string
 * @param {number} correct - Correct count
 * @param {number} total - Total count
 * @returns {string} - "X / Y" format
 */
export function formatScore(correct, total) {
  return `${correct} / ${total}`
}
