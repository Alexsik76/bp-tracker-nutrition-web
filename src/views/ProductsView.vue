<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { nutritionApi } from '../services/api';
import { useToastStore } from '../stores/toast';
import ModalSheet from '../components/ModalSheet.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import type { ProductRead } from '../types/nutrition';

const router = useRouter();
const toastStore = useToastStore();

const products = ref<ProductRead[]>([]);
const loading = ref(true);

const isSearchOpen = ref(false);
const searchQuery = ref('');

const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return products.value;
  return products.value.filter((p) => p.name.toLowerCase().includes(q) || (p.note && p.note.toLowerCase().includes(q)));
});

async function loadProducts() {
  loading.value = true;
  try {
    products.value = await nutritionApi.getProducts();
  } catch (err: unknown) {
    console.error('Failed to load products:', err);
    toastStore.show('Помилка завантаження продуктів', 'error');
  } finally {
    loading.value = false;
  }
}

function toggleSearch() {
  isSearchOpen.value = !isSearchOpen.value;
  if (!isSearchOpen.value) {
    searchQuery.value = '';
  }
}

// Switch: toggle available
async function toggleAvailable(product: ProductRead) {
  const nextVal = !product.available;
  const prevVal = product.available;
  product.available = nextVal; // Optimistic update

  try {
    const updated = await nutritionApi.updateProduct(product.id, { available: nextVal });
    product.available = updated.available;
  } catch (err: unknown) {
    product.available = prevVal;
    console.error('Failed to update product availability:', err);
    toastStore.show('Не вдалося оновити статус продукту', 'error');
  }
}

// Edit Modal Sheet
const isEditModalOpen = ref(false);
const activeProduct = ref<ProductRead | null>(null);
const editName = ref('');
const editNote = ref('');
const savingEdit = ref(false);
const deletingProduct = ref(false);

function openEditSheet(product: ProductRead) {
  activeProduct.value = product;
  editName.value = product.name;
  editNote.value = product.note || '';
  isEditModalOpen.value = true;
}

function closeEditSheet() {
  isEditModalOpen.value = false;
  activeProduct.value = null;
}

async function handleSaveEdit() {
  if (!activeProduct.value || savingEdit.value) return;
  const name = editName.value.trim();
  if (!name) return;

  const prodId = activeProduct.value.id;
  savingEdit.value = true;

  try {
    const updated = await nutritionApi.updateProduct(prodId, {
      name,
      note: editNote.value.trim() || null,
    });
    const idx = products.value.findIndex((p) => p.id === prodId);
    if (idx !== -1) {
      products.value[idx] = updated;
    }
    toastStore.show('Продукт оновлено', 'success');
    closeEditSheet();
  } catch (err: unknown) {
    console.error('Failed to update product:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка оновлення', 'error');
  } finally {
    savingEdit.value = false;
  }
}

async function handleDeleteProduct() {
  if (!activeProduct.value || deletingProduct.value) return;
  if (!confirm(`Видалити продукт «${activeProduct.value.name}»?`)) return;

  const prodId = activeProduct.value.id;
  deletingProduct.value = true;

  try {
    await nutritionApi.deleteProduct(prodId);
    products.value = products.value.filter((p) => p.id !== prodId);
    toastStore.show('Продукт видалено', 'success');
    closeEditSheet();
  } catch (err: unknown) {
    console.error('Failed to delete product:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення', 'error');
  } finally {
    deletingProduct.value = false;
  }
}

// Add Product Modal Sheet
const isAddModalOpen = ref(false);
const addName = ref('');
const addNote = ref('');
const addingProduct = ref(false);

function openAddModal() {
  addName.value = '';
  addNote.value = '';
  isAddModalOpen.value = true;
}

function closeAddModal() {
  isAddModalOpen.value = false;
}

async function handleAddProduct() {
  const name = addName.value.trim();
  if (!name || addingProduct.value) return;

  addingProduct.value = true;
  try {
    const created = await nutritionApi.createProduct({
      name,
      note: addNote.value.trim() || null,
      available: true,
    });
    products.value.unshift(created);
    toastStore.show(`Продукт «${created.name}» додано`, 'success');
    closeAddModal();
  } catch (err: unknown) {
    console.error('Failed to create product:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка додавання продукту', 'error');
  } finally {
    addingProduct.value = false;
  }
}

function goBack() {
  router.push('/menu');
}

onMounted(() => {
  loadProducts();
});
</script>

<template>
  <div class="products-screen">
    <!-- Header -->
    <header class="products-header">
      <div class="header-left" role="button" tabindex="0" @click="goBack" @keydown.enter="goBack">
        <svg
          class="back-arrow"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <h1 class="header-title">Продукти</h1>
      </div>
      <button
        type="button"
        class="btn-icon"
        aria-label="Пошук"
        @click="toggleSearch"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </header>

    <!-- Search Input (revealed on search button click) -->
    <div v-if="isSearchOpen" class="search-bar-wrap">
      <input
        v-model="searchQuery"
        type="search"
        class="search-input"
        placeholder="Пошук продукту..."
        autofocus
      />
    </div>

    <div v-if="loading" class="loading-wrap">
      <LoadingSpinner text="Завантаження продуктів..." />
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-wrap">
      <EmptyState
        title="Продуктів не знайдено"
        :description="searchQuery ? 'Спробуйте інший пошуковий запит' : 'Додайте продукти, які є у вас вдома, щоб ШІ міг формувати з них меню'"
        :action-label="searchQuery ? undefined : 'Додати продукт'"
        @action="openAddModal"
      />
    </div>

    <!-- Products List -->
    <div v-else class="products-list-scroll">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="product-row"
        :class="{ 'is-unavailable': !product.available }"
        @click="openEditSheet(product)"
      >
        <div class="product-info">
          <div class="product-name">{{ product.name }}</div>
          <div v-if="product.note" class="product-note">
            {{ product.note }}
          </div>
        </div>
        <div class="product-action">
          <button
            type="button"
            role="switch"
            :aria-checked="product.available"
            class="md-switch"
            :class="{ 'is-active': product.available }"
            :aria-label="product.available ? 'Є в наявності' : 'Немає в наявності'"
            @pointerdown.stop
            @click.stop="toggleAvailable(product)"
          >
            <span class="md-switch-knob"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- FAB: Add Product -->
    <button
      type="button"
      class="fab-btn"
      aria-label="Додати продукт"
      @click="openAddModal"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>

    <!-- Small Modal Sheet: Edit Product & Delete -->
    <ModalSheet
      :show="isEditModalOpen"
      :title="activeProduct?.name || 'Продукт'"
      @close="closeEditSheet"
    >
      <form @submit.prevent="handleSaveEdit" class="edit-product-form">
        <div class="form-group">
          <label class="form-label" for="editProductName">Назва продукту</label>
          <input
            id="editProductName"
            v-model="editName"
            type="text"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="editProductNote">Примітка</label>
          <textarea
            id="editProductNote"
            v-model="editNote"
            class="form-textarea"
            rows="2"
            placeholder="Наприклад: домашній, жирний"
          ></textarea>
        </div>

        <div class="modal-actions-col">
          <button
            type="submit"
            class="btn-save"
            :disabled="savingEdit || !editName.trim()"
          >
            <span v-if="!savingEdit">Зберегти</span>
            <LoadingSpinner v-else :size="18" />
          </button>
          <button
            type="button"
            class="btn-delete"
            :disabled="deletingProduct"
            @click="handleDeleteProduct"
          >
            Видалити продукт
          </button>
        </div>
      </form>
    </ModalSheet>

    <!-- Small Modal Sheet: Add Product -->
    <ModalSheet
      :show="isAddModalOpen"
      title="Новий продукт"
      @close="closeAddModal"
    >
      <form @submit.prevent="handleAddProduct" class="add-product-form">
        <div class="form-group">
          <label class="form-label" for="addProductName">Назва продукту</label>
          <input
            id="addProductName"
            v-model="addName"
            type="text"
            class="form-input"
            placeholder="Наприклад: Твердий сир"
            autofocus
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="addProductNote">Примітка (необов'язково)</label>
          <input
            id="addProductNote"
            v-model="addNote"
            type="text"
            class="form-input"
            placeholder="Наприклад: домашній, жирний"
          />
        </div>

        <div class="modal-actions-row">
          <button
            type="button"
            class="btn-cancel"
            @click="closeAddModal"
          >
            Скасувати
          </button>
          <button
            type="submit"
            class="btn-submit"
            :disabled="addingProduct || !addName.trim()"
          >
            <span v-if="!addingProduct">Додати</span>
            <LoadingSpinner v-else :size="18" />
          </button>
        </div>
      </form>
    </ModalSheet>
  </div>
</template>

<style scoped>
.products-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: var(--screen-max-width);
  margin: var(--space-0) auto;
  box-sizing: border-box;
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background-color: var(--color-bg);
  padding: calc(var(--space-14) + var(--safe-area-top)) var(--space-16) calc(var(--space-8) + var(--safe-area-bottom));
  min-height: var(--screen-min-height);
  position: relative;
}

/* Header */
.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  padding: var(--space-4) var(--space-4) var(--space-0);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  cursor: pointer;
  user-select: none;
}

.back-arrow {
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.header-left:hover .back-arrow {
  color: var(--color-text-primary);
}

.header-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.btn-icon:hover {
  color: var(--color-text-primary);
}

/* Search bar */
.search-bar-wrap {
  margin: var(--space-12) var(--space-4) var(--space-4);
}

.search-input {
  width: 100%;
  height: var(--btn-height-sm);
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--color-text-primary);
  padding: 0 var(--space-14);
  font-size: var(--font-size-input);
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--color-primary);
}

/* Scrollable Products List */
.products-list-scroll {
  flex: 1;
  overflow-y: auto;
  margin-top: var(--space-18);
  padding-bottom: calc(var(--space-48) + var(--space-24));
  scrollbar-width: none;
}

.products-list-scroll::-webkit-scrollbar {
  display: none;
}

.product-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-12) var(--space-4);
  border-bottom: var(--border-width-hairline) solid var(--color-border);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.product-row:active {
  background-color: var(--color-row-active-bg);
}

.product-row.is-unavailable {
  color: var(--color-text-muted);
}

.product-name {
  font-size: var(--font-size-base);
  color: inherit;
}

.product-row:not(.is-unavailable) .product-name {
  color: var(--color-text-primary);
}

.product-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

.product-action {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: var(--space-8);
}

/* MD3 Switch */
.md-switch {
  width: var(--switch-width);
  height: var(--switch-height);
  border-radius: var(--switch-radius);
  position: relative;
  border: var(--border-width-hairline) solid var(--color-border-strong);
  background: transparent;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.md-switch.is-active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.md-switch-knob {
  position: absolute;
  top: var(--switch-knob-top);
  left: var(--switch-knob-left);
  width: var(--switch-knob-size);
  height: var(--switch-knob-size);
  border-radius: 50%;
  background-color: var(--color-border-strong);
  transition: transform var(--transition-fast), background-color var(--transition-fast);
}

.md-switch.is-active .md-switch-knob {
  background-color: var(--color-on-primary);
  transform: translateX(var(--switch-knob-offset));
}

/* FAB */
.fab-btn {
  position: fixed;
  right: calc(50% - (var(--screen-max-width) / 2) + var(--space-16));
  bottom: calc(var(--space-24) + var(--safe-area-bottom));
  width: var(--fab-size);
  height: var(--fab-size);
  border-radius: var(--fab-radius);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--fab-shadow);
  cursor: pointer;
  z-index: 40;
  transition: background-color var(--transition-fast), transform var(--transition-fast);
}

@media (max-width: 480px) {
  .fab-btn {
    right: var(--space-16);
  }
}

.fab-btn:hover {
  background-color: var(--color-primary-hover);
}

.fab-btn:active {
  transform: scale(0.95);
}

/* Forms in modals */
.edit-product-form,
.add-product-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.form-label {
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.form-input {
  width: 100%;
  height: var(--btn-height-secondary);
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text-primary);
  padding: 0 var(--space-12);
  font-size: var(--font-size-input);
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.form-textarea {
  width: 100%;
  background-color: var(--color-surface);
  border: var(--border-width-hairline) solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-text-primary);
  padding: var(--space-10) var(--space-12);
  font-size: var(--font-size-input);
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.form-textarea:focus {
  border-color: var(--color-primary);
}

.modal-actions-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  margin-top: var(--space-8);
}

.btn-save {
  width: 100%;
  height: var(--btn-height-secondary);
  border-radius: var(--radius-pill);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
  --spinner-color: var(--color-on-primary);
  --spinner-track-color: var(--color-spinner-track-on-primary);
}

.btn-save:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-delete {
  width: 100%;
  height: var(--btn-height-sm);
  background: transparent;
  border: none;
  color: var(--danger);
  font-size: var(--font-size-sub);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.btn-delete:hover:not(:disabled) {
  text-decoration: underline;
  opacity: 0.9;
}

.modal-actions-row {
  display: flex;
  gap: var(--space-10);
  margin-top: var(--space-8);
}

.btn-cancel {
  flex: 1;
  height: var(--btn-height-secondary);
  border-radius: var(--radius-pill);
  border: var(--border-width-hairline) solid var(--color-btn-outline-border);
  background: transparent;
  color: var(--color-btn-outline-text);
  font-size: var(--font-size-base);
  cursor: pointer;
}

.btn-submit {
  flex: 1;
  height: var(--btn-height-secondary);
  border-radius: var(--radius-pill);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  --spinner-color: var(--color-on-primary);
  --spinner-track-color: var(--color-spinner-track-on-primary);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-wrap,
.empty-wrap {
  padding: var(--space-40) var(--space-0);
  display: flex;
  justify-content: center;
}
</style>
