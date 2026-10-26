<script setup lang="ts">
import type { OffPlanEntryRead } from '../../types/nutrition';

defineProps<{
  entries: OffPlanEntryRead[];
}>();

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'delete', id: string): void;
}>();
</script>

<template>
  <div class="card offplan-card">
    <div class="section-header">
      <span>Поза планом</span>
      <button class="btn-text-action" @click="emit('add')">
        + Записати
      </button>
    </div>

    <div v-if="entries.length === 0" class="offplan-empty">
      Немає незапланованих перекусів
    </div>

    <div v-else class="offplan-list">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="offplan-row"
      >
        <div class="offplan-text-group">
          <span class="offplan-text">{{ entry.text }}</span>
          <span v-if="entry.kcal_est" class="badge badge-neutral num-mono">
            +{{ entry.kcal_est }} ккал
          </span>
        </div>
        <button
          class="btn-icon offplan-del-btn"
          @click="emit('delete', entry.id)"
          aria-label="Видалити запис"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.offplan-card {
  margin-top: var(--space-16);
}

.btn-text-action {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.offplan-empty {
  font-size: 12.5px;
  color: var(--text-muted);
  padding: var(--space-4) 0;
}

.offplan-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.offplan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-control);
}

.offplan-text-group {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.offplan-text {
  font-size: 13.5px;
  color: var(--text-primary);
}

.offplan-del-btn {
  min-width: 32px;
  min-height: 32px;
}

.offplan-del-btn:hover {
  color: var(--danger);
}
</style>
