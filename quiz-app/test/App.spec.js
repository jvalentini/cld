/**
 * Unit tests for Quiz App Vue component
 * Updated with comprehensive tests for database integration, statistics, and submissions
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import App from '../src/App.vue';
import { supabase } from '../src/supabaseClient';

// Mock Supabase client
vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

// Mock auth module
vi.mock('../src/auth', () => ({
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
  getCurrentUser: vi.fn(() => null)
}));

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
    single: vi.fn().mockResolvedValue(resolvedValue),
  };
  chain.order.mockResolvedValue(resolvedValue);
  return chain;
}

// Setup default mock before each test
function setupDefaultMock() {
  const mockChain = createMockChain({ data: [], error: null });
  supabase.from.mockReturnValue(mockChain);
  supabase.rpc.mockResolvedValue({ data: null, error: null });
  return mockChain;
}

describe('Quiz App', () => {
  let wrapper;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.clearAllMocks();
    setupDefaultMock();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Initial State', () => {
    it('should render the quiz selector initially', async () => {
      wrapper = mount(App);
      await flushPromises();
      expect(wrapper.find('.quiz-selector').exists()).toBe(true);
      expect(wrapper.find('h1').text()).toBe('📝 Quiz App');
    });

    it('should show navigation buttons', async () => {
      wrapper = mount(App);
      await flushPromises();
      const navButtons = wrapper.findAll('.btn-nav');
      expect(navButtons.length).toBeGreaterThan(0);
    });

    it('should not show quiz or results initially', async () => {
      wrapper = mount(App);
      await flushPromises();
      expect(wrapper.find('.question-card').exists()).toBe(false);
      expect(wrapper.find('.results').exists()).toBe(false);
    });

    it('should initialize with quiz view', async () => {
      wrapper = mount(App);
      await flushPromises();
      expect(wrapper.vm.currentView).toBe('quiz');
    });
  });

  describe('View Navigation', () => {
    it('should navigate to statistics page', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const mockStatsChain = createMockChain({ data: [], error: null });
      supabase.from.mockReturnValue(mockStatsChain);
      
      await wrapper.vm.goToStatsPage();
      await flushPromises();
      
      expect(wrapper.vm.currentView).toBe('stats');
      expect(supabase.from).toHaveBeenCalledWith('quiz_statistics');
    });

    it('should navigate back to quiz page from stats', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      // First navigate to stats
      await wrapper.setData({ currentView: 'stats' });
      
      // Then navigate back
      await wrapper.vm.goToQuizPage();
      await flushPromises();
      
      expect(wrapper.vm.currentView).toBe('quiz');
    });

    it('should navigate to leaderboard', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.vm.goToLeaderboard();
      await flushPromises();
      
      expect(wrapper.vm.currentView).toBe('leaderboard');
    });
  });

  describe('Guest Mode and Authentication', () => {
    it('should enable guest mode when continuing as guest', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      wrapper.vm.continueAsGuest();
      await flushPromises();
      
      expect(wrapper.vm.guestMode).toBe(true);
    });

    it('should clear guest mode on login success', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({ guestMode: true });
      
      wrapper.vm.handleLoginSuccess({
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        full_name: 'Test User'
      });
      await flushPromises();
      
      expect(wrapper.vm.guestMode).toBe(false);
      expect(wrapper.vm.currentUser).not.toBeNull();
      expect(wrapper.vm.currentUser.username).toBe('testuser');
    });

    it('should set current user on login success', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      wrapper.vm.handleLoginSuccess({
        id: 42,
        username: 'john_doe',
        email: 'john@example.com',
        full_name: 'John Doe'
      });
      await flushPromises();
      
      expect(wrapper.vm.currentUser.userId).toBe(42);
      expect(wrapper.vm.currentUser.username).toBe('john_doe');
      expect(wrapper.vm.currentUser.fullName).toBe('John Doe');
    });

    it('should clear user state on logout', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        currentUser: { userId: 1, username: 'test' },
        guestMode: true
      });
      
      wrapper.vm.handleLogout();
      await flushPromises();
      
      expect(wrapper.vm.currentUser).toBeNull();
      expect(wrapper.vm.guestMode).toBe(false);
    });
  });

  describe('Database Quiz Loading', () => {
    it('should load available quizzes on mount', async () => {
      wrapper = mount(App);
      await flushPromises();
      expect(supabase.from).toHaveBeenCalledWith('quizzes');
    });

    it('should load quiz from database', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const mockQuiz = { name: 'Test Quiz' };
      const mockQuestions = [
        {
          id: 1,
          quiz_id: 1,
          question_text: 'Test question?',
          question_type: 'multiple_choice',
          order_index: 1,
          correct_answer_id: 2
        }
      ];
      const mockAnswers = [
        { id: 1, question_id: 1, answer_text: 'A', answer_label: 'A' },
        { id: 2, question_id: 1, answer_text: 'B', answer_label: 'B' },
        { id: 3, question_id: 1, answer_text: 'C', answer_label: 'C' },
        { id: 4, question_id: 1, answer_text: 'D', answer_label: 'D' }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'quizzes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockQuiz, error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null })
          };
        }
        if (table === 'answers') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAnswers, error: null })
          };
        }
        return createMockChain();
      });

      await wrapper.setData({ selectedQuizId: 1 });
      await wrapper.vm.loadQuizFromDatabase();
      await flushPromises();
      
      expect(wrapper.vm.questions.length).toBe(1);
      expect(wrapper.vm.currentQuizId).toBe(1);
      expect(wrapper.vm.quizStarted).toBe(true);
    });

    it('should handle quiz loading error', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      supabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }));

      await wrapper.setData({ selectedQuizId: 1 });
      await wrapper.vm.loadQuizFromDatabase();
      await flushPromises();
      
      expect(wrapper.vm.error).toContain('Failed to load quiz');
    });
  });

  describe('File Upload and Validation', () => {
    it('should validate JSON structure', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const invalidJson = '[{"invalid": "structure"}]';
      const file = new File([invalidJson], 'test.json', { type: 'application/json' });
      
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).toContain('invalid structure');
    });

    it('should load valid quiz with correct_answer field', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const validJson = JSON.stringify([
        {
          question: 'Test question?',
          answers: ['A', 'B', 'C', 'D'],
          type: 'multiple_choice',
          correct_answer: 2
        }
      ]);
      
      const file = new File([validJson], 'test.json', { type: 'application/json' });
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.uploadedQuizData).not.toBeNull();
      expect(wrapper.vm.uploadedQuizData.length).toBe(1);
    });

    it('should validate multiple choice has 4 answers', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const invalidJson = JSON.stringify([
        {
          question: 'Test question?',
          answers: ['A', 'B'],
          type: 'multiple_choice'
        }
      ]);
      
      const file = new File([invalidJson], 'test.json', { type: 'application/json' });
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).toContain('must have exactly 4 answers');
    });

    it('should validate true/false has 2 answers', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const invalidJson = JSON.stringify([
        {
          question: 'Test question?',
          answers: ['True', 'False', 'Maybe'],
          type: 'true_false'
        }
      ]);
      
      const file = new File([invalidJson], 'test.json', { type: 'application/json' });
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).toContain('must have exactly 2 answers');
    });

    it('should auto-detect true/false question type', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const validJson = JSON.stringify([
        {
          question: 'Is this true?',
          answers: ['True', 'False']
        }
      ]);
      
      const file = new File([validJson], 'test.json', { type: 'application/json' });
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.uploadedQuizData[0].type).toBe('true_false');
    });
  });

  describe('Quiz Saving to Database', () => {
    it('should require quiz data and name', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        uploadedQuizData: null,
        uploadedQuizName: ''
      });
      
      await wrapper.vm.saveUploadedQuizToDatabase();
      
      expect(wrapper.vm.error).toContain('Please load a quiz file');
    });

    it('should handle database error during save', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        uploadedQuizData: [
          {
            question: 'Test?',
            answers: ['A', 'B', 'C', 'D'],
            type: 'multiple_choice',
            correct_answer: 0
          }
        ],
        uploadedQuizName: 'Test Quiz'
      });
      
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      }));

      await wrapper.vm.saveUploadedQuizToDatabase();
      await flushPromises();
      
      expect(wrapper.vm.error).toContain('Failed to save quiz');
    });
  });

  describe('Quiz Submission Tracking', () => {
    it('should save submission when quiz is finished', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
        ],
        userAnswers: [1, 0],
        correctAnswers: [1, 0],
        currentQuizId: 1,
        questionIds: [1, 2],
        answerIds: [[1, 2, 3, 4], [5, 6]],
        quizStarted: true
      });
      
      vi.clearAllMocks();
      
      supabase.from.mockImplementation((table) => {
        if (table === 'submissions') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
          };
        }
        return createMockChain();
      });
      supabase.rpc.mockResolvedValue({ error: null });

      await wrapper.vm.finishQuiz();
      await flushPromises();
      
      expect(supabase.from).toHaveBeenCalledWith('submissions');
      expect(wrapper.vm.quizCompleted).toBe(true);
    });

    it('should include user_id in submission when logged in', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [{ question: 'Q1', answers: ['A', 'B'], type: 'true_false' }],
        userAnswers: [0],
        correctAnswers: [0],
        currentQuizId: 1,
        questionIds: [1],
        answerIds: [[1, 2]],
        quizStarted: true,
        currentUser: { userId: 42, username: 'testuser' }
      });
      
      vi.clearAllMocks();
      
      let capturedData = null;
      supabase.from.mockImplementation((table) => {
        if (table === 'submissions') {
          return {
            insert: vi.fn((data) => {
              capturedData = data;
              return {
                select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
              };
            })
          };
        }
        return createMockChain();
      });
      supabase.rpc.mockResolvedValue({ error: null });

      await wrapper.vm.finishQuiz();
      await flushPromises();
      
      expect(capturedData).not.toBeNull();
      expect(capturedData.user_id).toBe(42);
    });

    it('should increment answer guesses via RPC', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }
        ],
        userAnswers: [1],
        correctAnswers: [1],
        currentQuizId: 1,
        questionIds: [1],
        answerIds: [[10, 20, 30, 40]],
        quizStarted: true
      });
      
      vi.clearAllMocks();
      
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
      }));
      supabase.rpc.mockResolvedValue({ error: null });

      await wrapper.vm.finishQuiz();
      await flushPromises();
      
      expect(supabase.rpc).toHaveBeenCalledWith('increment_answer_guess', { answer_id: 20 });
    });

    it('should not save submission when no quiz_id', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [{ question: 'Q1', answers: ['A', 'B'], type: 'true_false' }],
        userAnswers: [0],
        correctAnswers: [0],
        currentQuizId: null,
        quizStarted: true
      });
      
      vi.clearAllMocks();

      await wrapper.vm.finishQuiz();
      await flushPromises();
      
      expect(supabase.from).not.toHaveBeenCalledWith('submissions');
      expect(wrapper.vm.quizCompleted).toBe(true);
    });

    it('should handle submission errors gracefully', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [{ question: 'Q1', answers: ['A', 'B'], type: 'true_false' }],
        userAnswers: [0],
        correctAnswers: [0],
        currentQuizId: 1,
        questionIds: [1],
        answerIds: [[1, 2]],
        quizStarted: true
      });
      
      vi.clearAllMocks();
      
      supabase.from.mockImplementation((table) => {
        if (table === 'submissions') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({ 
              data: null,
              error: { message: 'Submission failed' } 
            })
          };
        }
        return createMockChain();
      });

      await wrapper.vm.finishQuiz();
      await flushPromises();
      
      expect(wrapper.vm.error).toContain('failed to save submission');
      expect(wrapper.vm.quizCompleted).toBe(true);
    });
  });

  describe('Statistics Loading', () => {
    it('should load all quiz statistics', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const mockStats = [
        {
          quiz_id: 1,
          quiz_name: 'Quiz 1',
          total_questions: 5,
          total_submissions: 10,
          average_score: 75.5,
          highest_score: 100,
          lowest_score: 40
        }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'quiz_statistics') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStats, error: null })
          };
        }
        return createMockChain();
      });

      await wrapper.vm.loadAllQuizStats();
      await flushPromises();
      
      expect(wrapper.vm.allQuizStats).toEqual(mockStats);
    });

    it('should calculate total submissions correctly', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        allQuizStats: [
          { total_submissions: 10 },
          { total_submissions: 15 },
          { total_submissions: 20 }
        ]
      });

      expect(wrapper.vm.totalSubmissions).toBe(45);
    });

    it('should calculate overall average score with weighted average', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        allQuizStats: [
          { average_score: 80, total_submissions: 10 },
          { average_score: 70, total_submissions: 10 },
          { average_score: 90, total_submissions: 10 }
        ]
      });

      expect(wrapper.vm.overallAverageScore).toBe(80);
    });

    it('should load individual quiz statistics', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const mockQuizStats = {
        quiz_id: 1,
        quiz_name: 'Test Quiz',
        total_questions: 5,
        total_submissions: 10,
        average_score: 75
      };

      const mockQuestionStats = [
        {
          question_id: 1,
          quiz_id: 1,
          question_text: 'Q1',
          question_type: 'multiple_choice',
          total_guesses: 10,
          correct_guesses: 7,
          correct_percentage: 70
        }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'quiz_statistics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockQuizStats, error: null })
          };
        }
        if (table === 'question_statistics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockQuestionStats, error: null })
          };
        }
        return createMockChain();
      });

      await wrapper.vm.viewQuizStats(1);
      await flushPromises();
      
      expect(wrapper.vm.selectedQuizStats).toEqual(mockQuizStats);
      expect(wrapper.vm.questionStats).toEqual(mockQuestionStats);
      expect(wrapper.vm.currentView).toBe('quiz-stats');
    });
  });

  describe('Quiz Navigation', () => {
    it('should start at first question', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
        ],
        userAnswers: [null, null],
        quizStarted: true,
        currentQuestionIndex: 0
      });
      
      expect(wrapper.vm.currentQuestionIndex).toBe(0);
    });

    it('should move to next question', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
        ],
        userAnswers: [0, null],
        quizStarted: true,
        currentQuestionIndex: 0
      });
      
      wrapper.vm.nextQuestion();
      await flushPromises();
      
      expect(wrapper.vm.currentQuestionIndex).toBe(1);
    });

    it('should move to previous question', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
        ],
        userAnswers: [0, 0],
        quizStarted: true,
        currentQuestionIndex: 1
      });
      
      wrapper.vm.previousQuestion();
      await flushPromises();
      
      expect(wrapper.vm.currentQuestionIndex).toBe(0);
    });

    it('should calculate progress correctly', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
        ],
        currentQuestionIndex: 0
      });
      
      expect(wrapper.vm.progressPercentage).toBe(50);
      
      await wrapper.setData({ currentQuestionIndex: 1 });
      expect(wrapper.vm.progressPercentage).toBe(100);
    });

    it('should not go past last question', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'Q1', answers: ['A', 'B'], type: 'true_false' }
        ],
        userAnswers: [0],
        quizStarted: true,
        currentQuestionIndex: 0
      });
      
      wrapper.vm.nextQuestion();
      await flushPromises();
      
      expect(wrapper.vm.currentQuestionIndex).toBe(0);
    });

    it('should not go before first question', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'Q1', answers: ['A', 'B'], type: 'true_false' }
        ],
        userAnswers: [null],
        quizStarted: true,
        currentQuestionIndex: 0
      });
      
      wrapper.vm.previousQuestion();
      await flushPromises();
      
      expect(wrapper.vm.currentQuestionIndex).toBe(0);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate total score correctly', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'MC1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'MC2', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'TF1', answers: ['True', 'False'], type: 'true_false' },
          { question: 'TF2', answers: ['True', 'False'], type: 'true_false' }
        ],
        correctAnswers: [1, 2, 0, 1],
        userAnswers: [1, 0, 0, 0]  // 2 correct (MC1, TF1)
      });
      
      expect(wrapper.vm.score).toBe(2);
      expect(wrapper.vm.scorePercentage).toBe(50);
    });

    it('should calculate multiple choice score', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'MC1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'MC2', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }
        ],
        correctAnswers: [1, 2],
        userAnswers: [1, 0]  // 1 correct
      });
      
      const mcScore = wrapper.vm.multipleChoiceScore;
      expect(mcScore.total).toBe(2);
      expect(mcScore.correct).toBe(1);
    });

    it('should calculate true/false score', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'TF1', answers: ['True', 'False'], type: 'true_false' },
          { question: 'TF2', answers: ['True', 'False'], type: 'true_false' }
        ],
        correctAnswers: [0, 1],
        userAnswers: [0, 0]  // 1 correct
      });
      
      const tfScore = wrapper.vm.trueFalseScore;
      expect(tfScore.total).toBe(2);
      expect(tfScore.correct).toBe(1);
    });
  });

  describe('Quiz Reset', () => {
    it('should reset all quiz state', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [{ question: 'Q1', answers: ['A', 'B'], type: 'true_false' }],
        userAnswers: [1],
        correctAnswers: [1],
        quizStarted: true,
        quizCompleted: true,
        currentQuizId: 1,
        selectedQuizId: '1',
        uploadedQuizName: 'Test',
        uploadedQuizData: [{}]
      });
      
      wrapper.vm.resetQuiz();
      await flushPromises();
      
      expect(wrapper.vm.questions).toEqual([]);
      expect(wrapper.vm.userAnswers).toEqual([]);
      expect(wrapper.vm.correctAnswers).toEqual([]);
      expect(wrapper.vm.quizCompleted).toBe(false);
      expect(wrapper.vm.quizStarted).toBe(false);
      expect(wrapper.vm.currentQuizId).toBeNull();
      expect(wrapper.vm.selectedQuizId).toBe('');
      expect(wrapper.vm.uploadedQuizName).toBe('');
      expect(wrapper.vm.uploadedQuizData).toBeNull();
    });

    it('should reload available quizzes after reset', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      vi.clearAllMocks();
      setupDefaultMock();
      
      wrapper.vm.resetQuiz();
      await flushPromises();
      
      expect(supabase.from).toHaveBeenCalledWith('quizzes');
    });
  });

  describe('Correct Rate Classification', () => {
    it('should classify high success rate correctly', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      expect(wrapper.vm.getCorrectRateClass(85)).toBe('high');
      expect(wrapper.vm.getCorrectRateClass(100)).toBe('high');
    });

    it('should classify medium success rate correctly', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      expect(wrapper.vm.getCorrectRateClass(70)).toBe('medium');
      expect(wrapper.vm.getCorrectRateClass(50)).toBe('medium');
    });

    it('should classify low success rate correctly', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      expect(wrapper.vm.getCorrectRateClass(30)).toBe('low');
      expect(wrapper.vm.getCorrectRateClass(0)).toBe('low');
    });
  });

  describe('Answer Labels', () => {
    it('should return correct labels for multiple choice', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [{ question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }],
        currentQuestionIndex: 0
      });
      
      expect(wrapper.vm.getAnswerLabel(0)).toBe('A');
      expect(wrapper.vm.getAnswerLabel(1)).toBe('B');
      expect(wrapper.vm.getAnswerLabel(2)).toBe('C');
      expect(wrapper.vm.getAnswerLabel(3)).toBe('D');
    });

    it('should return correct labels for true/false', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [{ question: 'Q1', answers: ['True', 'False'], type: 'true_false' }],
        currentQuestionIndex: 0
      });
      
      expect(wrapper.vm.getAnswerLabel(0)).toBe('T');
      expect(wrapper.vm.getAnswerLabel(1)).toBe('F');
    });
  });

  describe('LocalStorage Integration', () => {
    it('should save progress on answer selection', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [{ question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }],
        userAnswers: [null],
        currentQuestionIndex: 0
      });
      
      wrapper.vm.selectAnswer(2);
      
      const saved = localStorage.getItem('quizProgress');
      expect(saved).not.toBeNull();
      
      const parsed = JSON.parse(saved);
      expect(parsed.userAnswers[0]).toBe(2);
    });

    it('should clear localStorage on finish', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        currentQuizId: 1,
        questions: [{ question: 'Q1', answers: ['A', 'B'], type: 'true_false' }],
        userAnswers: [0],
        correctAnswers: [0],
        questionIds: [1],
        answerIds: [[1, 2]],
        quizStarted: true
      });
      
      localStorage.setItem('quizProgress', JSON.stringify({ test: 'data' }));
      
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
      }));
      supabase.rpc.mockResolvedValue({ error: null });
      
      await wrapper.vm.finishQuiz();
      await flushPromises();
      
      expect(localStorage.getItem('quizProgress')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should show error for empty quiz array', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const emptyJson = JSON.stringify([]);
      const file = new File([emptyJson], 'test.json', { type: 'application/json' });
      
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).toContain('expected an array of questions');
    });

    it('should show error for invalid JSON', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const invalidJson = 'not valid json';
      const file = new File([invalidJson], 'test.json', { type: 'application/json' });
      
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).not.toBeNull();
    });

    it('should display error message in UI', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({ error: 'Test error message' });
      
      expect(wrapper.find('.error').exists()).toBe(true);
      expect(wrapper.find('.error').text()).toBe('Test error message');
    });

    it('should handle statistics loading errors', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      supabase.from.mockImplementation((table) => {
        if (table === 'quiz_statistics') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Failed to load' } 
            })
          };
        }
        return createMockChain();
      });

      await wrapper.vm.loadAllQuizStats();
      await flushPromises();
      
      expect(wrapper.vm.error).toContain('Failed to load statistics');
    });
  });

  describe('Question Detail View', () => {
    it('should load question details', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      const mockQuestionStats = {
        question_id: 1,
        question_text: 'Test question?',
        total_guesses: 100,
        correct_guesses: 75,
        correct_percentage: 75
      };

      const mockAnswerStats = [
        { answer_id: 1, answer_label: 'A', answer_text: 'Option A', guesses: 25, is_correct: false },
        { answer_id: 2, answer_label: 'B', answer_text: 'Option B', guesses: 75, is_correct: true }
      ];

      supabase.from.mockImplementation((table) => {
        if (table === 'question_statistics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockQuestionStats, error: null })
          };
        }
        if (table === 'answer_statistics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockAnswerStats, error: null })
          };
        }
        return createMockChain();
      });

      await wrapper.vm.viewQuestionDetail(1);
      await flushPromises();

      expect(wrapper.vm.currentView).toBe('question-detail');
      expect(wrapper.vm.selectedQuestionStats).toEqual(mockQuestionStats);
      expect(wrapper.vm.answerStats).toEqual(mockAnswerStats);
    });

    it('should calculate answer percentage correctly', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        selectedQuestionStats: { total_guesses: 100 }
      });

      expect(wrapper.vm.getAnswerPercentage(25)).toBe(25);
      expect(wrapper.vm.getAnswerPercentage(75)).toBe(75);
    });

    it('should return 0 for answer percentage when no guesses', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        selectedQuestionStats: { total_guesses: 0 }
      });

      expect(wrapper.vm.getAnswerPercentage(10)).toBe(0);
    });
  });

  describe('Question Type Methods', () => {
    it('should return correct question type label', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'MC', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'TF', answers: ['True', 'False'], type: 'true_false' }
        ],
        currentQuestionIndex: 0
      });
      
      expect(wrapper.vm.getQuestionTypeLabel()).toBe('Multiple Choice');
      
      await wrapper.setData({ currentQuestionIndex: 1 });
      expect(wrapper.vm.getQuestionTypeLabel()).toBe('True/False');
    });

    it('should return correct badge class', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'MC', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'TF', answers: ['True', 'False'], type: 'true_false' }
        ],
        currentQuestionIndex: 0
      });
      
      expect(wrapper.vm.getQuestionTypeBadgeClass()).toBe('badge-multiple-choice');
      
      await wrapper.setData({ currentQuestionIndex: 1 });
      expect(wrapper.vm.getQuestionTypeBadgeClass()).toBe('badge-true-false');
    });

    it('should return correct label for index', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'MC', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'TF', answers: ['True', 'False'], type: 'true_false' }
        ]
      });
      
      expect(wrapper.vm.getQuestionTypeLabelForIndex(0)).toBe('Multiple Choice');
      expect(wrapper.vm.getQuestionTypeLabelForIndex(1)).toBe('True/False');
    });

    it('should return correct badge class for index', async () => {
      wrapper = mount(App);
      await flushPromises();
      
      await wrapper.setData({
        questions: [
          { question: 'MC', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
          { question: 'TF', answers: ['True', 'False'], type: 'true_false' }
        ]
      });
      
      expect(wrapper.vm.getQuestionTypeBadgeClassForIndex(0)).toBe('badge-multiple-choice');
      expect(wrapper.vm.getQuestionTypeBadgeClassForIndex(1)).toBe('badge-true-false');
    });
  });
});
