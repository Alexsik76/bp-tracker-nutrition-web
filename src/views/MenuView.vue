<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
import AddItemModalSheet from '../components/menu/AddItemModalSheet.vue';
import EditItemModalSheet from '../components/menu/EditItemModalSheet.vue';
import ReplaceItemModalSheet from '../components/menu/ReplaceItemModalSheet.vue';
import OffPlanModalSheet from '../components/menu/OffPlanModalSheet.vue';
import type { MenuItemRead } from '../types/nutrition';

const {
  currentDate,
  menus,
  loading,
  generating,
  profileSlots,
  rationale,
  shoppingList,
  offPlanEntries,
  savingOffPlan,
  notesSupported,
  savedNotes,
  sendingNote,
  updatingItemId,
  totalKcal,
  eatenKcal,
  prevDay,
  nextDay,
  goToToday,
  loadProfileMeals,
  loadMenu,
  handleGenerateDay,
  handleGenerateSlot,
  updateSlotStatus,
  promptCancelMeal,
  handleMarkItemEaten,
  handleMarkItemSkipped,
  handleUnmarkItem,
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

// Modal: Add item to slot
const isAddItemModalOpen = ref(false);
const activeSlotForAdd = ref<string | null>(null);
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

async function openAddItemModal(slot: string) {
  activeSlotForAdd.value = slot;
  isAddItemModalOpen.value = true;
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

  addingItem.value = true;
  try {
    const ok = await handleAddMenuItem(activeSlotForAdd.value, payload);
    if (ok) isAddItemModalOpen.value = false;
  } finally {
    addingItem.value = false;
  }
}

function openEditItemModal(item: MenuItemRead) {
  if (item.status !== null) return;
  editingItem.value = item;
  isEditItemModalOpen.value = true;
}

function openReplaceFromEdit(item: MenuItemRead) {
  isEditItemModalOpen.value = false;
  openReplaceItemModal(item);
}

async function handleDeleteItemFromEdit(item: MenuItemRead) {
  isEditItemModalOpen.value = false;
  await handleDeleteItem(item);
}

async function handleSaveItemEdit(payload: {
  portionG?: number | null;
  portionText?: string | null;
  kcalEst?: number | null;
}) {
  if (!editingItem.value || editingItem.value.status !== null) return;

  savingEditItem.value = true;
  try {
    const ok = await handleUpdateItemPortion(editingItem.value.id, payload);
    if (ok) isEditItemModalOpen.value = false;
  } finally {
    savingEditItem.value = false;
  }
}

async function openReplaceItemModal(item: MenuItemRead) {
  if (item.status !== null) return;
  replacingItem.value = item;
  isReplaceModalOpen.value = true;
  await loadInventory();
}

async function handleSaveReplaceItem(payload: {
  dishId?: string;
  productId?: string;
  portionG?: number | null;
  portionText?: string | null;
  kcalEst?: number | null;
}) {
  if (!replacingItem.value || replacingItem.value.status !== null) return;

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

    <!-- Summary KPI banner if menus exist -->
    <CalorieSummaryCard
      v-if="menus.length > 0"
      :total-kcal="totalKcal"
      :eaten-kcal="eatenKcal"
      :eaten-slots-count="menus.filter(m => m.status === 'eaten').length"
      :total-slots-count="menus.length"
    />

    <LoadingSpinner v-if="loading" text="Завантаження меню..." />

    <!-- Empty state: No menu for this date -->
    <div v-else-if="menus.length === 0" class="empty-state-wrapper">
      <EmptyState
        title="Меню на цей день ще не складено"
        description="ШІ автоматично врахує залишки з холодильника, ваші цілі та обмеження з профілю"
        :action-label="generating ? 'Генерація...' : 'Згенерувати меню на весь день'"
        @action="handleGenerateDay"
      >
        <template #icon>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </template>
      </EmptyState>

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
            :disabled="generating"
            @click="handleGenerateSlot(s)"
          >
            + {{ s }}
          </button>
        </div>
      </div>
    </div>

    <!-- Menu Slots List -->
    <div v-else class="menu-slots-list">
      <MealSlotCard
        v-for="menu in menus"
        :key="menu.id"
        :menu="menu"
        :generating="generating"
        :updating-item-id="updatingItemId"
        @prompt-cancel="promptCancelMeal"
        @update-status="({ menu: m, status }) => updateSlotStatus(m, status)"
        @add-item="openAddItemModal"
        @generate-slot="handleGenerateSlot"
        @edit-item="openEditItemModal"
        @mark-item-eaten="handleMarkItemEaten"
        @mark-item-skipped="handleMarkItemSkipped"
        @unmark-item="handleUnmarkItem"
      />

      <!-- Regenerate Whole Day Button -->
      <div class="regenerate-day-area">
        <button
          class="btn btn-secondary btn-full"
          :disabled="generating"
          @click="handleGenerateDay"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>{{ generating ? 'ШІ перераховує меню...' : 'Перегенерувати весь день (ШІ)' }}</span>
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
  </div>
</template>

<style scoped>
.menu-view {
  padding-bottom: var(--space-20);
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
</style>
