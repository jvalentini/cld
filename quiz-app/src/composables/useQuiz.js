/**
 * Quiz composable
 * Manages quiz state, navigation, and scoring
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../supabaseClient.js'
import { STORAGE_KEYS, QUESTION_TYPES } from '../utils/constants.js'
import {
  getAnswerLabel as getLabel,
  calculateScoreByType,
  detectQuestionType,
  validateQuestion,
} from '../utils/questionTypes.js'

// Shared reactive state
const questions = ref([])
const questionIds = ref([])
const answerIds = ref([])
const userAnswers = ref([])
const correctAnswers = ref([])
const currentQuestionIndex = ref(0)
const quizStarted = ref(false)
const quizCompleted = ref(false)
const currentQuizId = ref(null)
const currentQuizName = ref('')

// Quiz selection state
const availableQuizzes = ref([])
const selectedQuizId = ref('')
const loadingQuizzes = ref(false)

// File upload state
const uploadedQuizName = ref('')
const uploadedQuizData = ref(null)

// Error/success state
const quizError = ref(null)
const quizSuccess = ref(null)

// Realtime subscription state
let messageSubscription = null
let subscriptionCount = 0

/**
 * Load available quizzes from database
 */
async function loadAvailableQuizzes() {
  loadingQuizzes.value = true
  quizError.value = null

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, name, description')
      .order('name')

    if (error) throw error

    availableQuizzes.value = data
    console.log('Loaded quizzes:', data.length)
  } catch (err) {
    console.error('Error loading quizzes:', err)
    quizError.value =
      'Failed to load quizzes from database. Please check your Supabase connection.'
  } finally {
    loadingQuizzes.value = false
  }
}

/**
 * Subscribe to Supabase Realtime updates for quizzes
 */
function subscribeToQuizzes() {
  subscriptionCount++
  if (messageSubscription) return

  console.log('Subscribing to quiz updates...')
  messageSubscription = supabase
    .channel('public:quizzes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, (payload) => {
      console.log('Quiz update received:', payload)
      // Refresh the quiz list
      loadAvailableQuizzes()
    })
    .subscribe()
}

/**
 * Unsubscribe from quiz updates
 */
function unsubscribeFromQuizzes() {
  subscriptionCount--
  if (subscriptionCount <= 0 && messageSubscription) {
    console.log('Unsubscribing from quiz updates...')
    supabase.removeChannel(messageSubscription)
    messageSubscription = null
    subscriptionCount = 0
  }
}

/**
 * Quiz composable
 * @returns {Object} - Quiz state and methods
 */
export function useQuiz() {
  // Computed properties
  const currentQuestion = computed(() => {
    return questions.value[currentQuestionIndex.value] || {}
  })

  const progressPercentage = computed(() => {
    if (questions.value.length === 0) return 0
    return ((currentQuestionIndex.value + 1) / questions.value.length) * 100
  })

  const score = computed(() => {
    return userAnswers.value.filter((answer, index) => answer === correctAnswers.value[index])
      .length
  })

  const scorePercentage = computed(() => {
    if (questions.value.length === 0) return 0
    return Math.round((score.value / questions.value.length) * 100)
  })

  const multipleChoiceScore = computed(() => {
    return calculateScoreByType(
      questions.value,
      userAnswers.value,
      correctAnswers.value,
      QUESTION_TYPES.MULTIPLE_CHOICE
    )
  })

  const trueFalseScore = computed(() => {
    return calculateScoreByType(
      questions.value,
      userAnswers.value,
      correctAnswers.value,
      QUESTION_TYPES.TRUE_FALSE
    )
  })

  const isFirstQuestion = computed(() => currentQuestionIndex.value === 0)
  const isLastQuestion = computed(() => currentQuestionIndex.value === questions.value.length - 1)
  const hasSelectedAnswer = computed(() => userAnswers.value[currentQuestionIndex.value] !== null)

  // Methods


  /**
   * Load quiz from database
   */
  async function loadQuizFromDatabase() {
    if (!selectedQuizId.value) return

    quizError.value = null

    try {
      // Load quiz name first
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('name')
        .eq('id', selectedQuizId.value)
        .single()

      if (quizError) throw quizError
      currentQuizName.value = quiz.name

      // Load questions
      const { data: questionsData, error: qError } = await supabase
        .from('questions')
        .select('id, question_text, question_type, order_index, correct_answer_id')
        .eq('quiz_id', selectedQuizId.value)
        .order('order_index')

      if (qError) throw qError
      if (!questionsData || questionsData.length === 0) {
        throw new Error('No questions found for this quiz')
      }

      // Load answers for all questions
      const { data: answersData, error: aError } = await supabase
        .from('answers')
        .select('id, question_id, answer_text, answer_label')
        .in(
          'question_id',
          questionsData.map(q => q.id)
        )
        .order('answer_label')

      if (aError) throw aError

      // Group answers by question
      const answersByQuestion = {}
      const answerIdsByQuestion = {}
      answersData.forEach(ans => {
        if (!answersByQuestion[ans.question_id]) {
          answersByQuestion[ans.question_id] = []
          answerIdsByQuestion[ans.question_id] = []
        }
        answersByQuestion[ans.question_id].push(ans.answer_text)
        answerIdsByQuestion[ans.question_id].push(ans.id)
      })

      // Build quiz data
      questions.value = questionsData.map(q => ({
        question: q.question_text,
        answers: answersByQuestion[q.id] || [],
        type: q.question_type,
      }))

      questionIds.value = questionsData.map(q => q.id)
      answerIds.value = questionsData.map(q => answerIdsByQuestion[q.id] || [])
      correctAnswers.value = questionsData.map((q, idx) => {
        const correctAnswerId = q.correct_answer_id
        return answerIds.value[idx].indexOf(correctAnswerId)
      })

      currentQuizId.value = selectedQuizId.value
      initializeQuiz()
    } catch (err) {
      console.error('Error loading quiz:', err)
      quizError.value = `Failed to load quiz: ${err.message}`
    }
  }

  /**
   * Load quiz from file
   * @param {Event} event - File input change event
   */
  async function loadQuizFile(event) {
    const file = event.target.files[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('Loading file:', file.name)
    const reader = new FileReader()

    reader.onerror = e => {
      console.error('FileReader error:', e)
      quizError.value = 'Failed to read the file.'
    }

    reader.onload = async e => {
      try {
        console.log('File content:', e.target.result)
        const data = JSON.parse(e.target.result)
        console.log('Parsed data:', data)

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid quiz format: expected an array of questions')
        }

        // Validate and process each question
        for (let i = 0; i < data.length; i++) {
          // Detect question type if not specified
          if (!data[i].type) {
            data[i].type = detectQuestionType(data[i].answers)
          }

          const validation = validateQuestion(data[i], i)
          if (!validation.valid) {
            throw new Error(validation.error)
          }
        }

        uploadedQuizData.value = data
        uploadedQuizName.value = file.name.replace('.json', '')
        quizError.value = null
        quizSuccess.value =
          "Quiz loaded! Enter a name and click 'Save Quiz to Database' to save it."
      } catch (err) {
        console.error('Parse error:', err)
        quizError.value = `Failed to load quiz file: ${err.message}`
      }
    }

    reader.readAsText(file)
  }

  /**
   * Save uploaded quiz to database
   */
  async function saveUploadedQuizToDatabase() {
    if (!uploadedQuizData.value || !uploadedQuizName.value) {
      quizError.value = 'Please load a quiz file and enter a name first.'
      return
    }

    quizError.value = null
    quizSuccess.value = 'Saving quiz to database...'

    try {
      // Create quiz record
      const { data: quiz, error: quizErr } = await supabase
        .from('quizzes')
        .insert({
          name: uploadedQuizName.value,
          description: 'Uploaded from JSON file',
        })
        .select()
        .single()

      if (quizErr) throw quizErr

      const quizId = quiz.id
      currentQuizId.value = quizId

      // Create questions and answers
      const questionPromises = uploadedQuizData.value.map(async (q, index) => {
        const { data: question, error: qError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quizId,
            question_text: q.question,
            question_type: q.type,
            order_index: index + 1,
          })
          .select()
          .single()

        if (qError) throw qError

        // Insert answers
        const labels = q.type === QUESTION_TYPES.TRUE_FALSE ? ['T', 'F'] : ['A', 'B', 'C', 'D']

        const answerPromises = q.answers.map(async (ans, ansIndex) => {
          const { data, error } = await supabase
            .from('answers')
            .insert({
              question_id: question.id,
              answer_text: ans,
              answer_label: labels[ansIndex],
              guesses: 0,
            })
            .select()
            .single()

          if (error) {
            console.error('Answer insert error:', error)
            throw new Error(`Failed to insert answer: ${error.message}`)
          }

          return { data, error }
        })

        const answerResults = await Promise.all(answerPromises)
        const answerData = answerResults.map(r => r.data)

        // Set correct answer if available
        if (q.correct_answer !== undefined && answerData[q.correct_answer]) {
          const correctAnswerId = answerData[q.correct_answer].id
          await supabase
            .from('questions')
            .update({ correct_answer_id: correctAnswerId })
            .eq('id', question.id)
        }

        return { question, answers: answerData }
      })

      const results = await Promise.all(questionPromises)

      // Build local quiz data
      questions.value = uploadedQuizData.value
      currentQuizName.value = uploadedQuizName.value
      questionIds.value = results.map(r => r.question.id)
      answerIds.value = results.map(r => r.answers.map(a => a.id))

      // Set correct answers from JSON if available
      correctAnswers.value = questions.value.map(q => {
        if (q.correct_answer !== undefined) {
          return q.correct_answer
        }
        return Math.floor(Math.random() * (q.type === QUESTION_TYPES.TRUE_FALSE ? 2 : 4))
      })

      quizSuccess.value = `Quiz "${uploadedQuizName.value}" saved to database successfully with ${results.length} questions!`

      initializeQuiz()
      await loadAvailableQuizzes()
    } catch (err) {
      console.error('Error saving quiz:', err)
      handleSaveError(err)
    }
  }

  /**
   * Handle save error with detailed message
   * @param {Error} err - Error object
   */
  function handleSaveError(err) {
    if (err.message?.includes('row-level security policy')) {
      quizError.value = `Database security error: Row Level Security (RLS) is blocking the insert.`
    } else if (err.message?.includes('Failed to insert answer')) {
      quizError.value = `Failed to insert answers: ${err.message}`
    } else {
      quizError.value = `Failed to save quiz to database: ${err.message}`
    }
  }

  /**
   * Initialize quiz for playing
   */
  function initializeQuiz() {
    const savedProgress = loadProgress()

    if (savedProgress && savedProgress.questions.length === questions.value.length) {
      userAnswers.value = savedProgress.userAnswers
      currentQuestionIndex.value = savedProgress.currentQuestionIndex
    } else {
      userAnswers.value = new Array(questions.value.length).fill(null)
      currentQuestionIndex.value = 0
    }

    quizStarted.value = true
    quizError.value = null
  }

  /**
   * Select an answer for current question
   * @param {number} answerIndex - Selected answer index
   */
  function selectAnswer(answerIndex) {
    userAnswers.value[currentQuestionIndex.value] = answerIndex
    saveProgress()
  }

  /**
   * Go to next question
   */
  function nextQuestion() {
    if (currentQuestionIndex.value < questions.value.length - 1) {
      currentQuestionIndex.value++
      saveProgress()
    }
  }

  /**
   * Go to previous question
   */
  function previousQuestion() {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--
      saveProgress()
    }
  }

  /**
   * Finish the quiz and save results
   * @param {Object} currentUser - Current user object (optional)
   */
  async function finishQuiz(currentUser = null) {
    quizCompleted.value = true

    if (currentQuizId.value) {
      try {
        const correctCount = score.value
        const totalQuestions = questions.value.length

        const submissionData = {
          quiz_id: currentQuizId.value,
          correct_answers: correctCount,
          total_questions: totalQuestions,
        }

        if (currentUser?.userId) {
          submissionData.user_id = currentUser.userId
          console.log('Saving submission with user_id:', currentUser.userId)
        } else {
          console.log('Saving submission without user_id (guest or not logged in)')
        }

        console.log('Submission data:', submissionData)

        const { data: submissionResult, error: submissionError } = await supabase
          .from('submissions')
          .insert(submissionData)
          .select()

        if (submissionError) {
          console.error('Error saving submission:', submissionError)
          quizError.value =
            'Quiz completed, but failed to save submission: ' + submissionError.message
        } else {
          console.log('Submission saved successfully:', submissionResult)
          if (currentUser) {
            quizSuccess.value = 'Your score has been recorded on the leaderboard!'
          }
        }

        // Increment guess counts
        await incrementAnswerGuesses()
      } catch (err) {
        console.error('Error saving quiz results:', err)
        quizError.value = 'Quiz completed, but failed to save statistics.'
      }
    }

    clearProgress()
  }

  /**
   * Increment guess counts for user answers
   */
  async function incrementAnswerGuesses() {
    for (let i = 0; i < userAnswers.value.length; i++) {
      const answerIndex = userAnswers.value[i]
      if (answerIndex !== null && answerIds.value[i]?.[answerIndex]) {
        const answerId = answerIds.value[i][answerIndex]

        const { error: guessError } = await supabase.rpc('increment_answer_guess', {
          answer_id: answerId,
        })

        if (guessError) {
          console.error('Error incrementing guess for answer:', answerId, guessError)
        }
      }
    }
  }

  /**
   * Reset quiz to initial state
   */
  function resetQuiz() {
    questions.value = []
    questionIds.value = []
    answerIds.value = []
    userAnswers.value = []
    correctAnswers.value = []
    currentQuestionIndex.value = 0
    quizCompleted.value = false
    quizStarted.value = false
    currentQuizId.value = null
    currentQuizName.value = ''
    selectedQuizId.value = ''
    uploadedQuizName.value = ''
    uploadedQuizData.value = null
    quizError.value = null
    quizSuccess.value = null
    clearProgress()
    loadAvailableQuizzes()
  }

  /**
   * Save progress to localStorage
   */
  function saveProgress() {
    const progress = {
      questions: questions.value,
      userAnswers: userAnswers.value,
      currentQuestionIndex: currentQuestionIndex.value,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEYS.QUIZ_PROGRESS, JSON.stringify(progress))
  }

  /**
   * Load progress from localStorage
   * @returns {Object|null} - Saved progress or null
   */
  function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEYS.QUIZ_PROGRESS)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * Clear progress from localStorage
   */
  function clearProgress() {
    localStorage.removeItem(STORAGE_KEYS.QUIZ_PROGRESS)
  }

  /**
   * Get answer label for display
   * @param {number} index - Answer index
   * @returns {string} - Answer label
   */
  function getAnswerLabel(index) {
    return getLabel(index, currentQuestion.value)
  }

  /**
   * Get answer label for results
   * @param {Object} question - Question object
   * @param {number} qIndex - Question index
   * @param {boolean} useCorrect - Whether to use correct answer
   * @returns {string} - Answer label
   */
  function getAnswerLabelForResult(question, qIndex, useCorrect = false) {
    const answerIndex = useCorrect ? correctAnswers.value[qIndex] : userAnswers.value[qIndex]
    return getLabel(answerIndex, question)
  }

  /**
   * Clear error and success messages
   */
  function clearMessages() {
    quizError.value = null
    quizSuccess.value = null
  }

  return {
    // State
    questions,
    questionIds,
    answerIds,
    userAnswers,
    correctAnswers,
    currentQuestionIndex,
    quizStarted,
    quizCompleted,
    currentQuizId,
    currentQuizName,
    availableQuizzes,
    selectedQuizId,
    loadingQuizzes,
    uploadedQuizName,
    uploadedQuizData,
    quizError,
    quizSuccess,

    // Computed
    currentQuestion,
    progressPercentage,
    score,
    scorePercentage,
    multipleChoiceScore,
    trueFalseScore,
    isFirstQuestion,
    isLastQuestion,
    hasSelectedAnswer,

    // Methods
    loadAvailableQuizzes,
    loadQuizFromDatabase,
    loadQuizFile,
    saveUploadedQuizToDatabase,
    initializeQuiz,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    finishQuiz,
    resetQuiz,
    saveProgress,
    loadProgress,
    clearProgress,
    getAnswerLabel,
    getAnswerLabelForResult,
    clearMessages,
  }
}

