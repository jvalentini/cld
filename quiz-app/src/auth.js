// Authentication utilities
// Simple client-side auth using bcrypt.js for password hashing

import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} - True if password matches
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

/**
 * Store auth token in localStorage
 * @param {object} user - User object
 */
export function setAuthToken(user) {
  localStorage.setItem('quiz_auth', JSON.stringify({
    userId: user.id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    timestamp: Date.now()
  }))
}

/**
 * Get current auth token from localStorage
 * @returns {object|null} - User object or null
 */
export function getAuthToken() {
  const data = localStorage.getItem('quiz_auth')
  if (!data) return null
  
  try {
    const auth = JSON.parse(data)
    // Check if token is less than 7 days old
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - auth.timestamp > sevenDays) {
      clearAuthToken()
      return null
    }
    return auth
  } catch {
    return null
  }
}

/**
 * Clear auth token from localStorage
 */
export function clearAuthToken() {
  localStorage.removeItem('quiz_auth')
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  return getAuthToken() !== null
}

/**
 * Get current user
 * @returns {object|null}
 */
export function getCurrentUser() {
  return getAuthToken()
}