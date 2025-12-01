<script setup>
/**
 * Question statistics list component
 */

import ProgressBar from '../ui/ProgressBar.vue'
import { getCorrectRateClass } from '../../utils/questionTypes.js'

defineProps({
  questions: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['view-question'])

function getProgressVariant(percentage) {
  return getCorrectRateClass(percentage)
}
</script>

<template>
  <div class="question-stats">
    <h3>Question Statistics</h3>
    <div v-if="questions.length === 0" class="no-data">
      No question statistics available yet.
    </div>
    <div v-else class="question-stats-list">
      <div 
        v-for="(qStat, index) in questions" 
        :key="qStat.question_id"
        class="question-stat-card clickable"
        role="button"
        tabindex="0"
        @click="emit('view-question', qStat.question_id)"
        @keydown.enter="emit('view-question', qStat.question_id)"
      >
        <div class="question-stat-header">
          <span class="question-number">Question {{ index + 1 }}</span>
          <span 
            class="question-type-badge" 
            :class="qStat.question_type === 'true_false' ? 'badge-true-false' : 'badge-multiple-choice'"
          >
            {{ qStat.question_type === 'true_false' ? 'True/False' : 'Multiple Choice' }}
          </span>
        </div>
        <div class="question-stat-text">{{ qStat.question_text }}</div>
        <div class="question-stat-correct-answer">
          <span class="correct-label">Correct Answer:</span>
          <span class="correct-answer">
            {{ qStat.correct_answer_label }}. {{ qStat.correct_answer_text }}
          </span>
        </div>
        <div class="question-stat-metrics">
          <div class="metric">
            <span class="metric-label">Total Guesses:</span>
            <span class="metric-value">{{ qStat.total_guesses || 0 }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Correct Guesses:</span>
            <span class="metric-value">{{ qStat.correct_guesses || 0 }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Correct Rate:</span>
            <span class="metric-value" :class="getProgressVariant(qStat.correct_percentage)">
              {{ qStat.correct_percentage || 0 }}%
            </span>
          </div>
        </div>
        <ProgressBar 
          :percentage="qStat.correct_percentage || 0"
          :variant="getProgressVariant(qStat.correct_percentage)"
          height="8px"
        />
        <div class="view-detail-hint">Click to view answer breakdown →</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-stats {
  margin-top: 40px;
}

.question-stats h3 {
  margin-bottom: 20px;
  color: #495057;
}

.question-stats-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-stat-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.question-stat-card.clickable {
  cursor: pointer;
}

.question-stat-card.clickable:hover,
.question-stat-card.clickable:focus {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  border-color: #007bff;
  outline: none;
}

.question-stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-number {
  font-weight: 700;
  color: #495057;
  font-size: 14px;
}

.question-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-multiple-choice {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-true-false {
  background: #f3e5f5;
  color: #7b1fa2;
}

.question-stat-text {
  font-size: 16px;
  color: #495057;
  margin-bottom: 15px;
  line-height: 1.5;
}

.question-stat-correct-answer {
  margin: 12px 0;
  padding: 8px 12px;
  background: #e7f3ff;
  border-left: 3px solid #007bff;
  border-radius: 4px;
}

.correct-label {
  font-weight: 600;
  color: #495057;
  margin-right: 8px;
}

.correct-answer {
  color: #007bff;
  font-weight: 500;
}

.question-stat-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metric-label {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #495057;
}

.metric-value.high {
  color: #28a745;
}

.metric-value.medium {
  color: #ffc107;
}

.metric-value.low {
  color: #dc3545;
}

.view-detail-hint {
  text-align: center;
  margin-top: 12px;
  color: #6c757d;
  font-size: 14px;
  font-style: italic;
}

.question-stat-card.clickable:hover .view-detail-hint {
  color: #007bff;
  font-weight: 500;
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

