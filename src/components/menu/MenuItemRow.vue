<script setup lang="ts">
import { computed } from 'vue';
import type { MenuItemRead } from '../../types/nutrition';

const props = withDefaults(
  defineProps<{
    item: MenuItemRead;
    canEdit?: boolean;
  }>(),
  {
    canEdit: true,
  }
);

const emit = defineEmits<{
  (e: 'edit', item: MenuItemRead): void;
}>();

const itemTooltip = computed(() => {
  if (props.canEdit) {
    return 'Натисніть для редагування або заміни';
  }
  return undefined;
});
</script>

<template>
  <div
    class="item-row"
    :class="{
      'item-row-incomplete': item.incomplete,
    }"
  >
    <div
      class="item-info"
      :class="{ 'item-info-readonly': !canEdit }"
      :title="itemTooltip"
      @click="canEdit && emit('edit', item)"
    >
      <div class="item-title-row">
        <span class="item-title">{{ item.title }}</span>
        <span v-if="item.incomplete" class="badge badge-warning item-badge">
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
        <span
          v-if="item.kcal !== null && item.kcal !== undefined"
          class="num-mono kcal-pill"
          :title="item.nutrition_source === 'model' ? 'Орієнтовна оцінка моделі, яку можна уточнити' : undefined"
        >
          {{ item.nutrition_source === 'model' ? '≈ ' : '' }}{{ Math.round(item.kcal) }} ккал
        </span>
        <span
          v-if="item.protein_g !== null || item.fat_g !== null || item.carbs_g !== null"
          class="num-mono macros-pill"
        >
          Б: {{ item.protein_g ?? 0 }} · Ж: {{ item.fat_g ?? 0 }} · В: {{ item.carbs_g ?? 0 }}
        </span>
        <span v-if="item.origin === 'manual'" class="badge badge-neutral manual-badge">
          вручну
        </span>
      </div>
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

.macros-pill {
  color: var(--text-muted);
  font-size: 11.5px;
}

.manual-badge {
  font-size: 10px;
}
</style>
