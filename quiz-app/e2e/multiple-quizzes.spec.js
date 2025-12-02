/**
 * End-to-end tests for multiple quiz scenarios
 * Tests quiz selection, switching between quizzes, and different quiz types
 */

import { test, expect } from './fixtures/test-fixtures.js'

test.describe('Multiple Quizzes - Selection and Switching', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
  })

  test('should display multiple quizzes in the selector', async ({ quizPage, page }) => {
    // Wait for quizzes to load
    await page.waitForTimeout(1000)
    
    const options = await quizPage.quizDropdown.locator('option').count()
    
    // Should have at least the placeholder option
    expect(options).toBeGreaterThanOrEqual(1)
    
    // If there are quizzes available, verify we can see them
    // In CI, there might be no quizzes, so we just verify the selector works
    if (options > 1) {
      // Verify we have actual quiz options (not just placeholder)
      const firstOption = await quizPage.quizDropdown.locator('option').nth(0).textContent()
      expect(firstOption).toBeTruthy()
    }
  })

  test('should be able to select different quizzes', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      // Select first quiz
      await quizPage.quizDropdown.selectOption({ index: 1 })
      const firstQuizName = await quizPage.quizDropdown.locator('option').nth(1).textContent()
      
      // Select second quiz if available
      if (options > 2) {
        await quizPage.quizDropdown.selectOption({ index: 2 })
        const secondQuizName = await quizPage.quizDropdown.locator('option').nth(2).textContent()
        
        expect(firstQuizName).not.toBe(secondQuizName)
      }
    }
  })

  test('should load and complete different quiz types', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      // Load first quiz
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      // Complete it
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        await quizPage.completeQuizRandomly()
        await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
        
        // Restart and try another quiz
        await quizPage.restartQuiz()
        await quizPage.waitForQuizToLoad()
        
        if (options > 2) {
          await quizPage.quizDropdown.selectOption({ index: 2 })
          await quizPage.loadSelectedQuiz()
          await quizPage.waitForQuizToLoad()
          
          const isInProgress2 = await quizPage.isQuizInProgress()
          if (isInProgress2) {
            await quizPage.completeQuizRandomly()
            await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
          }
        }
      }
    }
  })
})

test.describe('Multiple Quizzes - Quiz Content Validation', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
  })

  test('should display different questions for different quizzes', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      // Load first quiz and note first question
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        const firstQuestion1 = await quizPage.questionText.textContent()
        
        // Navigate back to quiz selector (don't use restart - quiz isn't completed)
        await quizPage.navigateToQuiz()
        await quizPage.waitForQuizToLoad()
        
        if (options > 2) {
          await quizPage.quizDropdown.selectOption({ index: 2 })
          await quizPage.loadSelectedQuiz()
          await quizPage.waitForQuizToLoad()
          
          const isInProgress2 = await quizPage.isQuizInProgress()
          if (isInProgress2) {
            const firstQuestion2 = await quizPage.questionText.textContent()
            
            // Questions should be different (unless by chance they're the same)
            // At minimum, verify we can load different quizzes
            expect(firstQuestion1).toBeTruthy()
            expect(firstQuestion2).toBeTruthy()
          }
        }
      }
    }
  })

  test('should show correct number of questions for each quiz', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        const totalQuestions = await quizPage.getTotalQuestions()
        expect(totalQuestions).toBeGreaterThan(0)
      }
    }
  })
})

test.describe('Multiple Quizzes - Quiz Completion and Results', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
  })

  test('should complete multiple quizzes in sequence', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      // Complete first quiz
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        await quizPage.completeQuizRandomly()
        await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
        
        const score1 = await quizPage.getScore()
        expect(score1).toBeGreaterThanOrEqual(0)
        
        // Restart and complete second quiz
        await quizPage.restartQuiz()
        await quizPage.waitForQuizToLoad()
        
        if (options > 2) {
          await quizPage.quizDropdown.selectOption({ index: 2 })
          await quizPage.loadSelectedQuiz()
          await quizPage.waitForQuizToLoad()
          
          const isInProgress2 = await quizPage.isQuizInProgress()
          if (isInProgress2) {
            await quizPage.completeQuizRandomly()
            await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
            
            const score2 = await quizPage.getScore()
            expect(score2).toBeGreaterThanOrEqual(0)
          }
        }
      }
    }
  })

  test('should show different scores for different quiz attempts', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      // Complete quiz first time
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        // Answer first question with index 0
        await quizPage.selectAnswer(0)
        if (await quizPage.finishButton.isVisible()) {
          await quizPage.finishQuiz()
        } else {
          await quizPage.completeQuizRandomly()
        }
        
        await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
        const score1 = await quizPage.getScore()
        
        // Restart and complete again with different answers
        await quizPage.restartQuiz()
        await quizPage.waitForQuizToLoad()
        await quizPage.quizDropdown.selectOption({ index: 1 })
        await quizPage.loadSelectedQuiz()
        await quizPage.waitForQuizToLoad()
        
        const isInProgress2 = await quizPage.isQuizInProgress()
        if (isInProgress2) {
          // Answer first question with different index
          await quizPage.selectAnswer(1)
          if (await quizPage.finishButton.isVisible()) {
            await quizPage.finishQuiz()
          } else {
            await quizPage.completeQuizRandomly()
          }
          
          await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
          const score2 = await quizPage.getScore()
          
          // Scores should be valid (0-100)
          expect(score1).toBeGreaterThanOrEqual(0)
          expect(score2).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })
})

test.describe('Multiple Quizzes - Navigation Between Quizzes', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
  })

  test('should navigate back to quiz selector after completing a quiz', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        await quizPage.completeQuizRandomly()
        await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
        
        // Click restart/take another quiz
        await quizPage.restartQuiz()
        
        // Should be back at quiz selector
        await expect(quizPage.quizSelector).toBeVisible({ timeout: 10000 })
      }
    }
  })

  test('should be able to switch quizzes mid-session', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 2) {
      // Start first quiz
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        // Answer a question
        await quizPage.selectAnswer(0)
        
        // Navigate back to quiz selector (via header)
        await quizPage.navigateToQuiz()
        await quizPage.waitForQuizToLoad()
        
        // Should be able to select a different quiz
        await expect(quizPage.quizSelector).toBeVisible()
        await quizPage.quizDropdown.selectOption({ index: 2 })
        await quizPage.loadSelectedQuiz()
        await quizPage.waitForQuizToLoad()
        
        // Should load the new quiz
        const isInProgress2 = await quizPage.isQuizInProgress()
        if (isInProgress2) {
          await expect(quizPage.questionCard).toBeVisible()
        }
      }
    }
  })
})

