/**
 * Test fixtures for Quiz App e2e tests
 * Provides reusable test data and setup utilities
 */

import { test as base } from '@playwright/test'
import { QuizPage } from '../pages/QuizPage.js'

// Sample quiz data for testing (matches sample-quiz.json structure)
export const sampleQuiz = {
  name: 'Sample Quiz',
  questions: [
    {
      question: 'What color is the sky on a clear day?',
      answers: ['Blue', 'Purple', 'Green', 'Orange'],
      type: 'multiple_choice',
      correct_answer: 0
    },
    {
      question: 'What is the capital of France?',
      answers: ['London', 'Berlin', 'Paris', 'Madrid'],
      type: 'multiple_choice',
      correct_answer: 2
    },
    {
      question: 'Which planet is known as the Red Planet?',
      answers: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      type: 'multiple_choice',
      correct_answer: 1
    },
    {
      question: 'The Earth orbits around the Sun.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 0
    },
    {
      question: 'Water boils at 100 degrees Celsius at sea level.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 0
    },
    {
      question: 'The Pacific Ocean is the smallest ocean.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 1
    },
    {
      question: 'What is 5 + 7?',
      answers: ['10', '11', '12', '13'],
      type: 'multiple_choice',
      correct_answer: 2
    }
  ]
}

// Get all correct answers from sample quiz
export const correctAnswers = sampleQuiz.questions.map(q => q.correct_answer)

// Test user credentials (for authenticated tests)
export const testUser = {
  username: 'testuser',
  password: 'TestPassword123!'
}

// Extended test fixture with QuizPage
export const test = base.extend({
  quizPage: async ({ page }, use) => {
    const quizPage = new QuizPage(page)
    await use(quizPage)
  },
})

export { expect } from '@playwright/test'

