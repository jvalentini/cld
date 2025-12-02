/**
 * Application constants
 */

// Question Types
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
}

// Answer Labels
export const ANSWER_LABELS = {
  MULTIPLE_CHOICE: ['A', 'B', 'C', 'D'],
  TRUE_FALSE: ['T', 'F'],
}

// Views
export const VIEWS = {
  QUIZ: 'quiz',
  LEADERBOARD: 'leaderboard',
  STATS: 'stats',
  QUIZ_STATS: 'quiz-stats',
  QUESTION_DETAIL: 'question-detail',
}

// Score Classification Thresholds
export const SCORE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50,
}

// Score Classes
export const SCORE_CLASSES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

// Auth Constants
export const AUTH_TOKEN_KEY = 'quiz_auth'
export const AUTH_TOKEN_EXPIRY_DAYS = 7

// Local Storage Keys
export const STORAGE_KEYS = {
  QUIZ_PROGRESS: 'quizProgress',
  AUTH_TOKEN: 'quiz_auth',
}

// Message Timeouts (ms)
export const MESSAGE_TIMEOUT = 3000
