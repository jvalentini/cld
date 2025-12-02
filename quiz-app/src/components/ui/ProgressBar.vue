<script setup>
/**
 * Progress bar component
 */

defineProps({
  percentage: {
    type: Number,
    required: true,
    validator: value => value >= 0 && value <= 100,
  },
  variant: {
    type: String,
    default: 'default',
    validator: value => ['default', 'high', 'medium', 'low'].includes(value),
  },
  height: {
    type: String,
    default: '12px',
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="progress-wrapper">
    <div
      class="progress-bar"
      :style="{ height }"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="progress-fill"
        :class="`progress-${variant}`"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
    <span v-if="showLabel" class="progress-label">{{ percentage }}%</span>
  </div>
</template>

<style scoped>
.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-default {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.progress-high {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.progress-medium {
  background: linear-gradient(90deg, #ffc107, #ff9800);
}

.progress-low {
  background: linear-gradient(90deg, #dc3545, #c82333);
}

.progress-label {
  min-width: 45px;
  text-align: right;
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}
</style>
