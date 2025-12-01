/**
 * Unit tests for Quiz App Vue component
 * Updated for refactored composable-based architecture
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { supabase } from '../src/supabaseClient'

// Mock Supabase client
vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}))

// Mock auth module
vi.mock('../src/auth', () => ({
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  getCurrentUser: vi.fn(() => null),
  hashPassword: vi.fn(async (pw) => `hashed_${pw}`),
  comparePassword: vi.fn(async () => true)
}))

// Helper to create a properly mocked Supabase chain
function createMockChain(resolvedValue = { data: [], error: null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue)
  }
  chain.order.mockResolvedValue(resolvedValue)
  chain.limit.mockResolvedValue(resolvedValue)
  return chain
}

// Setup default mock before each test
function setupDefaultMock() {
  const mockChain = createMockChain({ data: [], error: null })
  supabase.from.mockReturnValue(mockChain)
  supabase.rpc.mockResolvedValue({ data: null, error: null })
  return mockChain
}

// Mount helper with common stubs
function mountApp(options = {}) {
  return mount(App, {
    global: {
      stubs: {
        LeaderboardView: true,
        LoginForm: {
          template: '<div class="login-form-stub"></div>',
          props: ['isLogin'],
          emits: ['login-success', 'toggle-mode']
        }
      }
    },
    ...options
  })
}

describe('Quiz App', () => {
  let wrapper

  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    vi.clearAllMocks()
    setupDefaultMock()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Initial State', () => {
    it('should render the app header', async () => {
      wrapper = mountApp()
      await flushPromises()
      expect(wrapper.find('h1').text()).toBe('📝 Quiz App')
    })

    it('should show login form initially when not authenticated', async () => {
      wrapper = mountApp()
      await flushPromises()
      expect(wrapper.find('.login-form-stub').exists()).toBe(true)
    })

    it('should not show quiz or results initially', async () => {
      wrapper = mountApp()
      await flushPromises()
      expect(wrapper.find('.question-card').exists()).toBe(false)
      expect(wrapper.find('.results').exists()).toBe(false)
    })
  })

  describe('Guest Mode', () => {
    it('should enable guest mode when continuing as guest', async () => {
      wrapper = mountApp()
      await flushPromises()
      
      const guestButton = wrapper.find('.guest-access .btn-secondary')
      await guestButton.trigger('click')
      await flushPromises()
      
      // Should now show quiz selector
      expect(wrapper.find('.quiz-selector').exists()).toBe(true)
    })
  })

  describe('Database Quiz Loading', () => {
    it('should load available quizzes on mount', async () => {
      wrapper = mountApp()
      await flushPromises()
      expect(supabase.from).toHaveBeenCalledWith('quizzes')
    })
  })
})

// Test composables individually
describe('Composables', () => {
  describe('useQuiz', () => {
    let useQuiz

    beforeEach(async () => {
      vi.clearAllMocks()
      setupDefaultMock()
      // Import the composable fresh for each test
      const module = await import('../src/composables/useQuiz.js')
      useQuiz = module.useQuiz
    })

    it('should initialize with empty state', () => {
      const quiz = useQuiz()
      expect(quiz.questions.value).toEqual([])
      expect(quiz.quizStarted.value).toBe(false)
      expect(quiz.quizCompleted.value).toBe(false)
    })

    it('should calculate progress percentage correctly', () => {
      const quiz = useQuiz()
      quiz.questions.value = [
        { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
      ]
      quiz.currentQuestionIndex.value = 0
      
      expect(quiz.progressPercentage.value).toBe(50)
      
      quiz.currentQuestionIndex.value = 1
      expect(quiz.progressPercentage.value).toBe(100)
    })

    it('should calculate score correctly', () => {
      const quiz = useQuiz()
      quiz.questions.value = [
        { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
      ]
      quiz.correctAnswers.value = [1, 0]
      quiz.userAnswers.value = [1, 1] // First correct, second wrong
      
      expect(quiz.score.value).toBe(1)
      expect(quiz.scorePercentage.value).toBe(50)
    })

    it('should navigate questions correctly', () => {
      const quiz = useQuiz()
      quiz.questions.value = [
        { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
      ]
      quiz.userAnswers.value = [null, null]
      quiz.currentQuestionIndex.value = 0
      
      // Should not go below 0
      quiz.previousQuestion()
      expect(quiz.currentQuestionIndex.value).toBe(0)
      
      // Should advance
      quiz.nextQuestion()
      expect(quiz.currentQuestionIndex.value).toBe(1)
      
      // Should not go past end
      quiz.nextQuestion()
      expect(quiz.currentQuestionIndex.value).toBe(1)
    })

    it('should select answers correctly', () => {
      const quiz = useQuiz()
      quiz.questions.value = [
        { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }
      ]
      quiz.userAnswers.value = [null]
      quiz.currentQuestionIndex.value = 0
      
      quiz.selectAnswer(2)
      
      expect(quiz.userAnswers.value[0]).toBe(2)
    })

    it('should reset quiz state', () => {
      const quiz = useQuiz()
      quiz.questions.value = [{ question: 'Q1', answers: ['A', 'B'], type: 'true_false' }]
      quiz.quizStarted.value = true
      quiz.quizCompleted.value = true
      quiz.currentQuizId.value = 1
      
      quiz.resetQuiz()
      
      expect(quiz.questions.value).toEqual([])
      expect(quiz.quizStarted.value).toBe(false)
      expect(quiz.quizCompleted.value).toBe(false)
      expect(quiz.currentQuizId.value).toBeNull()
    })
  })

  describe('useStatistics', () => {
    let useStatistics

    beforeEach(async () => {
      vi.clearAllMocks()
      setupDefaultMock()
      const module = await import('../src/composables/useStatistics.js')
      useStatistics = module.useStatistics
    })

    it('should initialize with empty state', () => {
      const stats = useStatistics()
      expect(stats.allQuizStats.value).toEqual([])
      expect(stats.loadingStats.value).toBe(false)
    })

    it('should calculate total submissions correctly', () => {
      const stats = useStatistics()
      stats.allQuizStats.value = [
        { total_submissions: 10 },
        { total_submissions: 15 },
        { total_submissions: 20 }
      ]
      
      expect(stats.totalSubmissions.value).toBe(45)
    })

    it('should calculate weighted average score correctly', () => {
      const stats = useStatistics()
      stats.allQuizStats.value = [
        { average_score: 80, total_submissions: 10 },
        { average_score: 70, total_submissions: 10 },
        { average_score: 90, total_submissions: 10 }
      ]
      
      expect(stats.overallAverageScore.value).toBe(80)
    })

    it('should return 0 for average when no submissions', () => {
      const stats = useStatistics()
      stats.allQuizStats.value = []
      
      expect(stats.overallAverageScore.value).toBe(0)
    })
  })

  describe('useNavigation', () => {
    let useNavigation

    beforeEach(async () => {
      const module = await import('../src/composables/useNavigation.js')
      useNavigation = module.useNavigation
    })

    it('should initialize with quiz view', () => {
      const nav = useNavigation()
      expect(nav.isQuizView.value).toBe(true)
    })

    it('should navigate to different views', () => {
      const nav = useNavigation()
      
      nav.goToLeaderboard()
      expect(nav.isLeaderboardView.value).toBe(true)
      
      nav.goToStatsPage()
      expect(nav.isStatsView.value).toBe(true)
      
      nav.goToQuizPage()
      expect(nav.isQuizView.value).toBe(true)
    })
  })
})

// Test utility functions
describe('Utility Functions', () => {
  describe('questionTypes', () => {
    let questionTypes

    beforeEach(async () => {
      questionTypes = await import('../src/utils/questionTypes.js')
    })

    it('should detect true/false questions', () => {
      expect(questionTypes.detectQuestionType(['True', 'False'])).toBe('true_false')
      expect(questionTypes.detectQuestionType(['A', 'B', 'C', 'D'])).toBe('multiple_choice')
    })

    it('should get correct answer labels', () => {
      const mcQuestion = { type: 'multiple_choice' }
      const tfQuestion = { type: 'true_false' }
      
      expect(questionTypes.getAnswerLabel(0, mcQuestion)).toBe('A')
      expect(questionTypes.getAnswerLabel(1, mcQuestion)).toBe('B')
      expect(questionTypes.getAnswerLabel(0, tfQuestion)).toBe('T')
      expect(questionTypes.getAnswerLabel(1, tfQuestion)).toBe('F')
    })

    it('should classify correct rates', () => {
      expect(questionTypes.getCorrectRateClass(85)).toBe('high')
      expect(questionTypes.getCorrectRateClass(100)).toBe('high')
      expect(questionTypes.getCorrectRateClass(70)).toBe('medium')
      expect(questionTypes.getCorrectRateClass(50)).toBe('medium')
      expect(questionTypes.getCorrectRateClass(30)).toBe('low')
      expect(questionTypes.getCorrectRateClass(0)).toBe('low')
    })

    it('should validate question structure', () => {
      const validMC = {
        question: 'Test?',
        answers: ['A', 'B', 'C', 'D'],
        type: 'multiple_choice'
      }
      const validTF = {
        question: 'True?',
        answers: ['True', 'False'],
        type: 'true_false'
      }
      const invalidMC = {
        question: 'Test?',
        answers: ['A', 'B'],
        type: 'multiple_choice'
      }
      
      expect(questionTypes.validateQuestion(validMC, 0).valid).toBe(true)
      expect(questionTypes.validateQuestion(validTF, 0).valid).toBe(true)
      expect(questionTypes.validateQuestion(invalidMC, 0).valid).toBe(false)
    })

    it('should calculate scores by type', () => {
      const questions = [
        { type: 'multiple_choice' },
        { type: 'multiple_choice' },
        { type: 'true_false' }
      ]
      const userAnswers = [1, 2, 0]
      const correctAnswers = [1, 0, 0]
      
      const mcScore = questionTypes.calculateScoreByType(
        questions, userAnswers, correctAnswers, 'multiple_choice'
      )
      expect(mcScore.total).toBe(2)
      expect(mcScore.correct).toBe(1)
      
      const tfScore = questionTypes.calculateScoreByType(
        questions, userAnswers, correctAnswers, 'true_false'
      )
      expect(tfScore.total).toBe(1)
      expect(tfScore.correct).toBe(1)
    })
  })

  describe('formatters', () => {
    let formatters

    beforeEach(async () => {
      formatters = await import('../src/utils/formatters.js')
    })

    it('should format dates correctly', () => {
      expect(formatters.formatDate(null)).toBe('N/A')
      // Use a full ISO date to avoid timezone issues
      const result = formatters.formatDate('2024-01-15T12:00:00Z')
      expect(result).toMatch(/Jan \d+, 2024/)
    })

    it('should calculate percentages correctly', () => {
      expect(formatters.calculatePercentage(50, 100)).toBe(50)
      expect(formatters.calculatePercentage(1, 3)).toBe(33)
      expect(formatters.calculatePercentage(0, 100)).toBe(0)
      expect(formatters.calculatePercentage(10, 0)).toBe(0)
    })
  })
})

// Test file upload validation
describe('File Upload Validation', () => {
  let useQuiz

  beforeEach(async () => {
    vi.clearAllMocks()
    setupDefaultMock()
    const module = await import('../src/composables/useQuiz.js')
    useQuiz = module.useQuiz
  })

  it('should validate JSON structure', async () => {
    const quiz = useQuiz()
    
    // Invalid structure - missing question and answers properties
    const invalidJson = '[{"invalid": "structure"}]'
    const file = new File([invalidJson], 'test.json', { type: 'application/json' })
    
    await quiz.loadQuizFile({ target: { files: [file] } })
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Should have an error (exact message may vary based on validation)
    expect(quiz.quizError.value).not.toBeNull()
    expect(quiz.quizError.value).toContain('Failed to load quiz file')
  })

  it('should load valid quiz with correct_answer field', async () => {
    const quiz = useQuiz()
    
    const validJson = JSON.stringify([
      {
        question: 'Test question?',
        answers: ['A', 'B', 'C', 'D'],
        type: 'multiple_choice',
        correct_answer: 2
      }
    ])
    
    const file = new File([validJson], 'test.json', { type: 'application/json' })
    await quiz.loadQuizFile({ target: { files: [file] } })
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(quiz.uploadedQuizData.value).not.toBeNull()
    expect(quiz.uploadedQuizData.value.length).toBe(1)
  })

  it('should validate multiple choice has 4 answers', async () => {
    const quiz = useQuiz()
    
    const invalidJson = JSON.stringify([
      {
        question: 'Test question?',
        answers: ['A', 'B'],
        type: 'multiple_choice'
      }
    ])
    
    const file = new File([invalidJson], 'test.json', { type: 'application/json' })
    await quiz.loadQuizFile({ target: { files: [file] } })
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(quiz.quizError.value).toContain('must have exactly 4 answers')
  })

  it('should validate true/false has 2 answers', async () => {
    const quiz = useQuiz()
    
    const invalidJson = JSON.stringify([
      {
        question: 'Test question?',
        answers: ['True', 'False', 'Maybe'],
        type: 'true_false'
      }
    ])
    
    const file = new File([invalidJson], 'test.json', { type: 'application/json' })
    await quiz.loadQuizFile({ target: { files: [file] } })
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(quiz.quizError.value).toContain('must have exactly 2 answers')
  })

  it('should auto-detect true/false question type', async () => {
    const quiz = useQuiz()
    
    const validJson = JSON.stringify([
      {
        question: 'Is this true?',
        answers: ['True', 'False']
      }
    ])
    
    const file = new File([validJson], 'test.json', { type: 'application/json' })
    await quiz.loadQuizFile({ target: { files: [file] } })
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(quiz.uploadedQuizData.value[0].type).toBe('true_false')
  })

  it('should show error for empty quiz array', async () => {
    const quiz = useQuiz()
    
    const emptyJson = JSON.stringify([])
    const file = new File([emptyJson], 'test.json', { type: 'application/json' })
    
    await quiz.loadQuizFile({ target: { files: [file] } })
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(quiz.quizError.value).toContain('expected an array of questions')
  })
})

// Test LocalStorage Integration
describe('LocalStorage Integration', () => {
  let useQuiz

  beforeEach(async () => {
    localStorage.clear()
    vi.clearAllMocks()
    setupDefaultMock()
    const module = await import('../src/composables/useQuiz.js')
    useQuiz = module.useQuiz
  })

  it('should save progress on answer selection', () => {
    const quiz = useQuiz()
    quiz.questions.value = [
      { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }
    ]
    quiz.userAnswers.value = [null]
    quiz.currentQuestionIndex.value = 0
    
    quiz.selectAnswer(2)
    
    const saved = localStorage.getItem('quizProgress')
    expect(saved).not.toBeNull()
    
    const parsed = JSON.parse(saved)
    expect(parsed.userAnswers[0]).toBe(2)
  })

  it('should clear localStorage on reset', () => {
    const quiz = useQuiz()
    localStorage.setItem('quizProgress', JSON.stringify({ test: 'data' }))
    
    quiz.clearProgress()
    
    expect(localStorage.getItem('quizProgress')).toBeNull()
  })
})
