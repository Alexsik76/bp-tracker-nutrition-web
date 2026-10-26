<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { nutritionApi, ApiError } from '../services/api';
import { useToastStore } from '../stores/toast';
import {
  formatLocalDate,
  formatFriendlyDate,
  addDays,
  nowLocalIso,
} from '../utils/date';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import ModalSheet from '../components/ModalSheet.vue';
import SegmentedControl from '../components/SegmentedControl.vue';
import DishProductPicker from '../components/DishProductPicker.vue';
import type {
  MenuRead,
  MenuItemRead,
  MenuItemUpdate,
  MenuStatus,
  GenerationResultRead,
  DishRead,
  ProductRead,
  OffPlanEntryRead,
  MenuNoteRead,
  MenuNoteKind,
  MealSchedule,
} from '../types/nutrition';

const toastStore = useToastStore();

const currentDate = ref(formatLocalDate());
const menus = ref<MenuRead[]>([]);
const loading = ref(true);
const generating = ref(false);

const DEFAULT_MEALS: MealSchedule[] = [
  { name: 'Сніданок', time: '08:30' },
  { name: 'Обід', time: '13:30' },
  { name: 'Вечеря', time: '19:00' },
];
const FALLBACK_SLOT_ORDER = ['Сніданок', 'Другий сніданок', 'Обід', 'Полуденок', 'Перекус', 'Вечеря'];

const profileMeals = ref<MealSchedule[]>([...DEFAULT_MEALS]);
const profileSlots = computed(() => profileMeals.value.map((m) => m.name));

function sortMenus(list: MenuRead[]): MenuRead[] {
  const order = profileSlots.value.length > 0 ? profileSlots.value : FALLBACK_SLOT_ORDER;
  return [...list].sort((a, b) => {
    const ai = order.indexOf(a.slot);
    const bi = order.indexOf(b.slot);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    const fai = FALLBACK_SLOT_ORDER.indexOf(a.slot);
    const fbi = FALLBACK_SLOT_ORDER.indexOf(b.slot);
    if (fai !== -1 && fbi !== -1) return fai - fbi;
    if (fai !== -1) return -1;
    if (fbi !== -1) return 1;
    return a.slot.localeCompare(b.slot);
  });
}

async function loadProfileMeals() {
  try {
    const profile = await nutritionApi.getProfile();
    if (profile?.meals && profile.meals.length > 0) {
      profileMeals.value = [...profile.meals].sort((a, b) => a.time.localeCompare(b.time));
      if (menus.value.length > 0) {
        menus.value = sortMenus(menus.value);
      }
    }
  } catch {
    // Keep default 3 meals
  }
}

// Generation result extras
const rationale = ref<string>('');
const shoppingList = ref<string[]>([]);

// Off-plan entries
const offPlanEntries = ref<OffPlanEntryRead[]>([]);
const offPlanSupported = ref(true);
const isOffPlanModalOpen = ref(false);
const offPlanText = ref('');
const offPlanKcal = ref<number | null>(null);
const savingOffPlan = ref(false);

// AI Note / Correction
const notesSupported = ref(true);
const savedNotes = ref<MenuNoteRead[]>([]);
const noteKind = ref<MenuNoteKind>('info');
const noteText = ref('');
const noteAnswer = ref<string | null>(null);
const sendingNote = ref(false);

const noteKindOptions = [
  { label: 'Запитання', value: 'info' },
  { label: 'Коригування меню', value: 'correction' },
];

// Modal: Add item to slot
const isAddItemModalOpen = ref(false);
const activeSlotForAdd = ref<string | null>(null);
const addItemSourceType = ref<'dish' | 'product'>('dish');
const availableDishes = ref<DishRead[]>([]);
const availableProducts = ref<ProductRead[]>([]);
const selectedDishId = ref<string | null>(null);
const selectedProductId = ref<string | null>(null);
const addItemTitle = ref('');
const addItemPortionG = ref<number | null>(null);
const addItemPortionText = ref('');
const addItemKcalEst = ref<number | null>(null);
const addingItem = ref(false);

// Modal: Edit item portion
const isEditItemModalOpen = ref(false);
const editingItem = ref<MenuItemRead | null>(null);
const editPortionG = ref<number | null>(null);
const editPortionText = ref('');
const editKcalEst = ref<number | null>(null);
const savingEditItem = ref(false);
const updatingItemId = ref<string | null>(null);

// Modal: Replace item in slot
const isReplaceModalOpen = ref(false);
const replacingItem = ref<MenuItemRead | null>(null);
const replaceSourceType = ref<'dish' | 'product'>('dish');
const selectedReplaceDishId = ref<string | null>(null);
const selectedReplaceProductId = ref<string | null>(null);
const replacePortionG = ref<number | null>(null);
const replacePortionText = ref('');
const replaceKcalEst = ref<number | null>(null);
const savingReplaceItem = ref(false);

// Total stats
const totalKcal = computed(() => {
  return menus.value.reduce((total, m) => {
    const slotKcal = m.items.reduce((s, i) => s + (i.kcal_est || 0), 0);
    return total + slotKcal;
  }, 0);
});

const eatenKcal = computed(() => {
  return menus.value.reduce((total, m) => {
    const slotKcal = m.items
      .filter((i) => i.status === 'eaten')
      .reduce((s, i) => s + (i.kcal_est || 0), 0);
    return total + slotKcal;
  }, 0);
});

// Navigation functions
function prevDay() {
  currentDate.value = addDays(currentDate.value, -1);
}

function nextDay() {
  currentDate.value = addDays(currentDate.value, 1);
}

function goToToday() {
  currentDate.value = formatLocalDate();
}

async function loadMenu() {
  loading.value = true;
  menus.value = [];
  savedNotes.value = [];
  offPlanEntries.value = [];
  rationale.value = '';
  shoppingList.value = [];
  noteAnswer.value = null;

  try {
    const res = await nutritionApi.getDayMenus(currentDate.value);
    if (res) {
      menus.value = sortMenus(res.menus || []);
      savedNotes.value = res.notes || [];
      if (res.off_plan) {
        offPlanEntries.value = res.off_plan;
      }
    } else {
      menus.value = [];
      savedNotes.value = [];
      if (offPlanSupported.value) {
        try {
          offPlanEntries.value = await nutritionApi.getOffPlan(currentDate.value);
        } catch {
          offPlanSupported.value = false;
        }
      }
    }
  } catch (err) {
    console.error('Error loading menu:', err);
    toastStore.show('Помилка завантаження меню', 'error');
  } finally {
    loading.value = false;
  }
}

watch(currentDate, () => {
  loadMenu();
});

// Generate Full Day Menu
async function handleGenerateDay() {
  generating.value = true;
  try {
    const result: GenerationResultRead = await nutritionApi.generateMenu(currentDate.value, {
      scope: 'day',
    });
    menus.value = sortMenus(result.menus);
    rationale.value = result.rationale || '';
    shoppingList.value = result.shopping_list || [];
    toastStore.show('Меню на день згенеровано!', 'success');
  } catch (err: unknown) {
    console.error('Day generation error:', err);
    if (err instanceof ApiError && err.status === 409) {
      toastStore.show('Спочатку заповніть профіль харчування', 'warning');
    } else {
      toastStore.show(err instanceof Error ? err.message : 'Помилка генерації меню', 'error');
    }
  } finally {
    generating.value = false;
  }
}

// Generate or Regenerate Single Slot
async function handleGenerateSlot(slotName: string) {
  generating.value = true;
  try {
    const result = await nutritionApi.generateMenu(currentDate.value, {
      scope: 'slot',
      slot: slotName,
    });
    // Replace slot in place or append if newly created
    const updatedSlot = result.menus.find((m) => m.slot === slotName);
    if (updatedSlot) {
      const idx = menus.value.findIndex((m) => m.slot === slotName);
      if (idx !== -1) {
        menus.value[idx] = updatedSlot;
      } else {
        menus.value.push(updatedSlot);
      }
      menus.value = sortMenus(menus.value);
    } else {
      menus.value = sortMenus(result.menus);
    }
    if (result.rationale) rationale.value = result.rationale;
    if (result.shopping_list) shoppingList.value = result.shopping_list;
    toastStore.show(`Прийом «${slotName}» успішно згенеровано!`, 'success');
  } catch (err: unknown) {
    console.error('Slot generation error:', err);
    if (err instanceof ApiError && err.status === 409) {
      toastStore.show('Спочатку заповніть профіль харчування', 'warning');
    } else {
      toastStore.show(err instanceof Error ? err.message : 'Помилка генерації прийому', 'error');
    }
  } finally {
    generating.value = false;
  }
}

// Update Meal Slot Status
async function updateSlotStatus(menu: MenuRead, nextStatus: MenuStatus) {
  try {
    await nutritionApi.updateMenu(menu.id, {
      status: nextStatus,
      eaten_at: nextStatus === 'eaten' ? nowLocalIso() : null,
    });
    if (nextStatus === 'eaten') {
      toastStore.show(`«${menu.slot}» позначено як з'їдено`, 'success');
    } else if (nextStatus === 'skipped') {
      toastStore.show(`«${menu.slot}» пропущено`, 'info');
    } else if (nextStatus === 'planned') {
      toastStore.show(`«${menu.slot}»: статус скасовано`, 'info');
    }
    await loadMenu();
  } catch (err: unknown) {
    console.error('Error updating meal status:', err);
    toastStore.show('Помилка оновлення статусу прийому', 'error');
  }
}

// Prompt to cancel meal status via confirmation
async function promptCancelMeal(menu: MenuRead) {
  if (!confirm(`Скасувати статус для прийому «${menu.slot}»?`)) {
    return;
  }
  await updateSlotStatus(menu, 'planned');
}

// Item-level marking actions
async function handleMarkItemEaten(item: MenuItemRead) {
  if (updatingItemId.value) return;
  updatingItemId.value = item.id;
  try {
    await nutritionApi.updateMenuItem(item.id, {
      status: 'eaten',
      eaten_at: nowLocalIso(),
    });
    toastStore.show(`«${item.title}» позначено як з'їдено`, 'success');
    await loadMenu();
  } catch (err) {
    console.error('Error marking item eaten:', err);
    toastStore.show('Помилка оновлення статусу позиції', 'error');
  } finally {
    updatingItemId.value = null;
  }
}

async function handleMarkItemSkipped(item: MenuItemRead) {
  if (updatingItemId.value) return;
  updatingItemId.value = item.id;
  try {
    await nutritionApi.updateMenuItem(item.id, {
      status: 'skipped',
      eaten_at: null,
    });
    toastStore.show(`«${item.title}» пропущено`, 'info');
    await loadMenu();
  } catch (err) {
    console.error('Error marking item skipped:', err);
    toastStore.show('Помилка оновлення статусу позиції', 'error');
  } finally {
    updatingItemId.value = null;
  }
}

async function handleUnmarkItem(item: MenuItemRead) {
  if (updatingItemId.value) return;
  updatingItemId.value = item.id;
  try {
    await nutritionApi.updateMenuItem(item.id, {
      status: null,
      eaten_at: null,
    });
    toastStore.show(`«${item.title}»: позначку скасовано`, 'info');
    await loadMenu();
  } catch (err) {
    console.error('Error unmarking item:', err);
    toastStore.show('Помилка скасування позначки', 'error');
  } finally {
    updatingItemId.value = null;
  }
}

// Delete item from slot
async function handleDeleteItem(item: MenuItemRead) {
  if (item.status !== null) return;
  if (!confirm(`Видалити «${item.title}»?`)) return;

  try {
    await nutritionApi.deleteMenuItem(item.id);
    toastStore.show('Позицію видалено', 'info');
    await loadMenu();
  } catch (err) {
    console.error('Error deleting item:', err);
    toastStore.show('Помилка видалення позиції', 'error');
  }
}

// Open Edit Item modal
function openEditItemModal(item: MenuItemRead) {
  if (item.status !== null) return;
  editingItem.value = item;
  editPortionG.value = item.portion_g;
  editPortionText.value = item.portion_text || '';
  editKcalEst.value = item.kcal_est;
  isEditItemModalOpen.value = true;
}

function openReplaceFromEdit() {
  if (!editingItem.value || editingItem.value.status !== null) return;
  const item = editingItem.value;
  isEditItemModalOpen.value = false;
  openReplaceItemModal(item);
}

async function handleDeleteItemFromEdit() {
  if (!editingItem.value || editingItem.value.status !== null) return;
  const item = editingItem.value;
  isEditItemModalOpen.value = false;
  await handleDeleteItem(item);
}

async function handleSaveItemEdit() {
  if (!editingItem.value || editingItem.value.status !== null) return;

  savingEditItem.value = true;
  try {
    await nutritionApi.updateMenuItem(editingItem.value.id, {
      portion_g: editPortionG.value ? Number(editPortionG.value) : null,
      portion_text: editPortionText.value.trim() || null,
      kcal_est: editKcalEst.value !== null && editKcalEst.value !== undefined ? Number(editKcalEst.value) : null,
    });
    toastStore.show('Порцію оновлено', 'success');
    isEditItemModalOpen.value = false;
    await loadMenu();
  } catch (err) {
    toastStore.show('Помилка оновлення порції', 'error');
  } finally {
    savingEditItem.value = false;
  }
}

async function loadInventory() {
  try {
    const [dishes, prods] = await Promise.all([
      nutritionApi.getDishes(undefined, true),
      nutritionApi.getProducts(),
    ]);
    availableDishes.value = dishes;
    availableProducts.value = prods.filter((p) => p.availability !== 'out');
  } catch (err) {
    console.error('Error fetching inventory:', err);
  }
}

// Open Replace Item modal
async function openReplaceItemModal(item: MenuItemRead) {
  if (item.status !== null) return;
  replacingItem.value = item;
  replaceSourceType.value = item.dish_id ? 'dish' : (item.product_id ? 'product' : 'dish');
  selectedReplaceDishId.value = null;
  selectedReplaceProductId.value = null;
  replacePortionG.value = item.portion_g;
  replacePortionText.value = item.portion_text || '';
  replaceKcalEst.value = item.kcal_est;

  isReplaceModalOpen.value = true;
  await loadInventory();
}

function onSelectReplaceDish(dish: DishRead) {
  selectedReplaceDishId.value = dish.id;
  selectedReplaceProductId.value = null;
  if (dish.remaining_g) {
    replacePortionG.value = Math.min(250, dish.remaining_g);
    replacePortionText.value = '';
  }
}

function onSelectReplaceProduct(prod: ProductRead) {
  selectedReplaceProductId.value = prod.id;
  selectedReplaceDishId.value = null;
  if (prod.daily_limit_g) {
    replacePortionG.value = prod.daily_limit_g;
    replacePortionText.value = '';
  }
}

async function handleSaveReplaceItem() {
  if (!replacingItem.value || replacingItem.value.status !== null) return;
  const isDish = replaceSourceType.value === 'dish';
  const dishId = isDish ? selectedReplaceDishId.value : undefined;
  const productId = !isDish ? selectedReplaceProductId.value : undefined;

  if (!dishId && !productId) {
    toastStore.show('Оберіть страву або продукт зі списку', 'warning');
    return;
  }

  savingReplaceItem.value = true;
  try {
    const payload: MenuItemUpdate = {
      dish_id: dishId,
      product_id: productId,
      portion_g: replacePortionG.value ? Number(replacePortionG.value) : null,
      portion_text: replacePortionText.value.trim() || null,
      kcal_est: replaceKcalEst.value !== null && replaceKcalEst.value !== undefined ? Number(replaceKcalEst.value) : null,
    };
    await nutritionApi.updateMenuItem(replacingItem.value.id, payload);
    toastStore.show('Позицію замінено', 'success');
    isReplaceModalOpen.value = false;
    await loadMenu();
  } catch (err: unknown) {
    console.error('Error replacing item:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка заміни позиції', 'error');
  } finally {
    savingReplaceItem.value = false;
  }
}

// Open Add Item modal
async function openAddItemModal(slot: string) {
  activeSlotForAdd.value = slot;
  addItemSourceType.value = 'dish';
  selectedDishId.value = null;
  selectedProductId.value = null;
  addItemTitle.value = '';
  addItemPortionG.value = null;
  addItemPortionText.value = '';
  addItemKcalEst.value = null;

  isAddItemModalOpen.value = true;
  await loadInventory();
}

function onSelectDish(dish: DishRead) {
  selectedDishId.value = dish.id;
  selectedProductId.value = null;
  addItemTitle.value = dish.name;
  if (dish.remaining_g) {
    addItemPortionG.value = Math.min(250, dish.remaining_g);
  }
}

function onSelectProduct(prod: ProductRead) {
  selectedProductId.value = prod.id;
  selectedDishId.value = null;
  addItemTitle.value = prod.name;
  if (prod.daily_limit_g) {
    addItemPortionG.value = prod.daily_limit_g;
  }
}

async function handleSaveNewItem() {
  if (!activeSlotForAdd.value) return;
  if (!selectedDishId.value && !selectedProductId.value) {
    toastStore.show('Оберіть страву або продукт зі списку', 'warning');
    return;
  }

  addingItem.value = true;
  try {
    await nutritionApi.addMenuItem(currentDate.value, activeSlotForAdd.value, {
      dish_id: selectedDishId.value,
      product_id: selectedProductId.value,
      title: addItemTitle.value.trim() || undefined,
      portion_g: addItemPortionG.value ? Number(addItemPortionG.value) : undefined,
      portion_text: addItemPortionText.value.trim() || undefined,
      kcal_est: addItemKcalEst.value ? Number(addItemKcalEst.value) : undefined,
    });

    toastStore.show('Позицію додано до прийому', 'success');
    isAddItemModalOpen.value = false;
    await loadMenu();
  } catch (err: unknown) {
    console.error('Error adding item:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка додавання', 'error');
  } finally {
    addingItem.value = false;
  }
}

// Off-Plan Actions
function openOffPlanModal() {
  offPlanText.value = '';
  offPlanKcal.value = null;
  isOffPlanModalOpen.value = true;
}

async function handleSaveOffPlan() {
  if (!offPlanText.value.trim()) {
    toastStore.show('Вкажіть, що було зʼїдено', 'warning');
    return;
  }

  savingOffPlan.value = true;
  try {
    const entry = await nutritionApi.createOffPlan({
      date: currentDate.value,
      at: nowLocalIso(),
      text: offPlanText.value.trim(),
      kcal_est: offPlanKcal.value ? Number(offPlanKcal.value) : null,
    });
    if (entry) {
      offPlanEntries.value.push(entry);
      toastStore.show('Запис поза планом збережено', 'success');
    }
    isOffPlanModalOpen.value = false;
  } catch (err) {
    toastStore.show('Помилка збереження запису', 'error');
  } finally {
    savingOffPlan.value = false;
  }
}

async function handleDeleteOffPlan(id: string) {
  try {
    await nutritionApi.deleteOffPlan(id);
    offPlanEntries.value = offPlanEntries.value.filter((e) => e.id !== id);
    toastStore.show('Запис видалено', 'info');
  } catch (err) {
    toastStore.show('Помилка видалення', 'error');
  }
}

// AI Note / Correction
async function handleSendNote() {
  if (!noteText.value.trim()) return;

  sendingNote.value = true;
  noteAnswer.value = null;
  try {
    const res = await nutritionApi.createMenuNote(currentDate.value, {
      kind: noteKind.value,
      text: noteText.value.trim(),
    });
    if (res === null) {
      notesSupported.value = false;
      toastStore.show('Функція уточнень для ШІ тимчасово недоступна на сервері', 'info');
      return;
    }
    if (res.answer) {
      noteAnswer.value = res.answer;
      savedNotes.value.push(res);
      noteText.value = '';
      toastStore.show('Отримано відповідь ШІ', 'success');
    } else {
      noteText.value = '';
      toastStore.show('Повідомлення надіслано', 'info');
    }
    // If correction, reload menu to display adjusted items
    if (noteKind.value === 'correction') {
      await loadMenu();
    }
  } catch (err) {
    toastStore.show('Помилка надсилання уточнення', 'error');
  } finally {
    sendingNote.value = false;
  }
}

function getSlotKcal(menu: MenuRead): number {
  return menu.items.reduce((sum, item) => sum + (item.kcal_est || 0), 0);
}

onMounted(() => {
  loadProfileMeals();
  loadMenu();
});
</script>

<template>
  <div class="menu-view">
    <!-- Top Date Switcher -->
    <div class="date-header card">
      <button class="btn-icon date-nav-btn" @click="prevDay" aria-label="Попередній день">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="date-display" @click="goToToday" title="Натисніть для переходу на сьогодні">
        <span class="friendly-date">{{ formatFriendlyDate(currentDate) }}</span>
        <span class="exact-date num-mono">{{ currentDate }}</span>
      </div>

      <button class="btn-icon date-nav-btn" @click="nextDay" aria-label="Наступний день">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>

    <!-- Summary KPI banner if menus exist -->
    <div v-if="menus.length > 0" class="summary-card card">
      <div class="summary-col">
        <span class="summary-label">Заплановано</span>
        <span class="summary-val num-mono">{{ totalKcal }} <span class="summary-unit">ккал</span></span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-col">
        <span class="summary-label">З'їдено</span>
        <span class="summary-val num-mono val-eaten">{{ eatenKcal }} <span class="summary-unit">ккал</span></span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-col">
        <span class="summary-label">Прийомів</span>
        <span class="summary-val num-mono">{{ menus.filter(m => m.status === 'eaten').length }} / {{ menus.length }}</span>
      </div>
    </div>

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
      <div
        v-for="menu in menus"
        :key="menu.id"
        class="card slot-card"
        :class="{
          'slot-incomplete': menu.status === 'incomplete',
          'slot-eaten': menu.status === 'eaten',
          'slot-skipped': menu.status === 'skipped',
          'slot-partial': menu.status === 'partial',
        }"
      >
        <!-- Slot Header -->
        <div class="slot-header">
          <div class="slot-title-group">
            <h2 class="slot-title">{{ menu.slot }}</h2>
            <span class="slot-kcal num-mono">{{ getSlotKcal(menu) }} ккал</span>
          </div>

          <div class="slot-status-group">
            <template v-if="menu.status === 'eaten'">
              <span class="badge badge-success">
                ✓ З'їдено
              </span>
              <button
                type="button"
                class="btn-icon status-edit-btn"
                title="Скасувати статус «З'їдено»"
                aria-label="Скасувати статус «З'їдено»"
                @click="promptCancelMeal(menu)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            </template>
            <template v-else-if="menu.status === 'partial'">
              <span class="badge badge-primary">
                Частково
              </span>
              <button
                type="button"
                class="btn-icon status-edit-btn"
                title="Скасувати позначки для всього прийому"
                aria-label="Скасувати позначки для всього прийому"
                @click="promptCancelMeal(menu)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            </template>
            <template v-else-if="menu.status === 'skipped'">
              <span class="badge badge-neutral">
                Пропущено
              </span>
              <button
                type="button"
                class="btn-icon status-edit-btn"
                title="Скасувати статус «Пропущено»"
                aria-label="Скасувати статус «Пропущено»"
                @click="promptCancelMeal(menu)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            </template>
            <span v-else-if="menu.status === 'incomplete'" class="badge badge-warning">
              Не вистачає продуктів
            </span>
            <span v-else class="badge badge-info">
              Заплановано
            </span>
          </div>
        </div>

        <!-- Items in Slot -->
        <div class="slot-items">
          <div
            v-for="item in menu.items"
            :key="item.id"
            class="item-row"
            :class="{
              'item-row-eaten': item.status === 'eaten',
              'item-row-skipped': item.status === 'skipped',
              'item-row-incomplete': item.incomplete && !item.status,
            }"
          >
            <div
              class="item-info"
              :class="{ 'item-info-readonly': item.status !== null }"
              :title="item.status === null ? 'Натисніть для редагування або заміни' : undefined"
              @click="item.status === null && openEditItemModal(item)"
            >
              <div class="item-title-row">
                <span class="item-title">{{ item.title }}</span>
                <span v-if="item.status === 'eaten'" class="badge badge-success item-badge">
                  ✓ З'їдено
                </span>
                <span v-else-if="item.status === 'skipped'" class="badge badge-neutral item-badge">
                  Пропущено
                </span>
                <span v-else-if="item.incomplete" class="badge badge-warning item-badge">
                  Не вистачає
                </span>
              </div>
              <div class="item-meta">
                <span v-if="item.portion_g" class="num-mono portion-pill">
                  {{ item.portion_g }} г
                </span>
                <span v-else-if="item.portion_text" class="portion-pill">
                  {{ item.portion_text }}
                </span>
                <span v-if="item.kcal_est" class="num-mono kcal-pill">
                  {{ item.kcal_est }} ккал
                </span>
                <span v-if="item.origin === 'manual'" class="badge badge-neutral manual-badge">
                  вручну
                </span>
              </div>
            </div>

            <div class="item-actions">
              <!-- Marked item controls: unmark only (read-only until unmarked) -->
              <template v-if="item.status !== null">
                <button
                  type="button"
                  class="btn-icon item-btn item-unmark-btn"
                  :disabled="updatingItemId === item.id"
                  @click.stop="handleUnmarkItem(item)"
                  title="Зняти позначку"
                  aria-label="Зняти позначку"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              </template>

              <!-- Unmarked item controls: direct mark eaten / mark skipped buttons; edit/replace/delete in edit sheet -->
              <template v-else>
                <button
                  type="button"
                  class="btn-icon item-btn item-mark-eaten-btn"
                  :disabled="updatingItemId === item.id"
                  @click.stop="handleMarkItemEaten(item)"
                  title="Позначити як з'їдено"
                  aria-label="Позначити як з'їдено"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn-icon item-btn item-mark-skip-btn"
                  :disabled="updatingItemId === item.id"
                  @click.stop="handleMarkItemSkipped(item)"
                  title="Пропустити страву"
                  aria-label="Пропустити страву"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 4 15 12 5 20 5 4"></polygon>
                    <line x1="19" y1="5" x2="19" y2="19"></line>
                  </svg>
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Slot action bar -->
        <div class="slot-footer">
          <button
            v-if="menu.status !== 'eaten'"
            type="button"
            class="btn-action-text"
            @click="openAddItemModal(menu.slot)"
          >
            + Додати позицію
          </button>
          <div v-else></div>

          <div class="slot-buttons">
            <!-- Regenerate slot button -->
            <button
              v-if="menu.status !== 'eaten'"
              type="button"
              class="btn-icon slot-ctrl-btn"
              :disabled="generating"
              @click="handleGenerateSlot(menu.slot)"
              :title="`ШІ: перегенерувати прийом «${menu.slot}»`"
              :aria-label="`ШІ: перегенерувати прийом «${menu.slot}»`"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>

            <!-- Cancel whole meal button (when partial, eaten, or skipped) -->
            <button
              v-if="menu.status === 'eaten' || menu.status === 'partial' || menu.status === 'skipped'"
              type="button"
              class="btn-icon slot-ctrl-btn"
              @click="promptCancelMeal(menu)"
              title="Скасувати позначки для всього прийому"
              aria-label="Скасувати позначки для всього прийому"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <!-- Whole meal eaten button -->
            <button
              v-if="menu.status !== 'eaten'"
              type="button"
              class="btn btn-primary btn-sm-action"
              @click="updateSlotStatus(menu, 'eaten')"
            >
              ✓ З'їдено
            </button>

            <!-- Whole meal skipped button -->
            <button
              v-if="menu.status !== 'skipped' && menu.status !== 'eaten'"
              type="button"
              class="btn-icon slot-ctrl-btn"
              @click="updateSlotStatus(menu, 'skipped')"
              title="Пропустити прийом"
              aria-label="Пропустити прийом"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                <line x1="19" y1="5" x2="19" y2="19"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>

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
    <div v-if="rationale || (shoppingList && shoppingList.length > 0)" class="extras-section">
      <!-- Rationale card -->
      <div v-if="rationale" class="card rationale-card">
        <div class="section-header">
          <span>Обґрунтування ШІ</span>
        </div>
        <p class="rationale-text">{{ rationale }}</p>
      </div>

      <!-- Shopping list card -->
      <div v-if="shoppingList && shoppingList.length > 0" class="card shopping-card">
        <div class="section-header">
          <span>Рекомендації докупити</span>
        </div>
        <ul class="shopping-list">
          <li v-for="(item, idx) in shoppingList" :key="idx" class="shopping-item">
            <span class="shopping-bullet">•</span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Off-Plan Section ("Поза планом") -->
    <div class="card offplan-card">
      <div class="section-header">
        <span>Поза планом</span>
        <button class="btn-text-action" @click="openOffPlanModal">
          + Записати
        </button>
      </div>

      <div v-if="offPlanEntries.length === 0" class="offplan-empty">
        Немає незапланованих перекусів
      </div>

      <div v-else class="offplan-list">
        <div
          v-for="entry in offPlanEntries"
          :key="entry.id"
          class="offplan-row"
        >
          <div class="offplan-text-group">
            <span class="offplan-text">{{ entry.text }}</span>
            <span v-if="entry.kcal_est" class="badge badge-neutral num-mono">
              +{{ entry.kcal_est }} ккал
            </span>
          </div>
          <button
            class="btn-icon offplan-del-btn"
            @click="handleDeleteOffPlan(entry.id)"
            aria-label="Видалити запис"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- AI Notes Section ("Уточнення для ШІ") -->
    <div v-if="notesSupported" class="card ai-notes-card">
      <div class="section-header">Уточнення для ШІ</div>

      <div class="note-type-switcher">
        <SegmentedControl v-model="noteKind" :options="noteKindOptions" />
      </div>

      <form @submit.prevent="handleSendNote" class="ai-note-form">
        <textarea
          v-model="noteText"
          class="form-textarea"
          :placeholder="noteKind === 'info'
            ? 'Наприклад: є виноград — скільки можна зʼїсти?'
            : 'Наприклад: не хочу сьогодні казеїн, заміни на щось інше'"
          required
        ></textarea>

        <button
          type="submit"
          class="btn btn-secondary btn-full"
          :disabled="sendingNote || !noteText.trim()"
        >
          {{ sendingNote ? 'ШІ думає...' : (noteKind === 'info' ? 'Запитати у ШІ' : 'Надіслати коригування') }}
        </button>
      </form>

      <!-- Saved notes list with answers -->
      <div v-if="savedNotes.length > 0" class="saved-notes-list">
        <div v-for="note in savedNotes" :key="note.id" class="ai-answer-box">
          <div class="ai-answer-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>{{ note.kind === 'info' ? 'Запитання' : 'Коригування' }}: {{ note.text }}</span>
          </div>
          <div v-if="note.answer" class="ai-answer-content">{{ note.answer }}</div>
        </div>
      </div>
    </div>

    <!-- Modal: Add Item to Slot -->
    <ModalSheet
      :show="isAddItemModalOpen"
      :title="`Додати в «${activeSlotForAdd}»`"
      @close="isAddItemModalOpen = false"
    >
      <form @submit.prevent="handleSaveNewItem" class="add-item-form">
        <DishProductPicker
          v-model:source-type="addItemSourceType"
          :available-dishes="availableDishes"
          :available-products="availableProducts"
          :selected-dish-id="selectedDishId"
          :selected-product-id="selectedProductId"
          @select-dish="onSelectDish"
          @select-product="onSelectProduct"
        />

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label" for="addPortionG">Порція (г)</label>
            <input
              id="addPortionG"
              v-model.number="addItemPortionG"
              type="number"
              class="form-input num-mono"
              placeholder="Напр. 200"
              min="1"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="addPortionText">Або опис порції</label>
            <input
              id="addPortionText"
              v-model="addItemPortionText"
              type="text"
              class="form-input"
              placeholder="2 шт, 1 чашка..."
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="addKcalEst">Оцінка ккал (опційно)</label>
          <input
            id="addKcalEst"
            v-model.number="addItemKcalEst"
            type="number"
            class="form-input num-mono"
            placeholder="Напр. 350"
            min="0"
          />
        </div>

        <div class="modal-actions-area">
          <button
            type="submit"
            class="btn btn-primary btn-full"
            :disabled="addingItem || (addItemSourceType === 'dish' ? !selectedDishId : !selectedProductId)"
          >
            {{ addingItem ? 'Додаємо...' : 'Додати до меню' }}
          </button>
        </div>
      </form>
    </ModalSheet>

    <!-- Modal: Edit Item Portion & Actions -->
    <ModalSheet
      :show="isEditItemModalOpen"
      :title="editingItem?.title ? `Позиція: ${editingItem.title}` : 'Позиція меню'"
      @close="isEditItemModalOpen = false"
    >
      <form @submit.prevent="handleSaveItemEdit" class="edit-item-form">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label" for="editPortionG">Порція (г)</label>
            <input
              id="editPortionG"
              v-model.number="editPortionG"
              type="number"
              class="form-input num-mono"
              placeholder="г"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="editPortionText">Опис</label>
            <input
              id="editPortionText"
              v-model="editPortionText"
              type="text"
              class="form-input"
              placeholder="1 шт..."
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="editKcalEst">Калорійність (ккал)</label>
          <input
            id="editKcalEst"
            v-model.number="editKcalEst"
            type="number"
            class="form-input num-mono"
            placeholder="ккал"
          />
        </div>

        <div class="modal-actions-area">
          <button
            type="submit"
            class="btn btn-primary btn-full"
            :disabled="savingEditItem"
          >
            {{ savingEditItem ? 'Збереження...' : 'Зберегти порцію' }}
          </button>
          <button
            type="button"
            class="btn btn-secondary btn-full"
            @click="openReplaceFromEdit"
          >
            Замінити позицію...
          </button>
          <button
            type="button"
            class="btn btn-danger btn-full"
            @click="handleDeleteItemFromEdit"
          >
            Видалити позицію
          </button>
        </div>
      </form>
    </ModalSheet>

    <!-- Modal: Replace Item in Slot -->
    <ModalSheet
      :show="isReplaceModalOpen"
      :title="replacingItem?.title ? `Замінити «${replacingItem.title}»` : 'Заміна позиції'"
      @close="isReplaceModalOpen = false"
    >
      <form @submit.prevent="handleSaveReplaceItem" class="replace-item-form">
        <DishProductPicker
          v-model:source-type="replaceSourceType"
          :available-dishes="availableDishes"
          :available-products="availableProducts"
          :selected-dish-id="selectedReplaceDishId"
          :selected-product-id="selectedReplaceProductId"
          @select-dish="onSelectReplaceDish"
          @select-product="onSelectReplaceProduct"
        />

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label" for="replacePortionG">Порція (г)</label>
            <input
              id="replacePortionG"
              v-model.number="replacePortionG"
              type="number"
              class="form-input num-mono"
              placeholder="Напр. 200"
              min="1"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="replacePortionText">Або опис порції</label>
            <input
              id="replacePortionText"
              v-model="replacePortionText"
              type="text"
              class="form-input"
              placeholder="2 шт, 1 чашка..."
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="replaceKcalEst">Оцінка ккал (опційно)</label>
          <input
            id="replaceKcalEst"
            v-model.number="replaceKcalEst"
            type="number"
            class="form-input num-mono"
            placeholder="Напр. 350"
            min="0"
          />
        </div>

        <div class="modal-actions-area">
          <button
            type="submit"
            class="btn btn-primary btn-full"
            :disabled="savingReplaceItem || (replaceSourceType === 'dish' ? !selectedReplaceDishId : !selectedReplaceProductId)"
          >
            {{ savingReplaceItem ? 'Заміна...' : 'Замінити' }}
          </button>
        </div>
      </form>
    </ModalSheet>

    <!-- Modal: Add Off-Plan Entry -->
    <ModalSheet
      :show="isOffPlanModalOpen"
      title="Запис поза планом"
      @close="isOffPlanModalOpen = false"
    >
      <form @submit.prevent="handleSaveOffPlan" class="offplan-form">
        <div class="form-group">
          <label class="form-label" for="opText">Що було з'їдено?</label>
          <input
            id="opText"
            v-model="offPlanText"
            type="text"
            class="form-input"
            placeholder="Горіхи 30 г, банан, кава з молоком..."
            required
            autofocus
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="opKcal">Оцінка калорій (ккал)</label>
          <input
            id="opKcal"
            v-model.number="offPlanKcal"
            type="number"
            class="form-input num-mono"
            placeholder="Необов'язково"
            min="0"
          />
        </div>

        <div class="modal-actions-area">
          <button
            type="submit"
            class="btn btn-primary btn-full"
            :disabled="savingOffPlan"
          >
            {{ savingOffPlan ? 'Збереження...' : 'Зберегти запис' }}
          </button>
        </div>
      </form>
    </ModalSheet>
  </div>
</template>

<style scoped>
.menu-view {
  padding-bottom: var(--space-20);
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-12);
  margin-bottom: var(--space-12);
}

.date-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.friendly-date {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.exact-date {
  font-size: 11.5px;
  color: var(--text-muted);
}

.date-nav-btn {
  color: var(--primary);
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--space-12) var(--space-16);
  margin-bottom: var(--space-12);
  background: rgba(255, 255, 255, 0.03);
}

.summary-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-label {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.summary-val {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.val-eaten {
  color: var(--success);
}

.summary-unit {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
}

.summary-divider {
  width: 1px;
  height: 24px;
  background-color: var(--surface-border);
}

.menu-slots-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.slot-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-bottom: 0;
  transition: border-color 0.2s ease;
}

.slot-incomplete {
  border-color: rgba(251, 146, 60, 0.35);
  background: linear-gradient(180deg, rgba(249, 115, 22, 0.05) 0%, var(--surface) 100%);
}

.slot-eaten {
  border-color: rgba(34, 197, 94, 0.25);
}

.slot-skipped {
  opacity: 0.65;
}

.slot-partial {
  border-color: rgba(129, 140, 248, 0.35);
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slot-title-group {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
}

.slot-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.slot-kcal {
  font-size: 13px;
  color: var(--info);
  font-weight: 500;
}

.slot-status-group {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.status-edit-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  color: var(--text-muted);
  border-radius: var(--radius-pill);
}

.status-edit-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.slot-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.item-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-control);
  border: 1px solid rgba(255, 255, 255, 0.04);
  gap: var(--space-8);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.item-row-eaten {
  border-color: rgba(34, 197, 94, 0.25);
  background: rgba(34, 197, 94, 0.04);
}

.item-row-skipped {
  opacity: 0.65;
}

.item-row-incomplete {
  border-color: rgba(251, 146, 60, 0.35);
  background: rgba(249, 115, 22, 0.04);
}

.item-info {
  flex: 1 1 180px;
  min-width: 0;
  cursor: pointer;
}

.item-info-readonly {
  cursor: default;
}

.item-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 3px;
}

.item-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
}

.item-row-skipped .item-title {
  text-decoration: line-through;
}

.item-badge {
  font-size: 11px;
  padding: 2px 7px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.portion-pill {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 7px;
  border-radius: var(--radius-pill);
}

.kcal-pill {
  color: var(--info);
}

.manual-badge {
  font-size: 10px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.item-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border-radius: var(--radius-control);
}

.item-mark-eaten-btn {
  color: var(--text-muted);
}

.item-mark-eaten-btn:hover {
  color: var(--success);
  background: var(--success-bg-chip);
}

.item-mark-skip-btn {
  color: var(--text-muted);
}

.item-mark-skip-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.item-unmark-btn {
  color: var(--text-muted);
}

.item-unmark-btn:hover {
  color: var(--warning);
  background: var(--warning-bg-chip);
}

.item-del-btn:hover {
  color: var(--danger);
  background: var(--danger-bg-chip);
}

.slot-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
}

.btn-action-text {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.slot-buttons {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.slot-ctrl-btn {
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.05);
}

.slot-ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-sm-action {
  min-height: 44px;
  padding: 0 var(--space-12);
  font-size: 13px;
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

.extras-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: var(--space-16);
}

.rationale-text {
  font-size: 13.5px;
  color: var(--text-primary);
  line-height: 1.45;
}

.shopping-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.shopping-item {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 13.5px;
  color: var(--text-primary);
}

.shopping-bullet {
  color: var(--warning);
}

.offplan-card {
  margin-top: var(--space-16);
}

.offplan-empty {
  font-size: 12.5px;
  color: var(--text-muted);
  padding: var(--space-4) 0;
}

.offplan-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.offplan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-control);
}

.offplan-text-group {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.offplan-text {
  font-size: 13.5px;
  color: var(--text-primary);
}

.offplan-del-btn {
  min-width: 32px;
  min-height: 32px;
}

.offplan-del-btn:hover {
  color: var(--danger);
}

.ai-notes-card {
  margin-top: var(--space-16);
}

.note-type-switcher {
  margin-bottom: var(--space-12);
}

.ai-note-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.ai-answer-box {
  margin-top: var(--space-12);
  background: rgba(129, 140, 248, 0.08);
  border: 1px solid rgba(129, 140, 248, 0.25);
  border-radius: var(--radius-control);
  padding: var(--space-12);
}

.saved-notes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-12);
}

.saved-notes-list .ai-answer-box {
  margin-top: 0;
}

.ai-answer-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-4);
}

.ai-answer-content {
  font-size: 13.5px;
  color: var(--text-primary);
  line-height: 1.45;
}

.btn-text-action {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

.modal-actions-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: var(--space-20);
}

.btn-full {
  width: 100%;
}
</style>
