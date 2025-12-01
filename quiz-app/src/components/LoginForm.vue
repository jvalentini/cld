<script setup>
/**
 * Login/Signup form component
 * Refactored to use Composition API
 */

import { ref, computed } from 'vue'
import { supabase } from '../supabaseClient.js'
import { hashPassword, comparePassword } from '../auth.js'
import MessageAlert from './ui/MessageAlert.vue'

const props = defineProps({
  isLogin: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['login-success', 'toggle-mode'])

// Form state
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  fullName: ''
})

const loading = ref(false)
const error = ref(null)
const success = ref(null)

// Computed
const submitButtonText = computed(() => {
  if (loading.value) return 'Please wait...'
  return props.isLogin ? 'Login' : 'Sign Up'
})

const formTitle = computed(() => {
  return props.isLogin ? '🔐 Login' : '📝 Sign Up'
})

// Methods
async function handleSubmit() {
  error.value = null
  success.value = null

  if (props.isLogin) {
    await handleLogin()
  } else {
    await handleSignup()
  }
}

async function handleLogin() {
  loading.value = true

  try {
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, username, email, password_hash, full_name')
      .eq('username', formData.value.username)
      .limit(1)

    if (fetchError) throw fetchError

    if (!users || users.length === 0) {
      error.value = 'Invalid username or password'
      return
    }

    const user = users[0]
    const isValid = await comparePassword(formData.value.password, user.password_hash)

    if (!isValid) {
      error.value = 'Invalid username or password'
      return
    }

    emit('login-success', {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name
    })
  } catch (err) {
    console.error('Login error:', err)
    error.value = 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleSignup() {
  // Validate passwords match
  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    // Check if username already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', formData.value.username)
      .limit(1)

    if (checkError) throw checkError

    if (existingUsers && existingUsers.length > 0) {
      error.value = 'Username already taken'
      return
    }

    // Check if email already exists
    const { data: existingEmails, error: emailCheckError } = await supabase
      .from('users')
      .select('email')
      .eq('email', formData.value.email)
      .limit(1)

    if (emailCheckError) throw emailCheckError

    if (existingEmails && existingEmails.length > 0) {
      error.value = 'Email already registered'
      return
    }

    // Hash password
    const passwordHash = await hashPassword(formData.value.password)

    // Insert user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username: formData.value.username,
        email: formData.value.email,
        password_hash: passwordHash,
        full_name: formData.value.fullName
      })
      .select()
      .single()

    if (insertError) throw insertError

    success.value = 'Account created successfully! Logging you in...'

    // Auto-login after signup
    setTimeout(() => {
      emit('login-success', {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name
      })
    }, 1000)
  } catch (err) {
    console.error('Signup error:', err)
    error.value = `Signup failed: ${err.message}`
  } finally {
    loading.value = false
  }
}

function handleToggleMode() {
  // Reset form when toggling
  formData.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  }
  error.value = null
  success.value = null
  emit('toggle-mode')
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ formTitle }}</h2>

      <MessageAlert v-if="error" :message="error" type="error" />
      <MessageAlert v-if="success" :message="success" type="success" />

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="!isLogin" class="form-group">
          <label for="fullName">Full Name</label>
          <input
            id="fullName"
            v-model="formData.fullName"
            type="text"
            placeholder="John Doe"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="formData.username"
            type="text"
            placeholder="johndoe"
            required
            minlength="3"
            maxlength="50"
            autocomplete="username"
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="john@example.com"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
          />
        </div>

        <div v-if="!isLogin" class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ submitButtonText }}
        </button>
      </form>

      <div class="auth-switch">
        <p v-if="isLogin">
          Don't have an account?
          <a href="#" @click.prevent="handleToggleMode">Sign Up</a>
        </p>
        <p v-else>
          Already have an account?
          <a href="#" @click.prevent="handleToggleMode">Login</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 450px;
  width: 100%;
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.form-group input {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-primary {
  margin-top: 10px;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  margin-top: 20px;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}

.auth-switch a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-switch a:hover {
  text-decoration: underline;
}
</style>
