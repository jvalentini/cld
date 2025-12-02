<script setup>
/**
 * Guest access option component
 */

const emit = defineEmits(['continue-as-guest'])
</script>

<template>
  <div class="guest-access">
    <p>Or continue as guest (limited features)</p>
    <button class="btn-secondary" @click="emit('continue-as-guest')">Continue as Guest</button>
  </div>
</template>

<style scoped>
.guest-access {
  text-align: center;
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.guest-access p {
  margin-bottom: 15px;
  color: #6c757d;
}

.btn-secondary {
  padding: 12px 30px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
}
</style>
