<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { nutritionApi, ApiError } from '../services/api';
import { useToastStore } from '../stores/toast';
import SegmentedControl from '../components/SegmentedControl.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import DishCard from '../components/dishes/DishCard.vue';
import DishCreateModalSheet from '../components/dishes/DishCreateModalSheet.vue';
import DishEditModalSheet from '../components/dishes/DishEditModalSheet.vue';
import type {
  DishRead,
  DishCreate,
  DishUpdate,
  RecipeRead,
} from '../types/nutrition';

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  }
);

const router = useRouter();
const toastStore = useToastStore();

type DishesTab = 'fridge' | 'recipes';

const activeTab = ref<DishesTab>('fridge');
const tabOptions = [
  { label: 'Холодильник', value: 'fridge' },
  { label: 'Рецепти', value: 'recipes' },
];

const loading = ref(true);
const productsMap = ref<Record<string, string>>({});

// Tab 1: Fridge (Dishes)
const dishes = ref<DishRead[]>([]);
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const editingDish = ref<DishRead | null>(null);
const savingDish = ref(false);

// Tab 2: Recipes
const recipes = ref<RecipeRead[]>([]);
const showArchivedRecipes = ref(false);
const renamingRecipeId = ref<string | null>(null);
const renameValue = ref('');

async function loadProductsMap() {
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
}

async function loadTabData() {
  loading.value = true;
  try {
    if (activeTab.value === 'fridge') {
      dishes.value = await nutritionApi.getDishes(true);
    } else if (activeTab.value === 'recipes') {
      recipes.value = await nutritionApi.getRecipes(showArchivedRecipes.value);
    }
  } catch (err) {
    console.error('Error loading tab data:', err);
    toastStore.show('Помилка завантаження даних', 'error');
  } finally {
    loading.value = false;
  }
}

watch(activeTab, () => {
  loadTabData();
});

watch(showArchivedRecipes, () => {
  if (activeTab.value === 'recipes') {
    loadTabData();
  }
});

// --- Fridge Actions ---
function openCreateDish() {
  isCreateModalOpen.value = true;
}

function openEditDish(dish: DishRead) {
  editingDish.value = dish;
  isEditModalOpen.value = true;
}

async function handleSaveCreateDish({ data }: { data: DishCreate; saveAsFrequent: boolean }) {
  savingDish.value = true;
  try {
    const created = await nutritionApi.createDish(data);
    dishes.value.unshift(created);
    toastStore.show('Страву приготовлено', 'success');
    isCreateModalOpen.value = false;
  } catch (err: unknown) {
    console.error('Create dish error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка приготування', 'error');
  } finally {
    savingDish.value = false;
  }
}

async function handleSaveEditDish(payload: DishUpdate) {
  if (!editingDish.value) return;
  savingDish.value = true;
  try {
    const updated = await nutritionApi.updateDish(editingDish.value.id, payload);
    const index = dishes.value.findIndex((d) => d.id === editingDish.value?.id);
    if (index !== -1) {
      dishes.value[index] = updated;
    }
    editingDish.value = updated;
    toastStore.show('Страву оновлено', 'success');
  } catch (err: unknown) {
    console.error('Update dish error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка оновлення', 'error');
  } finally {
    savingDish.value = false;
  }
}

async function handleSaveDishManualNutrition(payload: {
  kcal?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  carbs_g?: number | null;
}) {
  if (!editingDish.value) return;
  savingDish.value = true;
  try {
    const updated = await nutritionApi.updateDish(editingDish.value.id, payload);
    const index = dishes.value.findIndex((d) => d.id === editingDish.value?.id);
    if (index !== -1) {
      dishes.value[index] = updated;
    }
    editingDish.value = updated;
    toastStore.show('КБЖВ оновлено', 'success');
  } catch (err: unknown) {
    console.error('Update dish nutrition error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка оновлення КБЖВ', 'error');
  } finally {
    savingDish.value = false;
  }
}

async function handleDeleteDish(id: string) {
  if (!confirm('Видалити цю страву?')) return;
  savingDish.value = true;
  try {
    await nutritionApi.deleteDish(id);
    dishes.value = dishes.value.filter((d) => d.id !== id);
    toastStore.show('Страву видалено', 'success');
    isEditModalOpen.value = false;
    editingDish.value = null;
  } catch (err: unknown) {
    console.error('Delete dish error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення', 'error');
  } finally {
    savingDish.value = false;
  }
}

async function markFinished(dish: DishRead) {
  const prevRemaining = dish.remaining_g;
  dish.remaining_g = 0;

  try {
    await nutritionApi.updateDish(dish.id, { remaining_g: 0 });
    toastStore.show(`Страву «${dish.name}» списано`, 'info');
    dishes.value = dishes.value.filter((d) => d.id !== dish.id);
  } catch {
    dish.remaining_g = prevRemaining;
    toastStore.show('Не вдалося оновити залишок', 'error');
  }
}

async function adjustRemaining({ dish, deltaG }: { dish: DishRead; deltaG: number }) {
  const current = dish.remaining_g ?? dish.cooked_weight_g ?? 0;
  const next = Math.max(0, current + deltaG);
  if (next === current) return;

  const prev = dish.remaining_g;
  dish.remaining_g = next;

  try {
    await nutritionApi.updateDish(dish.id, { remaining_g: next });
    if (next === 0) {
      dishes.value = dishes.value.filter((d) => d.id !== dish.id);
      toastStore.show(`Страву «${dish.name}» списано`, 'info');
    }
  } catch {
    dish.remaining_g = prev;
    toastStore.show('Не вдалося оновити залишок', 'error');
  }
}

// --- Recipes Actions ---
function startRenameRecipe(recipe: RecipeRead) {
  renamingRecipeId.value = recipe.id;
  renameValue.value = recipe.name;
}

async function confirmRenameRecipe(recipe: RecipeRead) {
  const newName = renameValue.value.trim();
  if (!newName || newName === recipe.name) {
    renamingRecipeId.value = null;
    return;
  }

  try {
    const updated = await nutritionApi.updateRecipe(recipe.id, { name: newName });
    const idx = recipes.value.findIndex((r) => r.id === recipe.id);
    if (idx !== -1) {
      recipes.value[idx] = updated;
    }
    toastStore.show('Рецепт перейменовано', 'success');
  } catch (err: unknown) {
    console.error('Rename recipe error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка перейменування', 'error');
  } finally {
    renamingRecipeId.value = null;
  }
}

function cancelRename() {
  renamingRecipeId.value = null;
}

async function toggleArchiveRecipe(recipe: RecipeRead) {
  const nextArchived = !recipe.archived;
  try {
    const updated = await nutritionApi.updateRecipe(recipe.id, { archived: nextArchived });
    const idx = recipes.value.findIndex((r) => r.id === recipe.id);
    if (idx !== -1) {
      if (!showArchivedRecipes.value && nextArchived) {
        recipes.value.splice(idx, 1);
      } else {
        recipes.value[idx] = updated;
      }
    }
    toastStore.show(nextArchived ? 'Рецепт перенесено в архів' : 'Рецепт відновлено з архіву', 'info');
  } catch (err: unknown) {
    console.error('Toggle archive recipe error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка зміни статусу архіву', 'error');
  }
}

async function handleDeleteRecipe(recipe: RecipeRead) {
  if (!confirm(`Видалити рецепт «${recipe.name}»?`)) return;

  try {
    await nutritionApi.deleteRecipe(recipe.id);
    recipes.value = recipes.value.filter((r) => r.id !== recipe.id);
    toastStore.show('Рецепт видалено', 'success');
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 409) {
      const msg = err.message || 'Рецепт використовується у стравах і не може бути видалений.';
      const shouldArchive = confirm(`${msg}\n\nБажаєте архівувати його замість видалення?`);
      if (shouldArchive) {
        try {
          const updated = await nutritionApi.updateRecipe(recipe.id, { archived: true });
          const idx = recipes.value.findIndex((r) => r.id === recipe.id);
          if (idx !== -1) {
            if (!showArchivedRecipes.value) {
              recipes.value.splice(idx, 1);
            } else {
              recipes.value[idx] = updated;
            }
          }
          toastStore.show('Рецепт перенесено в архів', 'info');
        } catch (archiveErr: unknown) {
          toastStore.show(archiveErr instanceof Error ? archiveErr.message : 'Помилка архівації', 'error');
        }
      }
    } else {
      toastStore.show(err instanceof Error ? err.message : 'Помилка видалення', 'error');
    }
  }
}

function goBack() {
  router.push('/menu');
}

onMounted(() => {
  loadProductsMap();
  loadTabData();
});
</script>

<template>
  <div class="dishes-view" :class="{ 'is-embedded': props.embedded }">
    <div class="view-header">
      <div class="title-wrap">
        <button v-if="!props.embedded" type="button" class="btn-back" @click="goBack" aria-label="Назад">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <div>
          <h1 class="view-title">Страви та рецепти</h1>
          <p class="view-subtitle">Холодильник та шаблони рецептів</p>
        </div>
      </div>

      <button
        v-if="activeTab === 'fridge'"
        class="btn btn-primary add-dish-btn"
        @click="openCreateDish"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Приготувати</span>
      </button>
    </div>

    <!-- Segmented Control Tabs Switcher -->
    <div class="tabs-switcher">
      <SegmentedControl v-model="activeTab" :options="tabOptions" />
    </div>

    <LoadingSpinner v-if="loading" text="Завантаження..." />

    <!-- TAB 1: FRIDGE -->
    <div v-else-if="activeTab === 'fridge'">
      <div v-if="dishes.length === 0">
        <EmptyState
          title="Холодильник порожній"
          description="Додайте приготовані страви з вагою, щоб розподілити їх у меню дня"
          action-label="Приготувати страву"
          @action="openCreateDish"
        />
      </div>

      <div v-else class="dishes-list">
        <DishCard
          v-for="dish in dishes"
          :key="dish.id"
          :dish="dish"
          @edit="openEditDish"
          @adjust-remaining="adjustRemaining"
          @mark-finished="markFinished"
        />
      </div>
    </div>

    <!-- TAB 2: RECIPES -->
    <div v-else-if="activeTab === 'recipes'">
      <!-- Recipes Toolbar: Toggle Archived -->
      <div class="recipes-toolbar">
        <label class="toggle-archived-label">
          <input
            v-model="showArchivedRecipes"
            type="checkbox"
            class="form-checkbox"
          />
          <span>Показати архівовані</span>
        </label>
      </div>

      <div v-if="recipes.length === 0">
        <EmptyState
          title="Рецептів не знайдено"
          :description="showArchivedRecipes ? 'Немає рецептів (включно з архівом)' : 'У вас ще немає збережених рецептів'"
          action-label="Приготувати страву як новий рецепт"
          @action="activeTab = 'fridge'; openCreateDish()"
        />
      </div>

      <div v-else class="recipes-list">
        <div
          v-for="recipe in recipes"
          :key="recipe.id"
          class="card recipe-card"
          :class="{ 'recipe-archived': recipe.archived }"
        >
          <div class="recipe-main-row">
            <div class="recipe-info">
              <!-- Name / Rename Input -->
              <div v-if="renamingRecipeId === recipe.id" class="recipe-rename-box">
                <input
                  v-model="renameValue"
                  type="text"
                  class="form-input rename-input"
                  autofocus
                  @keydown.enter="confirmRenameRecipe(recipe)"
                  @keydown.esc="cancelRename"
                />
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="confirmRenameRecipe(recipe)"
                >
                  OK
                </button>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  @click="cancelRename"
                >
                  Скасувати
                </button>
              </div>

              <div v-else class="recipe-name-row">
                <h3 class="recipe-name">{{ recipe.name }}</h3>
                <span v-if="recipe.archived" class="badge badge-neutral">
                  В архіві
                </span>
              </div>

              <!-- Product list -->
              <div v-if="recipe.product_ids && recipe.product_ids.length > 0" class="recipe-products-chips">
                <span
                  v-for="pid in recipe.product_ids"
                  :key="pid"
                  class="recipe-product-pill"
                >
                  {{ productsMap[pid] || 'Продукт' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Recipe Card Actions -->
          <div class="recipe-actions-row">
            <button
              v-if="renamingRecipeId !== recipe.id"
              type="button"
              class="btn-text"
              @click="startRenameRecipe(recipe)"
            >
              Перейменувати
            </button>

            <button
              type="button"
              class="btn-text"
              @click="toggleArchiveRecipe(recipe)"
            >
              {{ recipe.archived ? 'Повернути з архіву' : 'Архівувати' }}
            </button>

            <button
              type="button"
              class="btn-text text-danger"
              @click="handleDeleteRecipe(recipe)"
            >
              Видалити
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <DishCreateModalSheet
      :show="isCreateModalOpen"
      :saving="savingDish"
      @close="isCreateModalOpen = false"
      @save="handleSaveCreateDish"
    />

    <DishEditModalSheet
      :show="isEditModalOpen"
      :dish="editingDish"
      :saving="savingDish"
      @close="isEditModalOpen = false; editingDish = null"
      @save="handleSaveEditDish"
      @save-nutrition="handleSaveDishManualNutrition"
      @delete="handleDeleteDish"
    />
  </div>
</template>

<style scoped>
.dishes-view {
  padding-bottom: var(--space-20);
}

.dishes-view.is-embedded {
  padding-bottom: var(--space-48);
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-16);
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.btn-back {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  border-radius: var(--radius-sm);
}

.btn-back:hover {
  color: var(--color-text-primary);
}

.view-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.view-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.add-dish-btn {
  min-height: var(--space-40);
  padding: 0 var(--space-12);
  font-size: var(--font-size-sub);
}

.tabs-switcher {
  margin-bottom: var(--space-16);
}

.dishes-list,
.recipes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

/* Recipes Toolbar */
.recipes-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-12);
}

.toggle-archived-label {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  cursor: pointer;
}

.recipe-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.recipe-card.recipe-archived {
  opacity: 0.6;
}

.recipe-main-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.recipe-info {
  flex: 1;
}

.recipe-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.recipe-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.recipe-products-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
  margin-top: var(--space-6);
}

.recipe-product-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: var(--space-2) var(--space-8);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.recipe-actions-row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-8);
}

.btn-text {
  background: transparent;
  border: none;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
}

.btn-text.text-danger {
  color: var(--danger);
}

.recipe-rename-box {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.rename-input {
  min-height: var(--space-32);
  font-size: var(--font-size-input);
}
</style>

<style scoped>
.dishes-view {
  padding-bottom: var(--space-20);
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-16);
}

.view-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.view-subtitle {
  font-size: 12.5px;
  color: var(--text-muted);
}

.add-dish-btn {
  min-height: 40px;
  padding: 0 var(--space-12);
  font-size: 13.5px;
}

.tabs-switcher {
  margin-bottom: var(--space-16);
}

.dishes-list,
.frequent-dishes-list,
.recipes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

/* Frequent Dish Card */
.frequent-dish-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.fd-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  cursor: pointer;
}

.fd-title-area {
  flex: 1;
}

.fd-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.fd-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.badge-manual {
  font-size: 11px;
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: var(--radius-pill);
  padding: 1px 7px;
  font-weight: 600;
}

.fd-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.fd-nutrition {
  font-size: 12.5px;
  color: var(--text-dim);
}

.fd-kcal {
  color: var(--info);
  font-weight: 600;
}

.fd-macros {
  color: var(--text-muted);
}

.fd-components {
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

.fd-actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
}

.cook-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

/* Recipes List */
.recipes-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: var(--space-12);
}

.toggle-archived-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}

.recipe-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.recipe-card.recipe-archived {
  opacity: 0.65;
  border-style: dashed;
}

.recipe-main-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.recipe-info {
  flex: 1;
}

.recipe-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin-bottom: 6px;
}

.recipe-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.recipe-rename-box {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin-bottom: 6px;
}

.rename-input {
  max-width: 260px;
  min-height: 34px;
}

.recipe-products-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recipe-product-pill {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-pill);
  padding: 2px 8px;
  font-size: 12px;
  color: var(--text-dim);
}

.recipe-actions-row {
  display: flex;
  align-items: center;
  gap: var(--space-16);
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
}

.btn-text {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}

.btn-text:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.btn-text.text-danger:hover {
  color: var(--danger);
}
</style>
