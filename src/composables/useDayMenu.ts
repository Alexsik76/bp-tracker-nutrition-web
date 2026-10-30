import { ref, computed, watch } from 'vue';
import { nutritionApi, ApiError } from '../services/api';
import { useToastStore } from '../stores/toast';
import { notifyStockWarnings } from '../utils/stockWarnings';
import {
  formatLocalDate,
  addDays,
  nowLocalIso,
  isAfterToday,
} from '../utils/date';
import type {
  MenuRead,
  MenuItemRead,
  MenuItemUpdate,
  MealCreate,
  GenerationResultRead,
  OffPlanEntryRead,
  MenuNoteRead,
  MenuNoteKind,
  MealSchedule,
  AvailablePin,
  MealType,
} from '../types/nutrition';
import { mealTypeLabel } from '../utils/mealTypes';

const DEFAULT_MEALS: MealSchedule[] = [
  { type: 'breakfast', time: '08:30' },
  { type: 'lunch', time: '13:30' },
  { type: 'dinner', time: '19:00' },
];

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (typeof (err.data as { detail?: unknown })?.detail === 'string') {
      return (err.data as { detail: string }).detail;
    }
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export function useDayMenu() {
  const toastStore = useToastStore();

  const currentDate = ref(formatLocalDate());
  const menus = ref<MenuRead[]>([]);
  const loading = ref(true);
  const dayCreated = ref(true);
  const creatingDay = ref(false);
  const isCreateDayModalOpen = ref(false);

  function openCreateDayModal() {
    isCreateDayModalOpen.value = true;
  }

  function closeCreateDayModal() {
    isCreateDayModalOpen.value = false;
  }

  const canGenerateDay = ref(true);
  const dayGenerationReplacesManual = ref(false);
  const generatingDay = ref(false);
  const generatingSlot = ref<MealType | null>(null);
  const generating = computed(() => generatingDay.value || Boolean(generatingSlot.value));
  const generationStageText = ref<string>('Оцінюємо калорійність…');
  let stageTimer: ReturnType<typeof setTimeout> | null = null;

  function startGenerationStages() {
    generationStageText.value = 'Оцінюємо калорійність…';
    if (stageTimer) clearTimeout(stageTimer);
    stageTimer = setTimeout(() => {
      generationStageText.value = 'Генеруємо меню…';
    }, 2500);
  }

  function stopGenerationStages() {
    if (stageTimer) {
      clearTimeout(stageTimer);
      stageTimer = null;
    }
    generationStageText.value = 'Оцінюємо калорійність…';
  }

  const dayKcalIncomplete = ref(false);
  const estimatingSlot = ref<MealType | null>(null);
  const availablePins = ref<AvailablePin[]>([]);

  const profileMeals = ref<MealSchedule[]>([...DEFAULT_MEALS]);
  const profileSlots = computed(() => profileMeals.value.map((m) => m.type));

  // Generation result extras
  const rationale = ref<string>('');
  const shoppingList = ref<string[]>([]);

  // Off-plan entries
  const offPlanEntries = ref<OffPlanEntryRead[]>([]);
  const offPlanSupported = ref(true);
  const savingOffPlan = ref(false);

  // AI Note / Correction
  const notesSupported = ref(true);
  const savedNotes = ref<MenuNoteRead[]>([]);
  const noteAnswer = ref<string | null>(null);
  const sendingNote = ref(false);

  async function loadProfileMeals() {
    try {
      const profile = await nutritionApi.getProfile();
      if (profile?.meals && profile.meals.length > 0) {
        profileMeals.value = [...profile.meals].sort((a, b) => a.time.localeCompare(b.time));
      }
    } catch {
      // Keep default 3 meals
    }
  }

  // Total stats
  const totalKcal = computed(() => {
    return menus.value.reduce((total, m) => {
      const slotKcal = m.items.reduce((s, i) => s + (i.kcal || 0), 0);
      return total + slotKcal;
    }, 0);
  });

  const eatenKcal = computed(() => {
    return menus.value.reduce((total, m) => {
      if (m.status !== 'eaten') return total;
      const slotKcal = m.items.reduce((s, i) => s + (i.kcal || 0), 0);
      return total + slotKcal;
    }, 0);
  });

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
    availablePins.value = [];
    savedNotes.value = [];
    offPlanEntries.value = [];
    rationale.value = '';
    shoppingList.value = [];
    noteAnswer.value = null;
    isCreateDayModalOpen.value = false;

    try {
      const res = await nutritionApi.getDayMenus(currentDate.value, nowLocalIso());
      if (res) {
        notifyStockWarnings(res.stock_warnings);
        menus.value = res.menus || [];
        dayCreated.value = res.day_created ?? true;
        dayKcalIncomplete.value = res.kcal_incomplete !== undefined
          ? res.kcal_incomplete
          : (res.menus || []).some((m) => m.kcal_incomplete);
        canGenerateDay.value = res.can_generate_day ?? true;
        dayGenerationReplacesManual.value = res.day_generation_replaces_manual ?? false;
        availablePins.value = res.available_pins || [];
        savedNotes.value = res.notes || [];
        if (res.off_plan) {
          offPlanEntries.value = res.off_plan;
        }

        if (res.day_created === false && isAfterToday(currentDate.value)) {
          isCreateDayModalOpen.value = true;
        }
      } else {
        menus.value = [];
        dayCreated.value = false;
        availablePins.value = [];
        dayKcalIncomplete.value = false;
        canGenerateDay.value = false;
        dayGenerationReplacesManual.value = false;
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

  // Create Day Menu (reserving products)
  async function handleCreateDay(): Promise<boolean> {
    creatingDay.value = true;
    try {
      const res = await nutritionApi.createDay(currentDate.value, nowLocalIso());
      if (res) {
        notifyStockWarnings(res.stock_warnings);
        menus.value = res.menus || [];
        dayCreated.value = res.day_created ?? true;
        dayKcalIncomplete.value = res.kcal_incomplete !== undefined
          ? res.kcal_incomplete
          : (res.menus || []).some((m) => m.kcal_incomplete);
        canGenerateDay.value = res.can_generate_day ?? true;
        dayGenerationReplacesManual.value = res.day_generation_replaces_manual ?? false;
        availablePins.value = res.available_pins || [];
        savedNotes.value = res.notes || [];
        if (res.off_plan) {
          offPlanEntries.value = res.off_plan;
        }
      }
      isCreateDayModalOpen.value = false;
      toastStore.show('Раціон на день створено', 'success');
      return true;
    } catch (err: unknown) {
      console.error('Day creation error:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'День вже створено'), 'warning');
        await loadMenu();
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка створення дня', 'error');
      }
      return false;
    } finally {
      creatingDay.value = false;
    }
  }

  watch(currentDate, () => {
    loadMenu();
  });

  // Generate Full Day Menu
  async function handleGenerateDay() {
    if (!canGenerateDay.value || !dayCreated.value) return;

    if (dayGenerationReplacesManual.value) {
      if (!confirm('Перегенерувати меню? Додані вручну позиції буде замінено.')) {
        return;
      }
    }

    generatingDay.value = true;
    startGenerationStages();
    try {
      const result: GenerationResultRead = await nutritionApi.generateMenu(currentDate.value, {
        scope: 'day',
      });
      menus.value = result.menus;
      dayKcalIncomplete.value = result.menus.some((m) => m.kcal_incomplete);
      rationale.value = result.rationale || '';
      shoppingList.value = result.shopping_list || [];
      toastStore.show('Меню на день згенеровано!', 'success');
      await loadMenu();
    } catch (err: unknown) {
      console.error('Day generation error:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Не вдалося згенерувати меню'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка генерації меню', 'error');
      }
    } finally {
      stopGenerationStages();
      generatingDay.value = false;
    }
  }

  // Generate or Regenerate Single Slot
  async function handleGenerateSlot(slotName: MealType) {
    if (!dayCreated.value) return;
    generatingSlot.value = slotName;
    startGenerationStages();
    try {
      const result = await nutritionApi.generateMenu(currentDate.value, {
        scope: 'slot',
        meal_type: slotName,
      });
      if (result.rationale) rationale.value = result.rationale;
      if (result.shopping_list) shoppingList.value = result.shopping_list;
      toastStore.show(`Прийом «${mealTypeLabel(slotName)}» успішно згенеровано!`, 'success');
      await loadMenu();
    } catch (err: unknown) {
      console.error('Slot generation error:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Не вдалося згенерувати прийом'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка генерації прийому', 'error');
      }
    } finally {
      stopGenerationStages();
      generatingSlot.value = null;
    }
  }

  // Toggle Meal Eaten Status
  async function handleToggleMealEaten(menu: MenuRead) {
    if (!menu.id) return;
    const isEaten = menu.status === 'eaten';
    const nextEatenAt = isEaten ? null : nowLocalIso();
    try {
      await nutritionApi.updateMenu(menu.id, {
        eaten_at: nextEatenAt,
      });
      if (nextEatenAt) {
        toastStore.show(`«${mealTypeLabel(menu.meal_type)}» позначено як з'їдено`, 'success');
      } else {
        toastStore.show(`«${mealTypeLabel(menu.meal_type)}»: статус скасовано`, 'info');
      }
      await loadMenu();
    } catch (err: unknown) {
      console.error('Error updating meal status:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Помилка оновлення статусу прийому'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка оновлення статусу прийому', 'error');
      }
    }
  }

  // Delete whole meal from this day after confirmation
  async function handleDeleteMeal(menu: MenuRead) {
    if (!dayCreated.value) return;
    if (menu.status === 'eaten') {
      toastStore.show('Не можна видалити зʼїдений прийом (спочатку зніміть позначку «з\'їдено»)', 'warning');
      return;
    }
    const confirmMessage = menu.pinned
      ? `Видалити «${mealTypeLabel(menu.meal_type)}» з цього дня? Прийом стане звичайним для цієї дати.`
      : `Видалити «${mealTypeLabel(menu.meal_type)}» з цього дня?`;

    if (!confirm(confirmMessage)) {
      return;
    }
    try {
      await nutritionApi.deleteMeal(currentDate.value, menu.meal_type);
      toastStore.show(
        menu.pinned ? `«${mealTypeLabel(menu.meal_type)}»: закріплення знято на цей день` : `Прийом «${mealTypeLabel(menu.meal_type)}» видалено`,
        'info'
      );
      await loadMenu();
    } catch (err: unknown) {
      console.error('Error deleting meal:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Не можна видалити зʼїдений прийом'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка видалення прийому', 'error');
      }
    }
  }

  // Restore pinned meal back into this day
  async function handlePinMeal(slot: MealType) {
    if (!dayCreated.value) return;
    try {
      await nutritionApi.pinMeal(currentDate.value, slot);
      toastStore.show(`Закріплений прийом «${mealTypeLabel(slot)}» відновлено`, 'success');
      await loadMenu();
    } catch (err: unknown) {
      console.error('Error restoring pinned meal:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Помилка відновлення закріпленого прийому'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка відновлення закріпленого прийому', 'error');
      }
    }
  }

  // Create new meal for this day
  async function handleCreateMeal(payload: MealCreate): Promise<boolean> {
    if (!dayCreated.value) return false;
    try {
      await nutritionApi.createMeal(currentDate.value, payload);
      toastStore.show(`Прийом «${mealTypeLabel(payload.meal_type)}» успішно додано`, 'success');
      await loadMenu();
      return true;
    } catch (err: unknown) {
      console.error('Error creating meal:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(`Прийом «${mealTypeLabel(payload.meal_type)}» вже є на цей день`, 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка додавання прийому', 'error');
      }
      return false;
    }
  }

  async function handleDeleteItem(item: MenuItemRead) {
    if (!dayCreated.value) return;
    const parentMenu = menus.value.find((m) => m.items.some((i) => i.id === item.id));
    if (parentMenu?.status === 'eaten') {
      toastStore.show('Зʼїдений прийом їжі не можна змінювати (спочатку зніміть позначку «з\'їдено»)', 'warning');
      return;
    }
    if (!confirm(`Видалити «${item.title}»?`)) return;

    try {
      await nutritionApi.deleteMenuItem(item.id);
      toastStore.show('Позицію видалено', 'info');
      await loadMenu();
    } catch (err: unknown) {
      console.error('Error deleting item:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Зʼїдений прийом їжі не можна змінювати'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка видалення позиції', 'error');
      }
    }
  }

  async function handleAddMenuItem(slot: MealType, payload: {
    dishId?: string;
    title?: string;
    portionG?: number;
    portionText?: string;
    kcal?: number;
  }) {
    if (!dayCreated.value) return false;
    try {
      await nutritionApi.addMenuItem(currentDate.value, slot, {
        dish_id: payload.dishId,
        title: payload.title,
        portion_g: payload.portionG,
        portion_text: payload.portionText,
        kcal: payload.kcal,
      });
      toastStore.show('Позицію додано до прийому', 'success');
      await loadMenu();
      return true;
    } catch (err: unknown) {
      console.error('Error adding item:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Помилка додавання'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка додавання', 'error');
      }
      return false;
    }
  }

  async function handleUpdateItemPortion(itemId: string, payload: {
    title?: string | null;
    portionG?: number | null;
    portionText?: string | null;
    kcal?: number | null;
  }) {
    if (!dayCreated.value) return false;
    const parentMenu = menus.value.find((m) => m.items.some((i) => i.id === itemId));
    if (parentMenu?.status === 'eaten') {
      toastStore.show('Зʼїдений прийом їжі не можна редагувати (спочатку зніміть позначку «з\'їдено»)', 'warning');
      return false;
    }
    try {
      await nutritionApi.updateMenuItem(itemId, {
        title: payload.title,
        portion_g: payload.portionG,
        portion_text: payload.portionText,
        kcal: payload.kcal,
      });
      toastStore.show('Позицію оновлено', 'success');
      await loadMenu();
      return true;
    } catch (err: unknown) {
      console.error('Error updating item:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Зʼїдений прийом їжі не можна редагувати'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка оновлення позиції', 'error');
      }
      return false;
    }
  }

  async function handleEstimateSlot(slot: MealType) {
    if (!dayCreated.value || estimatingSlot.value) return;
    estimatingSlot.value = slot;
    try {
      await nutritionApi.estimateMenu(currentDate.value, slot);
      toastStore.show(`Калорійність для «${mealTypeLabel(slot)}» оцінено`, 'success');
      await loadMenu();
    } catch (err: unknown) {
      console.error('Estimate error:', err);
      toastStore.show(err instanceof Error ? err.message : 'Помилка оцінки калорійності', 'error');
    } finally {
      estimatingSlot.value = null;
    }
  }

  async function handleReplaceItem(itemId: string, payload: {
    dishId?: string;
    portionG?: number | null;
    portionText?: string | null;
    kcal?: number | null;
  }) {
    if (!dayCreated.value) return false;
    const parentMenu = menus.value.find((m) => m.items.some((i) => i.id === itemId));
    if (parentMenu?.status === 'eaten') {
      toastStore.show('Зʼїдений прийом їжі не можна замінити (спочатку зніміть позначку «з\'їдено»)', 'warning');
      return false;
    }
    try {
      const updatePayload: MenuItemUpdate = {
        dish_id: payload.dishId,
        portion_g: payload.portionG,
        portion_text: payload.portionText,
        kcal: payload.kcal,
      };
      await nutritionApi.updateMenuItem(itemId, updatePayload);
      toastStore.show('Позицію замінено', 'success');
      await loadMenu();
      return true;
    } catch (err: unknown) {
      console.error('Error replacing item:', err);
      if (err instanceof ApiError && err.status === 409) {
        toastStore.show(getErrorMessage(err, 'Зʼїдений прийом їжі не можна замінити'), 'warning');
      } else {
        toastStore.show(err instanceof Error ? err.message : 'Помилка заміни позиції', 'error');
      }
      return false;
    }
  }

  // Off-plan actions
  async function handleSaveOffPlan(payload: { text: string; kcal_est: number | null }) {
    if (!payload.text.trim()) {
      toastStore.show('Вкажіть, що було зʼїдено', 'warning');
      return false;
    }

    savingOffPlan.value = true;
    try {
      const entry = await nutritionApi.createOffPlan({
        date: currentDate.value,
        at: nowLocalIso(),
        text: payload.text.trim(),
        kcal_est: payload.kcal_est ? Number(payload.kcal_est) : null,
      });
      if (entry) {
        offPlanEntries.value.push(entry);
        toastStore.show('Запис поза планом збережено', 'success');
      }
      return true;
    } catch (err) {
      toastStore.show('Помилка збереження запису', 'error');
      return false;
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
  async function handleSendNote(payload: { kind: MenuNoteKind; text: string }) {
    if (!payload.text.trim()) return;

    sendingNote.value = true;
    noteAnswer.value = null;
    try {
      const res = await nutritionApi.createMenuNote(currentDate.value, {
        kind: payload.kind,
        text: payload.text.trim(),
      });
      if (res === null) {
        notesSupported.value = false;
        toastStore.show('Функція уточнень для ШІ тимчасово недоступна на сервері', 'info');
        return;
      }
      if (res.answer) {
        noteAnswer.value = res.answer;
        savedNotes.value.push(res);
        toastStore.show('Отримано відповідь ШІ', 'success');
      } else {
        toastStore.show('Повідомлення надіслано', 'info');
      }
      if (payload.kind === 'correction') {
        await loadMenu();
      }
    } catch (err) {
      toastStore.show('Помилка надсилання уточнення', 'error');
    } finally {
      sendingNote.value = false;
    }
  }

  function getSlotKcal(menu: MenuRead): number {
    return Math.round(menu.items.reduce((sum, item) => sum + (item.kcal || 0), 0));
  }

  return {
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
    dayGenerationReplacesManual,
    profileMeals,
    profileSlots,
    rationale,
    shoppingList,
    offPlanEntries,
    offPlanSupported,
    savingOffPlan,
    notesSupported,
    savedNotes,
    noteAnswer,
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
    getSlotKcal,
  };
}
