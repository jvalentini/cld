/**
 * Navigation composable
 * Manages view state and navigation
 */

import { ref, computed } from 'vue'
import { VIEWS } from '../utils/constants.js'

// Shared reactive state
const currentView = ref(VIEWS.QUIZ)

/**
 * Navigation composable
 * @returns {Object} - Navigation state and methods
 */
export function useNavigation() {
  // Computed properties
  const isQuizView = computed(() => currentView.value === VIEWS.QUIZ)
  const isLeaderboardView = computed(() => currentView.value === VIEWS.LEADERBOARD)
  const isStatsView = computed(() => currentView.value === VIEWS.STATS)
  const isQuizStatsView = computed(() => currentView.value === VIEWS.QUIZ_STATS)
  const isQuestionDetailView = computed(() => currentView.value === VIEWS.QUESTION_DETAIL)

  /**
   * Navigate to quiz page
   */
  function goToQuizPage() {
    currentView.value = VIEWS.QUIZ
  }

  /**
   * Navigate to leaderboard page
   */
  function goToLeaderboard() {
    currentView.value = VIEWS.LEADERBOARD
  }

  /**
   * Navigate to stats page
   */
  function goToStatsPage() {
    currentView.value = VIEWS.STATS
  }

  /**
   * Navigate to quiz stats page
   */
  function goToQuizStats() {
    currentView.value = VIEWS.QUIZ_STATS
  }

  /**
   * Navigate to question detail page
   */
  function goToQuestionDetail() {
    currentView.value = VIEWS.QUESTION_DETAIL
  }

  /**
   * Navigate to a specific view
   * @param {string} view - View name from VIEWS constant
   */
  function navigateTo(view) {
    if (Object.values(VIEWS).includes(view)) {
      currentView.value = view
    } else {
      console.warn(`Invalid view: ${view}`)
    }
  }

  /**
   * Get breadcrumb items for current view
   * @param {Object} options - Options for breadcrumb generation
   * @returns {Array} - Array of breadcrumb items
   */
  function getBreadcrumbs(options = {}) {
    const { quizName, selectedQuizStats } = options
    const breadcrumbs = [{ label: 'Home', action: goToQuizPage }]

    switch (currentView.value) {
      case VIEWS.QUIZ:
        if (quizName) {
          breadcrumbs.push({ label: quizName, current: true })
        }
        break
      case VIEWS.STATS:
        breadcrumbs.push({ label: 'Statistics', current: true })
        break
      case VIEWS.LEADERBOARD:
        breadcrumbs.push({ label: 'Leaderboard', current: true })
        break
      case VIEWS.QUIZ_STATS:
        breadcrumbs.push({ label: 'Statistics', action: goToStatsPage })
        breadcrumbs.push({
          label: selectedQuizStats?.quiz_name || 'Quiz Details',
          current: true,
        })
        break
      case VIEWS.QUESTION_DETAIL:
        breadcrumbs.push({ label: 'Statistics', action: goToStatsPage })
        breadcrumbs.push({
          label: selectedQuizStats?.quiz_name || 'Quiz Details',
          action: goToQuizStats,
        })
        breadcrumbs.push({ label: 'Question Detail', current: true })
        break
    }

    return breadcrumbs
  }

  return {
    // State
    currentView,

    // Computed
    isQuizView,
    isLeaderboardView,
    isStatsView,
    isQuizStatsView,
    isQuestionDetailView,

    // Methods
    goToQuizPage,
    goToLeaderboard,
    goToStatsPage,
    goToQuizStats,
    goToQuestionDetail,
    navigateTo,
    getBreadcrumbs,
  }
}
