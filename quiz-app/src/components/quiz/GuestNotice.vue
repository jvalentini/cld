<script setup>
/**
 * Guest mode notice component
 */

const emit = defineEmits(['login'])
</script>

<template>
  <div class="guest-notice">
    <p>
      📝 You're browsing as a guest.
      <a href="#" @click.prevent="emit('login')">Log in</a>
      to upload quizzes and track your scores on the leaderboard.
    </p>
  </div>
</template>

<style scoped>
.guest-notice {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.guest-notice p {
  margin: 0;
  color: #856404;
}

.guest-notice a {
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.guest-notice a:hover {
  color: #5568d3;
}
</style>
