<script setup lang="ts">
import type { DishRead, DishKind } from '../../types/nutrition';

defineProps<{
  dish: DishRead;
  activeKind: DishKind;
}>();

const emit = defineEmits<{
  (e: 'edit', dish: DishRead): void;
  (e: 'adjust-remaining', payload: { dish: DishRead; deltaG: number }): void;
  (e: 'mark-finished', dish: DishRead): void;
}>();
</script>

<template>
  <div class="card dish-card">
    <!-- Header row -->
    <div class="dish-header-row">
      <div class="dish-title-area" @click="emit('edit', dish)">
        <h3 class="dish-name">{{ dish.name }}</h3>
        <div class="dish-meta">
          <span v-if="dish.fixed_slot" class="badge badge-info">
            {{ dish.fixed_slot }}
          </span>
          <span v-if="dish.cooked_on && activeKind === 'ready'" class="cooked-date num-mono">
            Приготовлено: {{ dish.cooked_on }}
          </span>
        </div>
      </div>

      <button
        class="btn-icon edit-action-btn"
        @click="emit('edit', dish)"
        aria-label="Редагувати страву"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      </button>
    </div>

    <!-- Components section if present -->
    <div v-if="dish.components && dish.components.length > 0" class="dish-components">
      <div class="components-label">Складники:</div>
      <div class="components-chips">
        <span
          v-for="c in dish.components"
          :key="c.id"
          class="component-chip"
        >
          {{ c.name }}
          <span v-if="c.raw_weight_g || c.cooked_weight_g" class="num-mono comp-weight">
            ({{ c.cooked_weight_g ?? c.raw_weight_g }} г)
          </span>
        </span>
      </div>
    </div>

    <!-- Notes if present -->
    <div v-if="dish.notes" class="dish-notes">
      {{ dish.notes }}
    </div>

    <!-- Ready dish weight & stepper controls -->
    <div v-if="activeKind === 'ready'" class="ready-dish-actions">
      <div class="weight-display">
        <span class="weight-label">Залишок:</span>
        <span class="weight-value num-mono">
          <template v-if="dish.cooked_weight_g !== null || dish.remaining_g !== null">
            <strong>{{ dish.remaining_g ?? dish.cooked_weight_g }}</strong> / {{ dish.cooked_weight_g ?? '—' }} г
          </template>
          <template v-else>
            Без ваги
          </template>
        </span>
      </div>

      <div class="stepper-controls">
        <button
          class="btn-step"
          @click="emit('adjust-remaining', { dish, deltaG: -50 })"
          title="Відняти 50 г"
          aria-label="Відняти 50 грамів"
        >
          −50г
        </button>
        <button
          class="btn-step"
          @click="emit('adjust-remaining', { dish, deltaG: 50 })"
          title="Додати 50 г"
          aria-label="Додати 50 грамів"
        >
          +50г
        </button>
        <button
          class="btn btn-danger btn-finish"
          @click="emit('mark-finished', dish)"
        >
          Закінчилась
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dish-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-bottom: 0;
}

.dish-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.dish-title-area {
  flex: 1;
  cursor: pointer;
}

.dish-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.dish-meta {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.cooked-date {
  font-size: 12px;
  color: var(--text-muted);
}

.edit-action-btn {
  color: var(--text-muted);
}

.dish-components {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-control);
  padding: var(--space-8) var(--space-12);
}

.components-label {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.components-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.component-chip {
  font-size: 12.5px;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.comp-weight {
  color: var(--text-muted);
  font-size: 11.5px;
}

.dish-notes {
  font-size: 12.5px;
  color: var(--text-muted);
  font-style: italic;
}

.ready-dish-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
  gap: var(--space-8);
  flex-wrap: wrap;
}

.weight-display {
  display: flex;
  flex-direction: column;
}

.weight-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.weight-value {
  font-size: 14px;
  color: var(--text-primary);
}

.weight-value strong {
  color: var(--info);
}

.stepper-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-step {
  min-height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--surface-border);
  color: var(--text-primary);
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  cursor: pointer;
}

.btn-step:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-finish {
  min-height: 36px;
  padding: 0 12px;
  font-size: 12px;
}
</style>
