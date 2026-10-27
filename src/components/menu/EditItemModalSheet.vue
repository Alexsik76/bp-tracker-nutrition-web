<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import type { MenuItemRead } from '../../types/nutrition';

const props = withDefaults(
  defineProps<{
    show: boolean;
    item: MenuItemRead | null;
    saving: boolean;
    canReplace?: boolean;
  }>(),
  {
    canReplace: true,
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: {
    title?: string;
    portionG?: number | null;
    portionText?: string | null;
    kcal?: number | null;
  }): void;
  (e: 'replace', item: MenuItemRead): void;
  (e: 'delete', item: MenuItemRead): void;
}>();

const title = ref('');
const portionG = ref<number | null>(null);
const portionText = ref('');
const kcal = ref<number | null>(null);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen && props.item) {
      title.value = props.item.title;
      portionG.value = props.item.portion_g;
      portionText.value = props.item.portion_text || '';
      const isUser = props.item.nutrition_source === 'user';
      kcal.value = isUser ? (props.item.kcal ?? null) : null;
    }
  }
);

function handleSubmit() {
  if (!props.item) return;

  const isUser = props.item.nutrition_source === 'user';
  let kcalPayload: number | null | undefined = undefined;
  if (kcal.value !== null && kcal.value !== undefined && kcal.value !== ('' as unknown as number)) {
    kcalPayload = Number(kcal.value);
  } else if (isUser) {
    kcalPayload = null;
  } else {
    kcalPayload = undefined;
  }

  emit('save', {
    title: title.value.trim() || undefined,
    portionG: portionG.value ? Number(portionG.value) : null,
    portionText: portionText.value.trim() || null,
    kcal: kcalPayload,
  });
}
</script>

<template>
  <ModalSheet
    :show="show"
    :title="item?.title ? `Позиція: ${item.title}` : 'Позиція меню'"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="edit-item-form">
      <div class="form-group">
        <label class="form-label" for="editTitle">Назва страви</label>
        <input
          id="editTitle"
          v-model="title"
          type="text"
          class="form-input"
          placeholder="Назва"
          required
        />
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="editPortionG">Порція (г)</label>
          <input
            id="editPortionG"
            v-model.number="portionG"
            type="number"
            class="form-input num-mono"
            placeholder="г"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="editPortionText">Опис</label>
          <input
            id="editPortionText"
            v-model="portionText"
            type="text"
            class="form-input"
            placeholder="1 шт..."
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="editKcal">
          Калорійність (ккал)
          <span v-if="item?.nutrition_source === 'model'" class="model-hint">
            (оцінка моделі: ≈{{ item?.kcal }})
          </span>
        </label>
        <input
          id="editKcal"
          v-model.number="kcal"
          type="number"
          class="form-input num-mono"
          :placeholder="item?.nutrition_source === 'model' ? 'Залиште порожнім для переоцінки' : 'ккал'"
        />
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving"
        >
          {{ saving ? 'Збереження...' : 'Зберегти зміни' }}
        </button>
        <button
          v-if="item && canReplace"
          type="button"
          class="btn btn-secondary btn-full"
          @click="emit('replace', item)"
        >
          Замінити позицію...
        </button>
        <button
          v-if="item"
          type="button"
          class="btn btn-danger btn-full"
          @click="emit('delete', item)"
        >
          Видалити позицію
        </button>
      </div>
    </form>
  </ModalSheet>
</template>

<style scoped>
.model-hint {
  font-weight: 400;
  color: var(--info);
  text-transform: none;
  letter-spacing: normal;
  margin-left: 4px;
}
</style>
