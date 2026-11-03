<script setup lang="ts">
export interface SegmentOption<T = string> {
  label: string;
  value: T;
  count?: number;
}

const props = defineProps<{
  options: SegmentOption<any>[];
  modelValue: any;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

function select(value: any) {
  emit('update:modelValue', value);
}
</script>

<template>
  <div class="segmented-control" role="tablist">
    <button
      v-for="option in props.options"
      :key="String(option.value)"
      type="button"
      role="tab"
      :aria-selected="props.modelValue === option.value"
      class="segment-btn"
      :class="{ active: props.modelValue === option.value }"
      @click="select(option.value)"
    >
      <span>{{ option.label }}</span>
      <span v-if="option.count !== undefined" class="segment-count num-mono">
        {{ option.count }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.segmented-control {
  display: flex;
  background-color: var(--color-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: var(--space-3);
  gap: var(--space-3);
  width: 100%;
}

.segment-btn {
  flex: 1;
  min-height: var(--btn-height-sm);
  border-radius: var(--radius-pill);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  transition: all var(--transition-fast);
  user-select: none;
  padding: var(--space-0) var(--space-12);
}

.segment-btn.active {
  background-color: var(--color-primary-chip);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.segment-btn:not(.active):hover {
  color: var(--color-text-primary);
  background-color: var(--color-segment-hover-bg);
}

.segment-count {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-7);
  border-radius: var(--radius-pill);
  background-color: var(--color-segment-count-bg);
  color: var(--color-text-primary);
}

.segment-btn.active .segment-count {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}
</style>
