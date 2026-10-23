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
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-pill);
  padding: 3px;
  gap: 3px;
  width: 100%;
}

.segment-btn {
  flex: 1;
  min-height: 42px;
  border-radius: var(--radius-pill);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  transition: all 0.15s ease;
  user-select: none;
  padding: 0 var(--space-12);
}

.segment-btn.active {
  background-color: rgba(129, 140, 248, 0.22);
  color: #FFFFFF;
}

.segment-btn:not(.active):hover {
  color: var(--text-primary);
  background-color: rgba(255, 255, 255, 0.04);
}

.segment-count {
  font-size: 11.5px;
  padding: 1px 7px;
  border-radius: var(--radius-pill);
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.segment-btn.active .segment-count {
  background-color: var(--primary);
  color: var(--on-primary);
}
</style>
