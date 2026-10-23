<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { nutritionApi } from '../services/api';
import { useToastStore } from '../stores/toast';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import ModalSheet from '../components/ModalSheet.vue';
import SegmentedControl from '../components/SegmentedControl.vue';
import type {
  ProductRead,
  ProductCreate,
  ProductUpdate,
  ProductAvailability,
  ProductPreference,
} from '../types/nutrition';

const toastStore = useToastStore();

const products = ref<ProductRead[]>([]);
const loading = ref(true);
const searchQuery = ref('');

// Modal state
const isModalOpen = ref(false);
const editingProductId = ref<string | null>(null);
const saving = ref(false);

// Form fields
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

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return products.value;
  return products.value.filter((p) => p.name.toLowerCase().includes(query));
});

async function loadProducts() {
  loading.value = true;
  try {
    products.value = await nutritionApi.getProducts();
  } catch (err) {
    console.error('Error loading products:', err);
    toastStore.show('Помилка завантаження продуктів', 'error');
  } finally {
    loading.value = false;
  }
}

// Quick 1-tap cyclic toggle for availability
async function cycleAvailability(product: ProductRead) {
  const order: ProductAvailability[] = ['in_stock', 'low', 'out'];
  const currentIndex = order.indexOf(product.availability);
  const nextAvailability = order[(currentIndex + 1) % order.length];

  const prev = product.availability;
  product.availability = nextAvailability; // Optimistic update

  try {
    const updated = await nutritionApi.updateProduct(product.id, { availability: nextAvailability });
    Object.assign(product, updated);
  } catch (err) {
    product.availability = prev;
    toastStore.show('Не вдалося оновити наявність', 'error');
  }
}

// Quick 1-tap cyclic toggle for preference
async function cyclePreference(product: ProductRead) {
  const order: ProductPreference[] = ['preferred', 'neutral', 'avoid'];
  const currentIndex = order.indexOf(product.preference);
  const nextPreference = order[(currentIndex + 1) % order.length];

  const prev = product.preference;
  product.preference = nextPreference; // Optimistic update

  try {
    const updated = await nutritionApi.updateProduct(product.id, { preference: nextPreference });
    Object.assign(product, updated);
  } catch (err) {
    product.preference = prev;
    toastStore.show('Не вдалося оновити бажаність', 'error');
  }
}

function openCreateModal() {
  editingProductId.value = null;
  formName.value = '';
  formAvailability.value = 'in_stock';
  formPreference.value = 'neutral';
  formEatRaw.value = false;
  formCount.value = null;
  formDailyLimitG.value = null;
  isModalOpen.value = true;
}

function openEditModal(product: ProductRead) {
  editingProductId.value = product.id;
  formName.value = product.name;
  formAvailability.value = product.availability;
  formPreference.value = product.preference;
  formEatRaw.value = product.eat_raw;
  formCount.value = product.count;
  formDailyLimitG.value = product.daily_limit_g;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingProductId.value = null;
}

async function handleSaveProduct() {
  if (!formName.value.trim()) {
    toastStore.show('Вкажіть назву продукту', 'warning');
    return;
  }

  saving.value = true;
  try {
    if (editingProductId.value) {
      const payload: ProductUpdate = {
        name: formName.value.trim(),
        availability: formAvailability.value,
        preference: formPreference.value,
        eat_raw: formEatRaw.value,
        count: formCount.value,
        daily_limit_g: formDailyLimitG.value,
      };
      const updated = await nutritionApi.updateProduct(editingProductId.value, payload);
      const index = products.value.findIndex((p) => p.id === editingProductId.value);
      if (index !== -1) {
        products.value[index] = updated;
      }
      toastStore.show('Продукт оновлено', 'success');
    } else {
      const payload: ProductCreate = {
        name: formName.value.trim(),
        availability: formAvailability.value,
        preference: formPreference.value,
        eat_raw: formEatRaw.value,
        count: formCount.value,
        daily_limit_g: formDailyLimitG.value,
      };
      const created = await nutritionApi.createProduct(payload);
      products.value.unshift(created);
      toastStore.show('Продукт додано', 'success');
    }
    closeModal();
  } catch (err: unknown) {
    console.error('Error saving product:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка збереження', 'error');
  } finally {
    saving.value = false;
  }
}

async function handleDeleteProduct() {
  if (!editingProductId.value) return;
  if (!confirm('Видалити цей продукт?')) return;

  saving.value = true;
  try {
    await nutritionApi.deleteProduct(editingProductId.value);
    products.value = products.value.filter((p) => p.id !== editingProductId.value);
    toastStore.show('Продукт видалено', 'success');
    closeModal();
  } catch (err: unknown) {
    console.error('Error deleting product:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення', 'error');
  } finally {
    saving.value = false;
  }
}

function getAvailabilityBadge(val: ProductAvailability) {
  if (val === 'in_stock') return { label: 'Є', cls: 'badge-success' };
  if (val === 'low') return { label: 'Мало', cls: 'badge-warning' };
  return { label: 'Немає', cls: 'badge-danger' };
}

function getPreferenceBadge(val: ProductPreference) {
  if (val === 'preferred') return { label: 'Бажано', cls: 'badge-success' };
  if (val === 'avoid') return { label: 'Уникати', cls: 'badge-danger' };
  return { label: 'Нейтрально', cls: 'badge-neutral' };
}

onMounted(() => {
  loadProducts();
});
</script>

<template>
  <div class="products-view">
    <div class="view-header">
      <div>
        <h1 class="view-title">Продукти</h1>
        <p class="view-subtitle">Запаси та вподобання для ШІ-генератора</p>
      </div>
      <button class="btn btn-primary add-product-btn" @click="openCreateModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Додати</span>
      </button>
    </div>

    <!-- Search box -->
    <div class="search-box">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        v-model="searchQuery"
        type="search"
        class="form-input search-input"
        placeholder="Пошук продукту..."
      />
    </div>

    <LoadingSpinner v-if="loading" text="Завантаження продуктів..." />

    <div v-else-if="filteredProducts.length === 0">
      <EmptyState
        title="Продуктів не знайдено"
        :description="searchQuery ? 'Спробуйте інший пошуковий запит' : 'Додайте продукти, які є у вас вдома, щоб ШІ міг складати з них меню'"
        :action-label="searchQuery ? undefined : 'Додати перший продукт'"
        @action="openCreateModal"
      />
    </div>

    <div v-else class="products-list">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="card product-card"
      >
        <div class="product-main-row">
          <div class="product-info" @click="openEditModal(product)">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-badges">
              <span v-if="product.eat_raw" class="badge badge-info">Сирим</span>
              <span v-if="product.count" class="badge badge-neutral num-mono">
                {{ product.count }} шт
              </span>
              <span v-if="product.daily_limit_g" class="badge badge-warning num-mono">
                Ліміт: {{ product.daily_limit_g }} г/день
              </span>
            </div>
          </div>

          <button
            class="btn-icon edit-action-btn"
            @click="openEditModal(product)"
            aria-label="Редагувати продукт"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>

        <!-- Quick 1-tap toggles row -->
        <div class="quick-toggles-row">
          <button
            type="button"
            class="quick-toggle-btn"
            @click="cycleAvailability(product)"
            title="Натисніть для зміни наявності"
          >
            <span class="toggle-label">Наявність:</span>
            <span class="badge" :class="getAvailabilityBadge(product.availability).cls">
              {{ getAvailabilityBadge(product.availability).label }}
            </span>
          </button>

          <button
            type="button"
            class="quick-toggle-btn"
            @click="cyclePreference(product)"
            title="Натисніть для зміни вподобання"
          >
            <span class="toggle-label">Бажаність:</span>
            <span class="badge" :class="getPreferenceBadge(product.preference).cls">
              {{ getPreferenceBadge(product.preference).label }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Product Modal Sheet -->
    <ModalSheet
      :show="isModalOpen"
      :title="editingProductId ? 'Редагувати продукт' : 'Новий продукт'"
      @close="closeModal"
    >
      <form @submit.prevent="handleSaveProduct" class="product-form">
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
            {{ saving ? 'Збереження...' : (editingProductId ? 'Оновити продукт' : 'Додати продукт') }}
          </button>

          <button
            v-if="editingProductId"
            type="button"
            class="btn btn-danger btn-full"
            :disabled="saving"
            @click="handleDeleteProduct"
          >
            Видалити продукт
          </button>
        </div>
      </form>
    </ModalSheet>
  </div>
</template>

<style scoped>
.products-view {
  padding-bottom: var(--space-20);
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-16);
}

.view-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.view-subtitle {
  font-size: 12.5px;
  color: var(--text-muted);
}

.add-product-btn {
  min-height: 40px;
  padding: 0 var(--space-12);
  font-size: 13.5px;
}

.search-box {
  position: relative;
  margin-bottom: var(--space-16);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  padding-left: 42px;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.product-card {
  padding: var(--space-12) var(--space-16);
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.product-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-info {
  flex: 1;
  cursor: pointer;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.product-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.edit-action-btn {
  color: var(--text-muted);
}

.quick-toggles-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
}

.quick-toggle-btn {
  flex: 1;
  min-height: var(--touch-target-min);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-control);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  padding: 0 var(--space-8);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.quick-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.toggle-label {
  font-size: 11px;
  color: var(--text-muted);
}

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

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

.modal-actions-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: var(--space-20);
}

.btn-full {
  width: 100%;
}
</style>
