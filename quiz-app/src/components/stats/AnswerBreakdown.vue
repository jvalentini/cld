<script setup>
/**
 * Answer breakdown component for question detail view
 */

import ProgressBar from '../ui/ProgressBar.vue'

defineProps({
  answers: {
    type: Array,
    required: true
  },
  totalGuesses: {
    type: Number,
    required: true
  }
})

function getAnswerPercentage(guesses, total) {
  if (!total) return 0
  return Math.round((guesses / total) * 100)
}
</script>

<template>
  <div class="answer-breakdown">
    <h3>Answer Breakdown</h3>
    <div class="answer-stats-list">
      <div 
        v-for="answer in answers" 
        :key="answer.answer_id"
        class="answer-stat-card"
        :class="{ 'correct-answer': answer.is_correct }"
      >
        <div class="answer-header">
          <div class="answer-label-section">
            <span class="answer-label-badge">{{ answer.answer_label }}</span>
            <span v-if="answer.is_correct" class="correct-badge">✓ Correct Answer</span>
          </div>
          <div class="answer-guesses">
            <span class="guess-count">{{ answer.guesses || 0 }}</span>
            <span class="guess-label">guesses</span>
          </div>
        </div>
        <div class="answer-text">{{ answer.answer_text }}</div>
        <div class="answer-stats-bar">
          <ProgressBar 
            :percentage="getAnswerPercentage(answer.guesses, totalGuesses)"
            :variant="answer.is_correct ? 'high' : 'low'"
            height="24px"
            showLabel
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.answer-breakdown {
  margin-top: 30px;
}

.answer-breakdown h3 {
  margin-bottom: 20px;
  color: #495057;
}

.answer-stats-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.answer-stat-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s ease;
}

.answer-stat-card.correct-answer {
  border-color: #28a745;
  background: linear-gradient(to right, #f0fff4 0%, white 100%);
}

.answer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.answer-label-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.answer-label-badge {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: #007bff;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 16px;
}

.answer-stat-card.correct-answer .answer-label-badge {
  background: #28a745;
}

.correct-badge {
  padding: 4px 12px;
  background: #28a745;
  color: white;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.answer-guesses {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.guess-count {
  font-size: 28px;
  font-weight: 700;
  color: #343a40;
  line-height: 1;
}

.guess-label {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.answer-text {
  font-size: 16px;
  color: #495057;
  margin-bottom: 15px;
  padding-left: 42px;
}

.answer-stats-bar {
  padding-left: 42px;
}
</style>

