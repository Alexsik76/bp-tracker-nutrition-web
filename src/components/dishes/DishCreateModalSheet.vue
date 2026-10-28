<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import { nutritionApi } from '../../services/api';
import { useToastStore } from '../../stores/toast';
import { formatLocalDate } from '../../utils/date';
import type {
  RecipeRead,
  ProductRead,
  DishCreate,
  DishComponentCreate,
} from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: { data: DishCreate; saveAsFrequent: boolean }): void;
}>();

const toastStore = useToastStore();

const recipes = ref<RecipeRead[]>([]);
const products = ref<ProductRead[]>([]);
const loadingData = ref(false);

// Form state
const selectedRecipeMode = ref<'existing' | 'new'>('new');
const selectedRecipeId = ref<string>('');
const newRecipeName = ref('');
const cookedWeightG = ref<number | null>(null);
const cookedOn = ref(formatLocalDate());
const notes = ref('');

// Recipe components (weights for base recipe products)
interface RecipeProductRow {
  productId: string;
  name: string;
  weightG: number;
}
const recipeRows = ref<RecipeProductRow[]>([]);

// Extra components (up to 3)
interface ExtraProductRow {
  productId: string | null;
  newProduct: { name: string; stock_g: number | null } | null;
  weightG: number;
}
const extraRows = ref<ExtraProductRow[]>([]);

// Checkboxes
const saveAsNewRecipe = ref(false);
const saveAsFrequent = ref(false);

const canAddExtra = computed(() => extraRows.value.length < 3);

async function loadInitialData() {
  loadingData.value = true;
  try {
    const [recs, prods] = await Promise.all([
      nutritionApi.getRecipes(false),
      nutritionApi.getProducts(),
    ]);
    recipes.value = recs;
    products.value = prods;

    if (recs.length > 0) {
      selectedRecipeMode.value = 'existing';
      selectedRecipeId.value = recs[0].id;
      initRecipeProducts(recs[0]);
    } else {
      selectedRecipeMode.value = 'new';
      selectedRecipeId.value = '';
      recipeRows.value = [];
    }
  } catch (err) {
    console.error('Error loading recipes/products for dish create:', err);
  } finally {
    loadingData.value = false;
  }
}

function initRecipeProducts(recipe: RecipeRead) {
  const pMap = new Map(products.value.map((p) => [p.id, p.name]));
  recipeRows.value = recipe.product_ids.map((pid) => ({
    productId: pid,
    name: pMap.get(pid) || 'Продукт',
    weightG: 100,
  }));
}

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      cookedOn.value = formatLocalDate();
      notes.value = '';
      extraRows.value = [];
      saveAsNewRecipe.value = false;
      saveAsFrequent.value = false;
      loadInitialData();
    }
  }
);

watch(selectedRecipeId, (newId) => {
  if (selectedRecipeMode.value === 'existing') {
    const r = recipes.value.find((rec) => rec.id === newId);
    if (r) {
      initRecipeProducts(r);
    }
  }
});

watch(selectedRecipeMode, (mode) => {
  if (mode === 'new') {
    recipeRows.value = [];
    saveAsNewRecipe.value = true;
  } else {
    saveAsNewRecipe.value = false;
    if (recipes.value.length > 0) {
      if (!selectedRecipeId.value) {
        selectedRecipeId.value = recipes.value[0].id;
      }
      const r = recipes.value.find((rec) => rec.id === selectedRecipeId.value);
      if (r) initRecipeProducts(r);
    }
  }
});

function addExtraRow() {
  if (!canAddExtra.value) {
    toastStore.show('Максимум 3 додаткових продукти', 'warning');
    return;
  }
  extraRows.value.push({
    productId: products.value.length > 0 ? products.value[0].id : null,
    newProduct: null,
    weightG: 50,
  });
}

function removeExtraRow(index: number) {
  extraRows.value.splice(index, 1);
}

function toggleExtraInlineNew(row: ExtraProductRow) {
  if (row.newProduct) {
    row.newProduct = null;
    row.productId = products.value.length > 0 ? products.value[0].id : null;
  } else {
    row.productId = null;
    row.newProduct = { name: '', stock_g: null };
  }
}

// For 'new' recipe mode: user can add products into recipeRows too
function addNewRecipeProductRow() {
  if (products.value.length === 0) return;
  const p = products.value[0];
  recipeRows.value.push({
    productId: p.id,
    name: p.name,
    weightG: 100,
  });
}

function removeNewRecipeProductRow(index: number) {
  recipeRows.value.splice(index, 1);
}

function onRecipeProductChange(index: number, newPid: string) {
  const p = products.value.find((prod) => prod.id === newPid);
  if (p) {
    recipeRows.value[index].productId = p.id;
    recipeRows.value[index].name = p.name;
  }
}

function handleSubmit() {
  const isCreatingNewRecipe = selectedRecipeMode.value === 'new' || saveAsNewRecipe.value;

  if (isCreatingNewRecipe && !newRecipeName.value.trim()) {
    toastStore.show('Вкажіть назву нового рецепту', 'warning');
    return;
  }

  if (!isCreatingNewRecipe && !selectedRecipeId.value) {
    toastStore.show('Оберіть рецепт', 'warning');
    return;
  }

  if (!cookedWeightG.value || cookedWeightG.value <= 0) {
    toastStore.show('Готова вага має бути більше 0 г', 'warning');
    return;
  }

  // Collect all components
  const components: DishComponentCreate[] = [];

  for (const r of recipeRows.value) {
    if (r.weightG <= 0) {
      toastStore.show(`Вкажіть вагу для продукту «${r.name}»`, 'warning');
      return;
    }
    components.push({
      product_id: r.productId,
      weight_g: Number(r.weightG),
    });
  }

  for (const extra of extraRows.value) {
    if (extra.weightG <= 0) {
      toastStore.show('Вага додаткового продукту має бути більше 0', 'warning');
      return;
    }
    if (extra.newProduct) {
      if (!extra.newProduct.name.trim()) {
        toastStore.show('Вкажіть назву нового продукту', 'warning');
        return;
      }
      components.push({
        new_product: {
          name: extra.newProduct.name.trim(),
          stock_g: extra.newProduct.stock_g ? Number(extra.newProduct.stock_g) : null,
        },
        weight_g: Number(extra.weightG),
      });
    } else if (extra.productId) {
      components.push({
        product_id: extra.productId,
        weight_g: Number(extra.weightG),
      });
    }
  }

  if (components.length === 0) {
    toastStore.show('Додайте хоча б один складник до страви', 'warning');
    return;
  }

  const payload: DishCreate = {
    cooked_weight_g: Number(cookedWeightG.value),
    remaining_g: Number(cookedWeightG.value),
    cooked_on: cookedOn.value || null,
    notes: notes.value.trim() || null,
    components,
  };

  if (isCreatingNewRecipe) {
    payload.new_recipe = { name: newRecipeName.value.trim() };
    payload.name = newRecipeName.value.trim();
  } else {
    payload.recipe_id = selectedRecipeId.value;
    const r = recipes.value.find((rec) => rec.id === selectedRecipeId.value);
    if (r) payload.name = r.name;
  }

  emit('save', { data: payload, saveAsFrequent: saveAsFrequent.value });
}
</script>

<template>
  <ModalSheet
    :show="show"
    title="Приготувати страву"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="dish-create-form">
      <!-- Recipe Mode Selection -->
      <div class="form-group">
        <label class="form-label">Рецепт</label>
        <div class="recipe-mode-toggle">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: selectedRecipeMode === 'existing' }"
            :disabled="recipes.length === 0"
            @click="selectedRecipeMode = 'existing'"
          >
            Обрати рецепт
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: selectedRecipeMode === 'new' }"
            @click="selectedRecipeMode = 'new'"
          >
            + Новий рецепт
          </button>
        </div>
      </div>

      <!-- Existing Recipe Picker -->
      <div v-if="selectedRecipeMode === 'existing'" class="form-group">
        <label class="form-label" for="existingRecipeSelect">Виберіть рецепт</label>
        <select
          id="existingRecipeSelect"
          v-model="selectedRecipeId"
          class="form-select form-input"
          required
        >
          <option v-for="r in recipes" :key="r.id" :value="r.id">
            {{ r.name }}
          </option>
        </select>
      </div>

      <!-- New Recipe Name input -->
      <div v-if="selectedRecipeMode === 'new' || saveAsNewRecipe" class="form-group">
        <label class="form-label" for="newRecipeNameInput">Назва рецепту</label>
        <input
          id="newRecipeNameInput"
          v-model="newRecipeName"
          type="text"
          class="form-input"
          placeholder="Напр. Борщ класичний, Вівсянка з ягодами..."
          required
        />
      </div>

      <!-- Recipe Products List -->
      <div class="section-box">
        <div class="section-header">
          <span class="section-title">Складники за рецептом</span>
          <button
            v-if="selectedRecipeMode === 'new'"
            type="button"
            class="btn-text-action"
            @click="addNewRecipeProductRow"
          >
            + Додати продукт
          </button>
        </div>

        <div v-if="recipeRows.length === 0" class="empty-hint">
          {{ selectedRecipeMode === 'new' ? 'Додайте продукти рецепту' : 'У цьому рецепті немає складників' }}
        </div>

        <div v-for="(row, idx) in recipeRows" :key="idx" class="product-weight-row">
          <div class="product-name-area">
            <template v-if="selectedRecipeMode === 'new'">
              <select
                :value="row.productId"
                class="form-select form-input-sm"
                @change="onRecipeProductChange(idx, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </template>
            <template v-else>
              <span class="row-product-name">{{ row.name }}</span>
            </template>
          </div>

          <div class="product-weight-area">
            <input
              v-model.number="row.weightG"
              type="number"
              class="form-input num-mono weight-input"
              placeholder="100"
              min="1"
              required
            />
            <span class="unit-label">г</span>

            <button
              v-if="selectedRecipeMode === 'new'"
              type="button"
              class="btn-icon-del"
              title="Видалити складник"
              @click="removeNewRecipeProductRow(idx)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Extra Products (Limit 3) -->
      <div class="section-box">
        <div class="section-header">
          <div>
            <span class="section-title">Додаткові продукти</span>
            <span class="section-sub">(до 3 понад рецепт: {{ extraRows.length }}/3)</span>
          </div>
          <button
            v-if="canAddExtra"
            type="button"
            class="btn-text-action"
            @click="addExtraRow"
          >
            + Додати
          </button>
        </div>

        <div v-if="extraRows.length === 0" class="empty-hint">
          Немає додаткових продуктів
        </div>

        <div v-for="(extra, idx) in extraRows" :key="idx" class="extra-row-card">
          <div class="extra-input-row">
            <template v-if="!extra.newProduct">
              <select
                v-model="extra.productId"
                class="form-select form-input extra-select"
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
                v-model="extra.newProduct.name"
                type="text"
                class="form-input extra-new-name"
                placeholder="Назва нового продукту"
                required
              />
            </template>

            <button
              type="button"
              class="btn-toggle-inline"
              :title="extra.newProduct ? 'Обрати зі списку' : 'Створити новий продукт'"
              @click="toggleExtraInlineNew(extra)"
            >
              {{ extra.newProduct ? 'Зі списку' : 'Новий' }}
            </button>
          </div>

          <div class="extra-sub-row">
            <div class="weight-box">
              <label class="sub-label">Вага:</label>
              <input
                v-model.number="extra.weightG"
                type="number"
                class="form-input num-mono weight-input"
                min="1"
                required
              />
              <span class="unit-label">г</span>
            </div>

            <div v-if="extra.newProduct" class="stock-box">
              <label class="sub-label">Запас:</label>
              <input
                v-model.number="extra.newProduct.stock_g"
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
              title="Видалити"
              @click="removeExtraRow(idx)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Cooked Weight & Date -->
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="cookedWeightInput">Готова вага (г)</label>
          <input
            id="cookedWeightInput"
            v-model.number="cookedWeightG"
            type="number"
            class="form-input num-mono"
            placeholder="Напр. 500"
            min="1"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="cookedDateInput">Дата приготування</label>
          <input
            id="cookedDateInput"
            v-model="cookedOn"
            type="date"
            class="form-input num-mono"
            required
          />
        </div>
      </div>

      <!-- Notes -->
      <div class="form-group">
        <label class="form-label" for="dishNotesInput">Нотатки</label>
        <textarea
          id="dishNotesInput"
          v-model="notes"
          class="form-textarea"
          placeholder="Особливості рецепту, дата заморозки..."
        ></textarea>
      </div>

      <!-- Checkboxes -->
      <div class="checkboxes-section">
        <label v-if="selectedRecipeMode === 'existing'" class="checkbox-label">
          <input
            v-model="saveAsNewRecipe"
            type="checkbox"
            class="form-checkbox"
          />
          <span>Зберегти як новий рецепт</span>
        </label>

        <label class="checkbox-label">
          <input
            v-model="saveAsFrequent"
            type="checkbox"
            class="form-checkbox"
          />
          <span>Зберегти як часту страву</span>
        </label>
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving || loadingData"
        >
          {{ saving ? 'Приготування...' : 'Приготувати страву' }}
        </button>
      </div>
    </form>
  </ModalSheet>
</template>

<style scoped>
.dish-create-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.recipe-mode-toggle {
  display: flex;
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.04);
  padding: 3px;
  gap: 4px;
}

.mode-btn {
  flex: 1;
  min-height: 36px;
  background: transparent;
  border: none;
  border-radius: var(--radius-control);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-btn.active {
  background: var(--surface-card);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.section-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-left: 6px;
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

.btn-text-action:hover {
  text-decoration: underline;
}

.empty-hint {
  font-size: 12.5px;
  color: var(--text-muted);
  font-style: italic;
  padding: var(--space-4) 0;
}

.product-weight-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-8);
  padding: var(--space-4) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.product-weight-row:last-child {
  border-bottom: none;
}

.product-name-area {
  flex: 1;
}

.row-product-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-primary);
}

.product-weight-area {
  display: flex;
  align-items: center;
  gap: 6px;
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

.extra-row-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-control);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.extra-input-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.extra-select {
  flex: 1;
  min-height: 36px;
}

.extra-new-name {
  flex: 1;
  min-height: 36px;
}

.btn-toggle-inline {
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

.btn-toggle-inline:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.extra-sub-row {
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

.checkboxes-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-4) 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 13.5px;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
}

.form-input-sm {
  min-height: 34px;
  font-size: 13px;
}
</style>
