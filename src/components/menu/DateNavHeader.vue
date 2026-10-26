<script setup lang="ts">
import { formatFriendlyDate } from '../../utils/date';

defineProps<{
  currentDate: string;
}>();

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'today'): void;
}>();
</script>

<template>
  <div class="date-header card">
    <button class="btn-icon date-nav-btn" @click="emit('prev')" aria-label="Попередній день">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    <div class="date-display" @click="emit('today')" title="Натисніть для переходу на сьогодні">
      <span class="friendly-date">{{ formatFriendlyDate(currentDate) }}</span>
      <span class="exact-date num-mono">{{ currentDate }}</span>
    </div>

    <button class="btn-icon date-nav-btn" @click="emit('next')" aria-label="Наступний день">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-12);
  margin-bottom: var(--space-12);
}

.date-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.friendly-date {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.exact-date {
  font-size: 11.5px;
  color: var(--text-muted);
}

.date-nav-btn {
  color: var(--primary);
}
</style>
