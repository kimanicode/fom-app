import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:4000';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const api = {
  signup: (email: string, password: string, username: string) =>
    apiFetch<{ accessToken: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),
  login: (email: string, password: string) => apiFetch<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  getMe: () => apiFetch('/users/me'),
  updateProfile: (payload: any) => apiFetch('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),
  listInterests: () => apiFetch('/interests'),
  listQuests: (lat?: number, lng?: number) => {
    const qs = new URLSearchParams();
    if (lat != null) qs.set('lat', String(lat));
    if (lng != null) qs.set('lng', String(lng));
    return apiFetch(`/quests?${qs.toString()}`);
  },
  getQuest: (id: string) => apiFetch(`/quests/${id}`),
  createQuest: (payload: any) => apiFetch('/quests', { method: 'POST', body: JSON.stringify(payload) }),
  joinQuest: (id: string) => apiFetch(`/quests/${id}/join`, { method: 'POST' }),
  saveQuest: (id: string) => apiFetch(`/quests/${id}/save`, { method: 'POST' }),
  getSavedQuests: () => apiFetch('/users/me/saves'),
  redoQuest: (id: string, startTime: string) => apiFetch(`/quests/${id}/redo`, { method: 'POST', body: JSON.stringify({ startTime }) }),
  notifications: () => apiFetch('/notifications'),
  markNotificationsRead: () => apiFetch('/notifications/read', { method: 'POST' }),
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
