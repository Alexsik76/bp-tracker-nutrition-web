<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import DishProductPicker, { type PickerSourceType } from '../DishProductPicker.vue';
import { useToastStore } from '../../stores/toast';
import type { DishRead, ProductRead, MealType } from '../../types/nutrition';
import { mealTypeLabel } from '../../utils/mealTypes';

const props = withDefaults(
  defineProps<{
    show: boolean;
    slotName: MealType | null;
    availableDishes: DishRead[];
    availableProducts?: ProductRead[];
    adding: boolean;
    submitLabel?: string;
  }>(),
  {
    submitLabel: 'Додати до меню',
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: {
    dishId?: string;
    title?: string;
    portionG?: number;
    portionText?: string;
    kcal?: number;
  }): void;
}>();

const toastStore = useToastStore();

const sourceType = ref<PickerSourceType>('dish');
const selectedDishId = ref<string | null>(null);
const linkedReference = ref('');
const title = ref('');
const portionG = ref<number | null>(null);
const portionText = ref('');
const kcal = ref<number | null>(null);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      sourceType.value = 'dish';
      selectedDishId.value = null;
      linkedReference.value = '';
      title.value = '';
      portionG.value = null;
      portionText.value = '';
      kcal.value = null;
    }
  }
);

function onSelectDish(dish: DishRead) {
  selectedDishId.value = dish.id;
  title.value = dish.name;
  if (dish.remaining_g) {
    portionG.value = Math.min(250, dish.remaining_g);
  }
}

function onLinkedReferenceChange() {
  if (!linkedReference.value) {
    selectedDishId.value = null;
    return;
  }
  const [kind, id] = linkedReference.value.split(':');
  if (kind === 'dish') {
    selectedDishId.value = id;
    const dish = props.availableDishes.find((d) => d.id === id);
    if (dish) {
      if (!title.value.trim()) {
        title.value = dish.name;
      }
      if (!portionG.value && dish.remaining_g) {
        portionG.value = Math.min(250, dish.remaining_g);
      }
    }
  }
}

function handleSubmit() {
  if (sourceType.value === 'custom') {
    if (!title.value.trim()) {
      toastStore.show('Вкажіть назву позиції', 'warning');
      return;
    }
  } else if (!selectedDishId.value) {
    toastStore.show('Оберіть страву зі списку', 'warning');
    return;
  }

  emit('save', {
    dishId: selectedDishId.value || undefined,
    title: title.value.trim() || undefined,
    portionG: portionG.value ? Number(portionG.value) : undefined,
    portionText: portionText.value.trim() || undefined,
    kcal: kcal.value !== null && kcal.value !== undefined && kcal.value !== ('' as unknown as number)
      ? Number(kcal.value)
      : undefined,
  });
}
</script>

<template>
  <ModalSheet
    :show="show"
    :title="`Додати в «${mealTypeLabel(slotName)}»`"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="add-item-form">
      <DishProductPicker
        v-model:source-type="sourceType"
        :available-dishes="availableDishes"
        :selected-dish-id="selectedDishId"
        :allow-custom="true"
        @select-dish="onSelectDish"
      />

      <!-- Free text mode: title & optional reference link -->
      <template v-if="sourceType === 'custom'">
        <div class="form-group">
          <label class="form-label" for="addCustomTitle">
            Назва <span class="required-mark">*</span>
          </label>
          <input
            id="addCustomTitle"
            v-model="title"
            type="text"
            class="form-input"
            placeholder="Введіть назву страви"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="addCustomLink">
            Прив'язка до страви (опційно)
          </label>
          <select
            id="addCustomLink"
            v-model="linkedReference"
            class="form-input form-select"
            @change="onLinkedReferenceChange"
          >
            <option value="">Без прив'язки</option>
            <optgroup v-if="availableDishes.length > 0" label="Страви з холодильника">
              <option
                v-for="dish in availableDishes"
                :key="dish.id"
                :value="'dish:' + dish.id"
              >
                {{ dish.name }}
              </option>
            </optgroup>
          </select>
        </div>
      </template>

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
        <label class="form-label" for="addKcal">Оцінка ккал (опційно)</label>
        <input
          id="addKcal"
          v-model.number="kcal"
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
          :disabled="adding || (sourceType === 'custom' ? !title.trim() : !selectedDishId)"
        >
          {{ adding ? 'Додаємо...' : submitLabel }}
        </button>
      </div>
    </form>
  </ModalSheet>
</template>

<style scoped>
.required-mark {
  color: var(--danger);
}
</style>