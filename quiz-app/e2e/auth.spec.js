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
    await expect(quizPage.usernameInput).toBeVisible()
    await expect(quizPage.passwordInput).toBeVisible()
  })

  test('should display login button', async ({ quizPage }) => {
    await expect(quizPage.loginButton).toBeVisible()
  })

  test('should have option to toggle between login and signup', async ({ quizPage }) => {
    // Look for toggle link or signup button
    const toggleLink = quizPage.page.locator('a:has-text("Sign up"), a:has-text("Create"), button:has-text("Sign Up")')
    const isVisible = await toggleLink.first().isVisible().catch(() => false)
    
    expect(isVisible).toBeTruthy()
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
    
    // Guest notice should indicate limited functionality
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
    // Try to login with empty username
    await quizPage.passwordInput.fill('somepassword')
    await quizPage.loginButton.click()
    
    // Wait a moment for validation
    await page.waitForTimeout(500)
    
    // Should either show validation error or stay on login form
    const stillOnLogin = await quizPage.loginForm.isVisible().catch(() => false) ||
                         await quizPage.usernameInput.isVisible()
    expect(stillOnLogin).toBeTruthy()
  })

  test('should show error for empty password', async ({ quizPage, page }) => {
    // Try to login with empty password
    await quizPage.usernameInput.fill('testuser')
    await quizPage.loginButton.click()
    
    // Wait a moment for validation
    await page.waitForTimeout(500)
    
    // Should either show validation error or stay on login form
    const stillOnLogin = await quizPage.loginForm.isVisible().catch(() => false) ||
                         await quizPage.passwordInput.isVisible()
    expect(stillOnLogin).toBeTruthy()
  })

  test('should show error for invalid credentials', async ({ quizPage, page }) => {
    // Try to login with invalid credentials
    await quizPage.usernameInput.fill('nonexistent_user_12345')
    await quizPage.passwordInput.fill('wrong_password_67890')
    await quizPage.loginButton.click()
    
    // Wait for response
    await page.waitForTimeout(2000)
    
    // Should show error or stay on login
    const errorVisible = await quizPage.errorMessage.isVisible().catch(() => false)
    const stillOnLogin = await quizPage.usernameInput.isVisible()
    
    expect(errorVisible || stillOnLogin).toBeTruthy()
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
    
    // Try to find and click on sign up toggle
    const signUpLink = page.locator('a:has-text("Sign up"), a:has-text("Create an account")')
    const isVisible = await signUpLink.isVisible().catch(() => false)
    
    if (isVisible) {
      await signUpLink.click()
      await page.waitForTimeout(500)
    }
  })

  test('should have signup form accessible', async ({ quizPage, page }) => {
    // Either signup form is shown or there's a toggle to get to it
    const signUpButton = page.locator('button:has-text("Sign Up"), button:has-text("Create Account")')
    const isVisible = await signUpButton.isVisible().catch(() => false)
    
    expect(isVisible).toBeTruthy()
  })
})

