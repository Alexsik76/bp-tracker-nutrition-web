<script setup lang="ts">
import type { ProductRead, ProductAvailability, ProductPreference } from '../../types/nutrition';

defineProps<{
  product: ProductRead;
}>();

const emit = defineEmits<{
  (e: 'edit', product: ProductRead): void;
  (e: 'cycle-availability', product: ProductRead): void;
  (e: 'cycle-preference', product: ProductRead): void;
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
          <span v-if="product.daily_limit_g" class="badge badge-warning num-mono">
            Ліміт: {{ product.daily_limit_g }} г/день
          </span>
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
</style>
