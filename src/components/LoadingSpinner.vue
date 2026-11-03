<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: number;
    text?: string;
  }>(),
  {
    size: 28,
    text: '',
  }
);
</script>

<template>
  <div class="spinner-wrap">
    <div
      class="spinner"
      :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    ></div>
    <span v-if="props.text" class="spinner-text">{{ props.text }}</span>
  </div>
</template>

<style scoped>
.spinner-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-28) var(--space-16);
  gap: var(--space-12);
}

.spinner {
  border: var(--spinner-border-width) solid var(--color-spinner-track);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin var(--spinner-duration) linear infinite;
}

.spinner-text {
  font-size: var(--font-size-sub);
  color: var(--text-muted);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
