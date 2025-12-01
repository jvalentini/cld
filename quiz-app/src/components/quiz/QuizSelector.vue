<script setup>
/**
 * Quiz selection component
 */

import LoadingSpinner from '../ui/LoadingSpinner.vue'

defineProps({
  quizzes: {
    type: Array,
    required: true
  },
  selectedQuizId: {
    type: [String, Number],
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:selectedQuizId', 'load-quiz'])

function handleQuizSelect(event) {
  emit('update:selectedQuizId', event.target.value)
}
</script>

<template>
  <div class="quiz-selector">
    <h3>Select a Quiz from Database</h3>
    <LoadingSpinner v-if="loading" message="Loading quizzes..." />
    <div v-else class="selector-group">
      <select 
        :value="selectedQuizId" 
        @change="handleQuizSelect"
        aria-label="Select a quiz"
      >
        <option value="">-- Choose a quiz --</option>
        <option
          v-for="quiz in quizzes"
          :key="quiz.id"
          :value="quiz.id"
        >
          {{ quiz.name }}
        </option>
      </select>
      <button
        class="btn-load"
        @click="emit('load-quiz')"
        :disabled="!selectedQuizId"
      >
        Load Quiz
      </button>
    </div>
  </div>
</template>

<style scoped>
.quiz-selector {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9ff;
  border-radius: 12px;
}

.quiz-selector h3 {
  margin-bottom: 15px;
  color: #667eea;
}

.selector-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

select {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  cursor: pointer;
  background: white;
}

select:focus {
  outline: none;
  border-color: #667eea;
}

.btn-load {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-load:hover:not(:disabled) {
  background: #5568d3;
}

.btn-load:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

