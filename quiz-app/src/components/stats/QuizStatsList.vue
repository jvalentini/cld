<script setup>
/**
 * Quiz statistics list component
 */

defineProps({
  quizzes: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['view-quiz'])
</script>

<template>
  <div class="quiz-stats-list">
    <h3>Individual Quizzes</h3>
    <div v-if="quizzes.length === 0" class="no-data">
      No quiz statistics available yet. Take some quizzes to see statistics!
    </div>
    <div v-else class="quiz-cards">
      <div
        v-for="quiz in quizzes"
        :key="quiz.quiz_id"
        class="quiz-stat-card"
        role="button"
        tabindex="0"
        @click="emit('view-quiz', quiz.quiz_id)"
        @keydown.enter="emit('view-quiz', quiz.quiz_id)"
      >
        <div class="quiz-stat-header">
          <h4>{{ quiz.quiz_name }}</h4>
          <span class="view-link">View Details →</span>
        </div>
        <div class="quiz-stat-body">
          <div class="quiz-stat-item">
            <span class="label">Questions:</span>
            <span class="value">{{ quiz.total_questions || 0 }}</span>
          </div>
          <div class="quiz-stat-item">
            <span class="label">Submissions:</span>
            <span class="value">{{ quiz.total_submissions || 0 }}</span>
          </div>
          <div class="quiz-stat-item">
            <span class="label">Average Score:</span>
            <span class="value">{{ quiz.average_score || 0 }}%</span>
          </div>
          <div class="quiz-stat-item">
            <span class="label">Highest Score:</span>
            <span class="value">{{ quiz.highest_score || 0 }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-stats-list {
  margin-top: 40px;
}

.quiz-stats-list h3 {
  margin-bottom: 20px;
  color: #495057;
}

.quiz-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.quiz-stat-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quiz-stat-card:hover,
.quiz-stat-card:focus {
  border-color: #007bff;
  box-shadow: 0 8px 16px rgba(0, 123, 255, 0.1);
  transform: translateY(-4px);
  outline: none;
}

.quiz-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.quiz-stat-header h4 {
  margin: 0;
  color: #495057;
  font-size: 18px;
}

.view-link {
  color: #007bff;
  font-size: 14px;
  font-weight: 600;
}

.quiz-stat-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quiz-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.quiz-stat-item .label {
  color: #6c757d;
  font-size: 14px;
}

.quiz-stat-item .value {
  color: #495057;
  font-weight: 600;
  font-size: 16px;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
  font-size: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}
</style>
