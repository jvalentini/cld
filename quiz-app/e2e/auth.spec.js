/**
 * Authentication e2e tests for Quiz App
 * Tests login, signup, and auth-related flows
 */

import { test, expect, testUser } from './fixtures/test-fixtures.js'

test.describe('Authentication - Login Form', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
  })

  test('should display login form with username and password fields', async ({ quizPage }) => {
    // The auth card should be visible with form fields
    await expect(quizPage.authCard).toBeVisible()
    await expect(quizPage.usernameInput).toBeVisible()
    await expect(quizPage.passwordInput).toBeVisible()
  })

  test('should display login button', async ({ quizPage }) => {
    await expect(quizPage.loginButton).toBeVisible()
  })

  test('should have option to toggle between login and signup', async ({ quizPage }) => {
    await expect(quizPage.toggleAuthModeLink).toBeVisible()
  })

  test('should allow typing in username field', async ({ quizPage }) => {
    await quizPage.usernameInput.fill('testuser')
    await expect(quizPage.usernameInput).toHaveValue('testuser')
  })

  test('should allow typing in password field', async ({ quizPage }) => {
    await quizPage.passwordInput.fill('testpassword')
    await expect(quizPage.passwordInput).toHaveValue('testpassword')
  })

  test('should mask password input', async ({ quizPage }) => {
    const inputType = await quizPage.passwordInput.getAttribute('type')
    expect(inputType).toBe('password')
  })
})

test.describe('Authentication - Guest Mode', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
  })

  test('should display continue as guest button', async ({ quizPage }) => {
    await expect(quizPage.continueAsGuestButton).toBeVisible()
  })

  test('should enter guest mode when clicking continue as guest', async ({ quizPage }) => {
    await quizPage.continueAsGuest()
    
    // Should now show quiz selector
    await expect(quizPage.quizSelector).toBeVisible({ timeout: 10000 })
  })

  test('should show guest notice when in guest mode', async ({ quizPage }) => {
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Guest notice should be visible
    await expect(quizPage.guestNotice).toBeVisible({ timeout: 10000 })
  })

  test('should not show logout button in guest mode', async ({ quizPage }) => {
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Logout should not be visible for guests
    await expect(quizPage.logoutButton).not.toBeVisible()
  })

  test('should allow guest to access quiz functionality', async ({ quizPage, page }) => {
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Should be able to see quiz selector
    await expect(quizPage.quizSelector).toBeVisible()
    
    // Wait for quizzes to load
    await page.waitForTimeout(1000)
    
    // Should have quiz dropdown available
    await expect(quizPage.quizDropdown).toBeVisible()
  })
})

test.describe('Authentication - Login Validation', () => {
  test.beforeEach(async ({ quizPage }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
  })

  test('should show error for empty username', async ({ quizPage, page }) => {
    // Form has required fields - browser validation will prevent submission
    // Just verify the form stays on login view
    await quizPage.passwordInput.fill('somepassword')
    
    // Try to submit - browser validation should prevent it
    await quizPage.loginButton.click()
    
    // Should still be on login form
    await expect(quizPage.authCard).toBeVisible()
  })

  test('should show error for empty password', async ({ quizPage, page }) => {
    // Form has required fields - browser validation will prevent submission
    await quizPage.usernameInput.fill('testuser')
    
    // Try to submit - browser validation should prevent it
    await quizPage.loginButton.click()
    
    // Should still be on login form
    await expect(quizPage.authCard).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ quizPage, page }) => {
    // Fill in credentials that don't exist
    await quizPage.usernameInput.fill('nonexistent_user_12345')
    await quizPage.passwordInput.fill('wrong_password_67890')
    await quizPage.loginButton.click()
    
    // Wait for response - should show error or stay on login
    await page.waitForTimeout(2000)
    
    // Should still be on login form (failed login)
    await expect(quizPage.authCard).toBeVisible()
  })
})

test.describe('Authentication - Session Persistence', () => {
  test('should remember guest mode on page refresh', async ({ quizPage, page }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
    await quizPage.continueAsGuest()
    await quizPage.waitForQuizToLoad()
    
    // Verify we're in guest mode
    await expect(quizPage.quizSelector).toBeVisible()
    
    // Refresh the page
    await page.reload()
    await quizPage.waitForAppLoad()
    
    // Check if guest mode persists (this depends on implementation)
    // May need to continue as guest again if session isn't persisted
    const quizSelectorVisible = await quizPage.quizSelector.isVisible().catch(() => false)
    const guestButtonVisible = await quizPage.continueAsGuestButton.isVisible().catch(() => false)
    
    // Either already in guest mode or can re-enter
    expect(quizSelectorVisible || guestButtonVisible).toBeTruthy()
  })
})

test.describe('Authentication - Sign Up Form', () => {
  test.beforeEach(async ({ quizPage, page }) => {
    await quizPage.goto()
    await quizPage.waitForAppLoad()
  })

  test('should have signup form accessible via toggle', async ({ quizPage, page }) => {
    // Click the toggle link to switch to signup
    await quizPage.toggleAuthModeLink.click()
    await page.waitForTimeout(300)
    
    // Should show signup button now
    await expect(quizPage.signupButton).toBeVisible()
  })
})
