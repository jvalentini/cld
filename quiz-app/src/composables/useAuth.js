/**
 * Authentication composable
 * Manages user authentication state and operations
 */

import { ref, computed } from 'vue'
import { supabase } from '../supabaseClient.js'
import {
  hashPassword,
  comparePassword,
  setAuthToken,
  clearAuthToken,
  getCurrentUser,
} from '../auth.js'
import { MESSAGE_TIMEOUT } from '../utils/constants.js'

// Shared reactive state (singleton pattern)
const currentUser = ref(null)
const guestMode = ref(false)
const isLoginMode = ref(true)
const authError = ref(null)
const authSuccess = ref(null)
const authLoading = ref(false)

/**
 * Authentication composable
 * @returns {Object} - Auth state and methods
 */
export function useAuth() {
  // Computed properties
  const isAuthenticated = computed(() => currentUser.value !== null)
  const isGuest = computed(() => guestMode.value)
  const canAccessFeatures = computed(() => isAuthenticated.value || isGuest.value)
  const displayName = computed(() => {
    if (!currentUser.value) return null
    return currentUser.value.fullName || currentUser.value.username
  })

  /**
   * Initialize auth state from stored token
   */
  function initializeAuth() {
    const savedUser = getCurrentUser()
    if (savedUser) {
      currentUser.value = savedUser
      console.log('User restored from token:', savedUser)
    }
  }

  /**
   * Handle successful login
   * @param {Object} user - User data from database
   */
  function handleLoginSuccess(user) {
    console.log('Login successful:', user)
    currentUser.value = {
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
    }
    guestMode.value = false
    setAuthToken(user)
    setSuccessMessage(`Welcome back, ${user.username}!`)
  }

  /**
   * Handle user logout
   */
  function handleLogout() {
    clearAuthToken()
    currentUser.value = null
    guestMode.value = false
    setSuccessMessage('Logged out successfully')
  }

  /**
   * Enable guest mode
   */
  function continueAsGuest() {
    guestMode.value = true
    setSuccessMessage("Continuing as guest - you won't appear on leaderboards")
  }

  /**
   * Clear guest mode (used when returning to login)
   */
  function clearGuestMode() {
    guestMode.value = false
  }

  /**
   * Toggle between login and signup modes
   */
  function toggleAuthMode() {
    isLoginMode.value = !isLoginMode.value
  }

  /**
   * Set error message with auto-clear
   * @param {string} message - Error message
   */
  function setErrorMessage(message) {
    authError.value = message
    if (message) {
      setTimeout(() => {
        authError.value = null
      }, MESSAGE_TIMEOUT * 2)
    }
  }

  /**
   * Set success message with auto-clear
   * @param {string} message - Success message
   */
  function setSuccessMessage(message) {
    authSuccess.value = message
    if (message) {
      setTimeout(() => {
        authSuccess.value = null
      }, MESSAGE_TIMEOUT)
    }
  }

  /**
   * Clear all auth messages
   */
  function clearMessages() {
    authError.value = null
    authSuccess.value = null
  }

  /**
   * Perform login
   * @param {string} username - Username
   * @param {string} password - Password
   */
  async function login(username, password) {
    authLoading.value = true
    authError.value = null

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, email, password_hash, full_name')
        .eq('username', username)
        .limit(1)

      if (error) throw error

      if (!users || users.length === 0) {
        setErrorMessage('Invalid username or password')
        return false
      }

      const user = users[0]
      const isValid = await comparePassword(password, user.password_hash)

      if (!isValid) {
        setErrorMessage('Invalid username or password')
        return false
      }

      handleLoginSuccess(user)
      return true
    } catch (err) {
      console.error('Login error:', err)
      setErrorMessage('Login failed. Please try again.')
      return false
    } finally {
      authLoading.value = false
    }
  }

  /**
   * Perform signup
   * @param {Object} formData - Signup form data
   */
  async function signup(formData) {
    authLoading.value = true
    authError.value = null

    try {
      // Check if username already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .limit(1)

      if (checkError) throw checkError

      if (existingUsers && existingUsers.length > 0) {
        setErrorMessage('Username already taken')
        return false
      }

      // Check if email already exists
      const { data: existingEmails, error: emailCheckError } = await supabase
        .from('users')
        .select('email')
        .eq('email', formData.email)
        .limit(1)

      if (emailCheckError) throw emailCheckError

      if (existingEmails && existingEmails.length > 0) {
        setErrorMessage('Email already registered')
        return false
      }

      // Hash password and insert user
      const passwordHash = await hashPassword(formData.password)

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username: formData.username,
          email: formData.email,
          password_hash: passwordHash,
          full_name: formData.fullName,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setSuccessMessage('Account created successfully! Logging you in...')

      // Auto-login after signup
      setTimeout(() => {
        handleLoginSuccess(newUser)
      }, 1000)

      return true
    } catch (err) {
      console.error('Signup error:', err)
      setErrorMessage(`Signup failed: ${err.message}`)
      return false
    } finally {
      authLoading.value = false
    }
  }

  return {
    // State
    currentUser,
    guestMode,
    isLoginMode,
    authError,
    authSuccess,
    authLoading,

    // Computed
    isAuthenticated,
    isGuest,
    canAccessFeatures,
    displayName,

    // Methods
    initializeAuth,
    handleLoginSuccess,
    handleLogout,
    continueAsGuest,
    clearGuestMode,
    toggleAuthMode,
    setErrorMessage,
    setSuccessMessage,
    clearMessages,
    login,
    signup,
  }
}
