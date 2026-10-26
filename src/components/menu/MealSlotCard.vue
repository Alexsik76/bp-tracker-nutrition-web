<script setup lang="ts">
import MenuItemRow from './MenuItemRow.vue';
import type { MenuRead, MenuItemRead, MenuStatus } from '../../types/nutrition';

const props = defineProps<{
  menu: MenuRead;
  generating?: boolean;
  updatingItemId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'prompt-cancel', menu: MenuRead): void;
  (e: 'update-status', payload: { menu: MenuRead; status: MenuStatus }): void;
  (e: 'add-item', slot: string): void;
  (e: 'generate-slot', slot: string): void;
  (e: 'edit-item', item: MenuItemRead): void;
  (e: 'mark-item-eaten', item: MenuItemRead): void;
  (e: 'mark-item-skipped', item: MenuItemRead): void;
  (e: 'unmark-item', item: MenuItemRead): void;
}>();

function getSlotKcal(menu: MenuRead): number {
  return menu.items.reduce((sum, item) => sum + (item.kcal_est || 0), 0);
}
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
        <span class="slot-kcal num-mono">{{ getSlotKcal(menu) }} ккал</span>
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
      </div>
    </div>

    <!-- Items in Slot -->
    <div class="slot-items">
      <MenuItemRow
        v-for="item in menu.items"
        :key="item.id"
        :item="item"
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
        <!-- Regenerate slot button -->
        <button
          v-if="menu.status !== 'eaten'"
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

        <!-- Cancel whole meal button (when partial, eaten, or skipped) -->
        <button
          v-if="menu.status === 'eaten' || menu.status === 'partial' || menu.status === 'skipped'"
          type="button"
          class="btn-icon slot-ctrl-btn"
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
          v-if="menu.status !== 'eaten'"
          type="button"
          class="btn btn-primary btn-sm-action"
          @click="emit('update-status', { menu, status: 'eaten' })"
        >
          ✓ З'їдено
        </button>

        <!-- Whole meal skipped button -->
        <button
          v-if="menu.status !== 'skipped' && menu.status !== 'eaten'"
          type="button"
          class="btn-icon slot-ctrl-btn"
          @click="emit('update-status', { menu, status: 'skipped' })"
          title="Пропустити прийом"
          aria-label="Пропустити прийом"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 4 15 12 5 20 5 4"></polygon>
            <line x1="19" y1="5" x2="19" y2="19"></line>
          </svg>
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
  align-items: baseline;
  gap: var(--space-8);
}

.slot-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
}

.slot-kcal {
  font-size: 13px;
  color: var(--info);
  font-weight: 500;
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
</style>
