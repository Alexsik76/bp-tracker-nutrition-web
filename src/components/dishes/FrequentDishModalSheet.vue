<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import { nutritionApi } from '../../services/api';
import { useToastStore } from '../../stores/toast';
import type {
  FrequentDishRead,
  FrequentDishUpdate,
  FrequentDishComponentCreate,
  ProductRead,
} from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  frequentDish: FrequentDishRead | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: FrequentDishUpdate): void;
  (e: 'reset-nutrition'): void;
  (e: 'delete', id: string): void;
}>();

const toastStore = useToastStore();

const products = ref<ProductRead[]>([]);
const loadingProducts = ref(false);

// Form fields
const formCookedWeightG = ref<number | null>(null);

interface ComponentRow {
  productId: string | null;
  newProduct: { name: string; stock_g: number | null } | null;
  weightG: number;
}
const components = ref<ComponentRow[]>([]);

// Nutrition fields
const formKcal = ref<number | null>(null);
const formProtein = ref<number | null>(null);
const formFat = ref<number | null>(null);
const formCarbs = ref<number | null>(null);
const formFiber = ref<number | null>(null);
const formSugar = ref<number | null>(null);
const formSodium = ref<number | null>(null);

const isNutritionManuallyEdited = ref(false);

async function loadProducts() {
  loadingProducts.value = true;
  try {
    products.value = await nutritionApi.getProducts();
  } catch (err) {
    console.error('Error fetching products for frequent dish sheet:', err);
  } finally {
    loadingProducts.value = false;
  }
}

watch(
  () => props.frequentDish,
  (fd) => {
    if (fd) {
      formCookedWeightG.value = fd.cooked_weight_g;
      components.value = (fd.components || []).map((c) => ({
        productId: c.product_id,
        newProduct: null,
        weightG: c.weight_g,
      }));

      formKcal.value = fd.kcal !== null && fd.kcal !== undefined ? Math.round(fd.kcal * 10) / 10 : null;
      formProtein.value = fd.protein_g ?? null;
      formFat.value = fd.fat_g ?? null;
      formCarbs.value = fd.carbs_g ?? null;
      formFiber.value = fd.fiber_g ?? null;
      formSugar.value = fd.sugar_g ?? null;
      formSodium.value = fd.sodium_mg ?? null;

      isNutritionManuallyEdited.value = fd.nutrition_overridden;
    }
  },
  { immediate: true }
);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      loadProducts();
    }
  }
);

function onNutritionInput() {
  isNutritionManuallyEdited.value = true;
}

function addComponentRow() {
  components.value.push({
    productId: products.value.length > 0 ? products.value[0].id : null,
    newProduct: null,
    weightG: 100,
  });
}

function removeComponentRow(index: number) {
  components.value.splice(index, 1);
}

function toggleInlineNew(comp: ComponentRow) {
  if (comp.newProduct) {
    comp.newProduct = null;
    comp.productId = products.value.length > 0 ? products.value[0].id : null;
  } else {
    comp.productId = null;
    comp.newProduct = { name: '', stock_g: null };
  }
}

function handleSubmit() {
  if (!formCookedWeightG.value || formCookedWeightG.value <= 0) {
    toastStore.show('Готова вага має бути більше 0 г', 'warning');
    return;
  }

  const cleanedComponents: FrequentDishComponentCreate[] = [];
  for (const c of components.value) {
    if (c.weightG <= 0) {
      toastStore.show('Вага складника має бути більше 0 г', 'warning');
      return;
    }
    if (c.newProduct) {
      if (!c.newProduct.name.trim()) {
        toastStore.show('Вкажіть назву нового продукту', 'warning');
        return;
      }
      cleanedComponents.push({
        new_product: {
          name: c.newProduct.name.trim(),
          stock_g: c.newProduct.stock_g ? Number(c.newProduct.stock_g) : null,
        },
        weight_g: Number(c.weightG),
      });
    } else if (c.productId) {
      cleanedComponents.push({
        product_id: c.productId,
        weight_g: Number(c.weightG),
      });
    }
  }

  if (cleanedComponents.length === 0) {
    toastStore.show('Часта страва повинна містити хоча б 1 складник', 'warning');
    return;
  }

  const payload: FrequentDishUpdate = {
    cooked_weight_g: Number(formCookedWeightG.value),
    components: cleanedComponents,
  };

  if (isNutritionManuallyEdited.value) {
    payload.kcal = formKcal.value !== null ? Number(formKcal.value) : null;
    payload.protein_g = formProtein.value !== null ? Number(formProtein.value) : null;
    payload.fat_g = formFat.value !== null ? Number(formFat.value) : null;
    payload.carbs_g = formCarbs.value !== null ? Number(formCarbs.value) : null;
    payload.fiber_g = formFiber.value !== null ? Number(formFiber.value) : null;
    payload.sugar_g = formSugar.value !== null ? Number(formSugar.value) : null;
    payload.sodium_mg = formSodium.value !== null ? Number(formSodium.value) : null;
  }

  emit('save', payload);
}
</script>

<template>
  <ModalSheet
    :show="show"
    :title="frequentDish ? `Часта страва: ${frequentDish.recipe_name}` : 'Часта страва'"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="frequent-dish-form">
      <!-- Cooked weight -->
      <div class="form-group">
        <label class="form-label" for="fdCookedWeight">Готова вага (г)</label>
        <input
          id="fdCookedWeight"
          v-model.number="formCookedWeightG"
          type="number"
          class="form-input num-mono"
          placeholder="Напр. 400"
          min="1"
          required
        />
      </div>

      <!-- Nutrition Section -->
      <div class="nutrition-box">
        <div class="nutrition-header">
          <div class="title-with-badge">
            <span class="box-title">Поживна цінність (на 100 г)</span>
            <span v-if="isNutritionManuallyEdited" class="manual-badge">
              виправлено вручну
            </span>
          </div>
          <button
            type="button"
            class="btn btn-secondary btn-sm recount-btn"
            :disabled="saving"
            @click="emit('reset-nutrition')"
          >
            Перерахувати
          </button>
        </div>

        <div class="macros-grid num-mono">
          <div class="macro-field">
            <label class="macro-label">ккал</label>
            <input
              v-model.number="formKcal"
              type="number"
              step="0.1"
              min="0"
              class="form-input macro-input"
              @input="onNutritionInput"
            />
          </div>

          <div class="macro-field">
            <label class="macro-label">Б (г)</label>
            <input
              v-model.number="formProtein"
              type="number"
              step="0.1"
              min="0"
              class="form-input macro-input"
              @input="onNutritionInput"
            />
          </div>

          <div class="macro-field">
            <label class="macro-label">Ж (г)</label>
            <input
              v-model.number="formFat"
              type="number"
              step="0.1"
              min="0"
              class="form-input macro-input"
              @input="onNutritionInput"
            />
          </div>

          <div class="macro-field">
            <label class="macro-label">В (г)</label>
            <input
              v-model.number="formCarbs"
              type="number"
              step="0.1"
              min="0"
              class="form-input macro-input"
              @input="onNutritionInput"
            />
          </div>
        </div>

        <div class="micros-row num-mono">
          <div class="macro-field">
            <label class="macro-label">Клітковина (г)</label>
            <input
              v-model.number="formFiber"
              type="number"
              step="0.1"
              min="0"
              class="form-input macro-input"
              @input="onNutritionInput"
            />
          </div>

          <div class="macro-field">
            <label class="macro-label">Цукор (г)</label>
            <input
              v-model.number="formSugar"
              type="number"
              step="0.1"
              min="0"
              class="form-input macro-input"
              @input="onNutritionInput"
            />
          </div>

          <div class="macro-field">
            <label class="macro-label">Натрій (мг)</label>
            <input
              v-model.number="formSodium"
              type="number"
              step="0.1"
              min="0"
              class="form-input macro-input"
              @input="onNutritionInput"
            />
          </div>
        </div>
      </div>

      <!-- Components Section -->
      <div class="components-box">
        <div class="components-header">
          <span class="box-title">Складники</span>
          <button
            type="button"
            class="btn-text-action"
            @click="addComponentRow"
          >
            + Додати
          </button>
        </div>

        <div v-if="components.length === 0" class="empty-hint">
          Складників немає
        </div>

        <div v-for="(comp, idx) in components" :key="idx" class="comp-card">
          <div class="comp-main-row">
            <template v-if="!comp.newProduct">
              <select
                v-model="comp.productId"
                class="form-select form-input comp-select"
                required
              >
                <option :value="null" disabled>Оберіть продукт</option>
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.name }}
                  <template v-if="p.stock_g !== null"> (запас: {{ p.stock_g }} г)</template>
                </option>
              </select>
            </template>
            <template v-else>
              <input
                v-model="comp.newProduct.name"
                type="text"
                class="form-input comp-new-input"
                placeholder="Назва нового продукту"
                required
              />
            </template>

            <button
              type="button"
              class="btn-toggle-mode"
              :title="comp.newProduct ? 'Обрати зі списку' : 'Створити новий продукт'"
              @click="toggleInlineNew(comp)"
            >
              {{ comp.newProduct ? 'Зі списку' : 'Новий' }}
            </button>
          </div>

          <div class="comp-sub-row">
            <div class="weight-box">
              <label class="sub-label">Вага:</label>
              <input
                v-model.number="comp.weightG"
                type="number"
                class="form-input num-mono weight-input"
                min="1"
                required
              />
              <span class="unit-label">г</span>
            </div>

            <div v-if="comp.newProduct" class="stock-box">
              <label class="sub-label">Запас:</label>
              <input
                v-model.number="comp.newProduct.stock_g"
                type="number"
                class="form-input num-mono weight-input"
                placeholder="г"
                min="0"
              />
              <span class="unit-label">г</span>
            </div>

            <button
              type="button"
              class="btn-icon-del"
              title="Видалити складник"
              @click="removeComponentRow(idx)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving"
        >
          {{ saving ? 'Збереження...' : 'Зберегти зміни' }}
        </button>

        <button
          v-if="frequentDish"
          type="button"
          class="btn btn-danger btn-full"
          :disabled="saving"
          @click="emit('delete', frequentDish.id)"
        >
          Видалити часту страву
        </button>
      </div>
    </form>
  </ModalSheet>
</template>

<style scoped>
.frequent-dish-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.nutrition-box,
.components-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.nutrition-header,
.components-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.box-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-primary);
}

.manual-badge {
  font-size: 11px;
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: var(--radius-pill);
  padding: 1px 7px;
  font-weight: 600;
}

.recount-btn {
  min-height: 32px;
  font-size: 12px;
  padding: 0 10px;
}

.macros-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
}

.micros-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
}

.macro-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.macro-label {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.macro-input {
  min-height: 34px;
  text-align: center;
  font-size: 12.5px;
  padding: 2px 6px;
}

.btn-text-action {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
}

.empty-hint {
  font-size: 12.5px;
  color: var(--text-muted);
  font-style: italic;
  padding: var(--space-4) 0;
}

.comp-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-control);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.comp-main-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.comp-select,
.comp-new-input {
  flex: 1;
  min-height: 36px;
}

.btn-toggle-mode {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--surface-border);
  color: var(--text-muted);
  border-radius: var(--radius-control);
  padding: 0 8px;
  min-height: 36px;
  font-size: 11.5px;
  cursor: pointer;
  white-space: nowrap;
}

.comp-sub-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-12);
}

.weight-box,
.stock-box {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sub-label {
  font-size: 12px;
  color: var(--text-muted);
}

.weight-input {
  width: 75px;
  text-align: right;
  min-height: 34px;
  padding: 4px 8px;
}

.unit-label {
  font-size: 12px;
  color: var(--text-muted);
}

.btn-icon-del {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  cursor: pointer;
}

.btn-icon-del:hover {
  color: var(--danger);
  background: var(--danger-bg-chip);
}
</style>
