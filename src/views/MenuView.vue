<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { nutritionApi } from '../services/api';
import { useToastStore } from '../stores/toast';
import { formatLocalDate, nowLocalIso } from '../utils/date';
import { mealTypeLabel } from '../utils/mealTypes';
import type { JournalResponse, MenuRead } from '../types/nutrition';
import DayJournalModal from '../components/DayJournalModal.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import DishesView from './DishesView.vue';

const router = useRouter();
const toastStore = useToastStore();

// Main Screen State
const loadingInitial = ref(true);
const journalData = ref<JournalResponse | null>(null);
const currentSuggestion = ref<MenuRead | null>(null);
const currentState = ref<'request' | 'suggestion'>('request');

// Input fields
const requestText = ref('');
const clarifyText = ref('');

// Button loading states
const submitting = ref(false);
const submittingEat = ref(false);
const submittingOther = ref(false);

// Modal and Navigation
const showJournalModal = ref(false);
const isOverflowMenuOpen = ref(false);
const activePageIndex = ref(0);
const carouselRef = ref<HTMLDivElement | null>(null);

// Status bar computations
const totalsKcal = computed(() => journalData.value?.totals?.kcal || 0);
const normsKcal = computed(() => journalData.value?.norms?.kcal ?? null);
const totalsProtein = computed(() => journalData.value?.totals?.protein_g || 0);
const normsProtein = computed(() => journalData.value?.norms?.protein_g ?? null);

const kcalStatusText = computed(() => {
  const eaten = Math.round(totalsKcal.value);
  if (normsKcal.value != null && normsKcal.value > 0) {
    return `${eaten} / ${Math.round(normsKcal.value)} ккал`;
  }
  return `${eaten} ккал`;
});

const proteinStatusText = computed(() => {
  const eaten = Math.round(totalsProtein.value);
  if (normsProtein.value != null && normsProtein.value > 0) {
    return `білок ${eaten} / ${Math.round(normsProtein.value)}`;
  }
  return `білок ${eaten} г`;
});

const progressBarWidth = computed(() => {
  if (normsKcal.value == null || normsKcal.value <= 0) return '0%';
  const pct = Math.min(100, Math.max(0, Math.round((totalsKcal.value / normsKcal.value) * 100)));
  return `${pct}%`;
});

// Suggestion card computations
const currentMealLabel = computed(() => {
  return mealTypeLabel(currentSuggestion.value?.meal_type) || 'Прийом їжі';
});

const suggestionTotals = computed(() => {
  if (!currentSuggestion.value?.items) {
    return { kcal: 0, protein_g: 0 };
  }
  return currentSuggestion.value.items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + (item.kcal || 0),
      protein_g: acc.protein_g + (item.protein_g || 0),
    }),
    { kcal: 0, protein_g: 0 }
  );
});

const remainingKcalText = computed(() => {
  if (normsKcal.value == null) return '';
  const remaining = Math.round(normsKcal.value - totalsKcal.value - suggestionTotals.value.kcal);
  return `лишиться ${remaining} ккал`;
});

// Fetch Journal
async function fetchJournal() {
  try {
    const data = await nutritionApi.getJournal(formatLocalDate());
    journalData.value = data;
    if (data.suggestion) {
      currentSuggestion.value = data.suggestion;
      currentState.value = 'suggestion';
    } else if (currentState.value === 'suggestion' && !currentSuggestion.value) {
      currentState.value = 'request';
    }
  } catch (err: unknown) {
    console.error('Failed to load journal:', err);
  }
}

// State 1: Request suggestion
async function handleSuggest() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const textToSend = requestText.value.trim() || null;
    const res = await nutritionApi.createSuggestion({
      text: textToSend,
      date: formatLocalDate(),
      at: nowLocalIso(),
    });

    if (res.intent === 'log') {
      toastStore.show('Запис додано до щоденника', 'success');
      requestText.value = '';
      await fetchJournal();
    } else {
      currentSuggestion.value = res.menu;
      currentState.value = 'suggestion';
      requestText.value = '';
      clarifyText.value = '';
      await fetchJournal();
    }
  } catch (err: unknown) {
    console.error('Failed to request suggestion:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка отримання пропозиції', 'error');
  } finally {
    submitting.value = false;
  }
}

// State 2: Eat meal
async function handleEat() {
  if (!currentSuggestion.value || submitting.value) return;
  submitting.value = true;
  submittingEat.value = true;
  try {
    await nutritionApi.eatMeal(currentSuggestion.value.id, {
      date: formatLocalDate(),
      at: nowLocalIso(),
    });
    toastStore.show('Смачного! Прийом їжі збережено', 'success');
    currentSuggestion.value = null;
    currentState.value = 'request';
    await fetchJournal();
  } catch (err: unknown) {
    console.error('Failed to mark meal as eaten:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка збереження прийому їжі', 'error');
  } finally {
    submitting.value = false;
    submittingEat.value = false;
  }
}

// State 2: Regenerate suggestion ("Інше" or "Уточнити…")
async function handleRegenerate() {
  if (submitting.value) return;
  submitting.value = true;
  submittingOther.value = true;
  try {
    const textToSend = clarifyText.value.trim() || null;
    const res = await nutritionApi.createSuggestion({
      text: textToSend,
      date: formatLocalDate(),
      at: nowLocalIso(),
    });

    if (res.intent === 'log') {
      toastStore.show('Запис додано до щоденника', 'success');
      clarifyText.value = '';
      await fetchJournal();
    } else {
      currentSuggestion.value = res.menu;
      currentState.value = 'suggestion';
      clarifyText.value = '';
      await fetchJournal();
    }
  } catch (err: unknown) {
    console.error('Failed to regenerate suggestion:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка генерації іншої пропозиції', 'error');
  } finally {
    submitting.value = false;
    submittingOther.value = false;
  }
}

// Journal updated handler
async function handleJournalUpdated() {
  await fetchJournal();
  if (!journalData.value?.suggestion && currentState.value === 'suggestion') {
    currentSuggestion.value = null;
    currentState.value = 'request';
  }
}

// Overflow menu
function toggleOverflowMenu() {
  isOverflowMenuOpen.value = !isOverflowMenuOpen.value;
}

function closeOverflowMenu() {
  isOverflowMenuOpen.value = false;
}

function goToProducts() {
  closeOverflowMenu();
  router.push('/products');
}

function goToProfile() {
  closeOverflowMenu();
  router.push('/profile');
}

// Carousel scroll & dot navigation
function onCarouselScroll() {
  if (!carouselRef.value) return;
  const { scrollLeft, clientWidth } = carouselRef.value;
  if (clientWidth > 0) {
    const pageIndex = Math.round(scrollLeft / clientWidth);
    if (pageIndex !== activePageIndex.value) {
      activePageIndex.value = pageIndex;
    }
  }
}

function scrollToPage(index: number) {
  activePageIndex.value = index;
  if (!carouselRef.value) return;
  carouselRef.value.scrollTo({
    left: index * carouselRef.value.clientWidth,
    behavior: 'smooth',
  });
}

function onWindowResize() {
  if (!carouselRef.value) return;
  carouselRef.value.scrollTo({
    left: activePageIndex.value * carouselRef.value.clientWidth,
    behavior: 'auto',
  });
}

onMounted(async () => {
  window.addEventListener('resize', onWindowResize);
  loadingInitial.value = true;
  try {
    await fetchJournal();
  } finally {
    loadingInitial.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize);
});
</script>

<template>
  <div class="main-screen">
    <!-- Top Header -->
    <header class="main-screen-header">
      <span class="main-title">{{ activePageIndex === 0 ? 'Сьогодні' : 'Є вдома' }}</span>
      <div class="overflow-menu-wrapper">
        <button
          type="button"
          class="btn-overflow-trigger"
          aria-label="Меню налаштувань"
          :aria-expanded="isOverflowMenuOpen"
          @click="toggleOverflowMenu"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div v-if="isOverflowMenuOpen" class="dropdown-backdrop" @click="closeOverflowMenu"></div>

        <div v-if="isOverflowMenuOpen" class="overflow-menu-dropdown" @click.stop>
          <button type="button" class="dropdown-item" @click="goToProducts">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>Продукти</span>
          </button>
          <button type="button" class="dropdown-item" @click="goToProfile">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Профіль</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Status Line (Always visible at top, tapping opens day journal) -->
    <div
      class="status-line-container"
      role="button"
      tabindex="0"
      aria-label="Відкрити щоденник харчування"
      @click="showJournalModal = true"
      @keydown.enter="showJournalModal = true"
    >
      <div class="status-text-row">
        <span>{{ kcalStatusText }}</span>
        <span>{{ proteinStatusText }}</span>
      </div>
      <div class="status-bar-track">
        <div class="status-bar-fill" :style="{ width: progressBarWidth }"></div>
      </div>
    </div>

    <!-- Carousel: Page 0 «Сьогодні» and Page 1 «Є вдома» -->
    <div ref="carouselRef" class="carousel-container" @scroll.passive="onCarouselScroll">
      <!-- Page 0: Сьогодні -->
      <div class="carousel-page page-today">
        <!-- Center content: Request or Suggestion State -->
        <div class="state-center-wrapper">
          <div v-if="loadingInitial" class="loading-state">
            <LoadingSpinner :size="24" />
          </div>

          <!-- State 1: Request -->
          <div v-else-if="currentState === 'request'" class="request-state">
            <textarea
              v-model="requestText"
              class="request-textarea"
              placeholder="Побажання до прийому, або просто натисніть"
              :disabled="submitting"
              rows="4"
              @keydown.ctrl.enter="handleSuggest"
              @keydown.meta.enter="handleSuggest"
            ></textarea>
            <button
              type="button"
              class="btn-suggest-primary"
              :disabled="submitting"
              @click="handleSuggest"
            >
              <span v-if="!submitting">Що їсти?</span>
              <LoadingSpinner v-else :size="18" />
            </button>
          </div>

          <!-- State 2: Suggestion -->
          <div v-else class="suggestion-state">
            <div class="suggestion-card">
              <div class="meal-label">{{ currentMealLabel }}</div>
              <div class="dishes-list">
                <div
                  v-for="item in currentSuggestion?.items || []"
                  :key="item.id"
                  class="dish-row"
                >
                  <span class="dish-title">{{ item.title }}</span>
                  <span class="dish-grams">
                    {{ item.portion_g ? Math.round(item.portion_g) + ' г' : '' }}
                  </span>
                </div>
              </div>
              <div class="card-summary-divider"></div>
              <div class="card-summary-row">
                <span>
                  {{ Math.round(suggestionTotals.kcal) }} ккал · білок {{ Math.round(suggestionTotals.protein_g) }} г
                </span>
                <span v-if="remainingKcalText">
                  {{ remainingKcalText }}
                </span>
              </div>
              <div class="card-buttons-row">
                <button
                  type="button"
                  class="btn-eat"
                  :disabled="submitting"
                  @click="handleEat"
                >
                  <span v-if="!submittingEat">З'їв</span>
                  <LoadingSpinner v-else :size="16" />
                </button>
                <button
                  type="button"
                  class="btn-other"
                  :disabled="submitting"
                  @click="handleRegenerate"
                >
                  <span v-if="!submittingOther">Інше</span>
                  <LoadingSpinner v-else :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Collapsed Clarification line at bottom (only in State 2) -->
        <div v-if="currentState === 'suggestion'" class="clarify-wrapper">
          <div class="clarify-input-bar">
            <input
              v-model="clarifyText"
              type="text"
              class="clarify-input"
              placeholder="Уточнити…"
              :disabled="submitting"
              @keydown.enter.prevent="handleRegenerate"
            />
            <button
              type="button"
              class="btn-clarify-send"
              :disabled="submitting"
              aria-label="Уточнити"
              @click="handleRegenerate"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Page 1: Є вдома -->
      <div class="carousel-page page-dishes">
        <DishesView :embedded="true" />
      </div>
    </div>

    <!-- Bottom Page Indicator: Two dots -->
    <div class="page-indicator">
      <button
        type="button"
        class="page-dot"
        :class="{ active: activePageIndex === 0 }"
        aria-label="Сторінка Сьогодні"
        @click="scrollToPage(0)"
      ></button>
      <button
        type="button"
        class="page-dot"
        :class="{ active: activePageIndex === 1 }"
        aria-label="Сторінка Є вдома"
        @click="scrollToPage(1)"
      ></button>
    </div>

    <!-- Day Journal Modal -->
    <DayJournalModal
      :show="showJournalModal"
      @close="showJournalModal = false"
      @updated="handleJournalUpdated"
    />
  </div>
</template>

<style scoped>
.main-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: var(--screen-max-width);
  margin: var(--space-0) auto;
  background-color: var(--color-bg);
  padding: calc(var(--space-14) + var(--safe-area-top)) var(--space-16) calc(var(--space-8) + var(--safe-area-bottom));
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
}

/* Header */
.main-screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  padding: var(--space-4) var(--space-4) var(--space-0);
  flex-shrink: 0;
}

.main-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
}

.overflow-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.btn-overflow-trigger {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.btn-overflow-trigger:hover,
.btn-overflow-trigger:focus-visible {
  color: var(--color-text-primary);
}

.dropdown-backdrop {
  position: fixed;
  inset: var(--space-0);
  z-index: 90;
  background: transparent;
}

.overflow-menu-dropdown {
  position: absolute;
  top: calc(100% + var(--space-6));
  right: var(--space-0);
  background-color: var(--color-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dropdown);
  padding: var(--space-6) var(--space-0);
  z-index: 100;
  min-width: var(--dropdown-min-width);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-10);
  width: 100%;
  padding: var(--space-10) var(--space-16);
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-family: var(--font-sans);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--transition-fast);
}

.dropdown-item:hover,
.dropdown-item:focus-visible {
  background-color: var(--color-border);
}

/* Status Line */
.status-line-container {
  margin: var(--space-18) var(--space-4) var(--space-0);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.status-text-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}

.status-bar-track {
  height: var(--status-bar-height);
  background-color: var(--color-progress-track);
  border-radius: var(--radius-xs);
  margin-top: var(--space-8);
  overflow: hidden;
}

.status-bar-fill {
  height: 100%;
  background-color: var(--color-progress-fill);
  border-radius: var(--radius-xs);
  transition: width var(--transition-normal);
}

/* Carousel */
.carousel-container {
  flex: 1;
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  width: 100%;
  min-height: var(--space-0);
}

.carousel-container::-webkit-scrollbar {
  display: none;
}

.carousel-page {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.page-today {
  justify-content: space-between;
  padding: var(--space-0) var(--space-4);
  overflow: hidden;
}

.page-dishes {
  overflow-y: auto;
  padding: var(--space-0) var(--space-4);
  min-height: var(--space-0);
}

.state-center-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: var(--space-0);
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-40) var(--space-0);
}

/* State 1: Request */
.request-state {
  display: flex;
  flex-direction: column;
}

.request-textarea {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  border: var(--border-width-hairline) solid var(--color-border);
  padding: var(--space-16);
  min-height: var(--textarea-min-height);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  line-height: var(--leading-relaxed);
  resize: none;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color var(--transition-fast);
}

.request-textarea::placeholder {
  color: var(--color-text-muted);
}

.request-textarea:focus {
  border-color: var(--color-border-strong);
}

.btn-suggest-primary {
  margin-top: var(--space-16);
  height: var(--btn-height-primary);
  border-radius: var(--radius-btn);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: background-color var(--transition-fast);
}

.btn-suggest-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-suggest-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* State 2: Suggestion */
.suggestion-state {
  display: flex;
  flex-direction: column;
}

.suggestion-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--space-18) var(--space-16) var(--space-14);
  display: flex;
  flex-direction: column;
}

.meal-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-12);
}

.dishes-list {
  display: flex;
  flex-direction: column;
}

.dish-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-base);
  padding: var(--space-7) var(--space-0);
}

.dish-title {
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: var(--space-8);
}

.dish-grams {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.card-summary-divider {
  border-top: var(--border-width-hairline) solid var(--color-border);
  margin-top: var(--space-10);
  padding-top: var(--space-12);
}

.card-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}

.card-buttons-row {
  display: flex;
  gap: var(--space-10);
  margin-top: var(--space-16);
}

.btn-eat {
  flex: 1;
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

.btn-eat:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-eat:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-other {
  flex: 1;
  height: var(--btn-height-secondary);
  border-radius: var(--radius-pill);
  border: var(--border-width-hairline) solid var(--color-btn-outline-border);
  background-color: transparent;
  color: var(--color-btn-outline-text);
  font-size: var(--font-size-base);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.btn-other:hover:not(:disabled) {
  background-color: var(--color-btn-outline-hover-bg);
}

.btn-other:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Clarify Bar */
.clarify-wrapper {
  margin-top: var(--space-12);
  margin-bottom: var(--space-4);
  flex-shrink: 0;
}

.clarify-input-bar {
  height: var(--input-height-bottom);
  border-radius: var(--radius-pill);
  background-color: var(--color-surface);
  display: flex;
  align-items: center;
  padding: var(--space-0) var(--space-16);
  justify-content: space-between;
}

.clarify-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: var(--font-size-input);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}

.clarify-input::placeholder {
  color: var(--color-text-muted);
}

.btn-clarify-send {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  transition: color var(--transition-fast);
}

.btn-clarify-send:hover:not(:disabled) {
  color: var(--color-text-primary);
}

.btn-clarify-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Page Indicator */
.page-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-10) var(--space-0) var(--space-4);
  flex-shrink: 0;
}

.page-dot {
  width: var(--dot-inactive-width);
  height: var(--dot-height);
  border-radius: var(--radius-xs);
  background-color: var(--color-dot-inactive);
  border: none;
  padding: var(--space-0);
  cursor: pointer;
  transition: width var(--transition-fast), background-color var(--transition-fast);
}

.page-dot.active {
  width: var(--dot-active-width);
  background-color: var(--color-dot-active);
}
</style>
