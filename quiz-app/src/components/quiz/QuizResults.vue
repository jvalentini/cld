<script setup>
/**
 * Quiz results display component
 */

import {
  getQuestionTypeLabel,
  getQuestionTypeBadgeClass,
  getAnswerLabel,
} from '../../utils/questionTypes.js'

defineProps({
  questions: {
    type: Array,
    required: true,
  },
  userAnswers: {
    type: Array,
    required: true,
  },
  correctAnswers: {
    type: Array,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  scorePercentage: {
    type: Number,
    required: true,
  },
  multipleChoiceScore: {
    type: Object,
    default: () => ({ total: 0, correct: 0 }),
  },
  trueFalseScore: {
    type: Object,
    default: () => ({ total: 0, correct: 0 }),
  },
})

const emit = defineEmits(['reset'])

function getTypeBadgeClass(question) {
  return getQuestionTypeBadgeClass(question)
}

function getTypeLabel(question) {
  return getQuestionTypeLabel(question)
}

function getLabel(index, question) {
  return getAnswerLabel(index, question)
}
</script>

<template>
  <div class="results">
    <h2>🎉 Quiz Complete!</h2>
    <div class="score">{{ score }} / {{ questions.length }}</div>
    <p class="subtitle">{{ scorePercentage }}% Correct</p>

    <div v-if="multipleChoiceScore.total > 0 || trueFalseScore.total > 0" class="score-breakdown">
      <div v-if="multipleChoiceScore.total > 0" class="score-item">
        <div class="score-value">{{ multipleChoiceScore.correct }}</div>
        <div class="score-label">Multiple Choice Correct</div>
      </div>
      <div v-if="trueFalseScore.total > 0" class="score-item">
        <div class="score-value">{{ trueFalseScore.correct }}</div>
        <div class="score-label">True/False Correct</div>
      </div>
    </div>

    <div class="results-detail">
      <h3>Review Your Answers</h3>
      <div v-for="(question, qIndex) in questions" :key="qIndex" class="result-item">
        <div class="result-header">
          <span class="question-type-badge" :class="getTypeBadgeClass(question)">
            {{ getTypeLabel(question) }}
          </span>
        </div>
        <div class="result-question">{{ qIndex + 1 }}. {{ question.question }}</div>
        <div
          class="result-answer"
          :class="{
            correct: userAnswers[qIndex] === correctAnswers[qIndex],
            incorrect: userAnswers[qIndex] !== correctAnswers[qIndex],
          }"
        >
          Your answer: {{ getLabel(userAnswers[qIndex], question) }}.
          {{ question.answers[userAnswers[qIndex]] }}
          <span v-if="userAnswers[qIndex] === correctAnswers[qIndex]">✓</span>
          <span v-else>
            ✗ (Correct: {{ getLabel(correctAnswers[qIndex], question) }}.
            {{ question.answers[correctAnswers[qIndex]] }})
          </span>
        </div>
      </div>
    </div>

    <button class="btn-primary reset-btn" @click="emit('reset')">Take Another Quiz</button>
  </div>
</template>

<style scoped>
.results {
  text-align: center;
}

.score {
  font-size: 3em;
  color: #667eea;
  font-weight: 700;
  margin: 30px 0;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1em;
}

.score-breakdown {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.score-item {
  text-align: center;
}

.score-value {
  font-size: 1.8em;
  font-weight: 700;
  color: #667eea;
}

.score-label {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

.results-detail {
  margin-top: 40px;
  text-align: left;
}

.results-detail h3 {
  margin-bottom: 20px;
}

.result-item {
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 10px;
  background: #f8f9ff;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
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

.result-question {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.result-answer {
  color: #666;
  padding-left: 20px;
}

.result-answer.correct {
  color: #10b981;
}

.result-answer.incorrect {
  color: #ef4444;
}

.btn-primary {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.reset-btn {
  margin-top: 20px;
}
</style>
