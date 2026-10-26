<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();

const email = ref('');
const loadingPasskey = ref(false);
const loadingMagicLink = ref(false);
const magicLinkSent = ref(false);
const errorMessage = ref<string | null>(null);

async function handlePasskeyLogin() {
  loadingPasskey.value = true;
  errorMessage.value = null;
  try {
    await authStore.loginPasskey();
    toastStore.show('Успішний вхід!', 'success');
    router.replace('/menu');
  } catch (err: unknown) {
    console.error('Passkey login error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Не вдалося увійти за допомогою Passkey';
  } finally {
    loadingPasskey.value = false;
  }
}

async function handleMagicLinkRequest() {
  if (!email.value || !email.value.includes('@')) {
    errorMessage.value = 'Введіть коректну електронну адресу';
    return;
  }

  loadingMagicLink.value = true;
  errorMessage.value = null;
  try {
    const detail = await authStore.requestMagicLink(email.value.trim());
    magicLinkSent.value = true;
    toastStore.show(detail || 'Посилання надіслано на email', 'success');
  } catch (err: unknown) {
    console.error('Magic link request error:', err);
    errorMessage.value = err instanceof Error ? err.message : 'Не вдалося надіслати посилання';
  } finally {
    loadingMagicLink.value = false;
  }
}

async function handleDevBypass() {
  try {
    await authStore.loginPasskey();
    toastStore.show('Dev-сесію активовано', 'info');
    router.replace('/menu');
  } catch (err) {
    console.error(err);
  }
}

onMounted(async () => {
  // Check if token is in query (from magic link click)
  const token = route.query.token as string | undefined;
  if (token) {
    loadingMagicLink.value = true;
    try {
      await authStore.confirmMagicLink(token);
      toastStore.show('Успішний вхід за посиланням!', 'success');
      router.replace('/menu');
    } catch (err: unknown) {
      errorMessage.value = err instanceof Error ? err.message : 'Не вдалося підтвердити посилання';
    } finally {
      loadingMagicLink.value = false;
    }
  }
});
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="logo-area">
        <div class="logo-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <h1 class="login-title">Меню здоров'я</h1>
        <p class="login-subtitle">BP Tracker Nutrition</p>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Passkey Login Section -->
      <div class="auth-section">
        <button
          class="btn btn-primary btn-passkey"
          :disabled="loadingPasskey || loadingMagicLink"
          @click="handlePasskeyLogin"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2l-2 2m-1-1l-3 3m1 1l-2 2m-2-2l-1 1m-1-1l-2 2M3 21l3-3m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78z"></path>
          </svg>
          <span>{{ loadingPasskey ? 'Авторизація...' : 'Увійти з Passkey' }}</span>
        </button>
      </div>

      <div class="divider">
        <span class="divider-text">або електронна пошта</span>
      </div>

      <!-- Magic Link Section -->
      <div v-if="!magicLinkSent" class="auth-section">
        <form @submit.prevent="handleMagicLinkRequest" class="magic-form">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="alex@example.com"
              required
              autocomplete="email"
              :disabled="loadingPasskey || loadingMagicLink"
            />
          </div>
          <button
            type="submit"
            class="btn btn-secondary btn-full"
            :disabled="loadingPasskey || loadingMagicLink"
          >
            {{ loadingMagicLink ? 'Надсилаємо...' : 'Отримати посилання для входу' }}
          </button>
        </form>
      </div>

      <div v-else class="magic-sent-card">
        <div class="magic-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <p class="magic-sent-title">Перевірте пошту</p>
        <p class="magic-sent-desc">
          Ми надіслали посилання для входу на <strong>{{ email }}</strong>. Перейдіть за посиланням у листі для входу.
        </p>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          @click="magicLinkSent = false"
        >
          Надіслати повторно
        </button>
      </div>

      <!-- Dev mode quick login button -->
      <div v-if="authStore.isDevBypass" class="dev-bypass-box">
        <div class="dev-bypass-label">Режим розробника активний</div>
        <button class="btn btn-secondary btn-sm" @click="handleDevBypass">
          Швидкий вхід без сервера (Dev Bypass)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-16);
  background-color: var(--bg-primary);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-card);
  padding: var(--space-28) var(--space-20);
  display: flex;
  flex-direction: column;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--space-28);
}

.logo-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-control);
  background: var(--primary-bg-chip);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-12);
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  background: var(--danger-bg-chip);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: var(--danger);
  padding: var(--space-12);
  border-radius: var(--radius-control);
  font-size: 13px;
  margin-bottom: var(--space-20);
}

.auth-section {
  display: flex;
  flex-direction: column;
}

.btn-passkey {
  width: 100%;
  font-size: 16px;
}

.btn-sm {
  min-height: 38px;
  font-size: 13px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: var(--space-20) 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--surface-border);
}

.divider-text {
  padding: 0 var(--space-12);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.magic-form {
  display: flex;
  flex-direction: column;
}

.magic-sent-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-16);
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--surface-border);
}

.magic-icon {
  color: var(--success);
  margin-bottom: var(--space-8);
}

.magic-sent-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: var(--space-4);
}

.magic-sent-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: var(--space-16);
  line-height: 1.4;
}

.dev-bypass-box {
  margin-top: var(--space-28);
  padding-top: var(--space-16);
  border-top: 1px dashed var(--surface-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}

.dev-bypass-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--warning);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
