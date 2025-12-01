<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ isLogin ? '🔐 Login' : '📝 Sign Up' }}</h2>
      
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="success" class="success">{{ success }}</div>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="!isLogin" class="form-group">
          <label for="fullName">Full Name</label>
          <input
            id="fullName"
            v-model="formData.fullName"
            type="text"
            placeholder="John Doe"
            required
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
            :minlength="3"
            :maxlength="50"
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
            :minlength="6"
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
            :minlength="6"
          />
        </div>
        
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up') }}
        </button>
      </form>
      
      <div class="auth-switch">
        <p v-if="isLogin">
          Don't have an account?
          <a href="#" @click.prevent="$emit('toggle-mode')">Sign Up</a>
        </p>
        <p v-else>
          Already have an account?
          <a href="#" @click.prevent="$emit('toggle-mode')">Login</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '../supabaseClient'
import { hashPassword, comparePassword } from '../auth'

export default {
  name: 'LoginForm',
  props: {
    isLogin: {
      type: Boolean,
      default: true
    }
  },
  emits: ['login-success', 'toggle-mode'],
  data() {
    return {
      formData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
      },
      loading: false,
      error: null,
      success: null
    }
  },
  methods: {
    async handleSubmit() {
      this.error = null
      this.success = null
      
      if (this.isLogin) {
        await this.handleLogin()
      } else {
        await this.handleSignup()
      }
    },
    
    async handleLogin() {
      this.loading = true
      
      try {
        // Get user from database
        const { data: users, error } = await supabase
          .from('users')
          .select('id, username, email, password_hash, full_name')
          .eq('username', this.formData.username)
          .limit(1)
        
        if (error) throw error
        
        if (!users || users.length === 0) {
          this.error = 'Invalid username or password'
          return
        }
        
        const user = users[0]
        
        // Compare password
        const isValid = await comparePassword(this.formData.password, user.password_hash)
        
        if (!isValid) {
          this.error = 'Invalid username or password'
          return
        }
        
        // Login successful
        this.$emit('login-success', {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name
        })
        
      } catch (err) {
        console.error('Login error:', err)
        this.error = 'Login failed. Please try again.'
      } finally {
        this.loading = false
      }
    },
    
    async handleSignup() {
      // Validate passwords match
      if (this.formData.password !== this.formData.confirmPassword) {
        this.error = 'Passwords do not match'
        return
      }
      
      this.loading = true
      
      try {
        // Check if username already exists
        const { data: existingUsers, error: checkError } = await supabase
          .from('users')
          .select('username')
          .eq('username', this.formData.username)
          .limit(1)
        
        if (checkError) throw checkError
        
        if (existingUsers && existingUsers.length > 0) {
          this.error = 'Username already taken'
          return
        }
        
        // Check if email already exists
        const { data: existingEmails, error: emailCheckError } = await supabase
          .from('users')
          .select('email')
          .eq('email', this.formData.email)
          .limit(1)
        
        if (emailCheckError) throw emailCheckError
        
        if (existingEmails && existingEmails.length > 0) {
          this.error = 'Email already registered'
          return
        }
        
        // Hash password
        const passwordHash = await hashPassword(this.formData.password)
        
        // Insert user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            username: this.formData.username,
            email: this.formData.email,
            password_hash: passwordHash,
            full_name: this.formData.fullName
          })
          .select()
          .single()
        
        if (insertError) throw insertError
        
        this.success = 'Account created successfully! Logging you in...'
        
        // Auto-login after signup
        setTimeout(() => {
          this.$emit('login-success', {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            full_name: newUser.full_name
          })
        }, 1000)
        
      } catch (err) {
        console.error('Signup error:', err)
        this.error = `Signup failed: ${err.message}`
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

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

.error {
  color: #ef4444;
  padding: 12px;
  background: #fee;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.success {
  color: #10b981;
  padding: 12px;
  background: #d1fae5;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}
</style>