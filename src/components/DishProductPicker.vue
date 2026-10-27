<script setup lang="ts">
import { computed } from 'vue';
import SegmentedControl, { type SegmentOption } from './SegmentedControl.vue';
import type { DishRead } from '../types/nutrition';

export type PickerSourceType = 'dish' | 'custom';

const props = withDefaults(
  defineProps<{
    sourceType: PickerSourceType;
    availableDishes: DishRead[];
    selectedDishId: string | null;
    allowCustom?: boolean;
  }>(),
  {
    allowCustom: false,
  }
);

const emit = defineEmits<{
  (e: 'update:sourceType', val: PickerSourceType): void;
  (e: 'select-dish', dish: DishRead): void;
}>();

const options = computed<SegmentOption<PickerSourceType>[]>(() => {
  const list: SegmentOption<PickerSourceType>[] = [
    { label: 'Готова страва', value: 'dish' },
  ];
  if (props.allowCustom) {
    list.push({ label: 'Вільний запис', value: 'custom' });
  }
  return list;
});
</script>

<template>
  <div class="dish-product-picker">
    <div v-if="props.allowCustom" class="form-group">
      <label class="form-label">Джерело</label>
      <SegmentedControl
        :model-value="props.sourceType"
        :options="options"
        @update:model-value="emit('update:sourceType', $event)"
      />
    </div>

    <!-- Dishes picker -->
    <div v-if="props.sourceType === 'dish'" class="picker-section">
      <label class="form-label">Оберіть страву з холодильника</label>
      <div v-if="props.availableDishes.length === 0" class="picker-empty">
        Немає готових страв у наявності
      </div>
      <div v-else class="picker-list">
        <button
          v-for="dish in props.availableDishes"
          :key="dish.id"
          type="button"
          class="picker-item"
          :class="{ selected: props.selectedDishId === dish.id }"
          @click="emit('select-dish', dish)"
        >
          <span class="picker-item-name">{{ dish.name }}</span>
          <span class="picker-item-sub num-mono">
            залишок: {{ dish.remaining_g ?? dish.cooked_weight_g }} г
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dish-product-picker {
  margin-bottom: var(--space-12);
}

.picker-section {
  margin-bottom: var(--space-16);
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  padding: 4px;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-12);
  min-height: 44px;
  border-radius: var(--radius-control);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.picker-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.picker-item.selected {
  background: var(--primary-bg-chip);
  border-color: var(--primary);
}

.picker-item-name {
  font-size: 13.5px;
  color: var(--text-primary);
  font-weight: 600;
}

.picker-item-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.picker-empty {
  font-size: 13px;
  color: var(--text-muted);
  padding: var(--space-12) 0;
}
</style>