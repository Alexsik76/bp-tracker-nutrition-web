import { defineStore } from 'pinia';
import { ref } from 'vue';
import { startAuthentication } from '@simplewebauthn/browser';
import type { User } from '../types/auth';
import {
  authApi,
  getStoredRefreshToken,
  setAccessToken,
  setStoredRefreshToken,
  setOnUnauthorized,
} from '../services/api';

const DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
const DEV_USER: User = {
  id: 'dev-bypass-user',
  email: 'dev@home.vn.ua',
  display_name: 'Розробник (Dev)',
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const status = ref<'idle' | 'loading' | 'authenticated' | 'anonymous'>('idle');
  const error = ref<string | null>(null);

  setOnUnauthorized(() => {
    user.value = null;
    status.value = 'anonymous';
    setAccessToken(null);
    setStoredRefreshToken(null);
  });

  async function initAuth(): Promise<boolean> {
    if (DEV_BYPASS) {
      user.value = DEV_USER;
      status.value = 'authenticated';
      return true;
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      status.value = 'anonymous';
      return false;
    }

    status.value = 'loading';
    error.value = null;
    try {
      const me = await authApi.getMe();
      user.value = me;
      status.value = 'authenticated';
      return true;
    } catch {
      user.value = null;
      status.value = 'anonymous';
      setAccessToken(null);
      setStoredRefreshToken(null);
      return false;
    }
  }

  async function loginPasskey(): Promise<void> {
    if (DEV_BYPASS) {
      user.value = DEV_USER;
      status.value = 'authenticated';
      return;
    }

    status.value = 'loading';
    error.value = null;
    try {
      const options = await authApi.getPasskeyOptions();
      const assertion = await startAuthentication({ optionsJSON: options });
      const tokenResp = await authApi.verifyPasskey(assertion);

      setAccessToken(tokenResp.access_token);
      setStoredRefreshToken(tokenResp.refresh_token);

      const me = await authApi.getMe();
      user.value = me;
      status.value = 'authenticated';
    } catch (err: unknown) {
      status.value = 'anonymous';
      const msg = err instanceof Error ? err.message : 'Помилка входу за допомогою Passkey';
      error.value = msg;
      throw err;
    }
  }

  async function requestMagicLink(email: string): Promise<string> {
    if (DEV_BYPASS) {
      return 'Тестове посилання надіслано (Dev Mode)';
    }

    error.value = null;
    const res = await authApi.requestMagicLink({ email });
    return res.detail;
  }

  async function confirmMagicLink(token: string): Promise<void> {
    if (DEV_BYPASS) {
      user.value = DEV_USER;
      status.value = 'authenticated';
      return;
    }

    status.value = 'loading';
    error.value = null;
    try {
      const tokenResp = await authApi.confirmMagicLink({ token });
      setAccessToken(tokenResp.access_token);
      setStoredRefreshToken(tokenResp.refresh_token);

      const me = await authApi.getMe();
      user.value = me;
      status.value = 'authenticated';
    } catch (err: unknown) {
      status.value = 'anonymous';
      const msg = err instanceof Error ? err.message : 'Невірне або застаріле посилання';
      error.value = msg;
      throw err;
    }
  }

  async function logout(): Promise<void> {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken && !DEV_BYPASS) {
      try {
        await authApi.logout(refreshToken);
      } catch (err) {
        console.warn('Logout request failed:', err);
      }
    }

    user.value = null;
    status.value = 'anonymous';
    setAccessToken(null);
    setStoredRefreshToken(null);
  }

  return {
    user,
    status,
    error,
    isDevBypass: DEV_BYPASS,
    initAuth,
    loginPasskey,
    requestMagicLink,
    confirmMagicLink,
    logout,
  };
});
