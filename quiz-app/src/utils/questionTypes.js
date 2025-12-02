/**
 * Question type utilities
 */

import { QUESTION_TYPES, ANSWER_LABELS, SCORE_THRESHOLDS, SCORE_CLASSES } from './constants.js'

/**
 * Check if question is true/false type
 * @param {Object} question - Question object
 * @returns {boolean}
 */
export function isTrueFalse(question) {
  return question?.type === QUESTION_TYPES.TRUE_FALSE
}

/**
 * Check if question is multiple choice type
 * @param {Object} question - Question object
 * @returns {boolean}
 */
export function isMultipleChoice(question) {
  return question?.type === QUESTION_TYPES.MULTIPLE_CHOICE
}

/**
 * Get answer label for a given index and question type
 * @param {number} index - Answer index
 * @param {Object} question - Question object
 * @returns {string} - Answer label (A, B, C, D or T, F)
 */
export function getAnswerLabel(index, question) {
  if (isTrueFalse(question)) {
    return ANSWER_LABELS.TRUE_FALSE[index] || ''
  }
  return ANSWER_LABELS.MULTIPLE_CHOICE[index] || ''
}

/**
 * Get human-readable question type label
 * @param {Object} question - Question object
 * @returns {string} - "True/False" or "Multiple Choice"
 */
export function getQuestionTypeLabel(question) {
  return isTrueFalse(question) ? 'True/False' : 'Multiple Choice'
}

/**
 * Get CSS badge class for question type
 * @param {Object} question - Question object
 * @returns {string} - CSS class name
 */
export function getQuestionTypeBadgeClass(question) {
  return isTrueFalse(question) ? 'badge-true-false' : 'badge-multiple-choice'
}

/**
 * Get correct rate classification class
 * @param {number} percentage - Correct percentage
 * @returns {string} - CSS class ('high', 'medium', or 'low')
 */
export function getCorrectRateClass(percentage) {
  if (percentage >= SCORE_THRESHOLDS.HIGH) return SCORE_CLASSES.HIGH
  if (percentage >= SCORE_THRESHOLDS.MEDIUM) return SCORE_CLASSES.MEDIUM
  return SCORE_CLASSES.LOW
}

/**
 * Detect question type from answers
 * @param {Array<string>} answers - Answer options
 * @returns {string} - Question type
 */
export function detectQuestionType(answers) {
  if (answers.length === 2 && answers.includes('True') && answers.includes('False')) {
    return QUESTION_TYPES.TRUE_FALSE
  }
  return QUESTION_TYPES.MULTIPLE_CHOICE
}

/**
 * Validate question structure
 * @param {Object} question - Question to validate
 * @param {number} index - Question index for error messages
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateQuestion(question, index) {
  if (!question || !question.question || !Array.isArray(question.answers)) {
    return {
      valid: false,
      error: `Question ${index + 1} has invalid structure`,
    }
  }

  const type = question.type || detectQuestionType(question.answers)

  if (type === QUESTION_TYPES.MULTIPLE_CHOICE && question.answers.length !== 4) {
    return {
      valid: false,
      error: `Multiple choice question ${index + 1} must have exactly 4 answers`,
    }
  }

  if (type === QUESTION_TYPES.TRUE_FALSE && question.answers.length !== 2) {
    return {
      valid: false,
      error: `True/False question ${index + 1} must have exactly 2 answers`,
    }
  }

  return { valid: true }
}

/**
 * Calculate score by question type
 * @param {Array} questions - Array of questions
 * @param {Array} userAnswers - User's answers
 * @param {Array} correctAnswers - Correct answers
 * @param {string} type - Question type to filter by
 * @returns {Object} - { total: number, correct: number }
 */
export function calculateScoreByType(questions, userAnswers, correctAnswers, type) {
  let total = 0
  let correct = 0

  questions.forEach((q, idx) => {
    if (q.type === type && userAnswers[idx] !== null) {
      total++
      if (userAnswers[idx] === correctAnswers[idx]) {
        correct++
      }
    }
  })

  return { total, correct }
}
