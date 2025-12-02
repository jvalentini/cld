/**
 * Test fixtures for Quiz App e2e tests
 * Provides reusable test data and setup utilities
 */

import { test as base } from '@playwright/test'
import { QuizPage } from '../pages/QuizPage.js'

// General Knowledge Quiz
export const generalKnowledgeQuiz = {
  name: 'General Knowledge Quiz',
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

// Science Quiz
export const scienceQuiz = {
  name: 'Science Quiz',
  questions: [
    {
      question: 'What is the chemical symbol for water?',
      answers: ['H2O', 'CO2', 'NaCl', 'O2'],
      type: 'multiple_choice',
      correct_answer: 0
    },
    {
      question: 'What is the speed of light in a vacuum?',
      answers: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'],
      type: 'multiple_choice',
      correct_answer: 0
    },
    {
      question: 'Photosynthesis occurs in plant leaves.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 0
    },
    {
      question: 'The human body has 206 bones.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 0
    },
    {
      question: 'What is the largest planet in our solar system?',
      answers: ['Earth', 'Saturn', 'Jupiter', 'Neptune'],
      type: 'multiple_choice',
      correct_answer: 2
    },
    {
      question: 'DNA stands for Deoxyribonucleic Acid.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 0
    },
    {
      question: 'What is the most abundant gas in Earth\'s atmosphere?',
      answers: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'],
      type: 'multiple_choice',
      correct_answer: 2
    }
  ]
}

// History Quiz
export const historyQuiz = {
  name: 'History Quiz',
  questions: [
    {
      question: 'In which year did World War II end?',
      answers: ['1943', '1944', '1945', '1946'],
      type: 'multiple_choice',
      correct_answer: 2
    },
    {
      question: 'The Great Wall of China is visible from space.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 1
    },
    {
      question: 'Who was the first President of the United States?',
      answers: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'],
      type: 'multiple_choice',
      correct_answer: 1
    },
    {
      question: 'The Renaissance began in Italy.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 0
    },
    {
      question: 'In which year did the Berlin Wall fall?',
      answers: ['1987', '1988', '1989', '1990'],
      type: 'multiple_choice',
      correct_answer: 2
    },
    {
      question: 'The Roman Empire fell in 476 AD.',
      answers: ['True', 'False'],
      type: 'true_false',
      correct_answer: 0
    },
    {
      question: 'Which ancient civilization built the pyramids?',
      answers: ['Greeks', 'Romans', 'Egyptians', 'Mayans'],
      type: 'multiple_choice',
      correct_answer: 2
    }
  ]
}

// All quizzes array
export const allQuizzes = [
  generalKnowledgeQuiz,
  scienceQuiz,
  historyQuiz
]

// Get correct answers for each quiz
export const generalKnowledgeCorrectAnswers = generalKnowledgeQuiz.questions.map(q => q.correct_answer)
export const scienceCorrectAnswers = scienceQuiz.questions.map(q => q.correct_answer)
export const historyCorrectAnswers = historyQuiz.questions.map(q => q.correct_answer)

// Legacy export for backward compatibility
export const sampleQuiz = generalKnowledgeQuiz
export const correctAnswers = generalKnowledgeCorrectAnswers

// Test user credentials (for authenticated tests)
export const testUsers = {
  student: {
    username: 'testuser',
    password: 'TestPassword123!',
    fullName: 'Test Student'
  },
  teacher: {
    username: 'teacher',
    password: 'TeacherPass456!',
    fullName: 'Jane Teacher'
  },
  admin: {
    username: 'admin',
    password: 'AdminPass789!',
    fullName: 'Admin User'
  }
}

// Legacy export for backward compatibility
export const testUser = testUsers.student

// Helper function to get quiz by name
export function getQuizByName(name) {
  return allQuizzes.find(quiz => quiz.name === name) || generalKnowledgeQuiz
}

// Helper function to get correct answers for a quiz
export function getCorrectAnswersForQuiz(quiz) {
  return quiz.questions.map(q => q.correct_answer)
}

// Extended test fixture with QuizPage
export const test = base.extend({
  quizPage: async ({ page }, use) => {
    const quizPage = new QuizPage(page)
    await use(quizPage)
  },
})

export { expect } from '@playwright/test'
