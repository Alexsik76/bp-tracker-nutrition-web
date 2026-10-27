<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { nutritionApi } from '../services/api';
import { useToastStore } from '../stores/toast';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import ProductCard from '../components/products/ProductCard.vue';
import ProductModalSheet from '../components/products/ProductModalSheet.vue';
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
const editingProduct = ref<ProductRead | null>(null);
const saving = ref(false);

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
  editingProduct.value = null;
  isModalOpen.value = true;
}

function openEditModal(product: ProductRead) {
  editingProduct.value = product;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingProduct.value = null;
}

async function handleSaveProduct(payload: ProductCreate | ProductUpdate) {
  saving.value = true;
  try {
    if (editingProduct.value) {
      const updated = await nutritionApi.updateProduct(editingProduct.value.id, payload as ProductUpdate);
      const index = products.value.findIndex((p) => p.id === editingProduct.value?.id);
      if (index !== -1) {
        products.value[index] = updated;
      }
      toastStore.show('Продукт оновлено', 'success');
    } else {
      const created = await nutritionApi.createProduct(payload as ProductCreate);
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
  if (!editingProduct.value) return;
  if (!confirm('Видалити цей продукт?')) return;

  saving.value = true;
  try {
    await nutritionApi.deleteProduct(editingProduct.value.id);
    products.value = products.value.filter((p) => p.id !== editingProduct.value?.id);
    toastStore.show('Продукт видалено', 'success');
    closeModal();
  } catch (err: unknown) {
    console.error('Error deleting product:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення', 'error');
  } finally {
    saving.value = false;
  }
}

async function handleEstimateProduct(product: ProductRead) {
  try {
    const updated = await nutritionApi.estimateProduct(product.id);
    const index = products.value.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products.value[index] = updated;
    }
    toastStore.show(`Калорійність «${product.name}» успішно оцінено`, 'success');
  } catch (err: unknown) {
    console.error('Error estimating product:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка оцінки продукту', 'error');
  }
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
      <ProductCard
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
        @edit="openEditModal"
        @cycle-availability="cycleAvailability"
        @cycle-preference="cyclePreference"
        @estimate="handleEstimateProduct"
      />
    </div>

    <!-- Product Modal Sheet -->
    <ProductModalSheet
      :show="isModalOpen"
      :product="editingProduct"
      :saving="saving"
      @close="closeModal"
      @save="handleSaveProduct"
      @delete="handleDeleteProduct"
    />
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
</style>
