<script setup>
/**
 * Quiz App - Main Application Component
 * Refactored to use Composition API and composables
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useAuth, useNavigation, useQuiz, useStatistics } from './composables'
import { VIEWS } from './utils/constants.js'
import { getCorrectRateClass } from './utils/questionTypes.js'

// UI Components
import { AppHeader, AppBreadcrumb, MessageAlert, LoadingSpinner, StatCard, ProgressBar } from './components/ui'

// Quiz Components
import { QuizSelector, QuizUpload, QuizQuestion, QuizNavigation, QuizResults, GuestNotice, GuestAccess } from './components/quiz'

// Stats Components
import { StatsOverview, QuizStatsList, QuestionStatsList, AnswerBreakdown } from './components/stats'

// Auth Components
import LoginForm from './components/LoginForm.vue'
import LeaderboardView from './components/LeaderboardView.vue'

// Composables
const auth = useAuth()
const navigation = useNavigation()
const quiz = useQuiz()
const statistics = useStatistics()

// Local state for login mode
const isLoginMode = ref(true)

// Computed properties
const showQuizNav = computed(() => {
  return navigation.currentView.value !== VIEWS.QUIZ || quiz.quizStarted.value || quiz.quizCompleted.value
})

const showLeaderboardNav = computed(() => {
  return navigation.currentView.value !== VIEWS.LEADERBOARD
})

const showStatsNav = computed(() => {
  return navigation.currentView.value !== VIEWS.STATS
})

const showBreadcrumb = computed(() => {
  return (auth.canAccessFeatures.value) && 
    (navigation.currentView.value !== VIEWS.QUIZ || quiz.quizStarted.value || quiz.quizCompleted.value)
})

const breadcrumbItems = computed(() => {
  return navigation.getBreadcrumbs({
    quizName: quiz.currentQuizName.value,
    selectedQuizStats: statistics.selectedQuizStats.value
  })
})

const combinedError = computed(() => {
  return quiz.quizError.value || statistics.statsError.value || null
})

const combinedSuccess = computed(() => {
  return quiz.quizSuccess.value || auth.authSuccess.value || null
})

// Navigation handlers
async function handleNavigateQuiz() {
  if (quiz.quizStarted.value || quiz.quizCompleted.value) {
    quiz.resetQuiz()
  }
  statistics.clearQuizStats()
  statistics.clearQuestionDetail()
  navigation.goToQuizPage()
  quiz.clearMessages()
}

async function handleNavigateLeaderboard() {
  if (quiz.quizStarted.value || quiz.quizCompleted.value) {
    quiz.resetQuiz()
  }
  navigation.goToLeaderboard()
  quiz.clearMessages()
}

async function handleNavigateStats() {
  if (quiz.quizStarted.value || quiz.quizCompleted.value) {
    quiz.resetQuiz()
  }
  navigation.goToStatsPage()
  quiz.clearMessages()
  await statistics.loadAllQuizStats()
}

async function handleViewQuizStats(quizId) {
  try {
    navigation.goToQuizStats()
    await statistics.loadQuizStats(quizId)
  } catch {
    navigation.goToStatsPage()
  }
}

async function handleViewQuestionDetail(questionId) {
  try {
    navigation.goToQuestionDetail()
    await statistics.loadQuestionDetail(questionId)
  } catch {
    navigation.goToQuizStats()
  }
}

// Quiz handlers
function handleQuizFileChange(event) {
  quiz.loadQuizFile(event)
}

function handleQuizNameUpdate(name) {
  quiz.uploadedQuizName.value = name
}

function handleQuizIdUpdate(id) {
  quiz.selectedQuizId.value = id
}

async function handleFinishQuiz() {
  await quiz.finishQuiz(auth.currentUser.value)
}

// Auth handlers
function handleLoginSuccess(user) {
  auth.handleLoginSuccess(user)
  isLoginMode.value = true
}

function handleLogout() {
  auth.handleLogout()
  handleNavigateQuiz()
}

function handleToggleAuthMode() {
  isLoginMode.value = !isLoginMode.value
}

function handleContinueAsGuest() {
  auth.continueAsGuest()
}

function handleGuestLogin() {
  handleNavigateQuiz()
  auth.clearGuestMode()
}

// Lifecycle
onMounted(() => {
  auth.initializeAuth()
  quiz.loadAvailableQuizzes()
  
  // Check for saved progress
  const savedProgress = quiz.loadProgress()
  if (savedProgress && savedProgress.questions?.length > 0) {
    const resumeQuiz = confirm('You have an unfinished quiz. Would you like to resume?')
    if (resumeQuiz) {
      quiz.questions.value = savedProgress.questions
      quiz.initializeQuiz()
    } else {
      quiz.clearProgress()
    }
  }
})
</script>

<template>
  <div class="container">
    <!-- Header -->
    <AppHeader
      :current-user="auth.currentUser.value"
      :show-quiz-nav="showQuizNav"
      :show-leaderboard-nav="showLeaderboardNav"
      :show-stats-nav="showStatsNav"
      @navigate-quiz="handleNavigateQuiz"
      @navigate-leaderboard="handleNavigateLeaderboard"
      @navigate-stats="handleNavigateStats"
      @logout="handleLogout"
    />

    <!-- Messages -->
    <MessageAlert v-if="combinedError" :message="combinedError" type="error" />
    <MessageAlert v-if="combinedSuccess" :message="combinedSuccess" type="success" />

    <!-- Login/Signup for non-authenticated users on home page -->
    <div v-if="!auth.currentUser.value && navigation.isQuizView.value && !quiz.quizStarted.value">
      <LoginForm
        :is-login="isLoginMode"
        @login-success="handleLoginSuccess"
        @toggle-mode="handleToggleAuthMode"
      />
      
      <GuestAccess @continue-as-guest="handleContinueAsGuest" />
    </div>

    <!-- Breadcrumb (shown when logged in or guest) -->
    <AppBreadcrumb 
      v-if="showBreadcrumb"
      :items="breadcrumbItems" 
    />

    <!-- Leaderboard View -->
    <LeaderboardView v-if="navigation.isLeaderboardView.value" />

    <!-- Statistics Overview Page -->
    <div v-if="navigation.isStatsView.value && !quiz.quizStarted.value">
      <h2>📊 Quiz Statistics</h2>
      
      <LoadingSpinner v-if="statistics.loadingStats.value" message="Loading statistics..." />
      
      <template v-else>
        <StatsOverview
          :total-quizzes="statistics.allQuizStats.value.length"
          :total-submissions="statistics.totalSubmissions.value"
          :average-score="statistics.overallAverageScore.value"
        />
        
        <QuizStatsList
          :quizzes="statistics.allQuizStats.value"
          @view-quiz="handleViewQuizStats"
        />
      </template>
    </div>

    <!-- Individual Quiz Statistics Page -->
    <div v-if="navigation.isQuizStatsView.value && !quiz.quizStarted.value">
      <LoadingSpinner v-if="statistics.loadingStats.value" message="Loading quiz statistics..." />
      
      <template v-else-if="statistics.selectedQuizStats.value">
        <h2>{{ statistics.selectedQuizStats.value.quiz_name }}</h2>
        
        <!-- Quiz Overview Stats -->
        <div class="stats-overview">
          <h3>Quiz Overview</h3>
          <div class="stats-grid">
            <StatCard 
              :value="statistics.selectedQuizStats.value.total_questions || 0" 
              label="Total Questions" 
            />
            <StatCard 
              :value="statistics.selectedQuizStats.value.total_submissions || 0" 
              label="Submissions" 
            />
            <StatCard 
              :value="`${statistics.selectedQuizStats.value.average_score || 0}%`" 
              label="Average Score" 
            />
            <StatCard 
              :value="`${statistics.selectedQuizStats.value.highest_score || 0}%`" 
              label="Highest Score" 
            />
            <StatCard 
              :value="`${statistics.selectedQuizStats.value.lowest_score || 0}%`" 
              label="Lowest Score" 
            />
          </div>
        </div>

        <QuestionStatsList
          :questions="statistics.questionStats.value"
          @view-question="handleViewQuestionDetail"
        />
      </template>
    </div>

    <!-- Question Detail View -->
    <div v-if="navigation.isQuestionDetailView.value">
      <LoadingSpinner v-if="statistics.loadingStats.value" message="Loading answer statistics..." />
      
      <template v-else-if="statistics.selectedQuestionStats.value">
        <h2>{{ statistics.selectedQuestionStats.value.question_text }}</h2>
        
        <!-- Question Overview Stats -->
        <div class="stats-overview">
          <h3>Overall Performance</h3>
          <div class="stats-grid">
            <StatCard 
              :value="statistics.selectedQuestionStats.value.total_guesses || 0" 
              label="Total Attempts" 
            />
            <StatCard 
              :value="statistics.selectedQuestionStats.value.correct_guesses || 0" 
              label="Correct Guesses"
              value-class="success-text"
            />
            <StatCard 
              :value="(statistics.selectedQuestionStats.value.total_guesses - statistics.selectedQuestionStats.value.correct_guesses) || 0" 
              label="Incorrect Guesses"
              value-class="error-text"
            />
            <StatCard 
              :value="`${statistics.selectedQuestionStats.value.correct_percentage || 0}%`" 
              label="Success Rate"
              :value-class="getCorrectRateClass(statistics.selectedQuestionStats.value.correct_percentage)"
            />
          </div>
        </div>

        <AnswerBreakdown
          :answers="statistics.answerStats.value"
          :total-guesses="statistics.selectedQuestionStats.value.total_guesses"
        />
      </template>
    </div>

    <!-- Quiz Selection (only when logged in or guest, on quiz view, not started) -->
    <template v-if="(auth.currentUser.value || auth.guestMode.value) && navigation.isQuizView.value && !quiz.quizStarted.value">
      <QuizSelector
        :quizzes="quiz.availableQuizzes.value"
        :selected-quiz-id="quiz.selectedQuizId.value"
        :loading="quiz.loadingQuizzes.value"
        @update:selected-quiz-id="handleQuizIdUpdate"
        @load-quiz="quiz.loadQuizFromDatabase"
      />

      <!-- File Upload (only for authenticated users) -->
      <QuizUpload
        v-if="auth.currentUser.value"
        :uploaded-quiz-name="quiz.uploadedQuizName.value"
        :has-uploaded-data="!!quiz.uploadedQuizData.value"
        @file-change="handleQuizFileChange"
        @update:uploaded-quiz-name="handleQuizNameUpdate"
        @save-quiz="quiz.saveUploadedQuizToDatabase"
      />

      <!-- Guest mode notice -->
      <GuestNotice
        v-if="auth.guestMode.value"
        @login="handleGuestLogin"
      />
    </template>

    <!-- Quiz In Progress -->
    <div v-if="quiz.quizStarted.value && !quiz.quizCompleted.value">
      <ProgressBar 
        :percentage="quiz.progressPercentage.value" 
        height="12px"
      />
      <div class="progress-text">
        Question {{ quiz.currentQuestionIndex.value + 1 }} of {{ quiz.questions.value.length }}
      </div>

      <QuizQuestion
        :question="quiz.currentQuestion.value"
        :question-index="quiz.currentQuestionIndex.value"
        :total-questions="quiz.questions.value.length"
        :selected-answer="quiz.userAnswers.value[quiz.currentQuestionIndex.value]"
        @select-answer="quiz.selectAnswer"
      />

      <QuizNavigation
        :is-first-question="quiz.isFirstQuestion.value"
        :is-last-question="quiz.isLastQuestion.value"
        :can-proceed="quiz.hasSelectedAnswer.value"
        @previous="quiz.previousQuestion"
        @next="quiz.nextQuestion"
        @finish="handleFinishQuiz"
      />
    </div>

    <!-- Results -->
    <QuizResults
      v-if="quiz.quizCompleted.value"
      :questions="quiz.questions.value"
      :user-answers="quiz.userAnswers.value"
      :correct-answers="quiz.correctAnswers.value"
      :score="quiz.score.value"
      :score-percentage="quiz.scorePercentage.value"
      :multiple-choice-score="quiz.multipleChoiceScore.value"
      :true-false-score="quiz.trueFalseScore.value"
      @reset="quiz.resetQuiz"
    />
  </div>
</template>

<style scoped>
.progress-text {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-weight: 500;
}

/* Statistics Layout */
.stats-overview {
  margin-bottom: 40px;
}

.stats-overview h3 {
  margin-bottom: 20px;
  color: #495057;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

h2 {
  color: #333;
  margin-bottom: 30px;
}
</style>
