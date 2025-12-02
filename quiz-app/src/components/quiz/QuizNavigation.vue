<script setup>
/**
 * Quiz navigation buttons component
 */

defineProps({
  isFirstQuestion: {
    type: Boolean,
    required: true,
  },
  isLastQuestion: {
    type: Boolean,
    required: true,
  },
  canProceed: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['previous', 'next', 'finish'])
</script>

<template>
  <div class="navigation">
    <button class="btn-secondary" :disabled="isFirstQuestion" @click="emit('previous')">
      ← Previous
    </button>
    <button
      v-if="!isLastQuestion"
      class="btn-primary"
      :disabled="!canProceed"
      @click="emit('next')"
    >
      Next →
    </button>
    <button v-else class="btn-primary" :disabled="!canProceed" @click="emit('finish')">
      Finish Quiz
    </button>
  </div>
</template>

<style scoped>
.navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  gap: 15px;
}

button {
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
