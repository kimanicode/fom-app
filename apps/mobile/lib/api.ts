import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useAuthStore } from '../store/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';
const isDev = __DEV__;

type ApiErrorKind = 'auth_not_loaded' | 'blocked' | 'unauthorized' | 'network' | 'client' | 'server' | 'unknown';

export interface ApiError {
  kind: ApiErrorKind;
  message: string;
  path: string;
  status?: number;
  details?: unknown;
  retriable: boolean;
}

export class ApiRequestError extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiRequestError';
    this.apiError = apiError;
  }
}

let isHandlingUnauthorized = false;
let authLoadPromise: Promise<void> | null = null;

export function resetApiUnauthorizedState() {
  isHandlingUnauthorized = false;
}

function logApiError(error: ApiError) {
  if (!isDev) return;
  // Structured debug logging for API failures during development.
  console.warn('[api]', error.kind, error.status ?? '-', error.path, error.message, error.details ?? null);
}

function buildError(
  kind: ApiErrorKind,
  path: string,
  message: string,
  options: { status?: number; details?: unknown; retriable?: boolean } = {}
): ApiError {
  const error: ApiError = {
    kind,
    path,
    message,
    status: options.status,
    details: options.details,
    retriable: options.retriable ?? (kind === 'network'),
  };
  logApiError(error);
  return error;
}

async function ensureAuthLoaded(path: string): Promise<void> {
  const state = useAuthStore.getState();
  if (!state.loading) return;
  if (!authLoadPromise) {
    authLoadPromise = state.loadToken().finally(() => {
      authLoadPromise = null;
    });
  }
  await authLoadPromise;
  if (useAuthStore.getState().loading) {
    throw new ApiRequestError(
      buildError('auth_not_loaded', path, 'Authentication state is still loading. Please retry.')
    );
  }
}

async function parseErrorResponse(res: Response): Promise<unknown> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

function toErrorMessage(details: unknown, fallback: string): string {
  const fromArray = (value: unknown): string | null => {
    if (!Array.isArray(value)) return null;
    const parts = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    if (!parts.length) return null;
    return parts.join('\n');
  };

  if (!details) return fallback;
  const directArray = fromArray(details);
  if (directArray) return directArray;
  if (typeof details === 'string' && details.trim()) return details;
  if (typeof details === 'object' && details !== null) {
    const maybeMessage = (details as { message?: unknown }).message;
    const arrayMessage = fromArray(maybeMessage);
    if (arrayMessage) return arrayMessage;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage;
    const maybeError = (details as { error?: unknown }).error;
    if (typeof maybeError === 'string' && maybeError.trim()) return maybeError;
  }
  return fallback;
}

async function handleUnauthorized(path: string, details?: unknown, hadToken = false): Promise<never> {
  if (hadToken && !isHandlingUnauthorized) {
    isHandlingUnauthorized = true;
    void (async () => {
      try {
        await useAuthStore.getState().signOut();
        router.replace('/onboarding');
      } catch (err) {
        if (isDev) console.warn('[api] failed to complete unauthorized sign-out flow', err);
      }
    })();
  }

  throw new ApiRequestError(
    buildError('unauthorized', path, toErrorMessage(details, 'Session expired. Please sign in again.'), {
      status: 401,
      details,
      retriable: false,
    })
  );
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    await ensureAuthLoaded(path);

    const token = useAuthStore.getState().token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const details = await parseErrorResponse(res);
      if (res.status === 401) {
        return await handleUnauthorized(path, details, Boolean(token));
      }
      if (res.status >= 500) {
        throw new ApiRequestError(
          buildError('server', path, toErrorMessage(details, 'Server error. Please try again.'), {
            status: res.status,
            details,
          })
        );
      }
      throw new ApiRequestError(
        buildError('client', path, toErrorMessage(details, 'Request failed.'), {
          status: res.status,
          details,
          retriable: false,
        })
      );
    }

    if (res.status === 204) return undefined as T;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    const text = await res.text();
    return text as T;
  } catch (error: unknown) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiRequestError(
        buildError('network', path, 'Network error. Check your connection and try again.', {
          details: error.message,
        })
      );
    }

    throw new ApiRequestError(
      buildError('unknown', path, 'Unexpected error while processing request.', {
        details: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

export const api = {
  signup: (email: string, password: string, username: string) =>
    apiFetch<{ accessToken: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),
  googleAuth: (idToken: string) =>
    apiFetch<{ accessToken: string; isNewUser: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),
  login: (email: string, password: string) => apiFetch<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  forgotPassword: (email: string) =>
    apiFetch('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: () => apiFetch('/users/me'),
  updateProfile: (payload: any) => apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  listInterests: () => apiFetch('/interests'),
  getTaxonomy: () => apiFetch('/taxonomy'),
  listQuests: (lat?: number, lng?: number) => {
    const qs = new URLSearchParams();
    if (lat != null) qs.set('lat', String(lat));
    if (lng != null) qs.set('lng', String(lng));
    return apiFetch(`/quests?${qs.toString()}`);
  },
  getQuest: (id: string) => apiFetch(`/quests/${id}`),
  getRecommendations: (lat?: number, lng?: number, take?: number) => {
    const qs = new URLSearchParams();
    if (lat != null) qs.set('lat', String(lat));
    if (lng != null) qs.set('lng', String(lng));
    if (take != null) qs.set('take', String(take));
    return apiFetch(`/recommendations/events?${qs.toString()}`);
  },
  createQuest: (payload: any) => apiFetch('/quests', { method: 'POST', body: JSON.stringify(payload) }),
  joinQuest: (id: string, payload?: { paymentMethod?: string }) =>
    apiFetch(`/quests/${id}/join`, { method: 'POST', body: JSON.stringify(payload || {}) }),
  saveQuest: (id: string) => apiFetch(`/quests/${id}/save`, { method: 'POST' }),
  trackQuestSignal: (id: string, payload: { signalType: string; strength?: number; context?: Record<string, unknown> }) =>
    apiFetch(`/recommendations/events/${id}/signals`, { method: 'POST', body: JSON.stringify(payload) }),
  getSavedQuests: () => apiFetch('/users/me/saves'),
  getJoinedQuests: () => apiFetch('/users/me/joined'),
  getCreatedQuests: () => apiFetch('/users/me/created'),
  getCreatorWallet: () => apiFetch('/users/me/wallet'),
  requestWithdrawal: (amountCents: number, destination: string) =>
    apiFetch('/users/me/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ amountCents, destination }),
    }),
  notifications: () => apiFetch('/notifications'),
  markNotificationsRead: () => apiFetch('/notifications/read', { method: 'POST' }),
  notificationsUnread: () => apiFetch('/notifications?unread=1'),
  getChat: (instanceId: string) => apiFetch(`/quest-instances/${instanceId}/chat`),
  sendChat: (instanceId: string, text: string) =>
    apiFetch(`/quest-instances/${instanceId}/chat`, { method: 'POST', body: JSON.stringify({ text }) }),
  checkin: (id: string, lat: number, lng: number) => apiFetch(`/quest-instances/${id}/checkin`, { method: 'POST', body: JSON.stringify({ lat, lng }) }),
  complete: (id: string) => apiFetch(`/quest-instances/${id}/complete`, { method: 'POST', body: JSON.stringify({}) }),
  createPost: (id: string, payload: any) => apiFetch(`/quest-instances/${id}/posts`, { method: 'POST', body: JSON.stringify(payload) }),
  feed: (lat?: number, lng?: number) => {
    const qs = new URLSearchParams();
    if (lat != null) qs.set('lat', String(lat));
    if (lng != null) qs.set('lng', String(lng));
    return apiFetch(`/feed?${qs.toString()}`);
  },
  stories: () => apiFetch('/feed/stories'),
  getLocation: (id: string) => apiFetch(`/locations/${id}`),
  report: (payload: any) => apiFetch('/reports', { method: 'POST', body: JSON.stringify(payload) }),
  block: (blockedId: string) => apiFetch('/blocks', { method: 'POST', body: JSON.stringify({ blockedId }) }),
};
