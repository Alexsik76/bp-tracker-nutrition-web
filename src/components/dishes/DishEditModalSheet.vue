<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import { nutritionApi } from '../../services/api';
import { useToastStore } from '../../stores/toast';
import type {
  DishRead,
  DishUpdate,
  DishComponentCreate,
  ProductRead,
  RecipeRead,
} from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  dish: DishRead | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: DishUpdate): void;
  (e: 'save-nutrition', payload: { kcal?: number | null; protein_g?: number | null; fat_g?: number | null; carbs_g?: number | null }): void;
  (e: 'delete', id: string): void;
}>();

const toastStore = useToastStore();

const products = ref<ProductRead[]>([]);
const recipe = ref<RecipeRead | null>(null);
const loadingDetails = ref(false);

// Form fields
const formName = ref('');
const formCookedWeightG = ref<number | null>(null);
const formRemainingG = ref<number | null>(null);
const formCookedOn = ref<string>('');
const formNotes = ref('');

interface ComponentRow {
  productId: string | null;
  newProduct: { name: string; stock_g: number | null } | null;
  weightG: number;
}
const components = ref<ComponentRow[]>([]);

// Nutrition calculation and delta state
interface NutritionSnapshot {
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
}
const savedBaseNutrition = ref<NutritionSnapshot | null>(null);
const showDeltaSection = ref(false);

// Explicit nutrition correction fields
const manualKcal = ref<number | null>(null);
const manualProtein = ref<number | null>(null);
const manualFat = ref<number | null>(null);
const manualCarbs = ref<number | null>(null);
const savingManualNutrition = ref(false);

// Track recipe product IDs to enforce max 3 extras
const recipeProductIds = computed<Set<string>>(() => {
  if (!recipe.value) return new Set();
  return new Set(recipe.value.product_ids);
});

const extrasCount = computed(() => {
  return components.value.filter(
    (c) => c.newProduct || (c.productId && !recipeProductIds.value.has(c.productId))
  ).length;
});

const canAddExtra = computed(() => extrasCount.value < 3);

async function loadDataForDish() {
  if (!props.dish) return;
  loadingDetails.value = true;
  try {
    const [prods, rec] = await Promise.all([
      nutritionApi.getProducts(),
      props.dish.recipe_id ? nutritionApi.getRecipe(props.dish.recipe_id).catch(() => null) : null,
    ]);
    products.value = prods;
    recipe.value = rec;
  } catch (err) {
    console.error('Error loading dish edit details:', err);
  } finally {
    loadingDetails.value = false;
  }
}

watch(
  () => props.dish,
  (dish) => {
    if (dish) {
      formName.value = dish.name;
      formCookedWeightG.value = dish.cooked_weight_g;
      formRemainingG.value = dish.remaining_g;
      formCookedOn.value = dish.cooked_on || '';
      formNotes.value = dish.notes || '';
      components.value = (dish.components || []).map((c) => ({
        productId: c.product_id,
        newProduct: null,
        weightG: c.weight_g,
      }));

      // Update manual nutrition inputs with current dish values
      manualKcal.value = dish.kcal !== null && dish.kcal !== undefined ? Math.round(dish.kcal * 10) / 10 : null;
      manualProtein.value = dish.protein_g ?? null;
      manualFat.value = dish.fat_g ?? null;
      manualCarbs.value = dish.carbs_g ?? null;

      loadDataForDish();
    }
  },
  { immediate: true }
);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      showDeltaSection.value = false;
      savedBaseNutrition.value = props.dish
        ? {
            kcal: props.dish.kcal,
            protein_g: props.dish.protein_g,
            fat_g: props.dish.fat_g,
            carbs_g: props.dish.carbs_g,
          }
        : null;
    }
  }
);

function addComponentRow() {
  if (!canAddExtra.value) {
    toastStore.show('Ліміт додаткових продуктів понад рецепт: 3', 'warning');
    return;
  }
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

  if (extrasCount.value > 3) {
    toastStore.show('Дозволено щонайбільше 3 додаткових продукти понад рецепт', 'warning');
    return;
  }

  const cleanedComponents: DishComponentCreate[] = [];
  for (const c of components.value) {
    if (c.weightG <= 0) {
      toastStore.show('Вага всіх складників має бути більше 0 г', 'warning');
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
    toastStore.show('Страва повинна містити щонайменше 1 складник', 'warning');
    return;
  }

  // Remember baseline before this save to compute delta
  if (props.dish) {
    savedBaseNutrition.value = {
      kcal: props.dish.kcal,
      protein_g: props.dish.protein_g,
      fat_g: props.dish.fat_g,
      carbs_g: props.dish.carbs_g,
    };
    showDeltaSection.value = true;
  }

  const payload: DishUpdate = {
    name: formName.value.trim() || undefined,
    cooked_weight_g: Number(formCookedWeightG.value),
    remaining_g: formRemainingG.value !== null && formRemainingG.value !== undefined
      ? Number(formRemainingG.value)
      : null,
    cooked_on: formCookedOn.value || null,
    notes: formNotes.value.trim() || null,
    components: cleanedComponents,
  };

  emit('save', payload);
}

function formatDelta(base: number | null | undefined, current: number | null | undefined): string {
  if (base === null || base === undefined || current === null || current === undefined) {
    return current !== null && current !== undefined ? `${Math.round(current * 10) / 10}` : '—';
  }
  const diff = Math.round((current - base) * 10) / 10;
  const roundedBase = Math.round(base * 10) / 10;
  const roundedCurrent = Math.round(current * 10) / 10;
  const sign = diff >= 0 ? `+${diff}` : `${diff}`;
  return `${roundedCurrent} (${roundedBase} ${sign})`;
}

function handleSaveManualNutrition() {
  savingManualNutrition.value = true;
  try {
    emit('save-nutrition', {
      kcal: manualKcal.value !== null ? Number(manualKcal.value) : null,
      protein_g: manualProtein.value !== null ? Number(manualProtein.value) : null,
      fat_g: manualFat.value !== null ? Number(manualFat.value) : null,
      carbs_g: manualCarbs.value !== null ? Number(manualCarbs.value) : null,
    });
  } finally {
    savingManualNutrition.value = false;
  }
}
</script>

<template>
  <ModalSheet
    :show="show"
    title="Редагувати страву"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="dish-edit-form">
      <div class="form-group">
        <label class="form-label" for="editDishName">Назва страви</label>
        <input
          id="editDishName"
          v-model="formName"
          type="text"
          class="form-input"
          required
        />
      </div>

      <!-- Nutrition Delta Banner (Shown after saving components or when dish has nutrition) -->
      <div v-if="dish && (showDeltaSection || dish.kcal !== null)" class="nutrition-delta-card">
        <div class="delta-header">
          <span class="delta-title">Поживна цінність (на 100 г)</span>
          <span v-if="showDeltaSection" class="delta-badge">базова + різниця</span>
        </div>

        <div class="delta-metrics num-mono">
          <div class="metric-item">
            <span class="metric-label">Калорійність:</span>
            <span class="metric-val kcal-val">
              <template v-if="showDeltaSection">
                {{ formatDelta(savedBaseNutrition?.kcal, dish.kcal) }} ккал
              </template>
              <template v-else>
                {{ dish.kcal !== null ? Math.round(dish.kcal * 10) / 10 : '—' }} ккал
              </template>
            </span>
          </div>

          <div class="metric-row">
            <span class="metric-item">
              <span class="metric-label">Б:</span>
              <span class="metric-val">
                <template v-if="showDeltaSection">
                  {{ formatDelta(savedBaseNutrition?.protein_g, dish.protein_g) }} г
                </template>
                <template v-else>
                  {{ dish.protein_g ?? '—' }} г
                </template>
              </span>
            </span>

            <span class="metric-item">
              <span class="metric-label">Ж:</span>
              <span class="metric-val">
                <template v-if="showDeltaSection">
                  {{ formatDelta(savedBaseNutrition?.fat_g, dish.fat_g) }} г
                </template>
                <template v-else>
                  {{ dish.fat_g ?? '—' }} г
                </template>
              </span>
            </span>

            <span class="metric-item">
              <span class="metric-label">В:</span>
              <span class="metric-val">
                <template v-if="showDeltaSection">
                  {{ formatDelta(savedBaseNutrition?.carbs_g, dish.carbs_g) }} г
                </template>
                <template v-else>
                  {{ dish.carbs_g ?? '—' }} г
                </template>
              </span>
            </span>
          </div>
        </div>

        <!-- Manual nutrition correction block -->
        <div class="manual-correction-box">
          <div class="manual-correction-title">Ручне коригування КБЖВ:</div>
          <div class="manual-inputs-grid num-mono">
            <div class="manual-input-col">
              <label class="manual-lbl">ккал</label>
              <input
                v-model.number="manualKcal"
                type="number"
                step="0.1"
                min="0"
                class="form-input manual-input"
                placeholder="0"
              />
            </div>
            <div class="manual-input-col">
              <label class="manual-lbl">Б (г)</label>
              <input
                v-model.number="manualProtein"
                type="number"
                step="0.1"
                min="0"
                class="form-input manual-input"
                placeholder="0"
              />
            </div>
            <div class="manual-input-col">
              <label class="manual-lbl">Ж (г)</label>
              <input
                v-model.number="manualFat"
                type="number"
                step="0.1"
                min="0"
                class="form-input manual-input"
                placeholder="0"
              />
            </div>
            <div class="manual-input-col">
              <label class="manual-lbl">В (г)</label>
              <input
                v-model.number="manualCarbs"
                type="number"
                step="0.1"
                min="0"
                class="form-input manual-input"
                placeholder="0"
              />
            </div>
          </div>
          <button
            type="button"
            class="btn btn-secondary btn-sm apply-nutrition-btn"
            :disabled="saving || savingManualNutrition"
            @click="handleSaveManualNutrition"
          >
            Зберегти виправлені КБЖВ
          </button>
        </div>
      </div>

      <!-- Weights & date -->
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="editCookedWeight">Готова вага (г)</label>
          <input
            id="editCookedWeight"
            v-model.number="formCookedWeightG"
            type="number"
            class="form-input num-mono"
            min="1"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="editRemainingWeight">Залишок (г)</label>
          <input
            id="editRemainingWeight"
            v-model.number="formRemainingG"
            type="number"
            class="form-input num-mono"
            min="0"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="editCookedOn">Дата приготування</label>
        <input
          id="editCookedOn"
          v-model="formCookedOn"
          type="date"
          class="form-input num-mono"
        />
      </div>

      <!-- Components Section -->
      <div class="section-box">
        <div class="section-header">
          <div>
            <span class="section-title">Складники страви</span>
            <span class="section-sub">(додаткових понад рецепт: {{ extrasCount }}/3)</span>
          </div>
          <button
            v-if="canAddExtra"
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

        <div v-for="(comp, idx) in components" :key="idx" class="comp-edit-card">
          <div class="comp-row-main">
            <!-- Existing product dropdown -->
            <template v-if="!comp.newProduct">
              <select
                v-model="comp.productId"
                class="form-select form-input comp-select"
                required
              >
                <option :value="null" disabled>Оберіть продукт</option>
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.name }}
                  <template v-if="recipeProductIds.has(p.id)"> [з рецепту]</template>
                  <template v-if="p.stock_g !== null"> (запас: {{ p.stock_g }} г)</template>
                </option>
              </select>
            </template>

            <!-- Inline new product -->
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

          <div class="comp-row-sub">
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

      <!-- Notes -->
      <div class="form-group">
        <label class="form-label" for="editDishNotes">Нотатки</label>
        <textarea
          id="editDishNotes"
          v-model="formNotes"
          class="form-textarea"
          placeholder="Особливості рецепту..."
        ></textarea>
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
          v-if="dish"
          type="button"
          class="btn btn-danger btn-full"
          :disabled="saving"
          @click="emit('delete', dish.id)"
        >
          Видалити страву
        </button>
      </div>
    </form>
  </ModalSheet>
</template>

<style scoped>
.dish-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.nutrition-delta-card {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-control);
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.delta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.delta-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.delta-badge {
  font-size: 11px;
  color: var(--info);
  background: rgba(59, 130, 246, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
}

.delta-metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metric-row {
  display: flex;
  align-items: center;
  gap: var(--space-16);
}

.metric-label {
  color: var(--text-muted);
}

.metric-val {
  color: var(--text-primary);
  font-weight: 600;
}

.kcal-val {
  color: var(--info);
}

.manual-correction-box {
  margin-top: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.manual-correction-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.manual-inputs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
}

.manual-input-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.manual-lbl {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.manual-input {
  min-height: 32px;
  padding: 2px 6px;
  text-align: center;
  font-size: 12px;
}

.apply-nutrition-btn {
  align-self: flex-end;
  min-height: 32px;
  font-size: 12px;
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

.empty-hint {
  font-size: 12.5px;
  color: var(--text-muted);
  font-style: italic;
  padding: var(--space-4) 0;
}

.comp-edit-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-control);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.comp-row-main {
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

.comp-row-sub {
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
