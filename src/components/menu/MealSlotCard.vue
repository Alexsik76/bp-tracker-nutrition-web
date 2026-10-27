<script setup lang="ts">
import { computed } from 'vue';
import MenuItemRow from './MenuItemRow.vue';
import { formatTime24 } from '../../utils/date';
import type { MenuRead, MenuItemRead, MenuStatus } from '../../types/nutrition';

const props = defineProps<{
  menu: MenuRead;
  generating?: boolean;
  generatingSlot?: string | null;
  generationStageText?: string;
  updatingItemId?: string | null;
  estimatingSlot?: string | null;
  hasAvailablePin?: boolean;
}>();

const emit = defineEmits<{
  (e: 'prompt-cancel', menu: MenuRead): void;
  (e: 'update-status', payload: { menu: MenuRead; status: MenuStatus }): void;
  (e: 'add-item', slot: string): void;
  (e: 'generate-slot', slot: string): void;
  (e: 'estimate-slot', slot: string): void;
  (e: 'edit-item', item: MenuItemRead): void;
  (e: 'mark-item-eaten', item: MenuItemRead): void;
  (e: 'mark-item-skipped', item: MenuItemRead): void;
  (e: 'unmark-item', item: MenuItemRead): void;
  (e: 'delete-meal', menu: MenuRead): void;
  (e: 'restore-pin', slot: string): void;
}>();

function getSlotKcal(menu: MenuRead): number {
  return menu.items.reduce((sum, item) => sum + (item.kcal_est || 0), 0);
}

const hasEatenItems = computed(() =>
  props.menu.status === 'eaten' || props.menu.items.some((item) => item.status === 'eaten')
);

const deleteMealTooltip = computed(() => {
  if (hasEatenItems.value) {
    return props.menu.pinned
      ? 'Не можна зняти закріплення: у прийомі є зʼїдені позиції (спочатку зніміть позначку «з\'їдено»)'
      : 'Не можна видалити прийом: у ньому є зʼїдені позиції (спочатку зніміть позначку «з\'їдено»)';
  }
  return props.menu.pinned
    ? `Зняти закріплення з «${props.menu.slot}» на цей день`
    : `Видалити «${props.menu.slot}»`;
});
</script>

<template>
  <div
    class="card slot-card"
    :class="{
      'slot-incomplete': menu.status === 'incomplete',
      'slot-eaten': menu.status === 'eaten',
      'slot-skipped': menu.status === 'skipped',
      'slot-partial': menu.status === 'partial',
    }"
  >
    <!-- Slot Header -->
    <div class="slot-header">
      <div class="slot-title-group">
        <h2 class="slot-title">{{ menu.slot }}</h2>
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
          title="Відновити закріплений прийом"
          @click="emit('restore-pin', menu.slot)"
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
          v-if="menu.kcal_incomplete"
          type="button"
          class="btn-estimate"
          :disabled="Boolean(estimatingSlot)"
          :title="`Оцінити калорійність для «${menu.slot}»`"
          @click="emit('estimate-slot', menu.slot)"
        >
          <span v-if="estimatingSlot === menu.slot" class="spinner-sm"></span>
          <span>{{ estimatingSlot === menu.slot ? 'Оцінюємо...' : 'Оцінити' }}</span>
        </button>
      </div>

      <div class="slot-status-group">
        <template v-if="menu.status === 'eaten' || menu.status === 'partial' || menu.status === 'skipped'">
          <span v-if="menu.status === 'eaten'" class="badge badge-success">
            ✓ З'їдено
          </span>
          <span v-else-if="menu.status === 'partial'" class="badge badge-primary">
            Частково
          </span>
          <span v-else class="badge badge-neutral">
            Пропущено
          </span>
          <button
            v-if="menu.id"
            type="button"
            class="btn-icon status-edit-btn"
            :title="menu.status === 'eaten' ? 'Скасувати статус «З\'їдено»' : (menu.status === 'partial' ? 'Скасувати позначки для всього прийому' : 'Скасувати статус «Пропущено»')"
            :aria-label="menu.status === 'eaten' ? 'Скасувати статус «З\'їдено»' : (menu.status === 'partial' ? 'Скасувати позначки для всього прийому' : 'Скасувати статус «Пропущено»')"
            @click="emit('prompt-cancel', menu)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </template>
        <span v-else-if="menu.status === 'incomplete'" class="badge badge-warning">
          Не вистачає продуктів
        </span>
        <span v-else class="badge badge-info">
          Заплановано
        </span>

        <button
          type="button"
          class="btn-icon delete-slot-btn"
          :disabled="hasEatenItems"
          :title="deleteMealTooltip"
          :aria-label="deleteMealTooltip"
          @click="!hasEatenItems && emit('delete-meal', menu)"
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
        :can-edit="menu.status !== 'eaten'"
        :updating="updatingItemId === item.id"
        @edit="emit('edit-item', item)"
        @mark-eaten="emit('mark-item-eaten', item)"
        @mark-skipped="emit('mark-item-skipped', item)"
        @unmark="emit('unmark-item', item)"
      />
    </div>

    <!-- Slot action bar -->
    <div class="slot-footer">
      <button
        v-if="menu.status !== 'eaten'"
        type="button"
        class="btn-action-text"
        @click="emit('add-item', menu.slot)"
      >
        + Додати позицію
      </button>
      <div v-else></div>

      <div class="slot-buttons">
        <!-- Regenerating slot indicator -->
        <div
          v-if="generatingSlot === menu.slot"
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
          :disabled="generating"
          @click="emit('generate-slot', menu.slot)"
          :title="`ШІ: перегенерувати прийом «${menu.slot}»`"
          :aria-label="`ШІ: перегенерувати прийом «${menu.slot}»`"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>

        <!-- Cancel whole meal button (when partial or eaten) -->
        <button
          v-if="menu.id && (menu.status === 'eaten' || menu.status === 'partial') && generatingSlot !== menu.slot"
          type="button"
          class="btn-icon slot-ctrl-btn"
          :disabled="generating"
          @click="emit('prompt-cancel', menu)"
          title="Скасувати позначки для всього прийому"
          aria-label="Скасувати позначки для всього прийому"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>

        <!-- Whole meal eaten button -->
        <button
          v-if="menu.id && menu.items.length > 0 && menu.status !== 'eaten' && generatingSlot !== menu.slot"
          type="button"
          class="btn btn-primary btn-sm-action"
          :disabled="generating"
          @click="emit('update-status', { menu, status: 'eaten' })"
        >
          ✓ З'їдено
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

.slot-skipped {
  opacity: 0.65;
}

.slot-partial {
  border-color: rgba(129, 140, 248, 0.35);
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

.status-edit-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  color: var(--text-muted);
  border-radius: var(--radius-pill);
}

.status-edit-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
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
