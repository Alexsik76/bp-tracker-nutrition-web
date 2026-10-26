<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import SegmentedControl from '../SegmentedControl.vue';
import { useToastStore } from '../../stores/toast';
import type {
  ProductRead,
  ProductCreate,
  ProductUpdate,
  ProductAvailability,
  ProductPreference,
} from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  product: ProductRead | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: ProductCreate | ProductUpdate): void;
  (e: 'delete'): void;
}>();

const toastStore = useToastStore();

const formName = ref('');
const formAvailability = ref<ProductAvailability>('in_stock');
const formPreference = ref<ProductPreference>('neutral');
const formEatRaw = ref(false);
const formCount = ref<number | null>(null);
const formDailyLimitG = ref<number | null>(null);

const availabilityOptions: { label: string; value: ProductAvailability; badgeClass: string }[] = [
  { label: 'Є', value: 'in_stock', badgeClass: 'badge-success' },
  { label: 'Мало', value: 'low', badgeClass: 'badge-warning' },
  { label: 'Немає', value: 'out', badgeClass: 'badge-danger' },
];

const preferenceOptions: { label: string; value: ProductPreference; badgeClass: string }[] = [
  { label: 'Бажано', value: 'preferred', badgeClass: 'badge-success' },
  { label: 'Нейтрально', value: 'neutral', badgeClass: 'badge-neutral' },
  { label: 'Уникати', value: 'avoid', badgeClass: 'badge-danger' },
];

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      if (props.product) {
        formName.value = props.product.name;
        formAvailability.value = props.product.availability;
        formPreference.value = props.product.preference;
        formEatRaw.value = props.product.eat_raw;
        formCount.value = props.product.count;
        formDailyLimitG.value = props.product.daily_limit_g;
      } else {
        formName.value = '';
        formAvailability.value = 'in_stock';
        formPreference.value = 'neutral';
        formEatRaw.value = false;
        formCount.value = null;
        formDailyLimitG.value = null;
      }
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (!formName.value.trim()) {
    toastStore.show('Вкажіть назву продукту', 'warning');
    return;
  }

  const payload: ProductCreate | ProductUpdate = {
    name: formName.value.trim(),
    availability: formAvailability.value,
    preference: formPreference.value,
    eat_raw: formEatRaw.value,
    count: formCount.value,
    daily_limit_g: formDailyLimitG.value,
  };

  emit('save', payload);
}
</script>

<template>
  <ModalSheet
    :show="show"
    :title="product ? 'Редагувати продукт' : 'Новий продукт'"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="product-form">
      <div class="form-group">
        <label class="form-label" for="prodName">Назва продукту</label>
        <input
          id="prodName"
          v-model="formName"
          type="text"
          class="form-input"
          placeholder="Яйця курячі, Помідори, Вівсянка..."
          required
          autofocus
        />
      </div>

      <div class="form-group">
        <label class="form-label">Наявність</label>
        <SegmentedControl
          v-model="formAvailability"
          :options="availabilityOptions.map(o => ({ label: o.label, value: o.value }))"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Бажаність для ШІ</label>
        <SegmentedControl
          v-model="formPreference"
          :options="preferenceOptions.map(o => ({ label: o.label, value: o.value }))"
        />
      </div>

      <div class="form-check-group">
        <label class="checkbox-label">
          <input
            v-model="formEatRaw"
            type="checkbox"
            class="form-checkbox"
          />
          <span>Можна їсти без приготування (сирим)</span>
        </label>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label class="form-label" for="prodCount">Кількість (шт)</label>
          <input
            id="prodCount"
            v-model.number="formCount"
            type="number"
            class="form-input num-mono"
            placeholder="Необов'язково"
            min="0"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="prodLimit">Денний ліміт (г)</label>
          <input
            id="prodLimit"
            v-model.number="formDailyLimitG"
            type="number"
            class="form-input num-mono"
            placeholder="Напр. 30"
            min="0"
          />
        </div>
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving"
        >
          {{ saving ? 'Збереження...' : (product ? 'Оновити продукт' : 'Додати продукт') }}
        </button>

        <button
          v-if="product"
          type="button"
          class="btn btn-danger btn-full"
          :disabled="saving"
          @click="emit('delete')"
        >
          Видалити продукт
        </button>
      </div>
    </form>
  </ModalSheet>
</template>

<style scoped>
.form-check-group {
  margin-bottom: var(--space-16);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  min-height: var(--touch-target-min);
  cursor: pointer;
  font-size: 14px;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  accent-color: var(--primary);
  cursor: pointer;
}
</style>
