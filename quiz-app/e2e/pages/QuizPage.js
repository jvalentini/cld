/**
 * Page Object Model for Quiz App
 * Encapsulates page interactions for cleaner, more maintainable tests
 */

export class QuizPage {
  constructor(page) {
    this.page = page
    
    // Header elements
    this.header = page.locator('h1')
    this.quizNavButton = page.locator('button:has-text("Quiz")')
    this.leaderboardNavButton = page.locator('button:has-text("Leaderboard")')
    this.statsNavButton = page.locator('button:has-text("Stats")')
    this.logoutButton = page.locator('button:has-text("Logout")')
    
    // Login/Auth elements
    this.loginForm = page.locator('.login-form, .auth-form')
    this.usernameInput = page.locator('input[placeholder*="Username"], input[name="username"]')
    this.passwordInput = page.locator('input[type="password"]')
    this.loginButton = page.locator('button:has-text("Log In"), button:has-text("Login")')
    this.signupButton = page.locator('button:has-text("Sign Up")')
    this.toggleAuthModeLink = page.locator('a:has-text("Sign up"), a:has-text("Log in")')
    
    // Guest mode
    this.guestAccessSection = page.locator('.guest-access')
    this.continueAsGuestButton = page.locator('button:has-text("Continue as Guest")')
    this.guestNotice = page.locator('.guest-notice')
    
    // Quiz selector
    this.quizSelector = page.locator('.quiz-selector')
    this.quizDropdown = page.locator('select')
    this.loadQuizButton = page.locator('button:has-text("Load Quiz"), button:has-text("Start Quiz")')
    
    // Quiz in progress
    this.questionCard = page.locator('.question-card')
    this.questionText = page.locator('.question-text, .question-card h3')
    this.answerButtons = page.locator('.answer-btn, .answer-option')
    this.progressBar = page.locator('.progress-bar')
    this.progressText = page.locator('.progress-text')
    this.prevButton = page.locator('button:has-text("Previous")')
    this.nextButton = page.locator('button:has-text("Next")')
    this.finishButton = page.locator('button:has-text("Finish")')
    
    // Quiz results
    this.resultsSection = page.locator('.results, .quiz-results')
    this.scoreDisplay = page.locator('.score, .score-percentage')
    this.restartButton = page.locator('button:has-text("Try Again"), button:has-text("Start Over"), button:has-text("Restart")')
    
    // Messages
    this.errorMessage = page.locator('.error, .message-alert.error')
    this.successMessage = page.locator('.success, .message-alert.success')
    
    // Stats page
    this.statsOverview = page.locator('.stats-overview')
    this.quizStatsList = page.locator('.quiz-stats-list')
    
    // Leaderboard
    this.leaderboardTable = page.locator('.leaderboard, table')
    
    // Loading states
    this.loadingSpinner = page.locator('.loading, .loading-spinner')
  }

  async goto() {
    await this.page.goto('/')
  }

  async waitForAppLoad() {
    await this.header.waitFor({ state: 'visible' })
  }

  // Authentication methods
  async login(username, password) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async continueAsGuest() {
    await this.continueAsGuestButton.click()
  }

  async logout() {
    await this.logoutButton.click()
  }

  // Navigation methods
  async navigateToQuiz() {
    await this.quizNavButton.click()
  }

  async navigateToLeaderboard() {
    await this.leaderboardNavButton.click()
  }

  async navigateToStats() {
    await this.statsNavButton.click()
  }

  // Quiz interaction methods
  async selectQuiz(quizName) {
    await this.quizDropdown.selectOption({ label: quizName })
  }

  async loadSelectedQuiz() {
    await this.loadQuizButton.click()
  }

  async selectAnswer(answerIndex) {
    const answers = await this.answerButtons.all()
    if (answerIndex < answers.length) {
      await answers[answerIndex].click()
    }
  }

  async selectAnswerByText(answerText) {
    await this.page.locator(`.answer-btn:has-text("${answerText}"), .answer-option:has-text("${answerText}")`).click()
  }

  async goToNextQuestion() {
    await this.nextButton.click()
  }

  async goToPreviousQuestion() {
    await this.prevButton.click()
  }

  async finishQuiz() {
    await this.finishButton.click()
  }

  async restartQuiz() {
    await this.restartButton.click()
  }

  // Utility methods
  async getCurrentQuestionNumber() {
    const text = await this.progressText.textContent()
    const match = text.match(/Question (\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  async getTotalQuestions() {
    const text = await this.progressText.textContent()
    const match = text.match(/of (\d+)/)
    return match ? parseInt(match[1]) : 0
  }

  async getScore() {
    const scoreText = await this.scoreDisplay.textContent()
    const match = scoreText.match(/(\d+)%?/)
    return match ? parseInt(match[1]) : 0
  }

  async isQuizInProgress() {
    return await this.questionCard.isVisible()
  }

  async isQuizCompleted() {
    return await this.resultsSection.isVisible()
  }

  async isLoggedIn() {
    return await this.logoutButton.isVisible()
  }

  async isInGuestMode() {
    return await this.guestNotice.isVisible()
  }

  async waitForQuizToLoad() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
    await this.page.waitForTimeout(500) // Brief pause for UI to settle
  }

  async completeQuizRandomly() {
    while (await this.questionCard.isVisible()) {
      // Select a random answer
      const answerCount = await this.answerButtons.count()
      const randomIndex = Math.floor(Math.random() * answerCount)
      await this.selectAnswer(randomIndex)
      
      // Move to next question or finish
      if (await this.finishButton.isVisible()) {
        await this.finishQuiz()
        break
      } else if (await this.nextButton.isVisible()) {
        await this.goToNextQuestion()
      }
    }
  }

  async completeQuizCorrectly(correctAnswers) {
    for (let i = 0; i < correctAnswers.length; i++) {
      await this.selectAnswer(correctAnswers[i])
      
      if (i < correctAnswers.length - 1) {
        await this.goToNextQuestion()
      } else {
        await this.finishQuiz()
      }
    }
  }
}

