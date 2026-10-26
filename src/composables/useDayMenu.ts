import { ref, computed, watch } from 'vue';
import { nutritionApi, ApiError } from '../services/api';
import { useToastStore } from '../stores/toast';
import {
  formatLocalDate,
  addDays,
  nowLocalIso,
} from '../utils/date';
import type {
  MenuRead,
  MenuItemRead,
  MenuItemUpdate,
  MenuStatus,
  GenerationResultRead,
  OffPlanEntryRead,
  MenuNoteRead,
  MenuNoteKind,
  MealSchedule,
} from '../types/nutrition';

const DEFAULT_MEALS: MealSchedule[] = [
  { name: 'Сніданок', time: '08:30' },
  { name: 'Обід', time: '13:30' },
  { name: 'Вечеря', time: '19:00' },
];
const FALLBACK_SLOT_ORDER = ['Сніданок', 'Другий сніданок', 'Обід', 'Полуденок', 'Перекус', 'Вечеря'];

export function useDayMenu() {
  const toastStore = useToastStore();

  const currentDate = ref(formatLocalDate());
  const menus = ref<MenuRead[]>([]);
  const loading = ref(true);
  const generating = ref(false);

  const profileMeals = ref<MealSchedule[]>([...DEFAULT_MEALS]);
  const profileSlots = computed(() => profileMeals.value.map((m) => m.name));

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

  const updatingItemId = ref<string | null>(null);

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

  async function handleAddMenuItem(slot: string, payload: {
    dishId?: string;
    productId?: string;
    title?: string;
    portionG?: number;
    portionText?: string;
    kcalEst?: number;
  }) {
    try {
      await nutritionApi.addMenuItem(currentDate.value, slot, {
        dish_id: payload.dishId,
        product_id: payload.productId,
        title: payload.title,
        portion_g: payload.portionG,
        portion_text: payload.portionText,
        kcal_est: payload.kcalEst,
      });
      toastStore.show('Позицію додано до прийому', 'success');
      await loadMenu();
      return true;
    } catch (err: unknown) {
      console.error('Error adding item:', err);
      toastStore.show(err instanceof Error ? err.message : 'Помилка додавання', 'error');
      return false;
    }
  }

  async function handleUpdateItemPortion(itemId: string, payload: {
    portionG?: number | null;
    portionText?: string | null;
    kcalEst?: number | null;
  }) {
    try {
      await nutritionApi.updateMenuItem(itemId, {
        portion_g: payload.portionG,
        portion_text: payload.portionText,
        kcal_est: payload.kcalEst,
      });
      toastStore.show('Порцію оновлено', 'success');
      await loadMenu();
      return true;
    } catch {
      toastStore.show('Помилка оновлення порції', 'error');
      return false;
    }
  }

  async function handleReplaceItem(itemId: string, payload: {
    dishId?: string;
    productId?: string;
    portionG?: number | null;
    portionText?: string | null;
    kcalEst?: number | null;
  }) {
    try {
      const updatePayload: MenuItemUpdate = {
        dish_id: payload.dishId,
        product_id: payload.productId,
        portion_g: payload.portionG,
        portion_text: payload.portionText,
        kcal_est: payload.kcalEst,
      };
      await nutritionApi.updateMenuItem(itemId, updatePayload);
      toastStore.show('Позицію замінено', 'success');
      await loadMenu();
      return true;
    } catch (err: unknown) {
      console.error('Error replacing item:', err);
      toastStore.show(err instanceof Error ? err.message : 'Помилка заміни позиції', 'error');
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
    return menu.items.reduce((sum, item) => sum + (item.kcal_est || 0), 0);
  }

  return {
    currentDate,
    menus,
    loading,
    generating,
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
    getSlotKcal,
  };
}
