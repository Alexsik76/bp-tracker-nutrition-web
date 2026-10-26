<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import DishProductPicker from '../DishProductPicker.vue';
import { useToastStore } from '../../stores/toast';
import type { DishRead, ProductRead } from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  slotName: string | null;
  availableDishes: DishRead[];
  availableProducts: ProductRead[];
  adding: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: {
    dishId?: string;
    productId?: string;
    title?: string;
    portionG?: number;
    portionText?: string;
    kcalEst?: number;
  }): void;
}>();

const toastStore = useToastStore();

const sourceType = ref<'dish' | 'product'>('dish');
const selectedDishId = ref<string | null>(null);
const selectedProductId = ref<string | null>(null);
const title = ref('');
const portionG = ref<number | null>(null);
const portionText = ref('');
const kcalEst = ref<number | null>(null);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      sourceType.value = 'dish';
      selectedDishId.value = null;
      selectedProductId.value = null;
      title.value = '';
      portionG.value = null;
      portionText.value = '';
      kcalEst.value = null;
    }
  }
);

function onSelectDish(dish: DishRead) {
  selectedDishId.value = dish.id;
  selectedProductId.value = null;
  title.value = dish.name;
  if (dish.remaining_g) {
    portionG.value = Math.min(250, dish.remaining_g);
  }
}

function onSelectProduct(prod: ProductRead) {
  selectedProductId.value = prod.id;
  selectedDishId.value = null;
  title.value = prod.name;
  if (prod.daily_limit_g) {
    portionG.value = prod.daily_limit_g;
  }
}

function handleSubmit() {
  if (!selectedDishId.value && !selectedProductId.value) {
    toastStore.show('Оберіть страву або продукт зі списку', 'warning');
    return;
  }

  emit('save', {
    dishId: selectedDishId.value || undefined,
    productId: selectedProductId.value || undefined,
    title: title.value.trim() || undefined,
    portionG: portionG.value ? Number(portionG.value) : undefined,
    portionText: portionText.value.trim() || undefined,
    kcalEst: kcalEst.value ? Number(kcalEst.value) : undefined,
  });
}
</script>

<template>
  <ModalSheet
    :show="show"
    :title="`Додати в «${slotName}»`"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="add-item-form">
      <DishProductPicker
        v-model:source-type="sourceType"
        :available-dishes="availableDishes"
        :available-products="availableProducts"
        :selected-dish-id="selectedDishId"
        :selected-product-id="selectedProductId"
        @select-dish="onSelectDish"
        @select-product="onSelectProduct"
      />

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="addPortionG">Порція (г)</label>
          <input
            id="addPortionG"
            v-model.number="portionG"
            type="number"
            class="form-input num-mono"
            placeholder="Напр. 200"
            min="1"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="addPortionText">Або опис порції</label>
          <input
            id="addPortionText"
            v-model="portionText"
            type="text"
            class="form-input"
            placeholder="2 шт, 1 чашка..."
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="addKcalEst">Оцінка ккал (опційно)</label>
        <input
          id="addKcalEst"
          v-model.number="kcalEst"
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
          :disabled="adding || (sourceType === 'dish' ? !selectedDishId : !selectedProductId)"
        >
          {{ adding ? 'Додаємо...' : 'Додати до меню' }}
        </button>
      </div>
    </form>
  </ModalSheet>
</template>
