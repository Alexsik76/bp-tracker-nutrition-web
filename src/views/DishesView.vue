<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { nutritionApi } from '../services/api';
import { useToastStore } from '../stores/toast';
import ModalSheet from '../components/ModalSheet.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import DishComponentsEditor from '../components/dishes/DishComponentsEditor.vue';
import type { DishRead, MealType, DishComponentCreate, DishUpdate } from '../types/nutrition';

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

const dishes = ref<DishRead[]>([]);
const loading = ref(true);

// 3 Groups
const pinnedDishes = computed(() =>
  dishes.value.filter((d) => d.pinned_meal_type != null)
);

const readyDishes = computed(() =>
  dishes.value.filter((d) => d.is_ready && !d.pinned_meal_type)
);

const otherDishes = computed(() =>
  dishes.value.filter((d) => !d.is_ready && !d.pinned_meal_type)
);

async function loadDishes() {
  loading.value = true;
  try {
    dishes.value = await nutritionApi.getDishes();
  } catch (err: unknown) {
    console.error('Failed to load dishes:', err);
    toastStore.show('Помилка завантаження страв', 'error');
  } finally {
    loading.value = false;
  }
}

// --- Switch: Toggle Ready State ---
async function toggleReady(dish: DishRead) {
  const nextReady = !dish.is_ready;
  const prevReady = dish.is_ready;
  dish.is_ready = nextReady; // Optimistic update

  try {
    const updated = await nutritionApi.updateDish(dish.id, { is_ready: nextReady });
    dish.is_ready = updated.is_ready;
  } catch (err: unknown) {
    dish.is_ready = prevReady;
    console.error('Failed to update dish is_ready:', err);
    toastStore.show('Не вдалося оновити статус страви', 'error');
  }
}

// --- Pinning Slot Choice ---
const isSlotModalOpen = ref(false);
const slotTargetDish = ref<DishRead | null>(null);

const pinSlots: { label: string; value: MealType }[] = [
  { label: 'Сніданок', value: 'breakfast' },
  { label: 'Обід', value: 'lunch' },
  { label: 'Вечеря', value: 'dinner' },
  { label: 'Перекус', value: 'afternoon_snack' },
];

function openSlotChoice(dish: DishRead) {
  slotTargetDish.value = dish;
  isSlotModalOpen.value = true;
}

async function assignPinSlot(slot: MealType) {
  if (!slotTargetDish.value) return;
  const dish = slotTargetDish.value;
  const slotInfo = pinSlots.find((s) => s.value === slot);
  isSlotModalOpen.value = false;

  const prevSlot = dish.pinned_meal_type;
  dish.pinned_meal_type = slot; // Optimistic

  try {
    await nutritionApi.updateDish(dish.id, { pinned_meal_type: slot });
    toastStore.show(`Страву «${dish.name}» закріплено (${slotInfo?.label})`, 'success');
  } catch (err: unknown) {
    dish.pinned_meal_type = prevSlot;
    console.error('Failed to pin dish:', err);
    toastStore.show('Не вдалося закріпити страву', 'error');
  } finally {
    slotTargetDish.value = null;
  }
}

async function removePin(dish: DishRead) {
  const prevSlot = dish.pinned_meal_type;
  dish.pinned_meal_type = null; // Optimistic

  try {
    await nutritionApi.updateDish(dish.id, { pinned_meal_type: null });
    toastStore.show(`Закріплення зі страви «${dish.name}» знято`, 'info');
  } catch (err: unknown) {
    dish.pinned_meal_type = prevSlot;
    console.error('Failed to unpin dish:', err);
    toastStore.show('Не вдалося зняти закріплення', 'error');
  }
}

// --- Long Press & Tap via Pointer Events ---
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let isLongPressTriggered = false;
let startX = 0;
let startY = 0;

function handlePointerDown(e: PointerEvent, dish: DishRead) {
  if (e.button !== 0) return;
  startX = e.clientX;
  startY = e.clientY;
  isLongPressTriggered = false;

  if (longPressTimer !== null) {
    clearTimeout(longPressTimer);
  }

  longPressTimer = setTimeout(() => {
    isLongPressTriggered = true;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {
        // ignore
      }
    }
    if (dish.pinned_meal_type != null) {
      removePin(dish);
    } else if (dish.is_ready) {
      openSlotChoice(dish);
    }
  }, 500);
}

function handlePointerMove(e: PointerEvent) {
  if (longPressTimer === null) return;
  const dx = Math.abs(e.clientX - startX);
  const dy = Math.abs(e.clientY - startY);
  if (dx > 8 || dy > 8) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function handlePointerUp(dish: DishRead) {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  if (isLongPressTriggered) {
    isLongPressTriggered = false;
    return;
  }
  openDishCard(dish);
}

function handlePointerCancel() {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  isLongPressTriggered = false;
}

// --- Dish Card Modal Sheet (Edit & Delete) ---
const isCardModalOpen = ref(false);
const activeDish = ref<DishRead | null>(null);
const savingCard = ref(false);
const deletingCard = ref(false);
const reestimating = ref(false);

interface CardFormState {
  name: string;
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  cooked_weight_g: number | null;
  note: string;
  components: DishComponentCreate[];
}

const cardForm = ref<CardFormState>({
  name: '',
  kcal: null,
  protein_g: null,
  fat_g: null,
  carbs_g: null,
  cooked_weight_g: null,
  note: '',
  components: [],
});

const loadedNutrition = ref<{
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
}>({
  kcal: null,
  protein_g: null,
  fat_g: null,
  carbs_g: null,
});

function normalizeNutrition(val: number | null | undefined | string): number | null {
  if (val === '' || val === null || val === undefined) return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return Number.isNaN(num) ? null : num;
}

function normalizeCookedWeight(val: number | null | undefined | string): number | null {
  if (val === '' || val === null || val === undefined) return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return Number.isNaN(num) || num <= 0 ? null : num;
}

const pinnedPortionText = computed(() => {
  if (!activeDish.value?.pinned_meal_type) return '';
  const cw = normalizeCookedWeight(cardForm.value.cooked_weight_g);
  if (cw != null && cw > 0) {
    const n = Number.isInteger(cw) ? cw : Math.round(cw * 10) / 10;
    return `Порція: ${n} г (вага готової страви)`;
  }
  const comps = cardForm.value.components;
  if (!comps || comps.length === 0) {
    return 'Порція: 100 г — склад не вказано';
  }
  const sum = comps.reduce((acc, c) => {
    const w = Number(c.weight_g);
    return acc + (Number.isFinite(w) && w > 0 ? w : 0);
  }, 0);
  if (sum > 0) {
    const n = Number.isInteger(sum) ? sum : Math.round(sum * 10) / 10;
    return `Порція: ${n} г (сума складу)`;
  }
  return 'Порція: 100 г — склад не вказано';
});

function openDishCard(dish: DishRead) {
  activeDish.value = dish;
  loadedNutrition.value = {
    kcal: dish.kcal,
    protein_g: dish.protein_g,
    fat_g: dish.fat_g,
    carbs_g: dish.carbs_g,
  };
  cardForm.value = {
    name: dish.name,
    kcal: dish.kcal,
    protein_g: dish.protein_g,
    fat_g: dish.fat_g,
    carbs_g: dish.carbs_g,
    cooked_weight_g: dish.cooked_weight_g ?? null,
    note: dish.note || '',
    components: (dish.components || []).map((c) => ({
      product_id: c.product_id,
      weight_g: c.weight_g,
    })),
  };
  isCardModalOpen.value = true;
}

function closeDishCard() {
  isCardModalOpen.value = false;
  activeDish.value = null;
}

async function handleReestimate() {
  if (!activeDish.value || reestimating.value || savingCard.value) return;
  const dishId = activeDish.value.id;
  reestimating.value = true;

  try {
    const updated = await nutritionApi.updateDish(dishId, {
      reset_nutrition: true,
    });

    const idx = dishes.value.findIndex((d) => d.id === dishId);
    if (idx !== -1) {
      dishes.value[idx] = updated;
    }
    activeDish.value = updated;

    cardForm.value.kcal = updated.kcal;
    cardForm.value.protein_g = updated.protein_g;
    cardForm.value.fat_g = updated.fat_g;
    cardForm.value.carbs_g = updated.carbs_g;
    if (updated.cooked_weight_g !== undefined) {
      cardForm.value.cooked_weight_g = updated.cooked_weight_g ?? null;
    }

    loadedNutrition.value = {
      kcal: updated.kcal,
      protein_g: updated.protein_g,
      fat_g: updated.fat_g,
      carbs_g: updated.carbs_g,
    };

    toastStore.show('КБЖВ оцінено заново', 'success');
  } catch (err: unknown) {
    console.error('Failed to re-estimate dish nutrition:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка переоцінки КБЖВ', 'error');
  } finally {
    reestimating.value = false;
  }
}

async function handleSaveCard() {
  if (!activeDish.value || savingCard.value || reestimating.value) return;
  const dishId = activeDish.value.id;
  savingCard.value = true;

  try {
    const nutritionChanged =
      normalizeNutrition(cardForm.value.kcal) !== normalizeNutrition(loadedNutrition.value.kcal) ||
      normalizeNutrition(cardForm.value.protein_g) !== normalizeNutrition(loadedNutrition.value.protein_g) ||
      normalizeNutrition(cardForm.value.fat_g) !== normalizeNutrition(loadedNutrition.value.fat_g) ||
      normalizeNutrition(cardForm.value.carbs_g) !== normalizeNutrition(loadedNutrition.value.carbs_g);

    const payload: DishUpdate = {
      name: cardForm.value.name.trim(),
      note: cardForm.value.note.trim() || null,
      components: cardForm.value.components,
      cooked_weight_g: normalizeCookedWeight(cardForm.value.cooked_weight_g),
    };

    if (nutritionChanged) {
      payload.kcal = normalizeNutrition(cardForm.value.kcal);
      payload.protein_g = normalizeNutrition(cardForm.value.protein_g);
      payload.fat_g = normalizeNutrition(cardForm.value.fat_g);
      payload.carbs_g = normalizeNutrition(cardForm.value.carbs_g);
      payload.nutrition_overridden = true;
    }

    const updated = await nutritionApi.updateDish(dishId, payload);

    const idx = dishes.value.findIndex((d) => d.id === dishId);
    if (idx !== -1) {
      dishes.value[idx] = updated;
    }
    toastStore.show('Картку страви збережено', 'success');
    closeDishCard();
  } catch (err: unknown) {
    console.error('Failed to save dish card:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка збереження', 'error');
  } finally {
    savingCard.value = false;
  }
}

async function handleDeleteDish() {
  if (!activeDish.value || deletingCard.value || reestimating.value) return;
  if (!confirm(`Видалити страву «${activeDish.value.name}»?`)) return;

  const dishId = activeDish.value.id;
  deletingCard.value = true;

  try {
    await nutritionApi.deleteDish(dishId);
    dishes.value = dishes.value.filter((d) => d.id !== dishId);
    toastStore.show('Страву видалено', 'success');
    closeDishCard();
  } catch (err: unknown) {
    console.error('Failed to delete dish:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення', 'error');
  } finally {
    deletingCard.value = false;
  }
}

// --- FAB: Add Dish by Name Only ---
const isAddModalOpen = ref(false);
const newDishName = ref('');
const addingDish = ref(false);

function openAddModal() {
  newDishName.value = '';
  isAddModalOpen.value = true;
}

async function handleAddDish() {
  const name = newDishName.value.trim();
  if (!name || addingDish.value) return;

  addingDish.value = true;
  try {
    const created = await nutritionApi.createDish({ name });
    dishes.value.unshift(created);
    isAddModalOpen.value = false;
    newDishName.value = '';
    const kcalStr = created.kcal != null ? ` (${Math.round(created.kcal)} ккал)` : '';
    toastStore.show(`Страву «${created.name}» додано${kcalStr}`, 'success');
  } catch (err: unknown) {
    console.error('Failed to create dish:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка додавання страви', 'error');
  } finally {
    addingDish.value = false;
  }
}

// Formatting helpers
function formatKcal(val: number | null | undefined): string {
  if (val == null) return '0';
  return Math.round(val).toString();
}

function formatProtein(val: number | null | undefined): string {
  if (val == null) return '0';
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(1).replace('.', ',');
}

function goBack() {
  router.push('/menu');
}

onMounted(() => {
  loadDishes();
});
</script>

<template>
  <div class="dishes-screen" :class="{ 'is-embedded': props.embedded }">
    <!-- Standalone Header (only when not embedded in MenuView) -->
    <header v-if="!props.embedded" class="standalone-header">
      <button type="button" class="btn-icon" @click="goBack" aria-label="Назад">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h1 class="header-title">Є вдома</h1>
    </header>

    <div v-if="loading" class="loading-wrap">
      <LoadingSpinner text="Завантаження страв..." />
    </div>

    <div v-else-if="dishes.length === 0" class="empty-wrap">
      <EmptyState
        title="Страв ще немає"
        description="Додайте страви, які ви готуєте або маєте вдома, кнопкою «+»."
        action-label="Додати першу страву"
        @action="openAddModal"
      />
    </div>

    <!-- Scrollable Groups List -->
    <div v-else class="dishes-list-scroll">
      <!-- Group 1: Постійні -->
      <section v-if="pinnedDishes.length > 0" class="dishes-group">
        <div class="group-title">Постійні</div>
        <div
          v-for="dish in pinnedDishes"
          :key="dish.id"
          class="dish-row"
          tabindex="0"
          role="button"
          @pointerdown="handlePointerDown($event, dish)"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp(dish)"
          @pointercancel="handlePointerCancel"
          @keydown.enter="openDishCard(dish)"
          @contextmenu.prevent
        >
          <div class="dish-info">
            <div class="dish-name">{{ dish.name }}</div>
            <div class="dish-nutrition">
              {{ formatKcal(dish.kcal) }} ккал · білок {{ formatProtein(dish.protein_g) }} г
            </div>
          </div>
          <div class="dish-action">
            <svg
              class="pin-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-label="Закріплена страва"
            >
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-2l-2-2V5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v8l-2 2v2z"></path>
            </svg>
          </div>
        </div>
      </section>

      <!-- Group 2: Готові -->
      <section v-if="readyDishes.length > 0" class="dishes-group">
        <div class="group-title">Готові</div>
        <div
          v-for="dish in readyDishes"
          :key="dish.id"
          class="dish-row"
          tabindex="0"
          role="button"
          @pointerdown="handlePointerDown($event, dish)"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp(dish)"
          @pointercancel="handlePointerCancel"
          @keydown.enter="openDishCard(dish)"
          @contextmenu.prevent
        >
          <div class="dish-info">
            <div class="dish-name">{{ dish.name }}</div>
            <div class="dish-nutrition">
              {{ formatKcal(dish.kcal) }} ккал · білок {{ formatProtein(dish.protein_g) }} г на 100 г
            </div>
          </div>
          <div class="dish-action">
            <button
              type="button"
              role="switch"
              :aria-checked="true"
              class="md-switch is-active"
              aria-label="Є готова"
              @pointerdown.stop
              @pointerup.stop
              @click.stop="toggleReady(dish)"
            >
              <span class="md-switch-knob"></span>
            </button>
          </div>
        </div>
      </section>

      <!-- Group 3: Інші страви -->
      <section v-if="otherDishes.length > 0" class="dishes-group">
        <div class="group-title">Інші страви</div>
        <div
          v-for="dish in otherDishes"
          :key="dish.id"
          class="dish-row is-other"
          tabindex="0"
          role="button"
          @pointerdown="handlePointerDown($event, dish)"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp(dish)"
          @pointercancel="handlePointerCancel"
          @keydown.enter="openDishCard(dish)"
          @contextmenu.prevent
        >
          <div class="dish-info">
            <div class="dish-name">{{ dish.name }}</div>
            <div class="dish-nutrition">
              {{ formatKcal(dish.kcal) }} ккал · білок {{ formatProtein(dish.protein_g) }} г на 100 г
            </div>
          </div>
          <div class="dish-action">
            <button
              type="button"
              role="switch"
              :aria-checked="false"
              class="md-switch"
              aria-label="Не готова"
              @pointerdown.stop
              @pointerup.stop
              @click.stop="toggleReady(dish)"
            >
              <span class="md-switch-knob"></span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- FAB: Add Dish -->
    <button
      type="button"
      class="fab-btn"
      aria-label="Додати страву"
      @click="openAddModal"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>

    <!-- Modal 1: Slot Choice for Pinning -->
    <ModalSheet
      :show="isSlotModalOpen"
      title="Закріпити за слотом"
      @close="isSlotModalOpen = false"
    >
      <div class="slot-choice-modal">
        <div class="slot-dish-hint">
          Оберіть слот дня для постійної страви <strong>«{{ slotTargetDish?.name }}»</strong>:
        </div>
        <div class="slot-buttons-list">
          <button
            v-for="slot in pinSlots"
            :key="slot.value"
            type="button"
            class="slot-btn"
            @click="assignPinSlot(slot.value)"
          >
            <span>{{ slot.label }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </ModalSheet>

    <!-- Modal 2: Dish Card (Edit Nutrition, Note, Composition, Delete) -->
    <ModalSheet
      :show="isCardModalOpen"
      :title="cardForm.name || 'Картка страви'"
      @close="closeDishCard"
    >
      <form @submit.prevent="handleSaveCard" class="dish-card-form">
        <div class="form-group">
          <label class="form-label" for="cardDishName">Назва страви</label>
          <input
            id="cardDishName"
            v-model="cardForm.name"
            type="text"
            class="form-input"
            required
          />
        </div>

        <!-- Pinned dish daily portion -->
        <div v-if="activeDish?.pinned_meal_type" class="pinned-portion-banner">
          <svg
            class="pinned-portion-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-2l-2-2V5a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v8l-2 2v2z"></path>
          </svg>
          <span class="pinned-portion-text">{{ pinnedPortionText }}</span>
        </div>

        <div class="form-group">
          <div class="nutrition-header">
            <label class="form-label">КБЖВ на 100 г</label>
            <button
              v-if="activeDish?.nutrition_overridden"
              type="button"
              class="btn-text-action"
              :disabled="reestimating || savingCard || deletingCard"
              @click="handleReestimate"
            >
              Оцінити заново
            </button>
          </div>
          <div class="nutrition-inputs-grid">
            <div class="nutrition-input-cell">
              <span class="cell-label">Калорії</span>
              <input
                v-model.number="cardForm.kcal"
                type="number"
                step="1"
                min="0"
                class="form-input num-mono"
                placeholder="ккал"
              />
            </div>
            <div class="nutrition-input-cell">
              <span class="cell-label">Білки</span>
              <input
                v-model.number="cardForm.protein_g"
                type="number"
                step="0.1"
                min="0"
                class="form-input num-mono"
                placeholder="г"
              />
            </div>
            <div class="nutrition-input-cell">
              <span class="cell-label">Жири</span>
              <input
                v-model.number="cardForm.fat_g"
                type="number"
                step="0.1"
                min="0"
                class="form-input num-mono"
                placeholder="г"
              />
            </div>
            <div class="nutrition-input-cell">
              <span class="cell-label">Вуглеводи</span>
              <input
                v-model.number="cardForm.carbs_g"
                type="number"
                step="0.1"
                min="0"
                class="form-input num-mono"
                placeholder="г"
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="cardDishNote">Примітка</label>
          <textarea
            id="cardDishNote"
            v-model="cardForm.note"
            class="form-textarea"
            rows="2"
            placeholder="Вільна примітка (необов'язково)..."
          ></textarea>
        </div>

        <!-- Optional Composition -->
        <DishComponentsEditor v-model="cardForm.components" />

        <div class="form-group">
          <label class="form-label" for="cardDishCookedWeight">Вага готової страви, г</label>
          <input
            id="cardDishCookedWeight"
            v-model.number="cardForm.cooked_weight_g"
            type="number"
            step="1"
            min="0"
            class="form-input num-mono"
            placeholder="г"
          />
          <p class="field-hint">
            Заповніть, якщо під час приготування додається вода або вага змінюється
          </p>
        </div>

        <div class="card-modal-actions">
          <button
            type="submit"
            class="btn-save-card"
            :disabled="savingCard || reestimating"
          >
            <span v-if="!savingCard">Зберегти</span>
            <LoadingSpinner v-else :size="18" />
          </button>
          <button
            type="button"
            class="btn-delete-card"
            :disabled="deletingCard || reestimating"
            @click="handleDeleteDish"
          >
            Видалити страву
          </button>
        </div>
      </form>
    </ModalSheet>

    <!-- Modal 3: Add Dish by Name Only -->
    <ModalSheet
      :show="isAddModalOpen"
      title="Нова страва"
      @close="isAddModalOpen = false"
    >
      <form @submit.prevent="handleAddDish" class="add-dish-form">
        <div class="form-group">
          <label class="form-label" for="newDishName">Назва страви</label>
          <input
            id="newDishName"
            v-model="newDishName"
            type="text"
            class="form-input"
            placeholder="Наприклад: Борщ український"
            autofocus
            required
          />
          <p class="field-hint">
            Сервер автоматично розрахує КБЖВ на 100 г за допомогою ШІ.
          </p>
        </div>

        <div class="add-modal-actions">
          <button
            type="button"
            class="btn-cancel"
            @click="isAddModalOpen = false"
          >
            Скасувати
          </button>
          <button
            type="submit"
            class="btn-submit-add"
            :disabled="addingDish || !newDishName.trim()"
          >
            <span v-if="!addingDish">Додати</span>
            <LoadingSpinner v-else :size="18" />
          </button>
        </div>
      </form>
    </ModalSheet>
  </div>
</template>

<style scoped>
.dishes-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

.dishes-screen:not(.is-embedded) {
  max-width: var(--screen-max-width);
  margin: var(--space-0) auto;
  padding: calc(var(--space-14) + var(--safe-area-top)) var(--space-16) calc(var(--space-8) + var(--safe-area-bottom));
  min-height: var(--screen-min-height);
}

/* Standalone Header */
.standalone-header {
  display: flex;
  align-items: center;
  gap: var(--space-10);
  margin-bottom: var(--space-16);
  flex-shrink: 0;
}

.header-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* List & Groups */
.dishes-list-scroll {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(var(--space-48) + var(--space-24));
  scrollbar-width: none;
}

.dishes-list-scroll::-webkit-scrollbar {
  display: none;
}

.dishes-group {
  margin-bottom: var(--space-14);
}

.group-title {
  margin: var(--space-18) var(--space-4) 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  letter-spacing: var(--letter-spacing-label);
}

.dish-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-12) var(--space-4);
  border-bottom: var(--border-width-hairline) solid var(--color-border);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
  transition: background-color var(--transition-fast);
}

.dish-row:active {
  background-color: var(--color-row-active-bg);
}

.dish-row:focus-visible {
  outline: var(--border-width-base) solid var(--color-primary);
  border-radius: var(--radius-sm);
}

.dish-row.is-other {
  color: var(--color-text-muted);
}

.dish-name {
  font-size: var(--font-size-base);
  color: inherit;
}

.dish-row:not(.is-other) .dish-name {
  color: var(--color-text-primary);
}

.dish-nutrition {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

.dish-action {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: var(--space-8);
}

.pin-icon {
  color: var(--color-progress-fill);
}

/* MD3 Switch */
.md-switch {
  width: var(--switch-width);
  height: var(--switch-height);
  border-radius: var(--switch-radius);
  position: relative;
  border: var(--border-width-hairline) solid var(--color-border-strong);
  background: transparent;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.md-switch.is-active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.md-switch-knob {
  position: absolute;
  top: var(--switch-knob-top);
  left: var(--switch-knob-left);
  width: var(--switch-knob-size);
  height: var(--switch-knob-size);
  border-radius: 50%;
  background-color: var(--color-border-strong);
  transition: transform var(--transition-fast), background-color var(--transition-fast);
}

.md-switch.is-active .md-switch-knob {
  background-color: var(--color-on-primary);
  transform: translateX(var(--switch-knob-offset));
}

/* FAB */
.fab-btn {
  position: absolute;
  right: var(--space-4);
  bottom: var(--space-12);
  width: var(--fab-size);
  height: var(--fab-size);
  border-radius: var(--fab-radius);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--fab-shadow);
  cursor: pointer;
  z-index: 40;
  transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.dishes-screen:not(.is-embedded) .fab-btn {
  position: fixed;
  right: calc(50% - (var(--screen-max-width) / 2) + var(--space-16));
  bottom: calc(var(--space-24) + var(--safe-area-bottom));
}

@media (max-width: 480px) {
  .dishes-screen:not(.is-embedded) .fab-btn {
    right: var(--space-16);
  }
}

.fab-btn:hover {
  background-color: var(--color-primary-hover);
}

.fab-btn:active {
  transform: scale(0.95);
}

/* Slot Choice Modal */
.slot-choice-modal {
  display: flex;
  flex-direction: column;
  gap: var(--space-14);
}

.slot-dish-hint {
  font-size: var(--font-size-input);
  color: var(--color-text-secondary);
  line-height: var(--leading-normal);
}

.slot-buttons-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.slot-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--btn-height-secondary);
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  padding: 0 var(--space-16);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.slot-btn:hover {
  background-color: var(--color-surface-elevated);
  border-color: var(--color-primary);
}

/* Dish Card Form */
.dish-card-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.pinned-portion-banner {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-8) var(--space-12);
  background: var(--color-primary-chip);
  border: var(--border-width-hairline) solid rgba(159, 192, 234, 0.25);
  border-radius: var(--radius-control);
  font-size: var(--font-size-sub);
  color: var(--color-primary);
  line-height: var(--leading-normal);
}

.pinned-portion-icon {
  flex-shrink: 0;
  color: var(--color-primary);
}

.pinned-portion-text {
  font-weight: var(--font-weight-medium);
}

.nutrition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.btn-text-action:hover:not(:disabled) {
  text-decoration: underline;
  opacity: 0.9;
}

.btn-text-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.form-label {
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.form-input {
  width: 100%;
  height: var(--btn-height-sm);
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text-primary);
  padding: 0 var(--space-12);
  font-size: var(--font-size-input);
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.form-textarea {
  width: 100%;
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text-primary);
  padding: var(--space-10) var(--space-12);
  font-size: var(--font-size-input);
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.form-textarea:focus {
  border-color: var(--color-primary);
}

.nutrition-inputs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
}

.nutrition-input-cell {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cell-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.card-modal-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  margin-top: var(--space-8);
}

.btn-save-card {
  width: 100%;
  height: var(--btn-height-secondary);
  border-radius: var(--radius-pill);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.btn-save-card:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-delete-card {
  width: 100%;
  height: var(--btn-height-sm);
  background: transparent;
  border: none;
  color: var(--danger);
  font-size: var(--font-size-sub);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.btn-delete-card:hover:not(:disabled) {
  text-decoration: underline;
  opacity: 0.9;
}

/* Add Dish Modal */
.add-dish-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.field-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: var(--leading-normal);
}

.add-modal-actions {
  display: flex;
  gap: var(--space-10);
}

.btn-cancel {
  flex: 1;
  height: var(--btn-height-secondary);
  border-radius: var(--radius-pill);
  border: var(--border-width-hairline) solid var(--color-btn-outline-border);
  background: transparent;
  color: var(--color-btn-outline-text);
  font-size: var(--font-size-base);
  cursor: pointer;
}

.btn-submit-add {
  flex: 1;
  height: var(--btn-height-secondary);
  border-radius: var(--radius-pill);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-submit-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-wrap,
.empty-wrap {
  padding: var(--space-40) var(--space-0);
  display: flex;
  justify-content: center;
}
</style>
