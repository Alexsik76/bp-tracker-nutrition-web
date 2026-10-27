<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { nutritionApi, ApiError } from '../../services/api';
import { useInventory } from '../../composables/useInventory';
import { useToastStore } from '../../stores/toast';
import { formatTime24 } from '../../utils/date';
import AddItemModalSheet from '../menu/AddItemModalSheet.vue';
import EditItemModalSheet from '../menu/EditItemModalSheet.vue';
import type {
  MealSchedule,
  PinnedMealRead,
  PinnedMealItemRead,
  PinnedMealItemUpsert,
  MenuItemRead,
  MealType,
} from '../../types/nutrition';
import { mealTypeLabel } from '../../utils/mealTypes';

const props = defineProps<{
  scheduleMeals: MealSchedule[];
}>();

const toastStore = useToastStore();
const {
  availableDishes,
  availableProducts,
  loadInventory,
} = useInventory();

const pinnedMeals = ref<PinnedMealRead[]>([]);
const loading = ref(true);
const savingSlot = ref<MealType | null>(null);

// Add item modal sheet state
const isAddModalOpen = ref(false);
const activeSlotForAdd = ref<MealType | null>(null);
const addingItem = ref(false);

// Edit item modal sheet state
const isEditModalOpen = ref(false);
const activeSlotForEdit = ref<MealType | null>(null);
const editingPinItem = ref<PinnedMealItemRead | null>(null);
const savingEditItem = ref(false);

// Proxy MenuItemRead for EditItemModalSheet
const editingItemProxy = computed<MenuItemRead | null>(() => {
  if (!editingPinItem.value) return null;
  return {
    id: editingPinItem.value.id,
    menu_id: 'pinned',
    dish_id: editingPinItem.value.dish_id,
    product_id: editingPinItem.value.product_id,
    title: editingPinItem.value.title,
    portion_g: editingPinItem.value.portion_g,
    portion_text: editingPinItem.value.portion_text,
    kcal_est: editingPinItem.value.kcal_est,
    kcal_source: editingPinItem.value.kcal_est ? 'user' : null,
    origin: 'manual',
    position: editingPinItem.value.position,
    incomplete: false,
  };
});

function getPinnedMeal(slotName: MealType): PinnedMealRead | undefined {
  return pinnedMeals.value.find(
    (p) => p.meal_type === slotName
  );
}

function calculateSlotKcal(items: PinnedMealItemRead[]): number {
  return items.reduce((sum, item) => sum + (item.kcal_est || 0), 0);
}

async function loadPinned() {
  loading.value = true;
  try {
    pinnedMeals.value = await nutritionApi.getPinnedMeals();
  } catch (err) {
    console.error('Error loading pinned meals:', err);
    toastStore.show('Помилка завантаження закріплених прийомів', 'error');
  } finally {
    loading.value = false;
  }
}

async function openAddItem(slotName: MealType) {
  activeSlotForAdd.value = slotName;
  isAddModalOpen.value = true;
  await loadInventory();
}

async function handleSaveNewItem(payload: {
  dishId?: string;
  productId?: string;
  title?: string;
  portionG?: number;
  portionText?: string;
  kcalEst?: number;
}) {
  if (!activeSlotForAdd.value) return;

  const slotName = activeSlotForAdd.value;
  addingItem.value = true;

  try {
    const existing = getPinnedMeal(slotName);
    const existingItems: PinnedMealItemUpsert[] = (existing?.items || []).map((it, idx) => ({
      dish_id: it.dish_id,
      product_id: it.product_id,
      title: it.title,
      portion_g: it.portion_g,
      portion_text: it.portion_text,
      kcal_est: it.kcal_est,
      position: it.position ?? idx,
    }));

    const newItem: PinnedMealItemUpsert = {
      dish_id: payload.dishId || null,
      product_id: payload.productId || null,
      title: payload.title || null,
      portion_g: payload.portionG !== undefined ? payload.portionG : null,
      portion_text: payload.portionText || null,
      kcal_est: payload.kcalEst !== undefined ? payload.kcalEst : null,
      position: existingItems.length,
    };

    const updated = await nutritionApi.upsertPinnedMeal(slotName, {
      active: existing ? existing.active : true,
      items: [...existingItems, newItem],
    });

    // Update in-memory list
    const idx = pinnedMeals.value.findIndex(
      (p) => p.meal_type === slotName
    );
    if (idx !== -1) {
      pinnedMeals.value[idx] = updated;
    } else {
      pinnedMeals.value.push(updated);
    }

    toastStore.show(`Позицію додано до «${mealTypeLabel(slotName)}»`, 'success');
    isAddModalOpen.value = false;
  } catch (err: unknown) {
    console.error('Error adding pinned item:', err);
    if (err instanceof ApiError && err.status === 400) {
      toastStore.show(err.message || 'Спочатку збережіть розклад прийомів у профілі', 'warning');
    } else {
      toastStore.show(err instanceof Error ? err.message : 'Помилка додавання позиції', 'error');
    }
  } finally {
    addingItem.value = false;
  }
}

function openEditItem(slotName: MealType, item: PinnedMealItemRead) {
  activeSlotForEdit.value = slotName;
  editingPinItem.value = item;
  isEditModalOpen.value = true;
}

async function handleSaveItemEdit(payload: {
  title?: string;
  portionG?: number | null;
  portionText?: string | null;
  kcalEst?: number | null;
}) {
  if (!activeSlotForEdit.value || !editingPinItem.value) return;

  const slotName = activeSlotForEdit.value;
  const itemId = editingPinItem.value.id;
  savingEditItem.value = true;

  try {
    const existing = getPinnedMeal(slotName);
    if (!existing) return;

    const updatedItems: PinnedMealItemUpsert[] = existing.items.map((it, idx) => {
      if (it.id === itemId) {
        return {
          dish_id: it.dish_id,
          product_id: it.product_id,
          title: payload.title !== undefined ? payload.title : it.title,
          portion_g: payload.portionG !== undefined ? payload.portionG : it.portion_g,
          portion_text: payload.portionText !== undefined ? payload.portionText : it.portion_text,
          kcal_est: payload.kcalEst !== undefined ? payload.kcalEst : it.kcal_est,
          position: it.position ?? idx,
        };
      }
      return {
        dish_id: it.dish_id,
        product_id: it.product_id,
        title: it.title,
        portion_g: it.portion_g,
        portion_text: it.portion_text,
        kcal_est: it.kcal_est,
        position: it.position ?? idx,
      };
    });

    const updated = await nutritionApi.upsertPinnedMeal(slotName, {
      active: existing.active,
      items: updatedItems,
    });

    const idx = pinnedMeals.value.findIndex(
      (p) => p.meal_type === slotName
    );
    if (idx !== -1) {
      pinnedMeals.value[idx] = updated;
    }

    toastStore.show('Позицію оновлено', 'success');
    isEditModalOpen.value = false;
  } catch (err: unknown) {
    console.error('Error saving item edit:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка оновлення позиції', 'error');
  } finally {
    savingEditItem.value = false;
  }
}

async function handleDeleteItemFromEdit(item: MenuItemRead) {
  if (!activeSlotForEdit.value) return;
  await quickDeleteItem(activeSlotForEdit.value, item.id);
  isEditModalOpen.value = false;
}

async function quickDeleteItem(slotName: MealType, itemId: string) {
  const existing = getPinnedMeal(slotName);
  if (!existing) return;

  try {
    const remainingItems: PinnedMealItemUpsert[] = existing.items
      .filter((it) => it.id !== itemId)
      .map((it, idx) => ({
        dish_id: it.dish_id,
        product_id: it.product_id,
        title: it.title,
        portion_g: it.portion_g,
        portion_text: it.portion_text,
        kcal_est: it.kcal_est,
        position: idx,
      }));

    const updated = await nutritionApi.upsertPinnedMeal(slotName, {
      active: existing.active,
      items: remainingItems,
    });

    const idx = pinnedMeals.value.findIndex(
      (p) => p.meal_type === slotName
    );
    if (idx !== -1) {
      pinnedMeals.value[idx] = updated;
    }

    toastStore.show('Позицію видалено', 'info');
  } catch (err: unknown) {
    console.error('Error deleting pinned item:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення позиції', 'error');
  }
}

async function toggleActive(slotName: MealType) {
  const existing = getPinnedMeal(slotName);
  if (!existing || savingSlot.value === slotName) return;

  const nextActive = !existing.active;
  savingSlot.value = slotName;

  try {
    const items: PinnedMealItemUpsert[] = existing.items.map((it, idx) => ({
      dish_id: it.dish_id,
      product_id: it.product_id,
      title: it.title,
      portion_g: it.portion_g,
      portion_text: it.portion_text,
      kcal_est: it.kcal_est,
      position: it.position ?? idx,
    }));

    const updated = await nutritionApi.upsertPinnedMeal(slotName, {
      active: nextActive,
      items,
    });

    const idx = pinnedMeals.value.findIndex(
      (p) => p.meal_type === slotName
    );
    if (idx !== -1) {
      pinnedMeals.value[idx] = updated;
    }

    toastStore.show(
      nextActive ? `«${mealTypeLabel(slotName)}»: закріплення увімкнено` : `«${mealTypeLabel(slotName)}»: закріплення вимкнено`,
      'info'
    );
  } catch (err: unknown) {
    console.error('Error toggling active status:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка оновлення статусу', 'error');
  } finally {
    savingSlot.value = null;
  }
}

async function handleDeletePinnedMeal(slotName: MealType) {
  if (!confirm(`Видалити закріплений прийом для «${mealTypeLabel(slotName)}»?`)) {
    return;
  }

  savingSlot.value = slotName;
  try {
    await nutritionApi.deletePinnedMeal(slotName);
    pinnedMeals.value = pinnedMeals.value.filter(
      (p) => p.meal_type !== slotName
    );
    toastStore.show(`Закріплений прийом «${mealTypeLabel(slotName)}» видалено`, 'info');
  } catch (err: unknown) {
    console.error('Error deleting pinned meal:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення прийому', 'error');
  } finally {
    savingSlot.value = null;
  }
}

onMounted(() => {
  loadPinned();
});
</script>

<template>
  <div class="card pinned-meals-card">
    <div class="section-header">
      <div class="section-title-wrapper">
        <span>Закріплені прийоми</span>
        <span class="section-subtitle">
          Постійні щоденні прийоми їжі (закріплені меню). Автоматично підставляються на кожен день та не перезаписуються ШІ.
        </span>
      </div>
    </div>

    <div v-if="loading" class="pinned-loading">
      <span class="spinner-sm"></span>
      <span>Завантаження закріплених прийомів...</span>
    </div>

    <div v-else class="schedule-meals-list">
      <div
        v-for="sm in scheduleMeals"
        :key="sm.type"
        class="pinned-slot-box"
      >
        <!-- Slot Header -->
        <div class="pinned-slot-header">
          <div class="pinned-slot-title-group">
            <span class="pinned-slot-name">{{ mealTypeLabel(sm.type) }}</span>
            <span class="pinned-slot-time num-mono">{{ formatTime24(sm.time) }}</span>
            <span
              v-if="getPinnedMeal(sm.type)"
              class="pinned-slot-kcal num-mono"
            >
              {{ calculateSlotKcal(getPinnedMeal(sm.type)!.items) }} ккал
            </span>
          </div>

          <div v-if="getPinnedMeal(sm.type)" class="pinned-slot-actions">
            <!-- Active Toggle -->
            <label
              class="toggle-control"
              :class="{ 'is-active': getPinnedMeal(sm.type)!.active }"
              :title="getPinnedMeal(sm.type)!.active ? 'Закріплення активне' : 'Закріплення вимкнено'"
            >
              <input
                type="checkbox"
                class="toggle-checkbox"
                :checked="getPinnedMeal(sm.type)!.active"
                :disabled="savingSlot === sm.type"
                @change="toggleActive(sm.type)"
              />
              <span class="toggle-text">
                {{ getPinnedMeal(sm.type)!.active ? 'Активний' : 'Вимкнено' }}
              </span>
            </label>

            <!-- Delete Pinned Meal -->
            <button
              type="button"
              class="btn-icon delete-pin-btn"
              :title="`Видалити закріплений прийом «${mealTypeLabel(sm.type)}»`"
              :aria-label="`Видалити закріплений прийом «${mealTypeLabel(sm.type)}»`"
              :disabled="savingSlot === sm.type"
              @click="handleDeletePinnedMeal(sm.type)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Pinned Meal Content -->
        <div v-if="getPinnedMeal(sm.type)" class="pinned-slot-body">
          <div
            v-if="getPinnedMeal(sm.type)!.items.length === 0"
            class="empty-pinned-items"
          >
            <span>Позиції ще не додано</span>
          </div>

          <div v-else class="pinned-items-list">
            <div
              v-for="item in getPinnedMeal(sm.type)!.items"
              :key="item.id"
              class="pinned-item-row"
              @click="openEditItem(sm.type, item)"
            >
              <div class="pinned-item-info">
                <span class="pinned-item-title">{{ item.title }}</span>
                <div class="pinned-item-meta">
                  <span v-if="item.portion_g" class="num-mono portion-pill">
                    {{ item.portion_g }} г
                  </span>
                  <span v-else-if="item.portion_text" class="portion-pill">
                    {{ item.portion_text }}
                  </span>
                  <span
                    v-if="item.kcal_est !== null && item.kcal_est !== undefined"
                    class="num-mono kcal-pill"
                  >
                    {{ item.kcal_est }} ккал
                  </span>
                </div>
              </div>

              <div class="pinned-item-actions">
                <button
                  type="button"
                  class="btn-icon-sm edit-pin-item-btn"
                  title="Редагувати позицію"
                  @click.stop="openEditItem(sm.type, item)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn-icon-sm delete-pin-item-btn"
                  title="Видалити позицію"
                  @click.stop="quickDeleteItem(sm.type, item.id)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-secondary btn-full add-pinned-item-btn"
            @click="openAddItem(sm.type)"
          >
            + Додати страву або продукт
          </button>
        </div>

        <!-- Not configured state -->
        <div v-else class="not-configured-box">
          <span class="not-configured-text">Прийом не закріплено</span>
          <button
            type="button"
            class="btn btn-secondary btn-sm compose-pin-btn"
            @click="openAddItem(sm.type)"
          >
            + Скласти постійний прийом
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Add item to pinned meal -->
    <AddItemModalSheet
      :show="isAddModalOpen"
      :slot-name="activeSlotForAdd"
      :available-dishes="availableDishes"
      :available-products="availableProducts"
      :adding="addingItem"
      submit-label="Додати до прийому"
      @close="isAddModalOpen = false"
      @save="handleSaveNewItem"
    />

    <!-- Modal: Edit item in pinned meal -->
    <EditItemModalSheet
      :show="isEditModalOpen"
      :item="editingItemProxy"
      :saving="savingEditItem"
      :can-replace="false"
      @close="isEditModalOpen = false"
      @save="handleSaveItemEdit"
      @delete="handleDeleteItemFromEdit"
    />
  </div>
</template>

<style scoped>
.pinned-meals-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.section-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  line-height: 1.4;
}

.pinned-loading {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 13px;
  color: var(--text-muted);
  padding: var(--space-12) 0;
}

.schedule-meals-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.pinned-slot-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  transition: border-color 0.15s ease;
}

.pinned-slot-box:hover {
  border-color: rgba(255, 255, 255, 0.12);
}

.pinned-slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.pinned-slot-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.pinned-slot-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.pinned-slot-time {
  font-size: 12.5px;
  color: var(--text-muted);
}

.pinned-slot-kcal {
  font-size: 12px;
  color: var(--info);
  font-weight: 500;
}

.pinned-slot-actions {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.toggle-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.04);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.toggle-control.is-active {
  color: var(--primary);
  background: var(--primary-bg-chip);
}

.toggle-checkbox {
  cursor: pointer;
  accent-color: var(--primary);
  width: 15px;
  height: 15px;
  margin: 0;
}

.delete-pin-btn {
  min-width: 36px;
  min-height: 36px;
  color: var(--text-dim);
  border-radius: var(--radius-pill);
}

.delete-pin-btn:hover:not(:disabled) {
  color: var(--danger);
  background: var(--danger-bg-chip);
}

.pinned-slot-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: 2px;
}

.empty-pinned-items {
  font-size: 12.5px;
  color: var(--text-muted);
  font-style: italic;
  padding: var(--space-4) 0;
}

.pinned-items-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pinned-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-12);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-control);
  gap: var(--space-8);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.pinned-item-row:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.pinned-item-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.pinned-item-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
}

.pinned-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
}

.portion-pill {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  border-radius: var(--radius-pill);
}

.kcal-pill {
  color: var(--info);
}

.pinned-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon-sm {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  color: var(--text-muted);
}

.btn-icon-sm:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.delete-pin-item-btn:hover {
  color: var(--danger);
  background: var(--danger-bg-chip);
}

.add-pinned-item-btn {
  min-height: 38px;
  font-size: 13px;
  font-weight: 600;
  border: 1px dashed var(--surface-border);
  background: rgba(255, 255, 255, 0.02);
}

.add-pinned-item-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-bg-chip);
}

.not-configured-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0;
  gap: var(--space-8);
}

.not-configured-text {
  font-size: 13px;
  color: var(--text-muted);
}

.compose-pin-btn {
  min-height: 36px;
  font-size: 12.5px;
  padding: 0 var(--space-12);
}

.spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
