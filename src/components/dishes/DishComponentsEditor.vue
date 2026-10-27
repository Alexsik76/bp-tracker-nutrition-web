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
    product_id: null,
    new_product: null,
    weight_g: 100,
  });
}

function addNewProductRow() {
  components.value.push({
    product_id: null,
    new_product: { name: '', stock_g: null },
    weight_g: 100,
  });
}

function removeComponentRow(index: number) {
  components.value.splice(index, 1);
}

function switchToNew(comp: DishComponentCreate) {
  comp.new_product = { name: '', stock_g: null };
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
      <span class="section-title">Складники страви</span>
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
      Складників немає (для постійної страви потрібен щонайменше один)
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
                <template v-if="p.stock_g !== null"> (запас: {{ p.available_g ?? p.stock_g }} г)</template>
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
          <div class="comp-input-group new-prod-group">
            <input
              v-model="comp.new_product.name"
              type="text"
              class="form-input comp-name-input"
              placeholder="Назва продукту"
              required
            />
            <input
              v-model.number="comp.new_product.stock_g"
              type="number"
              class="form-input comp-stock-input num-mono"
              placeholder="Запас (г)"
              min="0"
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
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: var(--space-12);
}

.btn-text-action {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.btn-text-action:hover {
  text-decoration: underline;
}

.no-comps-hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: var(--space-8) 0;
}

.comp-edit-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  padding: 6px var(--space-8);
  margin-bottom: 6px;
}

.comp-edit-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comp-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.new-prod-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.comp-select {
  flex: 1;
  min-height: 38px;
  font-size: 13px;
}

.comp-name-input {
  flex: 2;
  min-height: 38px;
  font-size: 13px;
}

.comp-stock-input {
  width: 90px;
  min-height: 38px;
  font-size: 12px;
}

.btn-toggle-mode {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-pill);
  color: var(--text-dim);
  font-size: 11px;
  padding: 4px 8px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-toggle-mode:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.comp-weight-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.comp-w-input {
  width: 70px;
  min-height: 38px;
  padding: 4px 6px;
  font-size: 13px;
  text-align: right;
}

.weight-unit {
  font-size: 12px;
  color: var(--text-muted);
}

.del-comp-btn {
  min-width: 34px;
  min-height: 34px;
  color: var(--text-dim);
}

.del-comp-btn:hover {
  color: var(--danger);
}
</style>