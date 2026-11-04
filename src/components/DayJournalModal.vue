<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import ModalSheet from './ModalSheet.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import { nutritionApi } from '../services/api';
import { useToastStore } from '../stores/toast';
import {
  formatLocalDate,
  formatFriendlyDate,
  addDays,
  isToday,
  formatTime24,
  nowLocalIso,
} from '../utils/date';
import { mealTypeLabel } from '../utils/mealTypes';
import type {
  JournalResponse,
  MenuRead,
  MenuItemRead,
} from '../types/nutrition';

const props = defineProps<{
  show: boolean;
  initialDate?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const toastStore = useToastStore();

const todayDate = formatLocalDate();
const selectedDate = ref(props.initialDate || todayDate);
const loading = ref(false);
const journalData = ref<JournalResponse | null>(null);

// Editing grams state
const editingItemId = ref<string | null>(null);
const editingGrams = ref<number | null>(null);
const savingGrams = ref(false);

// Recording eaten meal state
const logText = ref('');
const submittingLog = ref(false);
const highlightedMealId = ref<string | null>(null);
let removeHighlightListeners: (() => void) | null = null;

function clearHighlight() {
  if (removeHighlightListeners) {
    removeHighlightListeners();
    removeHighlightListeners = null;
  }
  highlightedMealId.value = null;
}

function setHighlight(mealId: string) {
  clearHighlight();
  highlightedMealId.value = mealId;

  const onUserAction = () => {
    clearHighlight();
  };

  const timer = setTimeout(() => {
    window.addEventListener('pointerdown', onUserAction, { capture: true, once: true });
    window.addEventListener('keydown', onUserAction, { capture: true, once: true });

    removeHighlightListeners = () => {
      window.removeEventListener('pointerdown', onUserAction, { capture: true });
      window.removeEventListener('keydown', onUserAction, { capture: true });
    };
  }, 100);

  const prevCleanup = removeHighlightListeners;
  removeHighlightListeners = () => {
    clearTimeout(timer);
    if (prevCleanup) prevCleanup();
    window.removeEventListener('pointerdown', onUserAction, { capture: true });
    window.removeEventListener('keydown', onUserAction, { capture: true });
  };
}

// Evaluation explanation popup
interface ExplanationState {
  title: string;
  criterionKey: string;
  choice: string;
  level: string;
  text: string;
}
const activeExplanation = ref<ExplanationState | null>(null);

const CRITERIA_DEFINITIONS: Record<
  string,
  { title: string; criteria: Record<string, string> }
> = {
  goal: {
    title: 'Мета',
    criteria: {
      green: 'Калорійність відхиляється від денної норми не більше ніж на 10 %',
      yellow: 'Відхилення від 10 до 20 %',
      red: 'Відхилення понад 20 %',
      uncertain: 'Недостатня впевненість для визначення оцінки',
    },
  },
  balance: {
    title: 'Збалансованість',
    criteria: {
      green: 'Виконано всі три умови: білковий продукт у кожному прийомі, овочі/фрукти, щонайменше 4 групи продуктів',
      yellow: 'Виконано дві умови',
      red: 'Виконано одну умову або жодної',
      uncertain: 'Недостатня впевненість для визначення оцінки',
    },
  },
  salt: {
    title: 'Сіль',
    criteria: {
      green: 'Солоних і перероблених продуктів немає',
      yellow: 'Один солоний або перероблений продукт',
      red: 'Два і більше солоних або перероблених продуктів',
      uncertain: 'Недостатня впевненість для визначення оцінки',
    },
  },
};

async function loadJournalForDate(dateStr: string) {
  loading.value = true;
  try {
    const data = await nutritionApi.getJournal(dateStr);
    journalData.value = data;
  } catch (err) {
    console.error('Failed to load journal:', err);
    toastStore.show('Не вдалося завантажити журнал', 'error');
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      selectedDate.value = props.initialDate || todayDate;
      loadJournalForDate(selectedDate.value);
    } else {
      editingItemId.value = null;
      activeExplanation.value = null;
      clearHighlight();
    }
  }
);

watch(selectedDate, (newDate) => {
  if (props.show) {
    editingItemId.value = null;
    clearHighlight();
    loadJournalForDate(newDate);
  }
});

function prevDay() {
  clearHighlight();
  selectedDate.value = addDays(selectedDate.value, -1);
}

function nextDay() {
  if (isToday(selectedDate.value)) return;
  clearHighlight();
  selectedDate.value = addDays(selectedDate.value, 1);
}

function startEditGrams(item: MenuItemRead) {
  clearHighlight();
  editingItemId.value = item.id;
  editingGrams.value = item.portion_g ?? 100;
}

function cancelEditGrams() {
  editingItemId.value = null;
  editingGrams.value = null;
}

async function saveGrams(item: MenuItemRead) {
  if (editingGrams.value === null || editingGrams.value <= 0) {
    toastStore.show('Вкажіть коректну вагу у грамах', 'warning');
    return;
  }
  savingGrams.value = true;
  try {
    await nutritionApi.updateMenuItem(item.id, {
      portion_g: editingGrams.value,
    });
    toastStore.show('Вагу страви оновлено', 'success');
    editingItemId.value = null;
    await loadJournalForDate(selectedDate.value);
    emit('updated');
  } catch (err) {
    console.error('Failed to update grams:', err);
    toastStore.show('Помилка оновлення ваги', 'error');
  } finally {
    savingGrams.value = false;
  }
}

async function handleDeleteMeal(meal: MenuRead) {
  clearHighlight();
  if (!confirm(`Видалити цей прийом їжі (${mealTypeLabel(meal.meal_type)})?`)) {
    return;
  }
  try {
    await nutritionApi.deleteMeal(meal.id);
    toastStore.show('Прийом їжі видалено', 'success');
    await loadJournalForDate(selectedDate.value);
    emit('updated');
  } catch (err) {
    console.error('Failed to delete meal:', err);
    toastStore.show('Не вдалося видалити прийом їжі', 'error');
  }
}

function openEvaluationExplanation(
  criterionKey: string,
  level: string,
  choice: string,
  title?: string
) {
  clearHighlight();
  const def = CRITERIA_DEFINITIONS[criterionKey];
  const displayTitle = title || def?.title || criterionKey;
  const explanationText =
    def?.criteria[choice] ||
    def?.criteria[level] ||
    `Оцінка: ${choice}`;

  activeExplanation.value = {
    title: displayTitle,
    criterionKey,
    choice,
    level,
    text: explanationText,
  };
}

function closeExplanation() {
  activeExplanation.value = null;
}

function mealKcal(meal: MenuRead): number {
  return Math.round(
    meal.items.reduce((sum, it) => sum + (it.kcal ?? 0), 0)
  );
}

function mealProtein(meal: MenuRead): number {
  return Math.round(
    meal.items.reduce((sum, it) => sum + (it.protein_g ?? 0), 0)
  );
}

const eatenMeals = computed(() => {
  if (!journalData.value) return [];
  return journalData.value.meals.filter((m) => m.state === 'eaten');
});

async function handleLogMeal() {
  const textToSend = logText.value.trim();
  if (!textToSend || submittingLog.value) return;

  submittingLog.value = true;
  try {
    const res = await nutritionApi.createSuggestion({
      text: textToSend,
      date: selectedDate.value,
      at: nowLocalIso(),
      mode: 'log',
    });

    // Update journal list and totals without full-modal reload
    const freshJournal = await nutritionApi.getJournal(selectedDate.value);
    if (!freshJournal.meals.some((m) => m.id === res.menu.id)) {
      freshJournal.meals.push(res.menu);
    }
    journalData.value = freshJournal;

    // Highlight the new meal until next user action
    setHighlight(res.menu.id);

    // Clear input field on success
    logText.value = '';

    // Notify parent to refresh status line
    emit('updated');

    // Scroll new meal into view smoothly
    await nextTick();
    const el = document.querySelector(`[data-meal-id="${res.menu.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (err) {
    console.error('Failed to log meal:', err);
    toastStore.show(
      err instanceof Error ? err.message : 'Не вдалося записати прийом їжі',
      'error'
    );
  } finally {
    submittingLog.value = false;
  }
}

onUnmounted(() => {
  clearHighlight();
});
</script>

<template>
  <ModalSheet :show="props.show" title="Журнал дня" @close="emit('close')">
    <div class="journal-container">
      <!-- Date Navigation Row -->
      <div class="date-bar">
        <button
          type="button"
          class="btn-date-nav"
          @click="prevDay"
          aria-label="Попередній день"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <label class="date-display-label">
          <span class="date-friendly-text">{{ formatFriendlyDate(selectedDate) }}</span>
          <input
            v-model="selectedDate"
            type="date"
            class="hidden-date-picker"
            :max="todayDate"
          />
        </label>

        <button
          type="button"
          class="btn-date-nav"
          :disabled="isToday(selectedDate)"
          @click="nextDay"
          aria-label="Наступний день"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <LoadingSpinner v-if="loading" text="Завантаження журналу..." />

      <template v-else-if="journalData">
        <!-- Totals & Day Evaluations Summary Card -->
        <div class="journal-summary-card">
          <div class="summary-totals-row">
            <div class="summary-stat">
              <span class="stat-label">Калорії</span>
              <span class="stat-value num-mono">
                {{ Math.round(journalData.totals.kcal) }}
                <span v-if="journalData.norms?.kcal" class="stat-norm">
                  / {{ Math.round(journalData.norms.kcal) }} ккал
                </span>
                <span v-else class="stat-norm">ккал</span>
              </span>
            </div>

            <div class="summary-stat">
              <span class="stat-label">Білок</span>
              <span class="stat-value num-mono">
                {{ Math.round(journalData.totals.protein_g) }}
                <span v-if="journalData.norms?.protein_g" class="stat-norm">
                  / {{ Math.round(journalData.norms.protein_g) }} г
                </span>
                <span v-else class="stat-norm">г</span>
              </span>
            </div>
          </div>

          <!-- Day Evaluations Chips -->
          <div
            v-if="journalData.day_evaluations && journalData.day_evaluations.length > 0"
            class="day-eval-chips"
          >
            <button
              v-for="ev in journalData.day_evaluations"
              :key="ev.key"
              type="button"
              class="eval-chip"
              :class="'eval-' + (ev.level || 'uncertain')"
              @click="openEvaluationExplanation(ev.key, ev.level, ev.level, ev.title)"
            >
              <span class="eval-dot"></span>
              <span>{{ ev.title }}</span>
            </button>
          </div>
        </div>

        <!-- Eaten Meals List -->
        <div v-if="eatenMeals.length === 0" class="empty-journal-msg">
          <p>Немає записів за цей день</p>
        </div>

        <div v-else class="meals-list">
          <div
            v-for="meal in eatenMeals"
            :key="meal.id"
            :data-meal-id="meal.id"
            class="meal-card"
            :class="{ 'is-highlighted': meal.id === highlightedMealId }"
          >
            <!-- Meal Card Header -->
            <div class="meal-header">
              <div class="meal-header-left">
                <span v-if="meal.origin === 'pinned'" class="pinned-icon" title="Закріплений прийом">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22"></line>
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                  </svg>
                </span>
                <span class="meal-type-name">{{ mealTypeLabel(meal.meal_type) }}</span>
                <span v-if="meal.eaten_at" class="meal-time num-mono">
                  {{ formatTime24(meal.eaten_at) }}
                </span>
              </div>

              <button
                type="button"
                class="btn-delete-meal"
                aria-label="Видалити прийом"
                title="Видалити прийом"
                @click="handleDeleteMeal(meal)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>

            <!-- Meal Evaluations Chips -->
            <div
              v-if="meal.evaluations && meal.evaluations.length > 0"
              class="meal-eval-chips"
            >
              <button
                v-for="mev in meal.evaluations"
                :key="mev.criterion_key || mev.key"
                type="button"
                class="eval-chip"
                :class="'eval-' + (mev.level || mev.choice || 'uncertain')"
                @click="openEvaluationExplanation(mev.criterion_key || mev.key || '', mev.level, mev.choice)"
              >
                <span class="eval-dot"></span>
                <span>{{ CRITERIA_DEFINITIONS[mev.criterion_key || mev.key || '']?.title || mev.criterion_key }}</span>
              </button>
            </div>

            <!-- Dishes list -->
            <div class="meal-items-list">
              <div
                v-for="item in meal.items"
                :key="item.id"
                class="meal-item-row"
              >
                <span class="item-title">{{ item.title }}</span>

                <!-- Grams editor -->
                <div v-if="editingItemId === item.id" class="inline-edit-grams">
                  <input
                    v-model.number="editingGrams"
                    type="number"
                    min="1"
                    max="5000"
                    class="grams-input num-mono"
                    autofocus
                    @keydown.enter="saveGrams(item)"
                    @keydown.esc="cancelEditGrams"
                  />
                  <span class="grams-unit">г</span>
                  <button
                    type="button"
                    class="btn-confirm-grams"
                    :disabled="savingGrams"
                    @click="saveGrams(item)"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    class="btn-cancel-grams"
                    :disabled="savingGrams"
                    @click="cancelEditGrams"
                  >
                    ✕
                  </button>
                </div>

                <button
                  v-else
                  type="button"
                  class="item-portion-btn num-mono"
                  title="Натисніть для зміни грамів"
                  @click="startEditGrams(item)"
                >
                  <span>{{ item.portion_g ? `${item.portion_g} г` : item.portion_text }}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Meal Footer Summary -->
            <div class="meal-footer num-mono">
              <span>{{ mealKcal(meal) }} ккал · білок {{ mealProtein(meal) }} г</span>
            </div>
          </div>
        </div>

        <!-- Record Eaten Food Form -->
        <form class="log-meal-form" @submit.prevent="handleLogMeal">
          <input
            v-model="logText"
            type="text"
            class="log-meal-input"
            placeholder="Що з'їли? Наприклад: гречка 200 г, курятина 175 г"
            :disabled="submittingLog"
          />
          <button
            type="submit"
            class="btn-log-meal"
            :disabled="submittingLog || !logText.trim()"
          >
            <span v-if="!submittingLog">Записати</span>
            <LoadingSpinner v-else :size="16" />
          </button>
        </form>
      </template>

      <!-- Explanation Popover/Modal -->
      <div v-if="activeExplanation" class="explanation-backdrop" @click="closeExplanation">
        <div class="explanation-card" @click.stop>
          <div class="explanation-header">
            <div class="explanation-title-row">
              <span class="eval-dot" :class="'eval-dot-' + activeExplanation.level"></span>
              <h4 class="explanation-title">{{ activeExplanation.title }}</h4>
            </div>
            <button type="button" class="btn-close-explanation" @click="closeExplanation">✕</button>
          </div>
          <p class="explanation-body">{{ activeExplanation.text }}</p>
        </div>
      </div>
    </div>
  </ModalSheet>
</template>

<style scoped>
.journal-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-14);
}

/* Date Bar */
.date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-0);
  border-bottom: var(--border-width-base) solid var(--color-border);
}

.btn-date-nav {
  width: var(--btn-height-sm);
  height: var(--btn-height-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.btn-date-nav:hover:not(:disabled) {
  color: var(--color-text-primary);
}

.btn-date-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-display-label {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-sm);
}

.date-friendly-text {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.hidden-date-picker {
  position: absolute;
  inset: var(--space-0);
  opacity: 0;
  cursor: pointer;
  width: 100%;
}

/* Summary Card */
.journal-summary-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-14) var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  border: var(--border-width-base) solid var(--color-border);
}

.summary-totals-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.summary-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-label);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.stat-norm {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-regular);
}

/* Evaluations Chips */
.day-eval-chips,
.meal-eval-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
}

.eval-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-8);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: none;
  line-height: var(--leading-none);
  transition: transform var(--transition-fast);
}

.eval-chip:active {
  transform: scale(0.96);
}

.eval-green {
  background: var(--color-eval-green-bg);
  color: var(--color-eval-green);
}

.eval-yellow {
  background: var(--color-eval-yellow-bg);
  color: var(--color-eval-yellow);
}

.eval-red {
  background: var(--color-eval-red-bg);
  color: var(--color-eval-red);
}

.eval-uncertain {
  background: var(--color-eval-uncertain-bg);
  color: var(--color-eval-uncertain);
}

.eval-dot {
  width: var(--space-6);
  height: var(--space-6);
  border-radius: var(--radius-full);
  background: currentColor;
}

.eval-dot-green {
  background: var(--color-eval-green);
}

.eval-dot-yellow {
  background: var(--color-eval-yellow);
}

.eval-dot-red {
  background: var(--color-eval-red);
}

.eval-dot-uncertain {
  background: var(--color-eval-uncertain);
}

/* Meals List */
.empty-journal-msg {
  text-align: center;
  padding: var(--space-28) var(--space-0);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  max-height: var(--journal-list-max-height);
  overflow-y: auto;
  padding-right: var(--space-2);
}

.meal-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-14) var(--space-16);
  border: var(--border-width-base) solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  transition: border-color var(--transition-normal), background-color var(--transition-normal), box-shadow var(--transition-normal);
}

.meal-card.is-highlighted {
  border-color: var(--color-primary);
  background-color: var(--color-primary-chip);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meal-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.pinned-icon {
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
}

.meal-type-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-label);
  font-weight: var(--font-weight-semibold);
}

.meal-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-dim);
}

.btn-delete-meal {
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.btn-delete-meal:hover {
  color: var(--danger);
}

.meal-items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.meal-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}

.item-title {
  flex: 1;
}

.item-portion-btn {
  background: transparent;
  border: var(--border-width-base) dashed transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sub);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-6);
  border-radius: var(--radius-sm);
  transition: border-color var(--transition-fast), color var(--transition-fast);
}

.item-portion-btn:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

.inline-edit-grams {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
}

.grams-input {
  width: var(--space-48);
  height: var(--btn-height-xs);
  padding: var(--space-0) var(--space-4);
  background: var(--color-bg);
  border: var(--border-width-base) solid var(--color-primary);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sub);
  text-align: right;
  outline: none;
}

.grams-unit {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.btn-confirm-grams,
.btn-cancel-grams {
  height: var(--btn-height-xs);
  min-width: var(--btn-height-xs);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.btn-confirm-grams {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-cancel-grams {
  background: var(--color-border);
  color: var(--color-text-secondary);
}

.meal-footer {
  border-top: var(--border-width-base) solid var(--color-border);
  padding-top: var(--space-8);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  display: flex;
  justify-content: flex-end;
}

/* Explanation Overlay */
.explanation-backdrop {
  position: fixed;
  inset: var(--space-0);
  background: var(--color-scrim);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
}

.explanation-card {
  background: var(--color-surface);
  border: var(--border-width-base) solid var(--color-border-strong);
  border-radius: var(--radius-card);
  padding: var(--space-16);
  max-width: var(--screen-max-width);
  width: 100%;
  box-shadow: var(--shadow-modal);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.explanation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.explanation-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.explanation-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.btn-close-explanation {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-base);
  padding: var(--space-2) var(--space-4);
}

.explanation-body {
  font-size: var(--font-size-input);
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
  margin: 0;
}

/* Record Eaten Food Form */
.log-meal-form {
  display: flex;
  gap: var(--space-8);
  align-items: center;
  margin-top: var(--space-6);
  padding-top: var(--space-12);
  border-top: var(--border-width-base) solid var(--color-border);
  flex-shrink: 0;
}

.log-meal-input {
  flex: 1;
  min-width: 0;
  height: var(--btn-height-secondary);
  padding: 0 var(--space-12);
  background-color: var(--color-bg);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: var(--font-size-input);
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--transition-fast);
}

.log-meal-input:focus {
  border-color: var(--color-primary);
}

.log-meal-input::placeholder {
  color: var(--color-text-muted);
}

.log-meal-input:disabled {
  opacity: 0.6;
}

.btn-log-meal {
  height: var(--btn-height-secondary);
  padding: 0 var(--space-16);
  border-radius: var(--radius-control);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color var(--transition-fast);
  --spinner-color: var(--color-on-primary);
  --spinner-track-color: var(--color-spinner-track-on-primary);
}

.btn-log-meal:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-log-meal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-log-meal :deep(.spinner-wrap) {
  padding: 0;
}
</style>
