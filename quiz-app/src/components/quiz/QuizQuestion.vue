<script setup>
/**
 * Quiz question display component
 */

import { computed } from 'vue'
import { getQuestionTypeLabel, getQuestionTypeBadgeClass, getAnswerLabel } from '../../utils/questionTypes.js'

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  questionIndex: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  selectedAnswer: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['select-answer'])

const typeLabel = computed(() => getQuestionTypeLabel(props.question))
const badgeClass = computed(() => getQuestionTypeBadgeClass(props.question))

function getLabel(index) {
  return getAnswerLabel(index, props.question)
}
</script>

<template>
  <div class="question-card">
    <span class="question-type-badge" :class="badgeClass">
      {{ typeLabel }}
    </span>
    <div class="question-number">
      Question {{ questionIndex + 1 }}
    </div>
    <div class="question-text">{{ question.question }}</div>

    <div class="answers" role="radiogroup" :aria-label="`Answers for question ${questionIndex + 1}`">
      <div
        v-for="(answer, index) in question.answers"
        :key="index"
        class="answer-option"
        :class="{ selected: selectedAnswer === index }"
        role="radio"
        :aria-checked="selectedAnswer === index"
        tabindex="0"
        @click="emit('select-answer', index)"
        @keydown.enter="emit('select-answer', index)"
        @keydown.space.prevent="emit('select-answer', index)"
      >
        <span class="answer-label">{{ getLabel(index) }}</span>
        <span class="answer-text">{{ answer }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-card {
  margin-bottom: 30px;
}

.question-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.badge-multiple-choice {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-true-false {
  background: #f3e5f5;
  color: #7b1fa2;
}

.question-number {
  color: #667eea;
  font-weight: 700;
  font-size: 0.9em;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.question-text {
  font-size: 1.3em;
  color: #333;
  margin-bottom: 25px;
  line-height: 1.5;
}

.answers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.answer-option {
  padding: 18px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
}

.answer-option:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.answer-option:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.answer-option.selected {
  border-color: #667eea;
  background: #f0f1ff;
  font-weight: 600;
}

.answer-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  font-weight: 700;
  flex-shrink: 0;
  padding: 0 8px;
}

.answer-option.selected .answer-label {
  background: #667eea;
  color: white;
}

.answer-text {
  flex: 1;
  color: #333;
}
</style>

