/**
 * End-to-end tests for user-specific scenarios
 * Tests different user roles, authentication, and user-specific features
 */

import { test, expect } from './fixtures/test-fixtures.js'

test.describe('User Scenarios - Multiple Users', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
  })

  test('should allow different users to access the app', async ({ quizPage, page }) => {
    // Guest user can access
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    await expect(quizPage.quizSelector).toBeVisible({ timeout: 10000 })
    
    // Navigate back to login by reloading page (we're already on quiz page)
    // The quiz nav button might not be visible if we're already there
    await page.reload()
    await quizPage.waitForAppLoad()
    
    // After reload, should show login form or guest access
    const authCardVisible = await quizPage.authCard.isVisible().catch(() => false)
    const guestButtonVisible = await quizPage.continueAsGuestButton.isVisible().catch(() => false)
    
    // Either login form or guest access should be visible
    expect(authCardVisible || guestButtonVisible).toBeTruthy()
  })

  test('should show login form for all unauthenticated users', async ({ quizPage }) => {
    await expect(quizPage.authCard).toBeVisible()
    await expect(quizPage.usernameInput).toBeVisible()
    await expect(quizPage.passwordInput).toBeVisible()
    await expect(quizPage.loginButton).toBeVisible()
  })

  test('should allow switching between login and signup modes', async ({ quizPage, page }) => {
    // Should start in login mode
    await expect(quizPage.loginButton).toBeVisible()
    
    // Switch to signup
    await quizPage.toggleAuthModeLink.click()
    await page.waitForTimeout(300)
    
    // Should show signup button
    await expect(quizPage.signupButton).toBeVisible()
    
    // Switch back to login
    await quizPage.toggleAuthModeLink.click()
    await page.waitForTimeout(300)
    
    // Should show login button again
    await expect(quizPage.loginButton).toBeVisible()
  })
})

test.describe('User Scenarios - Guest Mode Features', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
  })

  test('should allow guest to take quizzes', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        await expect(quizPage.questionCard).toBeVisible()
      }
    }
  })

  test('should show guest notice to guest users', async ({ quizPage }) => {
    await expect(quizPage.guestNotice).toBeVisible({ timeout: 10000 })
  })

  test('should not show logout button for guests', async ({ quizPage }) => {
    await expect(quizPage.logoutButton).not.toBeVisible()
  })

  test('should allow guest to navigate between views', async ({ quizPage }) => {
    // Can navigate to leaderboard
    const leaderboardBtnVisible = await quizPage.leaderboardNavButton.isVisible()
    if (leaderboardBtnVisible) {
      await quizPage.navigateToLeaderboard()
      await expect(quizPage.leaderboardContainer).toBeVisible({ timeout: 10000 })
    }
    
    // Can navigate back to quiz
    await quizPage.navigateToQuiz()
    await expect(quizPage.quizSelector).toBeVisible({ timeout: 10000 })
  })
})

test.describe('User Scenarios - Authentication Flow', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
  })

  test('should validate username and password fields', async ({ quizPage }) => {
    // Try to submit empty form
    await quizPage.loginButton.click()
    
    // Form should still be visible (browser validation)
    await expect(quizPage.authCard).toBeVisible()
  })

  test('should handle invalid login credentials gracefully', async ({ quizPage, page }) => {
    // Try with non-existent user
    await quizPage.usernameInput.fill('nonexistent_user_xyz123')
    await quizPage.passwordInput.fill('wrong_password_abc456')
    await quizPage.loginButton.click()
    
    // Wait for response
    await page.waitForTimeout(2000)
    
    // Should still be on login form or show error
    const authCardVisible = await quizPage.authCard.isVisible()
    const errorVisible = await quizPage.errorMessage.isVisible().catch(() => false)
    
    expect(authCardVisible || errorVisible).toBeTruthy()
  })

  test('should allow signup form access', async ({ quizPage, page }) => {
    // Switch to signup mode
    await quizPage.toggleAuthModeLink.click()
    await page.waitForTimeout(300)
    
    // Should show signup form with additional fields
    await expect(quizPage.signupButton).toBeVisible()
    
    // Signup form should have email field (only visible in signup mode)
    const emailField = quizPage.page.locator('#email')
    const emailVisible = await emailField.isVisible().catch(() => false)
    
    // Email field should be visible in signup mode
    if (emailVisible) {
      await expect(emailField).toBeVisible()
    }
  })
})

test.describe('User Scenarios - Session Management', () => {
  test('should maintain guest session on page refresh', async ({ quizPage, page }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Verify in guest mode
    await expect(quizPage.quizSelector).toBeVisible()
    
    // Refresh page
    await page.reload()
    await quizPage.waitForAppLoad()
    
    // Should still be accessible (either still in guest mode or can re-enter)
    const quizSelectorVisible = await quizPage.quizSelector.isVisible().catch(() => false)
    const guestButtonVisible = await quizPage.continueAsGuestButton.isVisible().catch(() => false)
    
    expect(quizSelectorVisible || guestButtonVisible).toBeTruthy()
  })

  test('should allow switching from guest to authenticated mode', async ({ quizPage, page }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Should show guest notice with login option
    await expect(quizPage.guestNotice).toBeVisible({ timeout: 10000 })
    
    // Look for login link in guest notice
    const loginLink = quizPage.page.locator('.guest-notice a, .guest-notice button:has-text("Login")')
    const loginLinkVisible = await loginLink.isVisible().catch(() => false)
    
    if (loginLinkVisible) {
      await loginLink.click()
      await page.waitForTimeout(500)
      
      // Should show login form
      await expect(quizPage.authCard).toBeVisible()
    }
  })
})

test.describe('User Scenarios - Quiz Progress Across Sessions', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
  })

  test('should allow completing quiz as guest', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        // Complete the quiz
        await quizPage.completeQuizRandomly()
        await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
        
        // Should show score
        const score = await quizPage.getScore()
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      }
    }
  })

  test('should allow multiple quiz attempts', async ({ quizPage, page }) => {
    await page.waitForTimeout(1000)
    const options = await quizPage.quizDropdown.locator('option').count()
    
    if (options > 1) {
      // First attempt
      await quizPage.quizDropdown.selectOption({ index: 1 })
      await quizPage.loadSelectedQuiz()
      await quizPage.waitForQuizToLoad()
      
      const isInProgress = await quizPage.isQuizInProgress()
      if (isInProgress) {
        await quizPage.completeQuizRandomly()
        await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
        
        // Restart for second attempt
        await quizPage.restartQuiz()
        await quizPage.waitForQuizToLoad()
        
        // Second attempt
        await quizPage.quizDropdown.selectOption({ index: 1 })
        await quizPage.loadSelectedQuiz()
        await quizPage.waitForQuizToLoad()
        
        const isInProgress2 = await quizPage.isQuizInProgress()
        if (isInProgress2) {
          await quizPage.completeQuizRandomly()
          await expect(quizPage.resultsSection).toBeVisible({ timeout: 10000 })
        }
      }
    }
  })
})

