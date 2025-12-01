<script setup>
/**
 * Breadcrumb navigation component
 */

defineProps({
  items: {
    type: Array,
    required: true,
    validator: (items) => items.every(item => 
      typeof item.label === 'string' && 
      (item.current === true || typeof item.action === 'function' || item.action === undefined)
    )
  }
})
</script>

<template>
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <template v-for="(item, index) in items" :key="index">
      <span 
        v-if="item.current" 
        class="breadcrumb-current"
        aria-current="page"
      >
        {{ item.label }}
      </span>
      <span 
        v-else 
        class="breadcrumb-link"
        role="button"
        tabindex="0"
        @click="item.action"
        @keydown.enter="item.action"
      >
        {{ item.label }}
      </span>
      <span 
        v-if="index < items.length - 1" 
        class="breadcrumb-separator"
        aria-hidden="true"
      >
        ›
      </span>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #6c757d;
}

.breadcrumb-link {
  color: #007bff;
  cursor: pointer;
  transition: color 0.2s ease;
}

.breadcrumb-link:hover,
.breadcrumb-link:focus {
  color: #0056b3;
  text-decoration: underline;
  outline: none;
}

.breadcrumb-separator {
  color: #adb5bd;
  user-select: none;
}

.breadcrumb-current {
  color: #495057;
  font-weight: 600;
}
</style>

