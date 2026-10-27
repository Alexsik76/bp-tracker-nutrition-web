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
  availableProducts: ProductRead[];
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: {
    dishId?: string;
    productId?: string;
    portionG?: number | null;
    portionText?: string | null;
    kcalEst?: number | null;
  }): void;
}>();

const toastStore = useToastStore();

const replaceSourceType = ref<'dish' | 'product'>('dish');
const selectedReplaceDishId = ref<string | null>(null);
const selectedReplaceProductId = ref<string | null>(null);
const replacePortionG = ref<number | null>(null);
const replacePortionText = ref('');
const replaceKcalEst = ref<number | null>(null);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen && props.item) {
      replaceSourceType.value = props.item.dish_id ? 'dish' : (props.item.product_id ? 'product' : 'dish');
      selectedReplaceDishId.value = null;
      selectedReplaceProductId.value = null;
      replacePortionG.value = props.item.portion_g;
      replacePortionText.value = props.item.portion_text || '';
      replaceKcalEst.value = null;
    }
  }
);

function onSelectReplaceDish(dish: DishRead) {
  selectedReplaceDishId.value = dish.id;
  selectedReplaceProductId.value = null;
  if (dish.remaining_g) {
    replacePortionG.value = Math.min(250, dish.remaining_g);
    replacePortionText.value = '';
  }
}

function onSelectReplaceProduct(prod: ProductRead) {
  selectedReplaceProductId.value = prod.id;
  selectedReplaceDishId.value = null;
  if (prod.daily_limit_g) {
    replacePortionG.value = prod.daily_limit_g;
    replacePortionText.value = '';
  }
}

function handleSubmit() {
  if (!props.item) return;
  const isDish = replaceSourceType.value === 'dish';
  const dishId = isDish ? (selectedReplaceDishId.value ?? undefined) : undefined;
  const productId = !isDish ? (selectedReplaceProductId.value ?? undefined) : undefined;

  if (!dishId && !productId) {
    toastStore.show('Оберіть страву або продукт зі списку', 'warning');
    return;
  }

  emit('save', {
    dishId,
    productId,
    portionG: replacePortionG.value ? Number(replacePortionG.value) : null,
    portionText: replacePortionText.value.trim() || null,
    kcalEst: replaceKcalEst.value !== null && replaceKcalEst.value !== undefined && replaceKcalEst.value !== ('' as unknown as number)
      ? Number(replaceKcalEst.value)
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
        :available-products="availableProducts"
        :selected-dish-id="selectedReplaceDishId"
        :selected-product-id="selectedReplaceProductId"
        @select-dish="onSelectReplaceDish"
        @select-product="onSelectReplaceProduct"
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
        <label class="form-label" for="replaceKcalEst">Оцінка ккал (опційно)</label>
        <input
          id="replaceKcalEst"
          v-model.number="replaceKcalEst"
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
          :disabled="saving || (replaceSourceType === 'dish' ? !selectedReplaceDishId : !selectedReplaceProductId)"
        >
          {{ saving ? 'Заміна...' : 'Замінити' }}
        </button>
      </div>
    </form>
  </ModalSheet>
</template>
