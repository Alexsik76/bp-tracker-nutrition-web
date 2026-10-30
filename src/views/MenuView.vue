<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useInventory } from '../composables/useInventory';
import { useDayMenu } from '../composables/useDayMenu';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import DateNavHeader from '../components/menu/DateNavHeader.vue';
import CalorieSummaryCard from '../components/menu/CalorieSummaryCard.vue';
import MealSlotCard from '../components/menu/MealSlotCard.vue';
import MenuExtrasCard from '../components/menu/MenuExtrasCard.vue';
import OffPlanCard from '../components/menu/OffPlanCard.vue';
import MenuNotesCard from '../components/menu/MenuNotesCard.vue';
import ModalSheet from '../components/ModalSheet.vue';
import AddMealModalSheet from '../components/menu/AddMealModalSheet.vue';
import AddItemModalSheet from '../components/menu/AddItemModalSheet.vue';
import EditItemModalSheet from '../components/menu/EditItemModalSheet.vue';
import ReplaceItemModalSheet from '../components/menu/ReplaceItemModalSheet.vue';
import OffPlanModalSheet from '../components/menu/OffPlanModalSheet.vue';
import type { MenuItemRead, MealType } from '../types/nutrition';
import { mealTypeLabel } from '../utils/mealTypes';
import { formatFriendlyDate } from '../utils/date';

const {
  currentDate,
  menus,
  loading,
  dayCreated,
  creatingDay,
  isCreateDayModalOpen,
  openCreateDayModal,
  closeCreateDayModal,
  handleCreateDay,
  generating,
  generatingDay,
  generatingSlot,
  generationStageText,
  canGenerateDay,
  profileMeals,
  profileSlots,
  rationale,
  shoppingList,
  offPlanEntries,
  savingOffPlan,
  notesSupported,
  savedNotes,
  sendingNote,
  totalKcal,
  eatenKcal,
  dayKcalIncomplete,
  estimatingSlot,
  availablePins,
  prevDay,
  nextDay,
  goToToday,
  loadProfileMeals,
  loadMenu,
  handleGenerateDay,
  handleGenerateSlot,
  handleEstimateSlot,
  handleToggleMealEaten,
  handleDeleteMeal,
  handlePinMeal,
  handleCreateMeal,
  handleDeleteItem,
  handleAddMenuItem,
  handleUpdateItemPortion,
  handleReplaceItem,
  handleSaveOffPlan,
  handleDeleteOffPlan,
  handleSendNote,
} = useDayMenu();

const {
  availableDishes,
  availableProducts,
  loadInventory,
} = useInventory();

const unmatchedAvailablePins = computed(() => {
  const existingSlots = new Set(menus.value.map((m) => m.meal_type));
  return availablePins.value.filter((p) => !existingSlots.has(p.meal_type));
});

function formatModalDate(dateStr: string): string {
  const friendly = formatFriendlyDate(dateStr);
  return friendly.replace(/^(Завтра|Вчора|Сьогодні)/, (s) => s.toLowerCase());
}

// Modal: Add meal slot
const isAddMealModalOpen = ref(false);
const savingMeal = ref(false);

function openAddMealModal() {
  if (!dayCreated.value) return;
  isAddMealModalOpen.value = true;
}

async function handleSaveNewMeal(payload: { meal_type: MealType; time: string }) {
  savingMeal.value = true;
  try {
    const ok = await handleCreateMeal(payload);
    if (ok) {
      isAddMealModalOpen.value = false;
    }
  } finally {
    savingMeal.value = false;
  }
}

// Modal: Add item to slot
const isAddItemModalOpen = ref(false);
const activeSlotForAdd = ref<MealType | null>(null);
const addingItem = ref(false);

// Modal: Edit item portion
const isEditItemModalOpen = ref(false);
const editingItem = ref<MenuItemRead | null>(null);
const savingEditItem = ref(false);

// Modal: Replace item in slot
const isReplaceModalOpen = ref(false);
const replacingItem = ref<MenuItemRead | null>(null);
const savingReplaceItem = ref(false);

// Modal: Off-plan entry
const isOffPlanModalOpen = ref(false);

async function openAddItemModal(slot: MealType) {
  if (!dayCreated.value) return;
  activeSlotForAdd.value = slot;
  isAddItemModalOpen.value = true;
  await loadInventory();
}

async function handleSaveNewItem(payload: {
  dishId?: string;
  title?: string;
  portionG?: number;
  portionText?: string;
  kcal?: number;
}) {
  if (!activeSlotForAdd.value) return;

  addingItem.value = true;
  try {
    const ok = await handleAddMenuItem(activeSlotForAdd.value, payload);
    if (ok) isAddItemModalOpen.value = false;
  } finally {
    addingItem.value = false;
  }
}

function openEditItemModal(item: MenuItemRead) {
  if (!dayCreated.value) return;
  const parentMenu = menus.value.find((m) => m.items.some((i) => i.id === item.id));
  if (parentMenu?.status === 'eaten') return;
  editingItem.value = item;
  isEditItemModalOpen.value = true;
}

function openReplaceFromEdit(item: MenuItemRead) {
  const parentMenu = menus.value.find((m) => m.items.some((i) => i.id === item.id));
  if (parentMenu?.status === 'eaten') return;
  isEditItemModalOpen.value = false;
  openReplaceItemModal(item);
}

async function handleDeleteItemFromEdit(item: MenuItemRead) {
  const parentMenu = menus.value.find((m) => m.items.some((i) => i.id === item.id));
  if (parentMenu?.status === 'eaten') return;
  isEditItemModalOpen.value = false;
  await handleDeleteItem(item);
}

async function handleSaveItemEdit(payload: {
  title?: string;
  portionG?: number | null;
  portionText?: string | null;
  kcal?: number | null;
}) {
  if (!editingItem.value) return;

  savingEditItem.value = true;
  try {
    const ok = await handleUpdateItemPortion(editingItem.value.id, payload);
    if (ok) isEditItemModalOpen.value = false;
  } finally {
    savingEditItem.value = false;
  }
}

async function openReplaceItemModal(item: MenuItemRead) {
  if (!dayCreated.value) return;
  const parentMenu = menus.value.find((m) => m.items.some((i) => i.id === item.id));
  if (parentMenu?.status === 'eaten') return;
  replacingItem.value = item;
  isReplaceModalOpen.value = true;
  await loadInventory();
}

async function handleSaveReplaceItem(payload: {
  dishId?: string;
  portionG?: number | null;
  portionText?: string | null;
  kcal?: number | null;
}) {
  if (!replacingItem.value) return;

  savingReplaceItem.value = true;
  try {
    const ok = await handleReplaceItem(replacingItem.value.id, payload);
    if (ok) isReplaceModalOpen.value = false;
  } finally {
    savingReplaceItem.value = false;
  }
}

async function onSaveOffPlan(payload: { text: string; kcal_est: number | null }) {
  const success = await handleSaveOffPlan(payload);
  if (success) {
    isOffPlanModalOpen.value = false;
  }
}

onMounted(() => {
  loadProfileMeals();
  loadMenu();
});
</script>

<template>
  <div class="menu-view">
    <!-- Top Date Switcher -->
    <DateNavHeader
      :current-date="currentDate"
      @prev="prevDay"
      @next="nextDay"
      @today="goToToday"
    />

    <!-- Banner when day is not created -->
    <div v-if="!dayCreated && !loading" class="card create-day-banner">
      <div class="create-day-banner-content">
        <div class="create-day-banner-text">
          <span class="create-day-badge">Тільки перегляд</span>
          <p class="create-day-title">Раціон на цей день ще не створено</p>
          <p class="create-day-desc">Для створення раціону буде зарезервовано продукти зі складу</p>
        </div>
        <button
          type="button"
          class="btn btn-primary create-day-btn"
          @click="openCreateDayModal"
        >
          Створити день
        </button>
      </div>
    </div>

    <!-- Summary KPI banner if menus exist -->
    <CalorieSummaryCard
      v-if="menus.length > 0"
      :total-kcal="totalKcal"
      :eaten-kcal="eatenKcal"
      :eaten-slots-count="menus.filter(m => m.status === 'eaten').length"
      :total-slots-count="menus.length"
      :kcal-incomplete="dayKcalIncomplete"
    />

    <LoadingSpinner v-if="loading" text="Завантаження меню..." />

    <!-- Empty state: No menu for this date -->
    <div v-else-if="menus.length === 0" class="empty-state-wrapper">
      <EmptyState
        title="Меню на цей день ще не складено"
        description="ШІ автоматично врахує залишки з холодильника, ваші цілі та обмеження з профілю"
        :action-label="generatingDay ? generationStageText : 'Згенерувати меню на весь день'"
        :action-disabled="generating || !canGenerateDay || !dayCreated"
        :action-title="!dayCreated ? 'День ще не створено' : (!canGenerateDay ? 'Усе з\'їдено або закріплено' : undefined)"
        @action="handleGenerateDay"
      >
        <template #icon>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </template>
      </EmptyState>

      <!-- Add Meal Button on an empty day -->
      <button
        type="button"
        class="btn btn-secondary btn-full add-meal-btn"
        :disabled="!dayCreated"
        :title="!dayCreated ? 'День ще не створено' : undefined"
        @click="openAddMealModal"
      >
        + Додати прийом їжі
      </button>

      <!-- Available pins on an empty day (if any) -->
      <div v-if="unmatchedAvailablePins.length > 0" class="available-pins-area">
        <span class="available-pins-title">Закріплені прийоми:</span>
        <div class="available-pins-chips">
          <button
            v-for="pin in unmatchedAvailablePins"
            :key="pin.meal_type"
            type="button"
            class="btn-pin-chip"
            :disabled="!dayCreated"
            :title="!dayCreated ? 'День ще не створено' : `Відновити закріплений прийом «${mealTypeLabel(pin.meal_type)}»`"
            @click="handlePinMeal(pin.meal_type)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
            </svg>
            <span>+ Відновити «{{ mealTypeLabel(pin.meal_type) }}»</span>
          </button>
        </div>
      </div>

      <!-- Quick Single Slot Generation -->
      <div class="card quick-slot-card">
        <div class="quick-slot-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>Або згенеруйте окремий прийом їжі (ШІ):</span>
        </div>
        <div class="slot-quick-grid">
          <button
            v-for="s in profileSlots"
            :key="s"
            type="button"
            class="btn btn-secondary quick-slot-btn"
            :disabled="generating || !dayCreated"
            :title="!dayCreated ? 'День ще не створено' : undefined"
            @click="handleGenerateSlot(s)"
          >
            <span v-if="generatingSlot === s" class="spinner-sm"></span>
            <span>{{ generatingSlot === s ? generationStageText : `+ ${mealTypeLabel(s)}` }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Menu Slots List -->
    <div v-else class="menu-slots-list">
      <MealSlotCard
        v-for="menu in menus"
        :key="menu.id ?? menu.meal_type"
        :menu="menu"
        :read-only="!dayCreated"
        :generating="generating"
        :generating-slot="generatingSlot"
        :generation-stage-text="generationStageText"
        :estimating-slot="estimatingSlot"
        :has-available-pin="availablePins.some(p => p.meal_type === menu.meal_type)"
        @toggle-eaten="handleToggleMealEaten"
        @add-item="openAddItemModal"
        @generate-slot="handleGenerateSlot"
        @estimate-slot="handleEstimateSlot"
        @edit-item="openEditItemModal"
        @delete-meal="handleDeleteMeal"
        @restore-pin="handlePinMeal"
      />

      <!-- Add Meal Button below the list of meals -->
      <button
        type="button"
        class="btn btn-secondary btn-full add-meal-btn"
        :disabled="!dayCreated"
        :title="!dayCreated ? 'День ще не створено' : undefined"
        @click="openAddMealModal"
      >
        + Додати прийом їжі
      </button>

      <!-- Available pins not matched to existing cards -->
      <div v-if="unmatchedAvailablePins.length > 0" class="available-pins-area">
        <span class="available-pins-title">Закріплені прийоми:</span>
        <div class="available-pins-chips">
          <button
            v-for="pin in unmatchedAvailablePins"
            :key="pin.meal_type"
            type="button"
            class="btn-pin-chip"
            :disabled="!dayCreated"
            :title="!dayCreated ? 'День ще не створено' : `Відновити закріплений прийом «${mealTypeLabel(pin.meal_type)}»`"
            @click="handlePinMeal(pin.meal_type)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
            </svg>
            <span>+ Відновити «{{ mealTypeLabel(pin.meal_type) }}»</span>
          </button>
        </div>
      </div>

      <!-- Regenerate Whole Day Button -->
      <div class="regenerate-day-area">
        <button
          class="btn btn-secondary btn-full"
          :disabled="generating || !canGenerateDay || !dayCreated"
          :title="!dayCreated ? 'День ще не створено' : (!canGenerateDay ? 'Усе з\'їдено або закріплено' : undefined)"
          @click="handleGenerateDay"
        >
          <span v-if="generatingDay" class="spinner-sm"></span>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>{{ generatingDay ? generationStageText : 'Перегенерувати весь день (ШІ)' }}</span>
        </button>
      </div>

      <!-- Create Day Button at bottom when not created -->
      <div v-if="!dayCreated" class="create-day-action-area">
        <button
          type="button"
          class="btn btn-primary btn-full create-day-full-btn"
          @click="openCreateDayModal"
        >
          Створити день
        </button>
      </div>
    </div>

    <!-- Rationale and Shopping list section -->
    <MenuExtrasCard
      :rationale="rationale"
      :shopping-list="shoppingList"
    />

    <!-- Off-Plan Section ("Поза планом") -->
    <OffPlanCard
      :entries="offPlanEntries"
      @add="isOffPlanModalOpen = true"
      @delete="handleDeleteOffPlan"
    />

    <!-- AI Notes Section ("Уточнення для ШІ") -->
    <MenuNotesCard
      :notes-supported="notesSupported"
      :saved-notes="savedNotes"
      :sending-note="sendingNote"
      @send="handleSendNote"
    />

    <!-- Modal: Add Item to Slot -->
    <AddItemModalSheet
      :show="isAddItemModalOpen"
      :slot-name="activeSlotForAdd"
      :available-dishes="availableDishes"
      :available-products="availableProducts"
      :adding="addingItem"
      @close="isAddItemModalOpen = false"
      @save="handleSaveNewItem"
    />

    <!-- Modal: Edit Item Portion & Actions -->
    <EditItemModalSheet
      :show="isEditItemModalOpen"
      :item="editingItem"
      :saving="savingEditItem"
      @close="isEditItemModalOpen = false"
      @save="handleSaveItemEdit"
      @replace="openReplaceFromEdit"
      @delete="handleDeleteItemFromEdit"
    />

    <!-- Modal: Replace Item in Slot -->
    <ReplaceItemModalSheet
      :show="isReplaceModalOpen"
      :item="replacingItem"
      :available-dishes="availableDishes"
      :available-products="availableProducts"
      :saving="savingReplaceItem"
      @close="isReplaceModalOpen = false"
      @save="handleSaveReplaceItem"
    />

    <!-- Modal: Add Off-Plan Entry -->
    <OffPlanModalSheet
      :show="isOffPlanModalOpen"
      :saving="savingOffPlan"
      @close="isOffPlanModalOpen = false"
      @save="onSaveOffPlan"
    />

    <!-- Modal: Add Meal Slot -->
    <AddMealModalSheet
      :show="isAddMealModalOpen"
      :saving="savingMeal"
      :schedule-meals="profileMeals"
      :existing-slots="menus.map((m) => m.meal_type)"
      @close="isAddMealModalOpen = false"
      @save="handleSaveNewMeal"
    />

    <!-- Modal: Confirm Day Creation -->
    <ModalSheet
      :show="isCreateDayModalOpen"
      title="Створення дня"
      @close="closeCreateDayModal"
    >
      <div class="confirm-create-day-body">
        <p class="confirm-create-day-text">
          Створити раціон на {{ formatModalDate(currentDate) }}? Для нього буде зарезервовано продукти.
        </p>

        <div class="confirm-modal-actions">
          <button
            type="button"
            class="btn btn-primary btn-full"
            :disabled="creatingDay"
            @click="handleCreateDay"
          >
            <span v-if="creatingDay" class="spinner-sm"></span>
            <span>{{ creatingDay ? 'Створення…' : 'Створити раціон' }}</span>
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-full"
            :disabled="creatingDay"
            @click="closeCreateDayModal"
          >
            Скасувати
          </button>
        </div>
      </div>
    </ModalSheet>
  </div>
</template>

<style scoped>
.menu-view {
  padding-bottom: var(--space-20);
}

.create-day-banner {
  margin-bottom: var(--space-12);
  padding: var(--space-16);
  border-color: rgba(99, 102, 241, 0.3);
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, var(--surface) 100%);
}

.create-day-banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-16);
  flex-wrap: wrap;
}

.create-day-banner-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1;
  min-width: 220px;
}

.create-day-badge {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}

.create-day-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.create-day-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 0;
}

.create-day-btn {
  min-height: 44px;
  padding: 0 var(--space-20);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.create-day-action-area {
  margin-top: var(--space-8);
}

.create-day-full-btn {
  min-height: 48px;
  font-size: 15px;
  font-weight: 600;
}

.confirm-create-day-body {
  padding: var(--space-8) 0;
}

.confirm-create-day-text {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary);
  margin-bottom: var(--space-24);
}

.confirm-modal-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.add-meal-btn {
  min-height: 44px;
  font-size: 14px;
  font-weight: 600;
  border: 1px dashed var(--surface-border);
  background: rgba(255, 255, 255, 0.03);
}

.add-meal-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-bg-chip);
}

.available-pins-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: 2px 0 var(--space-4);
}

.available-pins-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.available-pins-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.btn-pin-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 4px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-bg-chip);
  border: 1px dashed rgba(129, 140, 248, 0.45);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn-pin-chip:hover {
  background: rgba(129, 140, 248, 0.25);
  border-color: var(--primary);
}

.menu-slots-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.empty-state-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.quick-slot-card {
  padding: var(--space-12) var(--space-16);
  background: rgba(255, 255, 255, 0.03);
}

.quick-slot-title {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: var(--space-12);
}

.slot-quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-8);
}

.quick-slot-btn {
  min-height: 42px;
  font-size: 13px;
  font-weight: 500;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--surface-border);
}

.quick-slot-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.regenerate-day-area {
  margin-top: var(--space-8);
}

.regenerate-day-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
