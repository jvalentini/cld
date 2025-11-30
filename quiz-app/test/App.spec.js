/**
 * Unit tests for Quiz App Vue component
 * Updated with comprehensive tests for database integration, statistics, and submissions
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';
import { supabase } from '../src/supabaseClient';

// Mock Supabase client
vi.mock('../src/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

describe('Quiz App', () => {
  let wrapper;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Initial State', () => {
    it('should render the quiz selector initially', () => {
      wrapper = mount(App);
      expect(wrapper.find('.quiz-selector').exists()).toBe(true);
      expect(wrapper.find('h1').text()).toBe('📝 Quiz App');
    });

    it('should show navigation buttons', () => {
      wrapper = mount(App);
      const navButtons = wrapper.findAll('.btn-nav');
      expect(navButtons.length).toBeGreaterThan(0);
    });

    it('should not show quiz or results initially', () => {
      wrapper = mount(App);
      expect(wrapper.find('.question-card').exists()).toBe(false);
      expect(wrapper.find('.results').exists()).toBe(false);
    });

    it('should initialize with quiz view', () => {
      wrapper = mount(App);
      expect(wrapper.vm.currentView).toBe('quiz');
    });
  });

  describe('View Navigation', () => {
    beforeEach(() => {
      wrapper = mount(App);
    });

    it('should navigate to statistics page', async () => {
      // Mock the loadAllQuizStats method
      wrapper.vm.loadAllQuizStats = vi.fn().mockResolvedValue();
      
      await wrapper.vm.goToStatsPage();
      
      expect(wrapper.vm.currentView).toBe('stats');
      expect(wrapper.vm.loadAllQuizStats).toHaveBeenCalled();
    });

    it('should navigate back to quiz page', async () => {
      wrapper.vm.currentView = 'stats';
      
      await wrapper.vm.goToQuizPage();
      
      expect(wrapper.vm.currentView).toBe('quiz');
      expect(wrapper.vm.selectedStatsQuizId).toBeNull();
    });

    it('should show breadcrumb when not on quiz page', async () => {
      wrapper.vm.currentView = 'stats';
      await wrapper.vm.$nextTick();
      
      expect(wrapper.find('.breadcrumb').exists()).toBe(true);
    });
  });

  describe('Database Quiz Loading', () => {
    beforeEach(() => {
      wrapper = mount(App);
    });

    it('should load available quizzes on mount', () => {
      expect(supabase.from).toHaveBeenCalledWith('quizzes');
    });

    it('should load quiz from database', async () => {
      const mockQuizData = [
        { 
          id: 1, 
          name: 'Test Quiz',
          description: 'A test quiz'
        }
      ];
      
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

      // Mock Supabase responses
      supabase.from.mockImplementation((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: table === 'questions' ? mockQuestions : mockAnswers,
          error: null 
        })
      }));

      wrapper.vm.selectedQuizId = 1;
      await wrapper.vm.loadQuizFromDatabase();
      
      expect(wrapper.vm.questions.length).toBe(1);
      expect(wrapper.vm.currentQuizId).toBe(1);
      expect(wrapper.vm.quizStarted).toBe(true);
    });

    it('should set correct answers from database', async () => {
      const mockQuestions = [
        {
          id: 1,
          quiz_id: 1,
          question_text: 'Test?',
          question_type: 'multiple_choice',
          order_index: 1,
          correct_answer_id: 3  // Third answer (index 2)
        }
      ];
      
      const mockAnswers = [
        { id: 1, question_id: 1, answer_text: 'A', answer_label: 'A' },
        { id: 2, question_id: 1, answer_text: 'B', answer_label: 'B' },
        { id: 3, question_id: 1, answer_text: 'C', answer_label: 'C' },
        { id: 4, question_id: 1, answer_text: 'D', answer_label: 'D' }
      ];

      supabase.from.mockImplementation((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: table === 'questions' ? mockQuestions : mockAnswers,
          error: null 
        })
      }));

      wrapper.vm.selectedQuizId = 1;
      await wrapper.vm.loadQuizFromDatabase();
      
      expect(wrapper.vm.correctAnswers[0]).toBe(2); // Index of answer with id 3
    });
  });

  describe('File Upload and Validation', () => {
    beforeEach(() => {
      wrapper = mount(App);
    });

    it('should validate JSON structure', async () => {
      const invalidJson = '[{"invalid": "structure"}]';
      const file = new File([invalidJson], 'test.json', { type: 'application/json' });
      
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).toContain('invalid structure');
    });

    it('should load valid quiz with correct_answer field', async () => {
      const validJson = JSON.stringify([
        {
          question: 'Test question?',
          answers: ['A', 'B', 'C', 'D'],
          type: 'multiple_choice',
          correct_answer: 2  // Index of correct answer
        }
      ]);
      
      const file = new File([validJson], 'test.json', { type: 'application/json' });
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.questions.length).toBe(1);
      expect(wrapper.vm.uploadedQuizData).not.toBeNull();
    });

    it('should show quiz name input after JSON upload', async () => {
      const validJson = JSON.stringify([
        {
          question: 'Test?',
          answers: ['A', 'B', 'C', 'D'],
          type: 'multiple_choice'
        }
      ]);
      
      const file = new File([validJson], 'test.json', { type: 'application/json' });
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.uploadedQuizData).not.toBeNull();
    });

    it('should validate multiple choice has 4 answers', async () => {
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
  });

  describe('Quiz Saving to Database', () => {
    beforeEach(() => {
      wrapper = mount(App);
      
      // Set up uploaded quiz data
      wrapper.vm.uploadedQuizData = [
        {
          question: 'Test question?',
          answers: ['A', 'B', 'C', 'D'],
          type: 'multiple_choice',
          correct_answer: 1
        }
      ];
      wrapper.vm.uploadedQuizName = 'Test Quiz';
    });

    it('should save quiz to database', async () => {
      const mockQuizInsert = { data: [{ id: 1 }], error: null };
      const mockQuestionInsert = { data: [{ id: 1, quiz_id: 1 }], error: null };
      const mockAnswerInsert = { 
        data: [
          { id: 1, question_id: 1 },
          { id: 2, question_id: 1 },
          { id: 3, question_id: 1 },
          { id: 4, question_id: 1 }
        ], 
        error: null 
      };

      supabase.from.mockImplementation((table) => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(
          table === 'quizzes' ? mockQuizInsert :
          table === 'questions' ? mockQuestionInsert :
          mockAnswerInsert
        ),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      }));

      await wrapper.vm.saveUploadedQuizToDatabase();
      
      expect(supabase.from).toHaveBeenCalledWith('quizzes');
      expect(supabase.from).toHaveBeenCalledWith('questions');
      expect(supabase.from).toHaveBeenCalledWith('answers');
    });

    it('should handle save errors gracefully', async () => {
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database error' } 
        })
      }));

      await wrapper.vm.saveUploadedQuizToDatabase();
      
      expect(wrapper.vm.error).toContain('Failed to save quiz');
    });
  });

  describe('Quiz Submission Tracking', () => {
    beforeEach(() => {
      wrapper = mount(App);
      wrapper.vm.questions = [
        { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
      ];
      wrapper.vm.userAnswers = [1, 0];
      wrapper.vm.correctAnswers = [1, 0]; // Both correct
      wrapper.vm.currentQuizId = 1;
      wrapper.vm.questionIds = [1, 2];
      wrapper.vm.answerIds = [
        [1, 2, 3, 4],  // Answer IDs for question 1
        [5, 6]          // Answer IDs for question 2
      ];
      wrapper.vm.quizStarted = true;
    });

    it('should save submission when quiz is finished', async () => {
      const mockSubmissionInsert = { error: null };
      
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockResolvedValue(mockSubmissionInsert)
      }));
      
      supabase.rpc.mockResolvedValue({ error: null });

      await wrapper.vm.finishQuiz();
      
      expect(supabase.from).toHaveBeenCalledWith('submissions');
      expect(wrapper.vm.quizCompleted).toBe(true);
    });

    it('should calculate correct answers correctly', async () => {
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockImplementation((data) => {
          // Verify the submission data
          expect(data.correct_answers).toBe(2);
          expect(data.total_questions).toBe(2);
          expect(data.quiz_id).toBe(1);
          return Promise.resolve({ error: null });
        })
      }));
      
      supabase.rpc.mockResolvedValue({ error: null });

      await wrapper.vm.finishQuiz();
    });

    it('should increment answer guesses', async () => {
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockResolvedValue({ error: null })
      }));
      
      supabase.rpc.mockResolvedValue({ error: null });

      await wrapper.vm.finishQuiz();
      
      // Should be called for each user answer (2 times)
      expect(supabase.rpc).toHaveBeenCalledWith('increment_answer_guess', { answer_id: 2 });
      expect(supabase.rpc).toHaveBeenCalledWith('increment_answer_guess', { answer_id: 5 });
    });

    it('should not save submission for uploaded quizzes without quiz_id', async () => {
      wrapper.vm.currentQuizId = null;
      
      supabase.from.mockImplementation(() => ({
        insert: vi.fn()
      }));

      await wrapper.vm.finishQuiz();
      
      expect(supabase.from).not.toHaveBeenCalled();
      expect(wrapper.vm.quizCompleted).toBe(true);
    });

    it('should handle submission errors gracefully', async () => {
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockResolvedValue({ 
          error: { message: 'Submission failed' } 
        })
      }));

      await wrapper.vm.finishQuiz();
      
      expect(wrapper.vm.error).toContain('failed to save submission statistics');
      expect(wrapper.vm.quizCompleted).toBe(true);
    });
  });

  describe('Statistics Loading', () => {
    beforeEach(() => {
      wrapper = mount(App);
    });

    it('should load all quiz statistics', async () => {
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

      supabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockStats, error: null })
      }));

      await wrapper.vm.loadAllQuizStats();
      
      expect(wrapper.vm.allQuizStats).toEqual(mockStats);
      expect(supabase.from).toHaveBeenCalledWith('quiz_statistics');
    });

    it('should calculate total submissions correctly', async () => {
      wrapper.vm.allQuizStats = [
        { total_submissions: 10 },
        { total_submissions: 15 },
        { total_submissions: 20 }
      ];

      expect(wrapper.vm.totalSubmissions).toBe(45);
    });

    it('should calculate overall average score', async () => {
      wrapper.vm.allQuizStats = [
        { average_score: 80 },
        { average_score: 70 },
        { average_score: 90 }
      ];

      expect(wrapper.vm.overallAverageScore).toBe(80);
    });

    it('should load individual quiz statistics', async () => {
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

      supabase.from.mockImplementation((table) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: mockQuizStats, 
          error: null 
        }),
        order: vi.fn().mockResolvedValue({ 
          data: mockQuestionStats, 
          error: null 
        })
      }));

      await wrapper.vm.viewQuizStats(1);
      
      expect(wrapper.vm.selectedQuizStats).toEqual(mockQuizStats);
      expect(wrapper.vm.questionStats).toEqual(mockQuestionStats);
      expect(wrapper.vm.currentView).toBe('quiz-stats');
    });
  });

  describe('Quiz Navigation', () => {
    beforeEach(async () => {
      wrapper = mount(App);
      wrapper.vm.questions = [
        { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'Q2', answers: ['True', 'False'], type: 'true_false' }
      ];
      wrapper.vm.userAnswers = [null, null];
      wrapper.vm.quizStarted = true;
      await wrapper.vm.$nextTick();
    });

    it('should start at first question', () => {
      expect(wrapper.vm.currentQuestionIndex).toBe(0);
    });

    it('should move to next question', async () => {
      wrapper.vm.userAnswers[0] = 0;
      await wrapper.vm.$nextTick();
      
      wrapper.vm.nextQuestion();
      expect(wrapper.vm.currentQuestionIndex).toBe(1);
    });

    it('should move to previous question', async () => {
      wrapper.vm.currentQuestionIndex = 1;
      wrapper.vm.userAnswers[1] = 0;
      await wrapper.vm.$nextTick();
      
      wrapper.vm.previousQuestion();
      expect(wrapper.vm.currentQuestionIndex).toBe(0);
    });

    it('should calculate progress correctly', () => {
      expect(wrapper.vm.progressPercentage).toBe(50); // Question 1 of 2
      wrapper.vm.currentQuestionIndex = 1;
      expect(wrapper.vm.progressPercentage).toBe(100);
    });
  });

  describe('Score Calculation', () => {
    beforeEach(async () => {
      wrapper = mount(App);
      wrapper.vm.questions = [
        { question: 'MC1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'MC2', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'TF1', answers: ['True', 'False'], type: 'true_false' },
        { question: 'TF2', answers: ['True', 'False'], type: 'true_false' }
      ];
      wrapper.vm.correctAnswers = [1, 2, 0, 1];
      wrapper.vm.userAnswers = [1, 0, 0, 0]; // 2 correct (MC1, TF1)
    });

    it('should calculate total score correctly', () => {
      expect(wrapper.vm.score).toBe(2);
      expect(wrapper.vm.scorePercentage).toBe(50);
    });

    it('should calculate multiple choice score', () => {
      const mcScore = wrapper.vm.multipleChoiceScore;
      expect(mcScore.total).toBe(2);
      expect(mcScore.correct).toBe(1);
    });

    it('should calculate true/false score', () => {
      const tfScore = wrapper.vm.trueFalseScore;
      expect(tfScore.total).toBe(2);
      expect(tfScore.correct).toBe(1);
    });
  });

  describe('Quiz Reset', () => {
    beforeEach(async () => {
      wrapper = mount(App);
      
      // Mock loadAvailableQuizzes
      wrapper.vm.loadAvailableQuizzes = vi.fn();
      
      // Set up quiz state
      wrapper.vm.questions = [{ question: 'Q1', answers: ['A', 'B'], type: 'true_false' }];
      wrapper.vm.userAnswers = [1];
      wrapper.vm.correctAnswers = [1];
      wrapper.vm.quizStarted = true;
      wrapper.vm.quizCompleted = true;
      wrapper.vm.currentQuizId = 1;
      wrapper.vm.selectedQuizId = '1';
      wrapper.vm.uploadedQuizName = 'Test';
      wrapper.vm.uploadedQuizData = [{}];
      await wrapper.vm.$nextTick();
    });

    it('should reset all quiz state', async () => {
      wrapper.vm.resetQuiz();
      
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

    it('should reload available quizzes after reset', () => {
      wrapper.vm.resetQuiz();
      
      expect(wrapper.vm.loadAvailableQuizzes).toHaveBeenCalled();
    });
  });

  describe('Correct Rate Classification', () => {
    beforeEach(() => {
      wrapper = mount(App);
    });

    it('should classify high success rate correctly', () => {
      expect(wrapper.vm.getCorrectRateClass(85)).toBe('high');
      expect(wrapper.vm.getCorrectRateClass(100)).toBe('high');
    });

    it('should classify medium success rate correctly', () => {
      expect(wrapper.vm.getCorrectRateClass(70)).toBe('medium');
      expect(wrapper.vm.getCorrectRateClass(50)).toBe('medium');
    });

    it('should classify low success rate correctly', () => {
      expect(wrapper.vm.getCorrectRateClass(30)).toBe('low');
      expect(wrapper.vm.getCorrectRateClass(0)).toBe('low');
    });
  });

  describe('LocalStorage Integration', () => {
    beforeEach(() => {
      wrapper = mount(App);
    });

    it('should save progress on answer selection', () => {
      wrapper.vm.questions = [{ question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }];
      wrapper.vm.userAnswers = [null];
      wrapper.vm.currentQuestionIndex = 0;
      
      wrapper.vm.selectAnswer(2);
      
      const saved = localStorage.getItem('quizProgress');
      expect(saved).not.toBeNull();
      
      const parsed = JSON.parse(saved);
      expect(parsed.userAnswers[0]).toBe(2);
    });

    it('should clear localStorage on finish', async () => {
      wrapper.vm.currentQuizId = 1;
      wrapper.vm.questions = [{ question: 'Q1', answers: ['A', 'B'], type: 'true_false' }];
      wrapper.vm.userAnswers = [0];
      wrapper.vm.correctAnswers = [0];
      wrapper.vm.questionIds = [1];
      wrapper.vm.answerIds = [[1, 2]];
      
      localStorage.setItem('quizProgress', JSON.stringify({ test: 'data' }));
      
      supabase.from.mockImplementation(() => ({
        insert: vi.fn().mockResolvedValue({ error: null })
      }));
      supabase.rpc.mockResolvedValue({ error: null });
      
      await wrapper.vm.finishQuiz();
      
      expect(localStorage.getItem('quizProgress')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      wrapper = mount(App);
    });

    it('should show error for empty quiz array', async () => {
      const emptyJson = JSON.stringify([]);
      const file = new File([emptyJson], 'test.json', { type: 'application/json' });
      
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).toContain('expected an array of questions');
    });

    it('should show error for invalid JSON', async () => {
      const invalidJson = 'not valid json';
      const file = new File([invalidJson], 'test.json', { type: 'application/json' });
      
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).not.toBeNull();
    });

    it('should display error message in UI', async () => {
      wrapper.vm.error = 'Test error message';
      await wrapper.vm.$nextTick();
      
      expect(wrapper.find('.error').exists()).toBe(true);
      expect(wrapper.find('.error').text()).toBe('Test error message');
    });

    it('should handle statistics loading errors', async () => {
      supabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Failed to load' } 
        })
      }));

      await wrapper.vm.loadAllQuizStats();
      
      expect(wrapper.vm.error).toContain('Failed to load statistics');
    });
  });
});