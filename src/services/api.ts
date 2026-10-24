import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import type {
  User,
  TokenResponse,
  MagicLinkRequest,
  MagicLinkConfirm,
  RefreshRequest,
  LogoutRequest,
} from '../types/auth';
import type {
  ProductRead,
  ProductCreate,
  ProductUpdate,
  DishRead,
  DishCreate,
  DishUpdate,
  DishKind,
  MenuRead,
  MenuUpdate,
  MenuItemRead,
  MenuItemCreate,
  MenuItemUpdate,
  GenerationRequest,
  GenerationResultRead,
  NutritionProfileRead,
  NutritionProfileUpsert,
  OffPlanEntryRead,
  OffPlanEntryCreate,
  MenuNoteRead,
  MenuNoteCreate,
  DayMenuRead,
} from '../types/nutrition';

declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function resolveBaseUrl(): string {
  // When running locally in Vite development server on localhost, use the /api proxy to prevent CORS issues
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '/api';
  }
  const windowUrl = window.__APP_CONFIG__?.apiUrl;
  const envUrl = import.meta.env.VITE_API_URL;
  const raw = windowUrl || envUrl || 'https://api2-bptracker-dev.home.vn.ua';
  return raw.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveBaseUrl();

// Token storage keys
const REFRESH_TOKEN_KEY = 'nutrition_refresh_token';

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb;
}

async function refreshAccessToken(): Promise<string | null> {
  const currentRefreshToken = getStoredRefreshToken();
  if (!currentRefreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: currentRefreshToken } as RefreshRequest),
    });

    if (!res.ok) {
      setAccessToken(null);
      setStoredRefreshToken(null);
      return null;
    }

    const data: TokenResponse = await res.json();
    setAccessToken(data.access_token);
    setStoredRefreshToken(data.refresh_token);
    return data.access_token;
  } catch (err) {
    console.error('Failed to refresh token:', err);
    setAccessToken(null);
    setStoredRefreshToken(null);
    return null;
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized with single in-flight refresh promise
  if (response.status === 401 && !isRetry && !path.includes('/auth/')) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      return request<T>(path, options, true);
    } else {
      const isDevBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
      if (onUnauthorizedCallback && !isDevBypass) {
        onUnauthorizedCallback();
      }
      throw new ApiError('Сесія завершилась. Будь ласка, увійдіть знову.', 401);
    }
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  if (!response.ok) {
    let errorDetail = `Помилка ${response.status}`;
    let errorData: unknown = null;
    try {
      errorData = await response.json();
      if (typeof errorData === 'object' && errorData !== null && 'detail' in errorData) {
        const detail = (errorData as { detail: unknown }).detail;
        if (typeof detail === 'string') {
          errorDetail = detail;
        } else if (Array.isArray(detail)) {
          errorDetail = detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
        }
      }
    } catch {
      // response not JSON
    }
    throw new ApiError(errorDetail, response.status, errorData);
  }

  return response.json() as Promise<T>;
}

// Auth API
export const authApi = {
  getPasskeyOptions: async () => {
    return request<PublicKeyCredentialRequestOptionsJSON>('/auth/webauthn/authenticate/options', {
      method: 'POST',
    });
  },

  verifyPasskey: async (body: unknown) => {
    return request<TokenResponse>('/auth/webauthn/authenticate/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  requestMagicLink: async (data: MagicLinkRequest) => {
    return request<{ detail: string }>('/auth/magic-link/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  confirmMagicLink: async (data: MagicLinkConfirm) => {
    return request<TokenResponse>('/auth/magic-link/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async (refreshToken: string) => {
    return request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken } as LogoutRequest),
    });
  },

  getMe: async () => {
    return request<User>('/users/me');
  },
};

function isExpectedEmptyStatus(err: unknown): boolean {
  if (err instanceof ApiError) {
    if (err.status === 404) return true;
    if (err.status === 401 && import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
      return true;
    }
  }
  return false;
}

import { mockNutritionApi } from './mockData';

const DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

// Real Nutrition API (calls backend)
const realNutritionApi = {
  // Profile
  getProfile: async (): Promise<NutritionProfileRead | null> => {
    try {
      return await request<NutritionProfileRead>('/nutrition/profile');
    } catch (err) {
      if (isExpectedEmptyStatus(err)) {
        return null;
      }
      throw err;
    }
  },

  upsertProfile: async (data: NutritionProfileUpsert): Promise<NutritionProfileRead> => {
    return request<NutritionProfileRead>('/nutrition/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Products
  getProducts: async (): Promise<ProductRead[]> => {
    try {
      return await request<ProductRead[]>('/nutrition/products');
    } catch (err) {
      if (isExpectedEmptyStatus(err)) {
        return [];
      }
      throw err;
    }
  },

  createProduct: async (data: ProductCreate): Promise<ProductRead> => {
    return request<ProductRead>('/nutrition/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct: async (productId: string, data: ProductUpdate): Promise<ProductRead> => {
    return request<ProductRead>(`/nutrition/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteProduct: async (productId: string): Promise<void> => {
    return request<void>(`/nutrition/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // Dishes
  getDishes: async (kind?: DishKind, available?: boolean): Promise<DishRead[]> => {
    try {
      const params = new URLSearchParams();
      if (kind) params.set('kind', kind);
      if (available !== undefined) params.set('available', String(available));
      const qs = params.toString() ? `?${params.toString()}` : '';
      return await request<DishRead[]>(`/nutrition/dishes${qs}`);
    } catch (err) {
      if (isExpectedEmptyStatus(err)) {
        return [];
      }
      throw err;
    }
  },

  getDish: async (dishId: string): Promise<DishRead> => {
    return request<DishRead>(`/nutrition/dishes/${dishId}`);
  },

  createDish: async (data: DishCreate): Promise<DishRead> => {
    return request<DishRead>('/nutrition/dishes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateDish: async (dishId: string, data: DishUpdate): Promise<DishRead> => {
    return request<DishRead>(`/nutrition/dishes/${dishId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteDish: async (dishId: string): Promise<void> => {
    return request<void>(`/nutrition/dishes/${dishId}`, {
      method: 'DELETE',
    });
  },

  // Menus
  getDayMenus: async (menuDate: string): Promise<DayMenuRead | null> => {
    try {
      return await request<DayMenuRead>(`/nutrition/menus/${menuDate}`);
    } catch (err) {
      if (isExpectedEmptyStatus(err)) {
        return null;
      }
      throw err;
    }
  },

  updateMenu: async (menuId: string, data: MenuUpdate): Promise<MenuRead> => {
    return request<MenuRead>(`/nutrition/menus/${menuId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  generateMenu: async (menuDate: string, data: GenerationRequest): Promise<GenerationResultRead> => {
    return request<GenerationResultRead>(`/nutrition/menus/${menuDate}/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  addMenuItem: async (menuDate: string, slot: string, data: MenuItemCreate): Promise<MenuItemRead> => {
    const params = new URLSearchParams({ slot });
    return request<MenuItemRead>(`/nutrition/menus/${menuDate}/items?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateMenuItem: async (itemId: string, data: MenuItemUpdate): Promise<MenuItemRead> => {
    return request<MenuItemRead>(`/nutrition/menu-items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteMenuItem: async (itemId: string): Promise<void> => {
    return request<void>(`/nutrition/menu-items/${itemId}`, {
      method: 'DELETE',
    });
  },

  // Off-plan entries (graceful 404 handling)
  getOffPlan: async (menuDate: string): Promise<OffPlanEntryRead[]> => {
    try {
      const params = new URLSearchParams({ date: menuDate });
      return await request<OffPlanEntryRead[]>(`/nutrition/off-plan?${params.toString()}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return [];
      }
      throw err;
    }
  },

  createOffPlan: async (data: OffPlanEntryCreate): Promise<OffPlanEntryRead | null> => {
    try {
      return await request<OffPlanEntryRead>('/nutrition/off-plan', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  deleteOffPlan: async (id: string): Promise<void> => {
    try {
      await request<void>(`/nutrition/off-plan/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return;
      }
      throw err;
    }
  },

  // AI Notes (graceful 404 handling)
  createMenuNote: async (menuDate: string, data: MenuNoteCreate): Promise<MenuNoteRead | null> => {
    try {
      return await request<MenuNoteRead>(`/nutrition/menus/${menuDate}/notes`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },
};

export const nutritionApi = DEV_BYPASS ? mockNutritionApi : realNutritionApi;
