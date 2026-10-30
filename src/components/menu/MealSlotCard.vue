<script setup lang="ts">
import { computed } from 'vue';
import MenuItemRow from './MenuItemRow.vue';
import { formatTime24 } from '../../utils/date';
import type { MenuRead, MenuItemRead, MealType } from '../../types/nutrition';
import { mealTypeLabel } from '../../utils/mealTypes';

const props = defineProps<{
  menu: MenuRead;
  readOnly?: boolean;
  generating?: boolean;
  generatingSlot?: MealType | null;
  generationStageText?: string;
  estimatingSlot?: MealType | null;
  hasAvailablePin?: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle-eaten', menu: MenuRead): void;
  (e: 'add-item', slot: MealType): void;
  (e: 'generate-slot', slot: MealType): void;
  (e: 'estimate-slot', slot: MealType): void;
  (e: 'edit-item', item: MenuItemRead): void;
  (e: 'delete-meal', menu: MenuRead): void;
  (e: 'restore-pin', slot: MealType): void;
}>();

function getSlotKcal(menu: MenuRead): number {
  return menu.items.reduce((sum, item) => sum + (item.kcal || 0), 0);
}

const deleteMealTooltip = computed(() => {
  return props.menu.pinned
    ? `Зняти закріплення з «${mealTypeLabel(props.menu.meal_type)}» на цей день`
    : `Видалити «${mealTypeLabel(props.menu.meal_type)}»`;
});
</script>

<template>
  <div
    class="card slot-card"
    :class="{
      'slot-incomplete': menu.status === 'incomplete',
      'slot-eaten': menu.status === 'eaten',
      'slot-missed': menu.status === 'missed',
    }"
  >
    <!-- Slot Header -->
    <div class="slot-header">
      <div class="slot-title-group">
        <h2 class="slot-title">{{ mealTypeLabel(menu.meal_type) }}</h2>
        <span v-if="menu.pinned" class="badge badge-primary slot-pin-badge" title="Закріплений прийом їжі">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
          </svg>
          <span>Закріплено</span>
        </span>
        <button
          v-if="hasAvailablePin"
          type="button"
          class="btn-pin-chip"
          :disabled="readOnly"
          :title="readOnly ? 'День ще не створено' : 'Відновити закріплений прийом'"
          @click="emit('restore-pin', menu.meal_type)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
          </svg>
          <span>Відновити закріплений</span>
        </button>
        <span v-if="menu.time" class="slot-time num-mono">{{ formatTime24(menu.time) }}</span>
        <span v-if="menu.kcal_incomplete" class="slot-kcal slot-kcal-uncalc">не розраховано</span>
        <span v-else class="slot-kcal num-mono">{{ getSlotKcal(menu) }} ккал</span>
        <button
          v-if="menu.kcal_incomplete && menu.status !== 'eaten'"
          type="button"
          class="btn-estimate"
          :disabled="Boolean(estimatingSlot) || readOnly"
          :title="readOnly ? 'День ще не створено' : `Оцінити калорійність для «${mealTypeLabel(menu.meal_type)}»`"
          @click="emit('estimate-slot', menu.meal_type)"
        >
          <span v-if="estimatingSlot === menu.meal_type" class="spinner-sm"></span>
          <span>{{ estimatingSlot === menu.meal_type ? 'Оцінюємо...' : 'Оцінити' }}</span>
        </button>
      </div>

      <div class="slot-status-group">
        <span v-if="menu.status === 'eaten'" class="badge badge-success">
          ✓ З'їдено
        </span>
        <span v-else-if="menu.status === 'incomplete'" class="badge badge-warning">
          Не вистачає продуктів
        </span>
        <span v-else-if="menu.status === 'missed'" class="badge badge-neutral">
          пропущено
        </span>
        <span v-else class="badge badge-info">
          Заплановано
        </span>

        <button
          v-if="menu.status !== 'eaten'"
          type="button"
          class="btn-icon delete-slot-btn"
          :disabled="readOnly"
          :title="readOnly ? 'День ще не створено' : deleteMealTooltip"
          :aria-label="readOnly ? 'День ще не створено' : deleteMealTooltip"
          @click="emit('delete-meal', menu)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Items in Slot -->
    <div class="slot-items">
      <MenuItemRow
        v-for="item in menu.items"
        :key="item.id"
        :item="item"
        :can-edit="menu.status !== 'eaten' && !readOnly"
        @edit="emit('edit-item', item)"
      />
    </div>

    <!-- Slot action bar -->
    <div class="slot-footer">
      <button
        v-if="menu.status !== 'eaten'"
        type="button"
        class="btn-action-text"
        :disabled="readOnly"
        :title="readOnly ? 'День ще не створено' : undefined"
        @click="emit('add-item', menu.meal_type)"
      >
        + Додати позицію
      </button>
      <div v-else></div>

      <div class="slot-buttons">
        <!-- Regenerating slot indicator -->
        <div
          v-if="generatingSlot === menu.meal_type"
          class="slot-generating-pill"
        >
          <span class="spinner-sm"></span>
          <span>{{ generationStageText || 'Генеруємо меню…' }}</span>
        </div>

        <!-- Regenerate slot button -->
        <button
          v-else-if="menu.status !== 'eaten'"
          type="button"
          class="btn-icon slot-ctrl-btn"
          :disabled="generating || readOnly"
          @click="emit('generate-slot', menu.meal_type)"
          :title="readOnly ? 'День ще не створено' : `ШІ: перегенерувати прийом «${mealTypeLabel(menu.meal_type)}»`"
          :aria-label="readOnly ? 'День ще не створено' : `ШІ: перегенерувати прийом «${mealTypeLabel(menu.meal_type)}»`"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>

        <!-- Eaten / Cancel button -->
        <button
          v-if="menu.id && menu.status === 'eaten' && generatingSlot !== menu.meal_type"
          type="button"
          class="btn btn-secondary btn-sm-action"
          :disabled="generating || readOnly"
          @click="emit('toggle-eaten', menu)"
        >
          Скасувати
        </button>
        <button
          v-else-if="menu.id && menu.items.length > 0 && menu.status !== 'eaten' && generatingSlot !== menu.meal_type"
          type="button"
          class="btn btn-primary btn-sm-action"
          :disabled="generating || readOnly"
          @click="emit('toggle-eaten', menu)"
        >
          З'їдено
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slot-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-bottom: 0;
  transition: border-color 0.2s ease;
}

.slot-incomplete {
  border-color: rgba(251, 146, 60, 0.35);
  background: linear-gradient(180deg, rgba(249, 115, 22, 0.05) 0%, var(--surface) 100%);
}

.slot-eaten {
  border-color: rgba(34, 197, 94, 0.25);
}

.slot-missed {
  opacity: 0.85;
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slot-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.slot-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.slot-pin-badge {
  font-size: 11px;
  padding: 2px 8px;
  gap: 4px;
}

.btn-pin-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 28px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-bg-chip);
  border: 1px dashed rgba(129, 140, 248, 0.45);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn-pin-chip:hover {
  background: rgba(129, 140, 248, 0.25);
  border-color: var(--primary);
}

.slot-time {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.slot-kcal {
  font-size: 13px;
  color: var(--info);
  font-weight: 500;
}

.slot-kcal-uncalc {
  color: var(--text-muted);
  font-style: italic;
}

.btn-estimate {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-bg-chip);
  border: 1px solid rgba(129, 140, 248, 0.35);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn-estimate:hover:not(:disabled) {
  background: rgba(129, 140, 248, 0.25);
  border-color: var(--primary);
}

.btn-estimate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-sm {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.slot-status-group {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.delete-slot-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  color: var(--text-dim);
  border-radius: var(--radius-pill);
}

.delete-slot-btn:hover:not(:disabled) {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
}

.delete-slot-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.slot-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.slot-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
}

.btn-action-text {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.btn-action-text:disabled,
.btn-pin-chip:disabled,
.slot-ctrl-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.slot-buttons {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.slot-ctrl-btn {
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.05);
}

.slot-ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-sm-action {
  min-height: 44px;
  padding: 0 var(--space-12);
  font-size: 13px;
}

.slot-generating-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  background: var(--primary-bg-chip);
  border: 1px solid rgba(129, 140, 248, 0.25);
  padding: 0 var(--space-12);
  min-height: 44px;
  border-radius: var(--radius-control);
}
</style>
