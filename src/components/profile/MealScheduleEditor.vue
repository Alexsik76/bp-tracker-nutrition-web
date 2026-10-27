<script setup lang="ts">
import { computed } from 'vue';
import { useToastStore } from '../../stores/toast';
import { normalizeTime24 } from '../../utils/date';
import { MEAL_TYPES } from '../../utils/mealTypes';
import type { MealSchedule, MealType } from '../../types/nutrition';

const meals = defineModel<MealSchedule[]>({ required: true });

const toastStore = useToastStore();

const usedTypes = computed(() => new Set(meals.value.map((m) => m.type)));
const canAdd = computed(() => usedTypes.value.size < MEAL_TYPES.length);

function isTypeTaken(type: MealType, own: MealType): boolean {
  return type !== own && usedTypes.value.has(type);
}

function addMeal() {
  const free = MEAL_TYPES.find((m) => !usedTypes.value.has(m.value));
  if (!free) {
    toastStore.show('Усі типи прийомів уже є в розкладі', 'warning');
    return;
  }
  meals.value.push({
    type: free.value,
    time: '16:00',
  });
}

function removeMeal(index: number) {
  if (meals.value.length <= 1) {
    toastStore.show('Повинен бути щонайменше один прийом їжі', 'warning');
    return;
  }
  meals.value.splice(index, 1);
}
</script>

<template>
  <div class="card">
    <div class="section-header">
      <span>Розклад прийомів їжі</span>
      <button
        type="button"
        class="btn-text-action"
        :disabled="!canAdd"
        @click="addMeal"
      >
        + Додати прийом
      </button>
    </div>

    <div class="meals-list">
      <div
        v-for="(meal, idx) in meals"
        :key="idx"
        class="meal-row"
      >
        <select
          v-model="meal.type"
          class="form-select meal-name-input"
          aria-label="Тип прийому"
          required
        >
          <option
            v-for="mt in MEAL_TYPES"
            :key="mt.value"
            :value="mt.value"
            :disabled="isTypeTaken(mt.value, meal.type)"
          >
            {{ mt.label }}
          </option>
        </select>
        <input
          v-model="meal.time"
          type="text"
          class="form-input meal-time-input num-mono"
          placeholder="08:30"
          pattern="^([01]\d|2[0-3]):[0-5]\d$"
          maxlength="5"
          title="Час у форматі 24г: ГГ:ХХ (наприклад, 08:30)"
          required
          @blur="meal.time = normalizeTime24(meal.time)"
        />
        <button
          type="button"
          class="btn-icon delete-meal-btn"
          @click="removeMeal(idx)"
          aria-label="Видалити прийом"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-text-action {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
}

.meals-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.meal-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.meal-name-input {
  flex: 1;
}

.meal-time-input {
  width: 105px;
  text-align: center;
}

.delete-meal-btn {
  color: var(--text-dim);
}

.delete-meal-btn:hover {
  color: var(--danger);
}
</style>
