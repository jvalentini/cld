<script setup>
/**
 * Loading spinner component
 */

defineProps({
  message: {
    type: String,
    default: 'Loading...',
  },
})
</script>

<template>
  <div class="loading" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    {{ message }}
  </div>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
