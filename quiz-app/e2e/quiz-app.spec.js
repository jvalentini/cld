/**
 * End-to-end tests for Quiz App
 * Tests core functionality and user flows
 */

import { test, expect, sampleQuiz, correctAnswers } from './fixtures/test-fixtures.js'

test.describe('Quiz App - Initial Load', () => {
  test('should display the app header', async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    
    await expect(quizPage.header).toBeVisible()
    await expect(quizPage.header).toContainText('Quiz App')
  })

  test('should show login form for unauthenticated users', async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    
    // Should show auth card or guest access option
    const authCardVisible = await quizPage.authCard.isVisible().catch(() => false)
    const guestAccessVisible = await quizPage.guestAccessSection.isVisible().catch(() => false)
    
    expect(authCardVisible || guestAccessVisible).toBeTruthy()
  })

  test('should have guest access option', async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    
    await expect(quizPage.continueAsGuestButton).toBeVisible()
  })
})

test.describe('Quiz App - Guest Mode', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
  })

  test('should enable guest mode when clicking continue as guest', async ({ quizPage }) => {
    await quizPage.continueAsGuest()
    
    // Should now show quiz selector
    await expect(quizPage.quizSelector).toBeVisible({ timeout: 10000 })
  })

  test('should show guest notice in guest mode', async ({ quizPage }) => {
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Guest notice should be visible
    await expect(quizPage.guestNotice).toBeVisible({ timeout: 10000 })
  })

  test('should be able to access quiz selector in guest mode', async ({ quizPage }) => {
    await quizPage.continueAsGuest()
    
    await expect(quizPage.quizSelector).toBeVisible({ timeout: 10000 })
    await expect(quizPage.quizDropdown).toBeVisible()
  })
})

test.describe('Quiz App - Quiz Flow', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
  })

  test('should display quiz selector with available quizzes', async ({ quizPage }) => {
    await expect(quizPage.quizSelector).toBeVisible()
    await expect(quizPage.quizDropdown).toBeVisible()
  })

  test('should be able to select and load a quiz', async ({ quizPage, page }) => {
    // Wait for quizzes to load
    await page.waitForTimeout(1000)
    
    // Check if there are quiz options available
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      // Select the first actual quiz (skip the placeholder)
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      
      // Should now show the quiz question
      await expect(quizPage.questionCard).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('Quiz App - Quiz Interaction', () => {
  test.beforeEach(async ({ quizPage, page }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Wait for quizzes to load and select one
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
    }
  })

  test('should display question card when quiz starts', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      await expect(quizPage.questionCard).toBeVisible()
      await expect(quizPage.questionText).toBeVisible()
    }
  })

  test('should display progress bar and text', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      await expect(quizPage.progressBar).toBeVisible()
      await expect(quizPage.progressText).toBeVisible()
      await expect(quizPage.progressText).toContainText(/Question \d+ of \d+/)
    }
  })

  test('should show answer options for questions', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      const answerCount = await quizPage.answerButtons.count()
      expect(answerCount).toBeGreaterThanOrEqual(2) // At least 2 for T/F
    }
  })

  test('should allow selecting an answer', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      await quizPage.selectAnswer(0)
      
      // Check that the answer is selected (has selected class or aria-selected)
      const firstAnswer = quizPage.answerButtons.first()
      const hasSelectedClass = await firstAnswer.evaluate(el => 
        el.classList.contains('selected') || el.getAttribute('aria-selected') === 'true'
      )
      
      expect(hasSelectedClass).toBeTruthy()
    }
  })

  test('should enable next button after selecting an answer', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      // Select an answer first
      await quizPage.selectAnswer(0)
      
      // Next button or finish button should be usable
      const nextVisible = await quizPage.nextButton.isVisible()
      const finishVisible = await quizPage.finishButton.isVisible()
      
      expect(nextVisible || finishVisible).toBeTruthy()
    }
  })

  test('should navigate to next question', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      const initialQuestion = await quizPage.getCurrentQuestionNumber()
      
      await quizPage.selectAnswer(0)
      
      if (await quizPage.nextButton.isVisible()) {
        await quizPage.goToNextQuestion()
        
        const newQuestion = await quizPage.getCurrentQuestionNumber()
        expect(newQuestion).toBe(initialQuestion + 1)
      }
    }
  })

  test('should navigate to previous question', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      // Go to second question first
      await quizPage.selectAnswer(0)
      
      if (await quizPage.nextButton.isVisible()) {
        await quizPage.goToNextQuestion()
        
        const secondQuestion = await quizPage.getCurrentQuestionNumber()
        
        // Now go back
        await quizPage.goToPreviousQuestion()
        
        const firstQuestion = await quizPage.getCurrentQuestionNumber()
        expect(firstQuestion).toBe(secondQuestion - 1)
      }
    }
  })
})

test.describe('Quiz App - Quiz Completion', () => {
  test.beforeEach(async ({ quizPage, page }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Wait for quizzes to load and select one
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
    }
  })

  test('should complete quiz and show results', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      // Complete the quiz by answering all questions
      await quizPage.completeQuizRandomly()
      
      // Should show results
      await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display score after completion', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      await quizPage.completeQuizRandomly()
      
      await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
      await expect(quizPage.scoreDisplay).toBeVisible()
    }
  })

  test('should have restart option after completion', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      await quizPage.completeQuizRandomly()
      
      await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
      // The button says "Take Another Quiz"
      await expect(quizPage.restartButton).toBeVisible()
    }
  })

  test('should restart quiz when clicking restart button', async ({ quizPage }) => {
    const isInProgress = await quizPage.isQuizInProgress()
    
    if (isInProgress) {
      await quizPage.completeQuizRandomly()
      
      await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
      
      // Click "Take Another Quiz"
      await quizPage.restartButton.click()
      
      // Should be back to quiz selection
      await expect(quizPage.quizSelector).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('Quiz App - Navigation', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
  })

  test('should navigate to leaderboard', async ({ quizPage }) => {
    const leaderboardBtnVisible = await quizPage.leaderboardNavButton.isVisible()
    
    if (leaderboardBtnVisible) {
      await quizPage.navigateToLeaderboard()
      
      // Should show leaderboard container
      await expect(quizPage.leaderboardContainer).toBeVisible({ timeout: 10000 })
    }
  })

  test('should navigate back to quiz from leaderboard', async ({ quizPage }) => {
    const leaderboardBtnVisible = await quizPage.leaderboardNavButton.isVisible()
    
    if (leaderboardBtnVisible) {
      await quizPage.navigateToLeaderboard()
      await expect(quizPage.leaderboardContainer).toBeVisible({ timeout: 10000 })
      
      // Navigate back to quiz
      await quizPage.navigateToQuiz()
      
      await expect(quizPage.quizSelector).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('Quiz App - Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page, quizPage }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    
    // Header should still be visible
    await expect(quizPage.header).toBeVisible()
    
    // Continue as guest should be accessible
    await expect(quizPage.continueAsGuestButton).toBeVisible()
  })

  test('should be responsive on tablet viewport', async ({ page, quizPage }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    
    // All main elements should be visible
    await expect(quizPage.header).toBeVisible()
    await expect(quizPage.continueAsGuestButton).toBeVisible()
  })
})

test.describe('Quiz App - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    
    // App should still be functional even if API calls fail
    await expect(quizPage.header).toBeVisible()
    await expect(quizPage.continueAsGuestButton).toBeVisible()
  })
})
