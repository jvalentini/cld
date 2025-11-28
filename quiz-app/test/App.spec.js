/**
 * Unit tests for Quiz App Vue component
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

describe('Quiz App', () => {
  let wrapper;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should render the upload interface initially', () => {
      wrapper = mount(App);
      expect(wrapper.find('.file-upload').exists()).toBe(true);
      expect(wrapper.find('h1').text()).toBe('📝 Quiz App');
    });

    it('should not show quiz or results initially', () => {
      wrapper = mount(App);
      expect(wrapper.find('.question-card').exists()).toBe(false);
      expect(wrapper.find('.results').exists()).toBe(false);
    });
  });

  describe('File Upload and Validation', () => {
    it('should validate JSON structure', async () => {
      wrapper = mount(App);
      
      const invalidJson = '[{"invalid": "structure"}]';
      const file = new File([invalidJson], 'test.json', { type: 'application/json' });
      
      // Directly call the loadQuizFile method instead of triggering input
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      
      // Wait for FileReader to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.error).toContain('invalid structure');
    });

    it('should load valid multiple choice questions', async () => {
      wrapper = mount(App);
      
      const validJson = JSON.stringify([
        {
          question: 'Test question?',
          answers: ['A', 'B', 'C', 'D'],
          type: 'multiple_choice'
        }
      ]);
      
      const file = new File([validJson], 'test.json', { type: 'application/json' });
      
      // Manually call loadQuizFile to avoid input element issues
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      
      // Wait for file to be read
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.questions.length).toBe(1);
      expect(wrapper.vm.quizStarted).toBe(true);
    });

    it('should load valid true/false questions', async () => {
      wrapper = mount(App);
      
      const validJson = JSON.stringify([
        {
          question: 'Assume this is true?',
          answers: ['True', 'False'],
          type: 'true_false'
        }
      ]);
      
      const file = new File([validJson], 'test.json', { type: 'application/json' });
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.questions.length).toBe(1);
      expect(wrapper.vm.questions[0].type).toBe('true_false');
    });

    it('should auto-detect true/false questions without type field', async () => {
      wrapper = mount(App);
      
      const validJson = JSON.stringify([
        {
          question: 'Test question?',
          answers: ['True', 'False']
        }
      ]);
      
      const file = new File([validJson], 'test.json', { type: 'application/json' });
      await wrapper.vm.loadQuizFile({ target: { files: [file] } });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(wrapper.vm.questions[0].type).toBe('true_false');
    });

    it('should validate multiple choice has 4 answers', async () => {
      wrapper = mount(App);
      
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
      
      await wrapper.find('button:not(.btn-secondary)').trigger('click');
      expect(wrapper.vm.currentQuestionIndex).toBe(1);
    });

    it('should move to previous question', async () => {
      wrapper.vm.currentQuestionIndex = 1;
      wrapper.vm.userAnswers[1] = 0;
      await wrapper.vm.$nextTick();
      
      await wrapper.find('.btn-secondary').trigger('click');
      expect(wrapper.vm.currentQuestionIndex).toBe(0);
    });

    it('should not allow next without selecting answer', () => {
      const nextButton = wrapper.find('button:not(.btn-secondary)');
      expect(nextButton.attributes('disabled')).toBeDefined();
    });

    it('should calculate progress correctly', () => {
      expect(wrapper.vm.progressPercentage).toBe(50); // Question 1 of 2
      wrapper.vm.currentQuestionIndex = 1;
      expect(wrapper.vm.progressPercentage).toBe(100);
    });
  });

  describe('Answer Selection', () => {
    beforeEach(async () => {
      wrapper = mount(App);
      wrapper.vm.questions = [
        { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }
      ];
      wrapper.vm.userAnswers = [null];
      wrapper.vm.quizStarted = true;
      await wrapper.vm.$nextTick();
    });

    it('should select an answer', async () => {
      const answerOptions = wrapper.findAll('.answer-option');
      await answerOptions[1].trigger('click');
      
      expect(wrapper.vm.userAnswers[0]).toBe(1);
    });

    it('should mark selected answer visually', async () => {
      wrapper.vm.userAnswers[0] = 2;
      await wrapper.vm.$nextTick();
      
      const answerOptions = wrapper.findAll('.answer-option');
      expect(answerOptions[2].classes()).toContain('selected');
    });

    it('should save progress to localStorage', async () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem');
      
      wrapper.vm.selectAnswer(1);
      
      expect(spy).toHaveBeenCalledWith('quizProgress', expect.any(String));
    });
  });

  describe('Answer Labels', () => {
    beforeEach(async () => {
      wrapper = mount(App);
    });

    it('should show A-D for multiple choice', async () => {
      wrapper.vm.questions = [
        { question: 'Q1', answers: ['Ans1', 'Ans2', 'Ans3', 'Ans4'], type: 'multiple_choice' }
      ];
      wrapper.vm.currentQuestionIndex = 0;
      wrapper.vm.quizStarted = true;
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.getAnswerLabel(0)).toBe('A');
      expect(wrapper.vm.getAnswerLabel(1)).toBe('B');
      expect(wrapper.vm.getAnswerLabel(2)).toBe('C');
      expect(wrapper.vm.getAnswerLabel(3)).toBe('D');
    });

    it('should show T/F for true/false', async () => {
      wrapper.vm.questions = [
        { question: 'Q1', answers: ['True', 'False'], type: 'true_false' }
      ];
      wrapper.vm.currentQuestionIndex = 0;
      wrapper.vm.quizStarted = true;
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.getAnswerLabel(0)).toBe('T');
      expect(wrapper.vm.getAnswerLabel(1)).toBe('F');
    });
  });

  describe('Question Type Display', () => {
    beforeEach(async () => {
      wrapper = mount(App);
      wrapper.vm.questions = [
        { question: 'MC', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'TF', answers: ['True', 'False'], type: 'true_false' }
      ];
      wrapper.vm.quizStarted = true;
      await wrapper.vm.$nextTick();
    });

    it('should show correct badge for multiple choice', () => {
      wrapper.vm.currentQuestionIndex = 0;
      expect(wrapper.vm.getQuestionTypeLabel()).toBe('Multiple Choice');
      expect(wrapper.vm.getQuestionTypeBadgeClass()).toBe('badge-multiple-choice');
    });

    it('should show correct badge for true/false', () => {
      wrapper.vm.currentQuestionIndex = 1;
      expect(wrapper.vm.getQuestionTypeLabel()).toBe('True/False');
      expect(wrapper.vm.getQuestionTypeBadgeClass()).toBe('badge-true-false');
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

  describe('Quiz Completion', () => {
    beforeEach(async () => {
      wrapper = mount(App);
      wrapper.vm.questions = [
        { question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }
      ];
      wrapper.vm.userAnswers = [1];
      wrapper.vm.correctAnswers = [1];
      wrapper.vm.quizStarted = true;
      await wrapper.vm.$nextTick();
    });

    it('should show results after finishing', async () => {
      wrapper.vm.finishQuiz();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.quizCompleted).toBe(true);
      expect(wrapper.find('.results').exists()).toBe(true);
    });

    it('should clear localStorage on finish', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem');
      wrapper.vm.finishQuiz();
      
      expect(spy).toHaveBeenCalledWith('quizProgress');
    });

    it('should reset quiz correctly', async () => {
      wrapper.vm.quizCompleted = true;
      await wrapper.vm.$nextTick();
      
      wrapper.vm.resetQuiz();
      
      expect(wrapper.vm.quizCompleted).toBe(false);
      expect(wrapper.vm.currentQuestionIndex).toBe(0);
      expect(wrapper.vm.userAnswers[0]).toBeNull();
    });
  });

  describe('LocalStorage Integration', () => {
    it('should save progress on answer selection', () => {
      wrapper = mount(App);
      wrapper.vm.questions = [{ question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }];
      wrapper.vm.userAnswers = [null];
      wrapper.vm.currentQuestionIndex = 0;
      
      wrapper.vm.selectAnswer(2);
      
      const saved = localStorage.getItem('quizProgress');
      expect(saved).not.toBeNull();
      
      const parsed = JSON.parse(saved);
      expect(parsed.userAnswers[0]).toBe(2);
    });

    it('should load progress on mount', async () => {
      const savedProgress = {
        questions: [{ question: 'Q1', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }],
        userAnswers: [2],
        currentQuestionIndex: 0,
        timestamp: Date.now()
      };
      localStorage.setItem('quizProgress', JSON.stringify(savedProgress));
      
      // Mock confirm to return true
      global.confirm = vi.fn(() => true);
      
      wrapper = mount(App);
      await wrapper.vm.$nextTick();
      
      // Mounted hook should have been called
      expect(wrapper.vm.questions.length).toBe(1);
    });
  });

  describe('Mixed Question Types', () => {
    beforeEach(async () => {
      wrapper = mount(App);
      wrapper.vm.questions = [
        { question: 'MC', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' },
        { question: 'TF', answers: ['True', 'False'], type: 'true_false' },
        { question: 'MC2', answers: ['A', 'B', 'C', 'D'], type: 'multiple_choice' }
      ];
      wrapper.vm.userAnswers = [null, null, null];
      wrapper.vm.quizStarted = true;
      wrapper.vm.currentQuestionIndex = 0;
      await wrapper.vm.$nextTick();
    });

    it('should handle navigation between different question types', async () => {
      // Start with MC question
      expect(wrapper.vm.getQuestionTypeLabel()).toBe('Multiple Choice');
      
      // Select answer and move to TF
      wrapper.vm.userAnswers[0] = 1;
      wrapper.vm.nextQuestion();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.getQuestionTypeLabel()).toBe('True/False');
      
      // Move to next MC
      wrapper.vm.userAnswers[1] = 0;
      wrapper.vm.nextQuestion();
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.getQuestionTypeLabel()).toBe('Multiple Choice');
    });

    it('should render correct number of answer options', async () => {
      await wrapper.vm.$nextTick();
      
      // MC question - should have 4 options
      let answerOptions = wrapper.findAll('.answer-option');
      expect(answerOptions.length).toBe(4);
      
      // Move to TF question
      wrapper.vm.userAnswers[0] = 1;
      wrapper.vm.nextQuestion();
      await wrapper.vm.$nextTick();
      
      // TF question - should have 2 options
      answerOptions = wrapper.findAll('.answer-option');
      expect(answerOptions.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      wrapper = mount(App);
    });

    it('should show error for empty array', async () => {
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
  });
});