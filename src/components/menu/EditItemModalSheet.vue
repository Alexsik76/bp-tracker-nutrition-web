<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import type { MenuItemRead } from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  item: MenuItemRead | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: {
    portionG?: number | null;
    portionText?: string | null;
    kcalEst?: number | null;
  }): void;
  (e: 'replace', item: MenuItemRead): void;
  (e: 'delete', item: MenuItemRead): void;
}>();

const portionG = ref<number | null>(null);
const portionText = ref('');
const kcalEst = ref<number | null>(null);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen && props.item) {
      portionG.value = props.item.portion_g;
      portionText.value = props.item.portion_text || '';
      kcalEst.value = props.item.kcal_est;
    }
  }
);

function handleSubmit() {
  if (!props.item || props.item.status !== null) return;
  emit('save', {
    portionG: portionG.value ? Number(portionG.value) : null,
    portionText: portionText.value.trim() || null,
    kcalEst: kcalEst.value !== null && kcalEst.value !== undefined ? Number(kcalEst.value) : null,
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
        <label class="form-label" for="editKcalEst">Калорійність (ккал)</label>
        <input
          id="editKcalEst"
          v-model.number="kcalEst"
          type="number"
          class="form-input num-mono"
          placeholder="ккал"
        />
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving"
        >
          {{ saving ? 'Збереження...' : 'Зберегти порцію' }}
        </button>
        <button
          v-if="item"
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
