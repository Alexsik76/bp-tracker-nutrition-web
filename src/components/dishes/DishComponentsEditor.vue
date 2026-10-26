<script setup lang="ts">
import type { DishComponentCreate } from '../../types/nutrition';

const components = defineModel<DishComponentCreate[]>({ required: true });

function addComponentRow() {
  components.value.push({
    name: '',
    raw_weight_g: null,
    cooked_weight_g: null,
  });
}

function removeComponentRow(index: number) {
  components.value.splice(index, 1);
}
</script>

<template>
  <div class="components-editor">
    <div class="section-header">
      <span>Складники (для точного розрахунку ШІ)</span>
      <button type="button" class="btn-text-action" @click="addComponentRow">
        + Додати
      </button>
    </div>

    <div v-if="components.length === 0" class="no-comps-hint">
      Складників немає (ШІ оцінюватиме калорійність за назвою)
    </div>

    <div
      v-for="(comp, idx) in components"
      :key="idx"
      class="comp-edit-row"
    >
      <input
        v-model="comp.name"
        type="text"
        class="form-input comp-name-input"
        placeholder="Складник (вівсянка, сир...)"
        required
      />
      <input
        v-model.number="comp.raw_weight_g"
        type="number"
        class="form-input comp-w-input num-mono"
        placeholder="Сира г"
        min="0"
      />
      <input
        v-model.number="comp.cooked_weight_g"
        type="number"
        class="form-input comp-w-input num-mono"
        placeholder="Готова г"
        min="0"
      />
      <button
        type="button"
        class="btn-icon del-comp-btn"
        @click="removeComponentRow(idx)"
        aria-label="Видалити складник"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.components-editor {
  margin-bottom: var(--space-16);
}

.btn-text-action {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.no-comps-hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: var(--space-8) 0;
}

.comp-edit-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.comp-name-input {
  flex: 2;
  min-height: 38px;
}

.comp-w-input {
  flex: 1;
  min-height: 38px;
  padding: 4px 6px;
  font-size: 12px;
}

.del-comp-btn {
  min-width: 38px;
  min-height: 38px;
  color: var(--text-dim);
}

.del-comp-btn:hover {
  color: var(--danger);
}
</style>
