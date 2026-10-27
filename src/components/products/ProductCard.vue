<script setup lang="ts">
import type { ProductRead, ProductAvailability, ProductPreference } from '../../types/nutrition';

defineProps<{
  product: ProductRead;
}>();

const emit = defineEmits<{
  (e: 'edit', product: ProductRead): void;
  (e: 'cycle-availability', product: ProductRead): void;
  (e: 'cycle-preference', product: ProductRead): void;
  (e: 'estimate', product: ProductRead): void;
}>();

function getAvailabilityBadge(val: ProductAvailability) {
  if (val === 'in_stock') return { label: 'Є', cls: 'badge-success' };
  if (val === 'low') return { label: 'Мало', cls: 'badge-warning' };
  return { label: 'Немає', cls: 'badge-danger' };
}

function getPreferenceBadge(val: ProductPreference) {
  if (val === 'preferred') return { label: 'Бажано', cls: 'badge-success' };
  if (val === 'avoid') return { label: 'Уникати', cls: 'badge-danger' };
  return { label: 'Нейтрально', cls: 'badge-neutral' };
}
</script>

<template>
  <div class="card product-card">
    <div class="product-main-row">
      <div class="product-info" @click="emit('edit', product)">
        <div class="product-name">{{ product.name }}</div>
        <div class="product-badges">
          <span v-if="product.eat_raw" class="badge badge-info">Сирим</span>
          <span v-if="product.count" class="badge badge-neutral num-mono">
            {{ product.count }} шт
          </span>
          <span v-if="product.stock_g !== null && product.stock_g !== undefined" class="badge badge-neutral num-mono">
            Запас: {{ product.stock_g }} г<template v-if="product.reserved_g"> (вільно: {{ product.available_g ?? (product.stock_g - product.reserved_g) }} г, резерв: {{ product.reserved_g }} г)</template>
          </span>
        </div>
        <div v-if="product.kcal !== null && product.kcal !== undefined" class="product-nutrition num-mono">
          <span class="nutrition-kcal">≈ {{ Math.round(product.kcal) }} ккал / 100 г</span>
          <span v-if="product.protein_g !== null || product.fat_g !== null || product.carbs_g !== null" class="nutrition-macros">
            · Б: {{ product.protein_g ?? 0 }} г · Ж: {{ product.fat_g ?? 0 }} г · В: {{ product.carbs_g ?? 0 }} г
          </span>
        </div>
        <div v-else class="product-nutrition-uncalc">
          <span class="uncalc-label">КБЖВ не оцінено</span>
          <button
            type="button"
            class="btn-estimate-retry"
            @click.stop="emit('estimate', product)"
          >
            Оцінити
          </button>
        </div>
      </div>

      <button
        class="btn-icon edit-action-btn"
        @click="emit('edit', product)"
        aria-label="Редагувати продукт"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      </button>
    </div>

    <!-- Quick 1-tap toggles row -->
    <div class="quick-toggles-row">
      <button
        type="button"
        class="quick-toggle-btn"
        @click="emit('cycle-availability', product)"
        title="Натисніть для зміни наявності"
      >
        <span class="toggle-label">Наявність:</span>
        <span class="badge" :class="getAvailabilityBadge(product.availability).cls">
          {{ getAvailabilityBadge(product.availability).label }}
        </span>
      </button>

      <button
        type="button"
        class="quick-toggle-btn"
        @click="emit('cycle-preference', product)"
        title="Натисніть для зміни вподобання"
      >
        <span class="toggle-label">Бажаність:</span>
        <span class="badge" :class="getPreferenceBadge(product.preference).cls">
          {{ getPreferenceBadge(product.preference).label }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  padding: var(--space-12) var(--space-16);
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.product-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-info {
  flex: 1;
  cursor: pointer;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.product-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.edit-action-btn {
  color: var(--text-muted);
}

.quick-toggles-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
}

.quick-toggle-btn {
  flex: 1;
  min-height: var(--touch-target-min);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  padding: 0 var(--space-8);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.quick-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.toggle-label {
  font-size: 11px;
  color: var(--text-muted);
}

.product-nutrition {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: 4px;
}

.nutrition-kcal {
  color: var(--info);
  font-weight: 500;
}

.nutrition-macros {
  color: var(--text-muted);
}

.product-nutrition-uncalc {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin-top: 4px;
}

.uncalc-label {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.btn-estimate-retry {
  background: rgba(59, 130, 246, 0.15);
  color: var(--info);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-pill);
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-estimate-retry:hover {
  background: rgba(59, 130, 246, 0.25);
  border-color: var(--info);
}
</style>
