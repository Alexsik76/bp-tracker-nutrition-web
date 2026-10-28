<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { nutritionApi } from '../../services/api';
import type { DishRead } from '../../types/nutrition';

defineProps<{
  dish: DishRead;
}>();

const emit = defineEmits<{
  (e: 'edit', dish: DishRead): void;
  (e: 'adjust-remaining', payload: { dish: DishRead; deltaG: number }): void;
  (e: 'mark-finished', dish: DishRead): void;
}>();

const productsMap = ref<Record<string, string>>({});

onMounted(async () => {
  try {
    const prods = await nutritionApi.getProducts();
    const map: Record<string, string> = {};
    for (const p of prods) {
      map[p.id] = p.name;
    }
    productsMap.value = map;
  } catch {
    // ignore
  }
});
</script>

<template>
  <div class="card dish-card">
    <!-- Header row -->
    <div class="dish-header-row">
      <div class="dish-title-area" @click="emit('edit', dish)">
        <h3 class="dish-name">{{ dish.name }}</h3>
        <div class="dish-meta">
          <span v-if="dish.cooked_on" class="cooked-date num-mono">
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

    <!-- Nutrition section if present -->
    <div v-if="dish.kcal !== null && dish.kcal !== undefined" class="dish-nutrition num-mono">
      <span class="dish-kcal">{{ Math.round(dish.kcal) }} ккал / 100 г</span>
      <span v-if="dish.protein_g !== null || dish.fat_g !== null || dish.carbs_g !== null" class="dish-macros">
        · Б: {{ dish.protein_g ?? 0 }} г · Ж: {{ dish.fat_g ?? 0 }} г · В: {{ dish.carbs_g ?? 0 }} г
      </span>
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
          {{ productsMap[c.product_id] || 'Продукт' }}
          <span class="num-mono comp-weight">
            ({{ c.weight_g }} г)
          </span>
        </span>
      </div>
    </div>

    <!-- Notes if present -->
    <div v-if="dish.notes" class="dish-notes">
      {{ dish.notes }}
    </div>

    <!-- Ready dish weight & stepper controls -->
    <div class="ready-dish-actions">
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
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.dish-meta {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 12px;
}

.cooked-date {
  color: var(--text-muted);
}

.edit-action-btn {
  color: var(--text-muted);
}

.dish-nutrition {
  font-size: 12.5px;
  color: var(--text-dim);
}

.dish-kcal {
  color: var(--info);
  font-weight: 600;
}

.dish-macros {
  color: var(--text-muted);
}

.dish-components {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.components-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.components-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.component-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  color: var(--text-primary);
}

.comp-weight {
  color: var(--text-muted);
  font-size: 11px;
}

.dish-notes {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  background: rgba(255, 255, 255, 0.02);
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-control);
}

.ready-dish-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
}

.weight-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
}

.weight-label {
  color: var(--text-muted);
}

.weight-value {
  color: var(--text-primary);
}

.stepper-controls {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.btn-step {
  height: 32px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-step:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-finish {
  height: 32px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
}
</style>
