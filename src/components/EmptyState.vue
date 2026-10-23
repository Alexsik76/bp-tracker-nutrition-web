<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  actionLabel?: string;
}>();

defineEmits<{
  (e: 'action'): void;
}>();
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </slot>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p v-if="description" class="empty-desc">{{ description }}</p>
    <button
      v-if="actionLabel"
      class="btn btn-primary empty-action"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-28) var(--space-16);
  border: 1px dashed var(--surface-border);
  border-radius: var(--radius-card);
  background-color: rgba(255, 255, 255, 0.02);
  margin-bottom: var(--space-16);
}

.empty-icon {
  color: var(--text-dim);
  margin-bottom: var(--space-12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
}

.empty-desc {
  font-size: 13.5px;
  color: var(--text-muted);
  max-width: 280px;
  margin-bottom: var(--space-16);
  line-height: 1.4;
}

.empty-action {
  width: auto;
}
</style>
