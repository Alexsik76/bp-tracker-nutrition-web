<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import { useToastStore } from '../../stores/toast';
import { normalizeTime24, isValidTime24 } from '../../utils/date';
import { MEAL_TYPES, mealTypeLabel } from '../../utils/mealTypes';
import type { MealSchedule, MealType } from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  saving: boolean;
  scheduleMeals: MealSchedule[];
  existingSlots: MealType[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: { meal_type: MealType; time: string }): void;
}>();

const toastStore = useToastStore();

const slotType = ref<MealType | ''>('');
const slotTime = ref('');

const existingSet = computed(() => new Set(props.existingSlots));

// Profile schedule meals that are not currently on the canvas
const missingScheduleMeals = computed(() =>
  props.scheduleMeals.filter((sm) => !existingSet.value.has(sm.type))
);

function selectScheduleMeal(sm: MealSchedule) {
  slotType.value = sm.type;
  slotTime.value = sm.time;
}

function handleTypeChange() {
  const sm = props.scheduleMeals.find((m) => m.type === slotType.value);
  if (sm) slotTime.value = sm.time;
}

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      if (missingScheduleMeals.value.length > 0) {
        const first = missingScheduleMeals.value[0];
        slotType.value = first.type;
        slotTime.value = first.time;
      } else {
        const free = MEAL_TYPES.find((m) => !existingSet.value.has(m.value));
        slotType.value = free?.value ?? '';
        slotTime.value = '';
      }
    }
  }
);

function handleTimeBlur() {
  if (slotTime.value) {
    slotTime.value = normalizeTime24(slotTime.value);
  }
}

function handleSubmit() {
  const type = slotType.value;
  if (!type) {
    toastStore.show('Оберіть тип прийому їжі', 'warning');
    return;
  }

  const normalizedTime = normalizeTime24(slotTime.value);
  if (!isValidTime24(normalizedTime)) {
    toastStore.show('Вкажіть час у форматі 24г: ГГ:ХХ (наприклад, 13:30)', 'warning');
    return;
  }

  emit('save', {
    meal_type: type,
    time: normalizedTime,
  });
}
</script>

<template>
  <ModalSheet
    :show="show"
    title="Додати прийом їжі"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="add-meal-form">
      <div v-if="missingScheduleMeals.length > 0" class="schedule-quick-section">
        <label class="form-label">Обрати з розкладу</label>
        <div class="schedule-chips-list">
          <button
            v-for="sm in missingScheduleMeals"
            :key="sm.type"
            type="button"
            class="schedule-chip"
            :class="{ active: slotType === sm.type }"
            @click="selectScheduleMeal(sm)"
          >
            <span class="chip-name">{{ mealTypeLabel(sm.type) }}</span>
            <span class="chip-time num-mono">{{ sm.time }}</span>
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="addMealSlotType">Тип прийому</label>
        <select
          id="addMealSlotType"
          v-model="slotType"
          class="form-select"
          required
          @change="handleTypeChange"
        >
          <option value="" disabled>Оберіть тип</option>
          <option
            v-for="mt in MEAL_TYPES"
            :key="mt.value"
            :value="mt.value"
            :disabled="existingSet.has(mt.value)"
          >
            {{ mt.label }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="addMealSlotTime">Час (24г: ГГ:ХХ)</label>
        <input
          id="addMealSlotTime"
          v-model="slotTime"
          type="text"
          class="form-input num-mono"
          placeholder="13:30"
          pattern="^([01]\d|2[0-3]):[0-5]\d$"
          maxlength="5"
          required
          @blur="handleTimeBlur"
        />
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving || !slotType"
        >
          {{ saving ? 'Додавання...' : 'Додати прийом' }}
        </button>
      </div>
    </form>
  </ModalSheet>
</template>

<style scoped>
.add-meal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.schedule-quick-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.schedule-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
}

.schedule-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  padding: 6px 12px;
  min-height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-pill);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.schedule-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary);
}

.schedule-chip.active {
  background: var(--primary-bg-chip);
  border-color: var(--primary);
  color: var(--primary);
}

.chip-time {
  font-size: 11.5px;
  color: var(--text-muted);
}

.schedule-chip.active .chip-time {
  color: var(--primary);
}
</style>
