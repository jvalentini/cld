<script setup>
/**
 * Application header component with navigation
 */

defineProps({
  currentUser: {
    type: Object,
    default: null,
  },
  showQuizNav: {
    type: Boolean,
    default: false,
  },
  showLeaderboardNav: {
    type: Boolean,
    default: true,
  },
  showStatsNav: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['navigate-quiz', 'navigate-leaderboard', 'navigate-stats', 'logout'])
</script>

<template>
  <header class="header-modern">
    <!-- Row 1: Branding -->
    <div class="header-top">
      <div class="brand-section">
        <h1>📝 Quiz App</h1>
        <p class="subtitle">Test your knowledge</p>
      </div>
    </div>

    <!-- Row 2: Navigation and User Info -->
    <div class="header-bottom">
      <nav class="nav-section" aria-label="Main navigation">
        <button v-if="showQuizNav" class="btn-nav" @click="emit('navigate-quiz')">
          🏠 Take Quiz
        </button>
        <button v-if="showLeaderboardNav" class="btn-nav" @click="emit('navigate-leaderboard')">
          🏆 Leaderboard
        </button>
        <button v-if="showStatsNav" class="btn-nav" @click="emit('navigate-stats')">
          📊 Statistics
        </button>
      </nav>

      <div v-if="currentUser" class="user-section">
        <div class="user-info">
          <span class="user-icon" aria-hidden="true">👤</span>
          <span class="user-name">{{ currentUser.fullName || currentUser.username }}</span>
        </div>
        <button class="btn-logout" @click="emit('logout')">Logout</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-modern {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  overflow: hidden;
}

.header-top {
  padding: 30px 30px 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.brand-section h1 {
  color: white;
  margin: 0;
  font-size: 2.5em;
}

.brand-section .subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 5px 0 0 0;
  font-size: 1.1em;
}

.header-bottom {
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.nav-section {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-nav {
  padding: 10px 20px;
  background: white;
  border: none;
  border-radius: 8px;
  color: #667eea;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-nav:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.user-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: white;
}

.user-icon {
  font-size: 18px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
}

.btn-logout {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.95);
  color: #dc3545;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: white;
  transform: scale(1.05);
}
</style>
