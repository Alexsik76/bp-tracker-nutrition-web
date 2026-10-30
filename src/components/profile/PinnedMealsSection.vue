<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { nutritionApi, ApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast';
import { formatTime24 } from '../../utils/date';
import ModalSheet from '../ModalSheet.vue';
import type {
  MealSchedule,
  PinnedMealRead,
  PinnedMealItemRead,
  PinnedMealItemUpsert,
  FrequentDishRead,
  MealType,
} from '../../types/nutrition';
import { mealTypeLabel } from '../../utils/mealTypes';

const props = defineProps<{
  scheduleMeals: MealSchedule[];
}>();

const toastStore = useToastStore();

const pinnedMeals = ref<PinnedMealRead[]>([]);
const frequentDishes = ref<FrequentDishRead[]>([]);
const loading = ref(true);
const savingSlot = ref<MealType | null>(null);

// Modal state for picking frequent dishes
const isPickerOpen = ref(false);
const activeSlotForPicker = ref<MealType | null>(null);
const selectedFrequentDishIds = ref<string[]>([]);
const savingPicker = ref(false);

const frequentDishesMap = computed(() => {
  const map = new Map<string, FrequentDishRead>();
  for (const fd of frequentDishes.value) {
    map.set(fd.id, fd);
  }
  return map;
});

function getPinnedMeal(slotName: MealType): PinnedMealRead | undefined {
  return pinnedMeals.value.find((p) => p.meal_type === slotName);
}

function calculateSlotKcal(items: PinnedMealItemRead[]): number {
  return items.reduce((sum, item) => {
    const fd = frequentDishesMap.value.get(item.frequent_dish_id);
    if (!fd || fd.kcal === null || fd.kcal === undefined) return sum;
    return sum + Math.round((fd.kcal * fd.cooked_weight_g) / 100);
  }, 0);
}

function portionMacro(value: number | null | undefined, cookedWeightG: number): number {
  if (value === null || value === undefined) return 0;
  return Math.round(((value * cookedWeightG) / 100) * 10) / 10;
}

async function loadData() {
  loading.value = true;
  try {
    const [pins, fds] = await Promise.all([
      nutritionApi.getPinnedMeals(),
      nutritionApi.getFrequentDishes(),
    ]);
    pinnedMeals.value = pins;
    frequentDishes.value = fds;
  } catch (err) {
    console.error('Error loading pinned meals data:', err);
    toastStore.show('Помилка завантаження закріплених прийомів', 'error');
  } finally {
    loading.value = false;
  }
}

function openPicker(slotName: MealType) {
  activeSlotForPicker.value = slotName;
  selectedFrequentDishIds.value = [];
  isPickerOpen.value = true;
}

function toggleFrequentDishSelection(id: string) {
  const idx = selectedFrequentDishIds.value.indexOf(id);
  if (idx >= 0) {
    selectedFrequentDishIds.value.splice(idx, 1);
  } else {
    selectedFrequentDishIds.value.push(id);
  }
}

async function handleSavePickedDishes() {
  if (!activeSlotForPicker.value) return;
  if (selectedFrequentDishIds.value.length === 0) {
    toastStore.show('Оберіть хоча б одну часту страву', 'warning');
    return;
  }

  const slotName = activeSlotForPicker.value;
  savingPicker.value = true;

  try {
    const existing = getPinnedMeal(slotName);
    const existingItems: PinnedMealItemUpsert[] = (existing?.items || []).map((it, idx) => ({
      frequent_dish_id: it.frequent_dish_id,
      position: it.position ?? idx,
    }));

    const newItems: PinnedMealItemUpsert[] = selectedFrequentDishIds.value.map((fdId, idx) => ({
      frequent_dish_id: fdId,
      position: existingItems.length + idx,
    }));

    const allItems = [...existingItems, ...newItems];

    const updated = await nutritionApi.upsertPinnedMeal(slotName, {
      active: existing ? existing.active : true,
      items: allItems,
    });

    const idx = pinnedMeals.value.findIndex((p) => p.meal_type === slotName);
    if (idx !== -1) {
      pinnedMeals.value[idx] = updated;
    } else {
      pinnedMeals.value.push(updated);
    }

    toastStore.show(`Страви додано до «${mealTypeLabel(slotName)}»`, 'success');
    isPickerOpen.value = false;
  } catch (err: unknown) {
    console.error('Error adding pinned items:', err);
    if (err instanceof ApiError && err.status === 400) {
      toastStore.show(err.message || 'Спочатку збережіть розклад прийомів у профілі', 'warning');
    } else {
      toastStore.show(err instanceof Error ? err.message : 'Помилка додавання', 'error');
    }
  } finally {
    savingPicker.value = false;
  }
}

async function moveItem(slotName: MealType, index: number, delta: number) {
  const existing = getPinnedMeal(slotName);
  if (!existing) return;

  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= existing.items.length) return;

  const itemsCopy = [...existing.items];
  const [removed] = itemsCopy.splice(index, 1);
  itemsCopy.splice(targetIndex, 0, removed);

  const reordered: PinnedMealItemUpsert[] = itemsCopy.map((it, idx) => ({
    frequent_dish_id: it.frequent_dish_id,
    position: idx,
  }));

  savingSlot.value = slotName;
  try {
    const updated = await nutritionApi.upsertPinnedMeal(slotName, {
      active: existing.active,
      items: reordered,
    });

    const idx = pinnedMeals.value.findIndex((p) => p.meal_type === slotName);
    if (idx !== -1) {
      pinnedMeals.value[idx] = updated;
    }
    toastStore.show('Порядок страв оновлено', 'info');
  } catch (err: unknown) {
    console.error('Error reordering items:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка оновлення порядку', 'error');
  } finally {
    savingSlot.value = null;
  }
}

async function removeItem(slotName: MealType, itemId: string) {
  const existing = getPinnedMeal(slotName);
  if (!existing) return;

  if (existing.items.length <= 1) {
    if (confirm(`Видалити закріплений прийом «${mealTypeLabel(slotName)}»?`)) {
      await handleDeletePinnedMeal(slotName);
    }
    return;
  }

  const remaining: PinnedMealItemUpsert[] = existing.items
    .filter((it) => it.id !== itemId)
    .map((it, idx) => ({
      frequent_dish_id: it.frequent_dish_id,
      position: idx,
    }));

  savingSlot.value = slotName;
  try {
    const updated = await nutritionApi.upsertPinnedMeal(slotName, {
      active: existing.active,
      items: remaining,
    });

    const idx = pinnedMeals.value.findIndex((p) => p.meal_type === slotName);
    if (idx !== -1) {
      pinnedMeals.value[idx] = updated;
    }
    toastStore.show('Страву вилучено з прийому', 'info');
  } catch (err: unknown) {
    console.error('Error removing item:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка вилучення страви', 'error');
  } finally {
    savingSlot.value = null;
  }
}

async function toggleActive(slotName: MealType) {
  const existing = getPinnedMeal(slotName);
  if (!existing || savingSlot.value === slotName) return;

  const nextActive = !existing.active;
  savingSlot.value = slotName;

  try {
    const items: PinnedMealItemUpsert[] = existing.items.map((it, idx) => ({
      frequent_dish_id: it.frequent_dish_id,
      position: it.position ?? idx,
    }));

    const updated = await nutritionApi.upsertPinnedMeal(slotName, {
      active: nextActive,
      items,
    });

    const idx = pinnedMeals.value.findIndex((p) => p.meal_type === slotName);
    if (idx !== -1) {
      pinnedMeals.value[idx] = updated;
    }

    toastStore.show(
      nextActive
        ? `«${mealTypeLabel(slotName)}»: закріплення увімкнено`
        : `«${mealTypeLabel(slotName)}»: закріплення вимкнено`,
      'info'
    );
  } catch (err: unknown) {
    console.error('Error toggling pinned meal active:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка зміни статусу', 'error');
  } finally {
    savingSlot.value = null;
  }
}

async function handleDeletePinnedMeal(slotName: MealType) {
  savingSlot.value = slotName;
  try {
    await nutritionApi.deletePinnedMeal(slotName);
    pinnedMeals.value = pinnedMeals.value.filter((p) => p.meal_type !== slotName);
    toastStore.show(`Закріплений прийом «${mealTypeLabel(slotName)}» видалено`, 'info');
  } catch (err: unknown) {
    console.error('Error deleting pinned meal:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення прийому', 'error');
  } finally {
    savingSlot.value = null;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="card pinned-meals-card">
    <div class="section-header">
      <div class="section-title-wrapper">
        <span class="section-title">Закріплені прийоми</span>
        <span class="section-subtitle">
          Постійні щоденні прийоми їжі з частих страв. Автоматично підставляються на кожен день та не перезаписуються ШІ.
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
              v-for="(item, idx) in getPinnedMeal(sm.type)!.items"
              :key="item.id"
              class="pinned-item-row"
            >
              <div class="pinned-item-info">
                <span class="pinned-item-title">
                  {{ frequentDishesMap.get(item.frequent_dish_id)?.recipe_name || 'Часта страва' }}
                </span>
                <div class="pinned-item-meta num-mono">
                  <template v-if="frequentDishesMap.get(item.frequent_dish_id)">
                    <span class="portion-pill">
                      {{ frequentDishesMap.get(item.frequent_dish_id)!.cooked_weight_g }} г
                    </span>
                    <span
                      v-if="frequentDishesMap.get(item.frequent_dish_id)!.kcal !== null"
                      class="kcal-pill"
                    >
                      ≈ {{ Math.round((frequentDishesMap.get(item.frequent_dish_id)!.kcal! * frequentDishesMap.get(item.frequent_dish_id)!.cooked_weight_g) / 100) }} ккал
                    </span>
                    <span class="macros-pill">
                      Б: {{ portionMacro(frequentDishesMap.get(item.frequent_dish_id)!.protein_g, frequentDishesMap.get(item.frequent_dish_id)!.cooked_weight_g) }} ·
                      Ж: {{ portionMacro(frequentDishesMap.get(item.frequent_dish_id)!.fat_g, frequentDishesMap.get(item.frequent_dish_id)!.cooked_weight_g) }} ·
                      В: {{ portionMacro(frequentDishesMap.get(item.frequent_dish_id)!.carbs_g, frequentDishesMap.get(item.frequent_dish_id)!.cooked_weight_g) }}
                    </span>
                  </template>
                </div>
              </div>

              <!-- Reorder and Delete Actions -->
              <div class="pinned-item-actions">
                <button
                  type="button"
                  class="btn-icon-sm"
                  title="Вгору"
                  :disabled="idx === 0 || savingSlot === sm.type"
                  @click="moveItem(sm.type, idx, -1)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>

                <button
                  type="button"
                  class="btn-icon-sm"
                  title="Вниз"
                  :disabled="idx === getPinnedMeal(sm.type)!.items.length - 1 || savingSlot === sm.type"
                  @click="moveItem(sm.type, idx, 1)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                <button
                  type="button"
                  class="btn-icon-sm delete-item-btn"
                  title="Вилучити"
                  :disabled="savingSlot === sm.type"
                  @click="removeItem(sm.type, item.id)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
            @click="openPicker(sm.type)"
          >
            + Додати часту страву
          </button>
        </div>

        <!-- Not configured state -->
        <div v-else class="not-configured-box">
          <span class="not-configured-text">Прийом не закріплено</span>
          <button
            type="button"
            class="btn btn-secondary btn-sm compose-pin-btn"
            @click="openPicker(sm.type)"
          >
            + Скласти постійний прийом
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Sheet: Pick Frequent Dishes -->
    <ModalSheet
      :show="isPickerOpen"
      :title="`Оберіть часті страви: ${activeSlotForPicker ? mealTypeLabel(activeSlotForPicker) : ''}`"
      @close="isPickerOpen = false"
    >
      <div class="frequent-picker-content">
        <div v-if="frequentDishes.length === 0" class="empty-picker">
          <p>Немає створених частих страв.</p>
          <p class="empty-picker-hint">
            Створіть або збережіть страву як часту у розділі «Страви», щоб закріпити її у щоденному розкладі.
          </p>
        </div>

        <div v-else class="frequent-dishes-picker-list">
          <div
            v-for="fd in frequentDishes"
            :key="fd.id"
            class="picker-dish-card"
            :class="{ selected: selectedFrequentDishIds.includes(fd.id) }"
            @click="toggleFrequentDishSelection(fd.id)"
          >
            <div class="picker-dish-checkbox">
              <input
                type="checkbox"
                class="form-checkbox"
                :checked="selectedFrequentDishIds.includes(fd.id)"
                @click.stop="toggleFrequentDishSelection(fd.id)"
              />
            </div>
            <div class="picker-dish-info">
              <div class="picker-dish-name">{{ fd.recipe_name }}</div>
              <div class="picker-dish-meta num-mono">
                <span>{{ fd.cooked_weight_g }} г</span>
                <span v-if="fd.kcal !== null" class="kcal-pill">
                  · ≈ {{ Math.round((fd.kcal * fd.cooked_weight_g) / 100) }} ккал
                </span>
                <span v-if="fd.protein_g !== null" class="macros-pill">
                  · Б: {{ fd.protein_g }} г · Ж: {{ fd.fat_g }} г · В: {{ fd.carbs_g }} г
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="picker-actions">
          <button
            type="button"
            class="btn btn-primary btn-full"
            :disabled="savingPicker || selectedFrequentDishIds.length === 0"
            @click="handleSavePickedDishes"
          >
            {{ savingPicker ? 'Додаємо...' : `Додати обрані (${selectedFrequentDishIds.length})` }}
          </button>
        </div>
      </div>
    </ModalSheet>
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

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.section-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 400;
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
  font-weight: 600;
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
  min-width: 34px;
  min-height: 34px;
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

.macros-pill {
  color: var(--text-muted);
  font-size: 11.5px;
}

.pinned-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon-sm {
  width: 30px;
  height: 30px;
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

.btn-icon-sm:hover:not(:disabled) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.btn-icon-sm:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.delete-item-btn:hover:not(:disabled) {
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
  font-size: 12.5px;
  font-weight: 600;
}

/* Modal Picker styles */
.frequent-picker-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.empty-picker {
  text-align: center;
  padding: var(--space-20) 0;
  color: var(--text-muted);
  font-size: 13.5px;
}

.empty-picker-hint {
  font-size: 12px;
  color: var(--text-dim);
  margin-top: var(--space-8);
}

.frequent-dishes-picker-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-height: 360px;
  overflow-y: auto;
}

.picker-dish-card {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-10) var(--space-12);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  cursor: pointer;
  transition: all 0.15s ease;
}

.picker-dish-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.picker-dish-card.selected {
  background: var(--primary-bg-chip);
  border-color: var(--primary);
}

.picker-dish-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.picker-dish-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
