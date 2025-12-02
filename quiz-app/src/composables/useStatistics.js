/**
 * Statistics composable
 * Manages quiz statistics state and operations
 */

import { ref, computed } from 'vue'
import { supabase } from '../supabaseClient.js'
import { getCorrectRateClass } from '../utils/questionTypes.js'
import { calculatePercentage } from '../utils/formatters.js'

// Shared reactive state
const allQuizStats = ref([])
const selectedQuizStats = ref(null)
const questionStats = ref([])
const selectedQuestionId = ref(null)
const selectedQuestionStats = ref(null)
const answerStats = ref([])
const selectedStatsQuizId = ref(null)
const loadingStats = ref(false)
const statsError = ref(null)

/**
 * Statistics composable
 * @returns {Object} - Statistics state and methods
 */
export function useStatistics() {
  // Computed properties
  const totalSubmissions = computed(() => {
    return allQuizStats.value.reduce((sum, quiz) => sum + (quiz.total_submissions || 0), 0)
  })

  const overallAverageScore = computed(() => {
    if (allQuizStats.value.length === 0) return 0

    let totalScore = 0
    let totalSubs = 0

    allQuizStats.value.forEach(quiz => {
      if (quiz.total_submissions && quiz.average_score) {
        totalScore += quiz.average_score * quiz.total_submissions
        totalSubs += quiz.total_submissions
      }
    })

    if (totalSubs === 0) return 0
    return Math.round(totalScore / totalSubs)
  })

  const hasQuizStats = computed(() => allQuizStats.value.length > 0)
  const hasQuestionStats = computed(() => questionStats.value.length > 0)
  const hasAnswerStats = computed(() => answerStats.value.length > 0)

  // Methods

  /**
   * Load all quiz statistics
   */
  async function loadAllQuizStats() {
    loadingStats.value = true
    statsError.value = null

    try {
      const { data, error } = await supabase.from('quiz_statistics').select('*').order('quiz_name')

      if (error) throw error

      allQuizStats.value = data || []
    } catch (err) {
      console.error('Error loading quiz statistics:', err)
      statsError.value = `Failed to load statistics: ${err.message}`
    } finally {
      loadingStats.value = false
    }
  }

  /**
   * Load statistics for a specific quiz
   * @param {number} quizId - Quiz ID
   */
  async function loadQuizStats(quizId) {
    selectedStatsQuizId.value = quizId
    loadingStats.value = true
    statsError.value = null

    try {
      // Load quiz overview stats
      const { data: quizData, error: quizError } = await supabase
        .from('quiz_statistics')
        .select('*')
        .eq('quiz_id', quizId)
        .single()

      if (quizError) throw quizError

      selectedQuizStats.value = quizData

      // Load question statistics
      const { data: questionData, error: questionError } = await supabase
        .from('question_statistics')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_id')

      if (questionError) throw questionError

      questionStats.value = questionData || []
    } catch (err) {
      console.error('Error loading quiz statistics:', err)
      statsError.value = `Failed to load quiz statistics: ${err.message}`
      throw err // Re-throw for navigation handling
    } finally {
      loadingStats.value = false
    }
  }

  /**
   * Load details for a specific question
   * @param {number} questionId - Question ID
   */
  async function loadQuestionDetail(questionId) {
    selectedQuestionId.value = questionId
    loadingStats.value = true
    statsError.value = null

    try {
      // Load question statistics
      const { data: questionData, error: questionError } = await supabase
        .from('question_statistics')
        .select('*')
        .eq('question_id', questionId)
        .single()

      if (questionError) throw questionError

      selectedQuestionStats.value = questionData

      // Load answer statistics
      const { data: answerData, error: answerError } = await supabase
        .from('answer_statistics')
        .select('*')
        .eq('question_id', questionId)
        .order('answer_label')

      if (answerError) throw answerError

      answerStats.value = answerData || []
    } catch (err) {
      console.error('Error loading question details:', err)
      statsError.value = `Failed to load question details: ${err.message}`
      throw err // Re-throw for navigation handling
    } finally {
      loadingStats.value = false
    }
  }

  /**
   * Get answer percentage for a specific answer
   * @param {number} guesses - Number of guesses for this answer
   * @returns {number} - Percentage
   */
  function getAnswerPercentage(guesses) {
    if (!selectedQuestionStats.value?.total_guesses) {
      return 0
    }
    return calculatePercentage(guesses, selectedQuestionStats.value.total_guesses)
  }

  /**
   * Clear quiz stats selection
   */
  function clearQuizStats() {
    selectedStatsQuizId.value = null
    selectedQuizStats.value = null
    questionStats.value = []
  }

  /**
   * Clear question detail selection
   */
  function clearQuestionDetail() {
    selectedQuestionId.value = null
    selectedQuestionStats.value = null
    answerStats.value = []
  }

  /**
   * Reset all statistics state
   */
  function resetStatistics() {
    allQuizStats.value = []
    selectedQuizStats.value = null
    questionStats.value = []
    selectedQuestionId.value = null
    selectedQuestionStats.value = null
    answerStats.value = []
    selectedStatsQuizId.value = null
    statsError.value = null
  }

  /**
   * Clear error message
   */
  function clearError() {
    statsError.value = null
  }

  return {
    // State
    allQuizStats,
    selectedQuizStats,
    questionStats,
    selectedQuestionId,
    selectedQuestionStats,
    answerStats,
    selectedStatsQuizId,
    loadingStats,
    statsError,

    // Computed
    totalSubmissions,
    overallAverageScore,
    hasQuizStats,
    hasQuestionStats,
    hasAnswerStats,

    // Methods
    loadAllQuizStats,
    loadQuizStats,
    loadQuestionDetail,
    getAnswerPercentage,
    getCorrectRateClass,
    clearQuizStats,
    clearQuestionDetail,
    resetStatistics,
    clearError,
  }
}
