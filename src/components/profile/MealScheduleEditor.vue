<script setup lang="ts">
import { useToastStore } from '../../stores/toast';
import type { MealSchedule } from '../../types/nutrition';

const meals = defineModel<MealSchedule[]>({ required: true });

const toastStore = useToastStore();

function addMeal() {
  meals.value.push({
    name: 'Перекус',
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
      <button type="button" class="btn-text-action" @click="addMeal">
        + Додати прийом
      </button>
    </div>

    <div class="meals-list">
      <div
        v-for="(meal, idx) in meals"
        :key="idx"
        class="meal-row"
      >
        <input
          v-model="meal.name"
          type="text"
          class="form-input meal-name-input"
          placeholder="Назва прийому"
          required
        />
        <input
          v-model="meal.time"
          type="time"
          class="form-input meal-time-input num-mono"
          required
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
