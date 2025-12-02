<script setup>
/**
 * Statistics card component
 */

defineProps({
  value: {
    type: [String, Number],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  valueClass: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="stat-card">
    <div class="stat-value" :class="valueClass">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-value {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 10px;
}

.stat-value.success-text {
  color: #86efac;
}

.stat-value.error-text {
  color: #fca5a5;
}

.stat-value.high {
  color: #86efac;
}

.stat-value.medium {
  color: #fde047;
}

.stat-value.low {
  color: #fca5a5;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
