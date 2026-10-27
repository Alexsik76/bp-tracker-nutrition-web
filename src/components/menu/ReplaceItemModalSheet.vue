<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import DishProductPicker from '../DishProductPicker.vue';
import { useToastStore } from '../../stores/toast';
import type { DishRead, ProductRead, MenuItemRead } from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  item: MenuItemRead | null;
  availableDishes: DishRead[];
  availableProducts?: ProductRead[];
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: {
    dishId?: string;
    portionG?: number | null;
    portionText?: string | null;
    kcal?: number | null;
  }): void;
}>();

const toastStore = useToastStore();

const replaceSourceType = ref<'dish' | 'custom'>('dish');
const selectedReplaceDishId = ref<string | null>(null);
const replacePortionG = ref<number | null>(null);
const replacePortionText = ref('');
const replaceKcal = ref<number | null>(null);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen && props.item) {
      replaceSourceType.value = 'dish';
      selectedReplaceDishId.value = null;
      replacePortionG.value = props.item.portion_g;
      replacePortionText.value = props.item.portion_text || '';
      replaceKcal.value = null;
    }
  }
);

function onSelectReplaceDish(dish: DishRead) {
  selectedReplaceDishId.value = dish.id;
  if (dish.remaining_g) {
    replacePortionG.value = Math.min(250, dish.remaining_g);
    replacePortionText.value = '';
  }
}

function handleSubmit() {
  if (!props.item) return;

  if (!selectedReplaceDishId.value) {
    toastStore.show('Оберіть страву зі списку', 'warning');
    return;
  }

  emit('save', {
    dishId: selectedReplaceDishId.value,
    portionG: replacePortionG.value ? Number(replacePortionG.value) : null,
    portionText: replacePortionText.value.trim() || null,
    kcal: replaceKcal.value !== null && replaceKcal.value !== undefined && replaceKcal.value !== ('' as unknown as number)
      ? Number(replaceKcal.value)
      : undefined,
  });
}
</script>

<template>
  <ModalSheet
    :show="show"
    :title="item?.title ? `Замінити «${item.title}»` : 'Заміна позиції'"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="replace-item-form">
      <DishProductPicker
        v-model:source-type="replaceSourceType"
        :available-dishes="availableDishes"
        :selected-dish-id="selectedReplaceDishId"
        @select-dish="onSelectReplaceDish"
      />

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="replacePortionG">Порція (г)</label>
          <input
            id="replacePortionG"
            v-model.number="replacePortionG"
            type="number"
            class="form-input num-mono"
            placeholder="Напр. 200"
            min="1"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="replacePortionText">Або опис порції</label>
          <input
            id="replacePortionText"
            v-model="replacePortionText"
            type="text"
            class="form-input"
            placeholder="2 шт, 1 чашка..."
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="replaceKcal">Оцінка ккал (опційно)</label>
        <input
          id="replaceKcal"
          v-model.number="replaceKcal"
          type="number"
          class="form-input num-mono"
          placeholder="Напр. 350"
          min="0"
        />
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving || !selectedReplaceDishId"
        >
          {{ saving ? 'Заміна...' : 'Замінити' }}
        </button>
      </div>
    </form>
  </ModalSheet>
</template>