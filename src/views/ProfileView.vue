<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { nutritionApi } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import SegmentedControl from '../components/SegmentedControl.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import type { NutritionProfileUpsert } from '../types/nutrition';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const loading = ref(true);
const saving = ref(false);

const sex = ref<'male' | 'female'>('male');
const birthYear = ref<number>(1976);
const heightCm = ref<number>(200);
const weightKg = ref<number>(118);
const targetWeightKg = ref<number>(110);
const paceKgPerWeek = ref<number>(0.75);
const restrictions = ref<string>('');
const dislikes = ref<string>('');

// Three generation weights (0..1)
const weightVariety = ref<number>(0.5);
const weightBalance = ref<number>(0.5);
const weightGoal = ref<number>(0.5);

const sexOptions = [
  { label: 'Чоловік', value: 'male' },
  { label: 'Жінка', value: 'female' },
];

async function loadProfile() {
  loading.value = true;
  try {
    const profile = await nutritionApi.getProfile();
    if (profile) {
      sex.value = profile.sex;
      birthYear.value = profile.birth_year;
      heightCm.value = profile.height_cm;
      weightKg.value = profile.weight_kg;
      targetWeightKg.value = profile.target_weight_kg;
      paceKgPerWeek.value = profile.pace_kg_per_week;
      restrictions.value = profile.restrictions || '';
      dislikes.value = profile.dislikes || '';
      weightVariety.value = profile.weight_variety ?? 0.5;
      weightBalance.value = profile.weight_balance ?? 0.5;
      weightGoal.value = profile.weight_goal ?? 0.5;
    }
  } catch (err: unknown) {
    console.error('Error loading profile:', err);
    toastStore.show('Помилка завантаження профілю', 'error');
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  try {
    const payload: NutritionProfileUpsert = {
      sex: sex.value,
      birth_year: Number(birthYear.value),
      height_cm: Number(heightCm.value),
      weight_kg: Number(weightKg.value),
      target_weight_kg: Number(targetWeightKg.value),
      pace_kg_per_week: Number(paceKgPerWeek.value),
      restrictions: restrictions.value.trim() || null,
      dislikes: dislikes.value.trim() || null,
      weight_variety: Number(weightVariety.value),
      weight_balance: Number(weightBalance.value),
      weight_goal: Number(weightGoal.value),
    };

    await nutritionApi.upsertProfile(payload);
    toastStore.show('Профіль успішно збережено!', 'success');
  } catch (err: unknown) {
    console.error('Save profile error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Не вдалося зберегти профіль', 'error');
  } finally {
    saving.value = false;
  }
}

function goBack() {
  router.push('/menu');
}

async function handleLogout() {
  if (confirm('Ви дійсно бажаєте вийти з акаунту?')) {
    await authStore.logout();
    router.replace('/login');
  }
}

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="profile-view">
    <header class="profile-header">
      <div class="header-left" role="button" tabindex="0" @click="goBack" @keydown.enter="goBack">
        <svg
          class="back-arrow"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <h1 class="header-title">Профіль</h1>
      </div>
    </header>

    <div v-if="loading" class="loading-wrap">
      <LoadingSpinner text="Завантаження профілю..." />
    </div>

    <form v-else @submit.prevent="saveProfile" class="profile-form">
      <!-- User info card -->
      <div v-if="authStore.user" class="card user-brief-card">
        <div class="user-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="user-info">
          <div class="user-email">{{ authStore.user.email }}</div>
          <div v-if="authStore.user.display_name" class="user-name">
            {{ authStore.user.display_name }}
          </div>
        </div>
      </div>

      <!-- Physical parameters card -->
      <div class="card">
        <div class="section-title">Фізичні показники</div>

        <div class="form-group">
          <label class="form-label">Стать</label>
          <SegmentedControl v-model="sex" :options="sexOptions" />
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label" for="birthYear">Рік народження</label>
            <input
              id="birthYear"
              v-model.number="birthYear"
              type="number"
              class="form-input num-mono"
              min="1920"
              max="2026"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="heightCm">Зріст (см)</label>
            <input
              id="heightCm"
              v-model.number="heightCm"
              type="number"
              class="form-input num-mono"
              min="100"
              max="250"
              required
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label" for="weightKg">Поточна вага (кг)</label>
            <input
              id="weightKg"
              v-model.number="weightKg"
              type="number"
              step="0.1"
              class="form-input num-mono"
              min="30"
              max="300"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="targetWeightKg">Цільова вага (кг)</label>
            <input
              id="targetWeightKg"
              v-model.number="targetWeightKg"
              type="number"
              step="0.1"
              class="form-input num-mono"
              min="30"
              max="300"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="paceKgPerWeek">Бажаний темп (кг/тиждень)</label>
          <input
            id="paceKgPerWeek"
            v-model.number="paceKgPerWeek"
            type="number"
            step="0.05"
            class="form-input num-mono"
            min="0.1"
            max="2.0"
            required
          />
        </div>
      </div>

      <!-- Health Restrictions & Dislikes -->
      <div class="card">
        <div class="section-title">Обмеження та вподобання</div>

        <div class="form-group">
          <label class="form-label" for="restrictions">Особливості здоров'я / обмеження</label>
          <textarea
            id="restrictions"
            v-model="restrictions"
            class="form-textarea"
            rows="3"
            placeholder="Наприклад: видалений жовчний міхур, помірна кількість жирів за прийом"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="dislikes">Небажані / неприйнятні продукти</label>
          <textarea
            id="dislikes"
            v-model="dislikes"
            class="form-textarea"
            rows="3"
            placeholder="Наприклад: селера, кінза, надлишок молочних продуктів"
          ></textarea>
        </div>
      </div>

      <!-- Generation Weights (Three sliders 0..1) -->
      <div class="card">
        <div class="section-title">Ваги генерації меню</div>
        <p class="section-hint">Пріоритети моделі при підборі страв та продуктів (0..1)</p>

        <!-- Slider 1: weight_variety -->
        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-name">Різноманітність</span>
            <span class="slider-val num-mono">{{ weightVariety.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="weightVariety"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="weight-slider"
          />
          <div class="slider-scale">
            <span>Звичне</span>
            <span>Різноманітне</span>
          </div>
        </div>

        <!-- Slider 2: weight_balance -->
        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-name">Збалансованість</span>
            <span class="slider-val num-mono">{{ weightBalance.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="weightBalance"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="weight-slider"
          />
          <div class="slider-scale">
            <span>Вільний склад</span>
            <span>Ідеальний КБЖВ</span>
          </div>
        </div>

        <!-- Slider 3: weight_goal -->
        <div class="slider-group">
          <div class="slider-header">
            <span class="slider-name">Відповідність меті</span>
            <span class="slider-val num-mono">{{ weightGoal.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="weightGoal"
            type="range"
            min="0"
            max="1"
            step="0.05"
            class="weight-slider"
          />
          <div class="slider-scale">
            <span>М'яко</span>
            <span>Строго до цілі</span>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <button
        type="submit"
        class="btn-save-profile"
        :disabled="saving"
      >
        <span v-if="!saving">Зберегти профіль</span>
        <LoadingSpinner v-else :size="18" />
      </button>

      <!-- Logout Button -->
      <div class="logout-area">
        <button
          type="button"
          class="btn-logout"
          @click="handleLogout"
        >
          Вийти з акаунту
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--screen-max-width);
  margin: var(--space-0) auto;
  box-sizing: border-box;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background-color: var(--color-bg);
  padding: calc(var(--space-14) + var(--safe-area-top)) var(--space-16) calc(var(--space-24) + var(--safe-area-bottom));
  min-height: var(--screen-min-height);
}

/* Header */
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-4) var(--space-16);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  cursor: pointer;
  user-select: none;
}

.back-arrow {
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.header-left:hover .back-arrow {
  color: var(--color-text-primary);
}

.header-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

/* Cards */
.card {
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-16);
  display: flex;
  flex-direction: column;
  gap: var(--space-14);
}

.user-brief-card {
  flex-direction: row;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
}

.user-avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 50%;
  background-color: var(--color-primary-chip);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  overflow: hidden;
}

.user-email {
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-name {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.section-title {
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.section-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: calc(-1 * var(--space-8));
  margin-bottom: var(--space-4);
  line-height: var(--leading-normal);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.form-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.form-input {
  width: 100%;
  height: var(--btn-height-secondary);
  background-color: var(--color-surface-elevated);
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
  background-color: var(--color-surface-elevated);
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

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

/* Sliders */
.slider-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4) var(--space-0);
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sub);
}

.slider-name {
  color: var(--color-text-secondary);
}

.slider-val {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.weight-slider {
  width: 100%;
  height: var(--slider-track-height);
  border-radius: var(--radius-xs);
  background: var(--color-progress-track);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  margin: var(--space-4) var(--space-0);
}

.weight-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--slider-thumb-size);
  height: var(--slider-thumb-size);
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: var(--slider-thumb-shadow);
}

.weight-slider::-moz-range-thumb {
  width: var(--slider-thumb-size);
  height: var(--slider-thumb-size);
  border-radius: 50%;
  background: var(--color-primary);
  border: none;
  cursor: pointer;
  box-shadow: var(--slider-thumb-shadow);
}

.slider-scale {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Save & Logout */
.btn-save-profile {
  width: 100%;
  height: var(--btn-height-primary);
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
  margin-top: var(--space-8);
  transition: background-color var(--transition-fast);
}

.btn-save-profile:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-save-profile:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-area {
  display: flex;
  justify-content: center;
  margin-top: var(--space-8);
}

.btn-logout {
  background: transparent;
  border: none;
  color: var(--danger);
  font-size: var(--font-size-sub);
  cursor: pointer;
  padding: var(--space-8);
  transition: opacity var(--transition-fast);
}

.btn-logout:hover {
  text-decoration: underline;
  opacity: 0.9;
}

.loading-wrap {
  padding: var(--space-48) 0;
  display: flex;
  justify-content: center;
}
</style>
