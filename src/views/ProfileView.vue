<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { nutritionApi } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import SegmentedControl from '../components/SegmentedControl.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import MealScheduleEditor from '../components/profile/MealScheduleEditor.vue';
import PinnedMealsSection from '../components/profile/PinnedMealsSection.vue';
import { normalizeTime24, isValidTime24 } from '../utils/date';
import type { NutritionProfileUpsert, MealSchedule } from '../types/nutrition';
import { mealTypeLabel } from '../utils/mealTypes';

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
const meals = ref<MealSchedule[]>([
  { type: 'breakfast', time: '08:30' },
  { type: 'lunch', time: '13:30' },
  { type: 'dinner', time: '19:00' },
]);

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
      if (profile.meals && profile.meals.length > 0) {
        meals.value = JSON.parse(JSON.stringify(profile.meals));
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err);
    toastStore.show('Помилка завантаження профілю', 'error');
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  const normalizedMeals = meals.value.map((m) => ({
    type: m.type,
    time: normalizeTime24(m.time),
  }));

  if (new Set(normalizedMeals.map((m) => m.type)).size !== normalizedMeals.length) {
    toastStore.show('Кожен тип прийому може бути в розкладі лише один раз', 'warning');
    return;
  }

  for (const m of normalizedMeals) {
    if (!m.type) {
      toastStore.show('Оберіть тип для всіх прийомів їжі', 'warning');
      return;
    }
    if (!isValidTime24(m.time)) {
      toastStore.show(`Вкажіть коректний час у форматі 24г (ГГ:ХХ) для «${mealTypeLabel(m.type)}»`, 'warning');
      return;
    }
  }

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
      meals: normalizedMeals,
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
    <div class="view-header">
      <h1 class="view-title">Профіль харчування</h1>
    </div>

    <LoadingSpinner v-if="loading" text="Завантаження налаштувань..." />

    <form v-else @submit.prevent="saveProfile" class="profile-form">
      <!-- User info card -->
      <div v-if="authStore.user" class="card user-brief-card">
        <div class="user-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        <div class="section-header">Фізичні показники</div>

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
              max="2020"
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
          <span class="field-hint">Рекомендовано: 0.5 – 1.0 кг/тиждень</span>
        </div>
      </div>

      <!-- Health Restrictions & Dislikes -->
      <div class="card">
        <div class="section-header">Обмеження та вподобання</div>

        <div class="form-group">
          <label class="form-label" for="restrictions">Особливості здоров'я / обмеження</label>
          <textarea
            id="restrictions"
            v-model="restrictions"
            class="form-textarea"
            placeholder="Наприклад: видалений жовчний міхур, помірно жирів за прийом"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="dislikes">Небажані / неприйнятні продукти</label>
          <textarea
            id="dislikes"
            v-model="dislikes"
            class="form-textarea"
            placeholder="Наприклад: селера, кінза, надлишок молочних продуктів"
          ></textarea>
        </div>
      </div>

      <!-- Meal Schedule -->
      <MealScheduleEditor v-model="meals" />

      <!-- Pinned Meals -->
      <PinnedMealsSection :schedule-meals="meals" />

      <!-- Save Button -->
      <button
        type="submit"
        class="btn btn-primary btn-save"
        :disabled="saving"
      >
        <span v-if="saving">Збереження...</span>
        <span v-else>Зберегти профіль</span>
      </button>

      <!-- Logout Button -->
      <div class="logout-area">
        <button
          type="button"
          class="btn btn-danger btn-logout"
          @click="handleLogout"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Вийти з акаунту</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-view {
  padding-bottom: var(--space-20);
}

.view-header {
  margin-bottom: var(--space-16);
}

.view-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.user-brief-card {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-control);
  background: var(--primary-bg-chip);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-email {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-name {
  font-size: 12px;
  color: var(--text-muted);
}

.field-hint {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 2px;
}

.btn-save {
  width: 100%;
  font-size: 16px;
  margin-top: var(--space-8);
}

.logout-area {
  margin-top: var(--space-28);
  display: flex;
  justify-content: center;
}

.btn-logout {
  width: 100%;
}
</style>
