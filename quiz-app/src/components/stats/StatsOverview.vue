<script setup>
/**
 * Statistics overview component
 */

import StatCard from '../ui/StatCard.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

defineProps({
  totalQuizzes: {
    type: Number,
    required: true,
  },
  totalSubmissions: {
    type: Number,
    required: true,
  },
  averageScore: {
    type: Number,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="stats-overview">
    <h3>Overall Statistics</h3>
    <LoadingSpinner v-if="loading" message="Loading statistics..." />
    <div v-else class="stats-grid">
      <StatCard :value="totalQuizzes" label="Total Quizzes" />
      <StatCard :value="totalSubmissions" label="Total Submissions" />
      <StatCard :value="`${averageScore}%`" label="Average Score" />
    </div>
  </div>
</template>

<style scoped>
.stats-overview {
  margin-bottom: 40px;
}

.stats-overview h3 {
  margin-bottom: 20px;
  color: #495057;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
</style>
