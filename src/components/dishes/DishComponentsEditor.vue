<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { nutritionApi } from '../../services/api';
import { useToastStore } from '../../stores/toast';
import type { DishComponentCreate, ProductRead, DishRead } from '../../types/nutrition';

const components = defineModel<DishComponentCreate[]>({ required: true });

const props = defineProps<{
  allDishes?: DishRead[];
}>();

const toastStore = useToastStore();
const products = ref<ProductRead[]>([]);
const fallbackDishes = ref<DishRead[]>([]);
const addingProductIndex = ref<number | null>(null);

// Autocomplete state
const activeRowIndex = ref<number | null>(null);
const highlightedIndex = ref<number>(-1);

onMounted(async () => {
  try {
    products.value = await nutritionApi.getProducts();
  } catch (err) {
    console.error('Error fetching products for editor:', err);
  }

  // If dishes are not provided via prop, fetch them as fallback
  if (!props.allDishes || props.allDishes.length === 0) {
    try {
      fallbackDishes.value = await nutritionApi.getDishes();
    } catch (err) {
      console.error('Error fetching dishes for editor:', err);
    }
  }
});

const effectiveDishes = computed<DishRead[]>(() => {
  if (props.allDishes && props.allDishes.length > 0) {
    return props.allDishes;
  }
  return fallbackDishes.value;
});

// Pool of known names from Products catalogue and all user's dishes, deduplicated case-insensitively
const allKnownNames = computed<string[]>(() => {
  const seen = new Set<string>();
  const list: string[] = [];

  // 1. From Products catalogue
  for (const prod of products.value) {
    const trimmed = prod.name?.trim();
    if (trimmed) {
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push(trimmed);
      }
    }
  }

  // 2. From all dish components
  for (const dish of effectiveDishes.value) {
    for (const comp of dish.components || []) {
      const trimmed = comp.name?.trim();
      if (trimmed) {
        const lower = trimmed.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          list.push(trimmed);
        }
      }
    }
  }

  return list;
});

function getSuggestions(query: string | undefined): string[] {
  const q = query?.trim().toLowerCase() ?? '';
  if (!q) return [];
  return allKnownNames.value
    .filter((name) => name.toLowerCase().includes(q))
    .slice(0, 15);
}

function onInput(idx: number) {
  activeRowIndex.value = idx;
  highlightedIndex.value = -1;
}

function onFocus(idx: number) {
  activeRowIndex.value = idx;
  highlightedIndex.value = -1;
}

function onBlur(idx: number) {
  // Delay blur close so mousedown/click on suggestion registers
  setTimeout(() => {
    if (activeRowIndex.value === idx) {
      activeRowIndex.value = null;
      highlightedIndex.value = -1;
    }
  }, 200);
}

function selectSuggestion(comp: DishComponentCreate, suggestion: string) {
  comp.name = suggestion;
  activeRowIndex.value = null;
  highlightedIndex.value = -1;
}

function onKeydown(e: KeyboardEvent, comp: DishComponentCreate) {
  const suggestions = getSuggestions(comp.name);
  if (!suggestions.length || activeRowIndex.value === null) {
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex.value = (highlightedIndex.value + 1) % suggestions.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex.value =
      highlightedIndex.value <= 0 ? suggestions.length - 1 : highlightedIndex.value - 1;
  } else if (e.key === 'Enter') {
    if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.length) {
      e.preventDefault();
      selectSuggestion(comp, suggestions[highlightedIndex.value]);
    }
  } else if (e.key === 'Escape') {
    activeRowIndex.value = null;
    highlightedIndex.value = -1;
  }
}

// Check if component name is not in Products catalogue (case-insensitive exact match)
function canAddToProducts(comp: DishComponentCreate): boolean {
  const trimmed = comp.name?.trim() ?? '';
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  return !products.value.some((p) => p.name?.trim().toLowerCase() === lower);
}

// Add component name as a new product to catalogue
async function addToProducts(comp: DishComponentCreate, idx: number) {
  const trimmed = comp.name?.trim() ?? '';
  if (!trimmed || addingProductIndex.value !== null) return;

  addingProductIndex.value = idx;
  try {
    const created = await nutritionApi.createProduct({
      name: trimmed,
      available: true,
    });
    products.value.push(created);
    toastStore.show(`«${created.name}» додано до продуктів`, 'success');
  } catch (err: unknown) {
    console.error('Failed to add product to catalog:', err);
    toastStore.show(err instanceof Error ? err.message : 'Не вдалося додати продукт', 'error');
  } finally {
    addingProductIndex.value = null;
  }
}

function addComponentRow() {
  components.value.push({
    name: '',
    weight_g: 100,
  });
}

function removeComponentRow(index: number) {
  components.value.splice(index, 1);
  if (activeRowIndex.value === index) {
    activeRowIndex.value = null;
    highlightedIndex.value = -1;
  }
}
</script>

<template>
  <div class="components-editor">
    <div class="section-header">
      <span class="section-title">Складники страви (необов'язково)</span>
      <div class="header-actions">
        <button type="button" class="btn-text-action" @click="addComponentRow">
          + Додати складник
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
        <!-- Ingredient name with autocomplete -->
        <div class="comp-input-group">
          <div class="autocomplete-wrapper">
            <input
              v-model="comp.name"
              type="text"
              class="form-input comp-name-input"
              placeholder="Назва складника"
              autocomplete="off"
              required
              @focus="onFocus(idx)"
              @input="onInput(idx)"
              @keydown="onKeydown($event, comp)"
              @blur="onBlur(idx)"
            />

            <!-- Autocomplete suggestions dropdown -->
            <ul
              v-if="activeRowIndex === idx && getSuggestions(comp.name).length > 0"
              class="autocomplete-dropdown"
              role="listbox"
            >
              <li
                v-for="(suggestion, sIdx) in getSuggestions(comp.name)"
                :key="suggestion"
                class="autocomplete-item"
                :class="{ 'is-highlighted': sIdx === highlightedIndex }"
                role="option"
                @mousedown.prevent="selectSuggestion(comp, suggestion)"
                @click="selectSuggestion(comp, suggestion)"
              >
                {{ suggestion }}
              </li>
            </ul>
          </div>

          <!-- Small action to add unknown ingredient to products catalogue -->
          <button
            v-if="canAddToProducts(comp)"
            type="button"
            class="btn-add-product-action"
            title="Додати до каталогу продуктів"
            :disabled="addingProductIndex !== null"
            @click="addToProducts(comp, idx)"
          >
            В продукти
          </button>
        </div>

        <!-- Weight in grams -->
        <div class="comp-weight-group">
          <input
            v-model.number="comp.weight_g"
            type="number"
            class="form-input comp-w-input num-mono"
            placeholder="Вага"
            step="1"
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
  min-width: 0;
}

.autocomplete-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.comp-name-input {
  width: 100%;
  min-height: var(--btn-height-sm);
  font-size: var(--font-size-sub);
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  padding: var(--space-0) var(--space-8);
}

.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + var(--space-4));
  left: 0;
  right: 0;
  z-index: 50;
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-modal);
  max-height: 180px;
  overflow-y: auto;
  margin: 0;
  padding: var(--space-4) 0;
  list-style: none;
}

.autocomplete-item {
  padding: var(--space-6) var(--space-10);
  font-size: var(--font-size-sub);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.autocomplete-item:hover,
.autocomplete-item.is-highlighted {
  background-color: var(--color-pill-hover-bg);
}

.btn-add-product-action {
  flex-shrink: 0;
  background: var(--color-btn-outline-hover-bg);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  padding: var(--space-4) var(--space-8);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.btn-add-product-action:hover:not(:disabled) {
  color: var(--color-primary-hover, var(--color-primary));
  background: var(--color-pill-hover-bg);
}

.btn-add-product-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comp-weight-group {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.del-comp-btn:hover {
  color: var(--danger);
}
</style>
