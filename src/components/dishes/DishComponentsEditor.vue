<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { nutritionApi } from '../../services/api';
import type { DishComponentCreate, ProductRead } from '../../types/nutrition';

const components = defineModel<DishComponentCreate[]>({ required: true });

const products = ref<ProductRead[]>([]);

onMounted(async () => {
  try {
    products.value = await nutritionApi.getProducts();
  } catch (err) {
    console.error('Error fetching products for editor:', err);
  }
});

function addComponentRow() {
  components.value.push({
    product_id: products.value.length > 0 ? products.value[0].id : null,
    new_product: null,
    weight_g: 100,
  });
}

function addNewProductRow() {
  components.value.push({
    product_id: null,
    new_product: { name: '', available: true, note: null },
    weight_g: 100,
  });
}

function removeComponentRow(index: number) {
  components.value.splice(index, 1);
}

function switchToNew(comp: DishComponentCreate) {
  comp.new_product = { name: '', available: true, note: null };
  comp.product_id = null;
}

function switchToExisting(comp: DishComponentCreate) {
  comp.new_product = null;
  comp.product_id = products.value.length > 0 ? products.value[0].id : null;
}
</script>

<template>
  <div class="components-editor">
    <div class="section-header">
      <span class="section-title">Складники страви (необов'язково)</span>
      <div class="header-actions">
        <button type="button" class="btn-text-action" @click="addComponentRow">
          + Зі списку
        </button>
        <button type="button" class="btn-text-action" @click="addNewProductRow">
          + Новий продукт
        </button>
      </div>
    </div>

    <div v-if="components.length === 0" class="no-comps-hint">
      Складників ще не додано
    </div>

    <div
      v-for="(comp, idx) in components"
      :key="idx"
      class="comp-edit-card"
    >
      <div class="comp-edit-main">
        <!-- Existing product picker -->
        <template v-if="!comp.new_product">
          <div class="comp-input-group">
            <select
              v-model="comp.product_id"
              class="form-input comp-select"
              required
            >
              <option :value="null" disabled>-- Оберіть продукт --</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <button
              type="button"
              class="btn-toggle-mode"
              title="Створити новий продукт"
              @click="switchToNew(comp)"
            >
              Новий?
            </button>
          </div>
        </template>

        <!-- New inline product -->
        <template v-else>
          <div class="comp-input-group">
            <input
              v-model="comp.new_product.name"
              type="text"
              class="form-input comp-name-input"
              placeholder="Назва продукту"
              required
            />
            <button
              type="button"
              class="btn-toggle-mode"
              title="Обрати зі списку існуючих"
              @click="switchToExisting(comp)"
            >
              Зі списку
            </button>
          </div>
        </template>

        <!-- Weight in grams -->
        <div class="comp-weight-group">
          <input
            v-model.number="comp.weight_g"
            type="number"
            class="form-input comp-w-input num-mono"
            placeholder="Вага"
            min="1"
            required
          />
          <span class="weight-unit">г</span>
        </div>

        <button
          type="button"
          class="btn-icon del-comp-btn"
          @click="removeComponentRow(idx)"
          aria-label="Видалити складник"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.components-editor {
  margin-bottom: var(--space-16);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-8);
}

.section-title {
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  gap: var(--space-12);
}

.btn-text-action {
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  padding: var(--space-0);
  transition: opacity var(--transition-fast);
}

.btn-text-action:hover {
  text-decoration: underline;
  opacity: 0.9;
}

.no-comps-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  padding: var(--space-8) var(--space-0);
}

.comp-edit-card {
  background: var(--color-subtle-card-bg);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-control);
  padding: var(--space-6) var(--space-8);
  margin-bottom: var(--space-6);
}

.comp-edit-main {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.comp-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.comp-select {
  flex: 1;
  min-height: var(--btn-height-sm);
  font-size: var(--font-size-sub);
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  padding: var(--space-0) var(--space-8);
}

.comp-name-input {
  flex: 1;
  min-height: var(--btn-height-sm);
  font-size: var(--font-size-sub);
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  padding: var(--space-0) var(--space-8);
}

.btn-toggle-mode {
  background: var(--color-btn-outline-hover-bg);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-text-dim);
  font-size: var(--font-size-xs);
  padding: var(--space-4) var(--space-8);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.btn-toggle-mode:hover {
  color: var(--color-text-primary);
  background: var(--color-pill-hover-bg);
}

.comp-weight-group {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.comp-w-input {
  width: var(--input-width-grams);
  min-height: var(--btn-height-sm);
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-sub);
  text-align: right;
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
}

.weight-unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.del-comp-btn {
  min-width: var(--btn-size-icon);
  min-height: var(--btn-size-icon);
  padding: var(--space-0);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-dim);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.del-comp-btn:hover {
  color: var(--danger);
}
</style>
