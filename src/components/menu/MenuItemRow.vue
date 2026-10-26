<script setup lang="ts">
import type { MenuItemRead } from '../../types/nutrition';

defineProps<{
  item: MenuItemRead;
  updating?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', item: MenuItemRead): void;
  (e: 'mark-eaten', item: MenuItemRead): void;
  (e: 'mark-skipped', item: MenuItemRead): void;
  (e: 'unmark', item: MenuItemRead): void;
}>();
</script>

<template>
  <div
    class="item-row"
    :class="{
      'item-row-eaten': item.status === 'eaten',
      'item-row-skipped': item.status === 'skipped',
      'item-row-incomplete': item.incomplete && !item.status,
    }"
  >
    <div
      class="item-info"
      :class="{ 'item-info-readonly': item.status !== null }"
      :title="item.status === null ? 'Натисніть для редагування або заміни' : undefined"
      @click="item.status === null && emit('edit', item)"
    >
      <div class="item-title-row">
        <span class="item-title">{{ item.title }}</span>
        <span v-if="item.status === 'eaten'" class="badge badge-success item-badge">
          ✓ З'їдено
        </span>
        <span v-else-if="item.status === 'skipped'" class="badge badge-neutral item-badge">
          Пропущено
        </span>
        <span v-else-if="item.incomplete" class="badge badge-warning item-badge">
          Не вистачає
        </span>
      </div>
      <div class="item-meta">
        <span v-if="item.portion_g" class="num-mono portion-pill">
          {{ item.portion_g }} г
        </span>
        <span v-else-if="item.portion_text" class="portion-pill">
          {{ item.portion_text }}
        </span>
        <span v-if="item.kcal_est" class="num-mono kcal-pill">
          {{ item.kcal_est }} ккал
        </span>
        <span v-if="item.origin === 'manual'" class="badge badge-neutral manual-badge">
          вручну
        </span>
      </div>
    </div>

    <div class="item-actions">
      <!-- Marked item controls: unmark only (read-only until unmarked) -->
      <template v-if="item.status !== null">
        <button
          type="button"
          class="btn-icon item-btn item-unmark-btn"
          :disabled="updating"
          @click.stop="emit('unmark', item)"
          title="Зняти позначку"
          aria-label="Зняти позначку"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </template>

      <!-- Unmarked item controls: direct mark eaten / mark skipped buttons -->
      <template v-else>
        <button
          type="button"
          class="btn-icon item-btn item-mark-eaten-btn"
          :disabled="updating"
          @click.stop="emit('mark-eaten', item)"
          title="Позначити як з'їдено"
          aria-label="Позначити як з'їдено"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <button
          type="button"
          class="btn-icon item-btn item-mark-skip-btn"
          :disabled="updating"
          @click.stop="emit('mark-skipped', item)"
          title="Пропустити страву"
          aria-label="Пропустити страву"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 4 15 12 5 20 5 4"></polygon>
            <line x1="19" y1="5" x2="19" y2="19"></line>
          </svg>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.item-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  padding: var(--space-8) var(--space-12);
  border-radius: var(--radius-control);
  border: 1px solid rgba(255, 255, 255, 0.04);
  gap: var(--space-8);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.item-row-eaten {
  border-color: rgba(34, 197, 94, 0.25);
  background: rgba(34, 197, 94, 0.04);
}

.item-row-skipped {
  opacity: 0.65;
}

.item-row-incomplete {
  border-color: rgba(251, 146, 60, 0.35);
  background: rgba(249, 115, 22, 0.04);
}

.item-info {
  flex: 1 1 180px;
  min-width: 0;
  cursor: pointer;
}

.item-info-readonly {
  cursor: default;
}

.item-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 3px;
}

.item-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
}

.item-row-skipped .item-title {
  text-decoration: line-through;
}

.item-badge {
  font-size: 11px;
  padding: 2px 7px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.portion-pill {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 7px;
  border-radius: var(--radius-pill);
}

.kcal-pill {
  color: var(--info);
}

.manual-badge {
  font-size: 10px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.item-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border-radius: var(--radius-control);
}

.item-mark-eaten-btn {
  color: var(--text-muted);
}

.item-mark-eaten-btn:hover {
  color: var(--success);
  background: var(--success-bg-chip);
}

.item-mark-skip-btn {
  color: var(--text-muted);
}

.item-mark-skip-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.item-unmark-btn {
  color: var(--text-muted);
}

.item-unmark-btn:hover {
  color: var(--warning);
  background: var(--warning-bg-chip);
}
</style>
