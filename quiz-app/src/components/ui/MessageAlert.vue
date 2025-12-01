<script setup>
/**
 * Alert message component for errors and success messages
 */

defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['error', 'success', 'info', 'warning'].includes(value)
  }
})
</script>

<template>
  <div 
    v-if="message" 
    class="alert" 
    :class="`alert-${type}`"
    role="alert"
  >
    {{ message }}
  </div>
</template>

<style scoped>
.alert {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert-error {
  color: #ef4444;
  background: #fee;
}

.alert-success {
  color: #10b981;
  background: #d1fae5;
}

.alert-info {
  color: #3b82f6;
  background: #dbeafe;
}

.alert-warning {
  color: #856404;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}
</style>

