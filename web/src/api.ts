export const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export type ApiUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  failedLoginCount?: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  assignedLocations?: { locationId: number; name: string }[];
};
export type ApiContent = {
  versionId: number;
  poiId: number;
  languageCode: string;
  versionNumber: number;
  title: string;
  narrationText: string;
  status: string;
  needsReview?: boolean;
  audio?: { filePath: string; fileFormat: string; isValid: boolean; isOutdated: boolean };
};
export type ApiVoice = { id: number; languageCode: string; providerVoiceKey: string; isAvailable: boolean };
export type ApiLanguage = { code: string; name: string; isActive: boolean; isFallback: boolean; defaultVoiceId?: number };
export type ApiLocation = {
  id: number;
  isActive: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  translations: { languageCode: string; name: string; shortDescription?: string }[];
};
export type ApiPoi = ApiLocation & { locationId: number };
export type ApiQr = { id: number; poiId: number; targetUrl: string; imagePath?: string; createdAt: string };
export type ApiReviewEvent = { eventType: string; reason?: string; actedAt: string; actorUserId: number };
export type ApiAnalytics = { pageViews: number; qrOpens: number; audioStarts: number; listeningMs: number; activePois: number; activeVisitors: number; windowDays: number };
type TranslationInput = { languageCode: string; name: string; shortDescription?: string };

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok) throw new ApiError(response.status, body?.message ?? 'API request failed');
  return body as T;
}

export const api = {
  login: (username: string, password: string) => request<{ accessToken: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<{ changed: true; message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }, token),
  forgotPassword: (email: string) =>
    request<{ success: true; message: string; resetToken?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ reset: true; message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  content: (token: string) => request<ApiContent[]>('/content', {}, token),
  contentHistory: (token: string, versionId: number) => request<ApiReviewEvent[]>(`/content/${versionId}/history`, {}, token),
  voices: (token: string) => request<ApiVoice[]>('/voices', {}, token),
  qrCodes: () => request<ApiQr[]>('/qr'),
  saveQr: (token: string, poiId: number, imagePath?: string) => request<ApiQr>(`/pois/${poiId}/qr`, { method: 'POST', body: JSON.stringify({ imagePath }) }, token),
  elevenLabsAudio: (token: string, versionId: number, voiceId: number, modelId?: string) => request<ApiContent>(`/content/${versionId}/audio/tts`, { method: 'POST', body: JSON.stringify({ voiceId, modelId }) }, token),
  uploadAudio: async (token: string, versionId: number, file: File) => {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch(`${API_URL}/content/${versionId}/audio/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
    const result = await response.json().catch(() => undefined);
    if (!response.ok) throw new ApiError(response.status, result?.message ?? 'Audio upload failed');
    return result as ApiContent;
  },
  confirmReviewed: (token: string, versionId: number) => request<ApiContent>(`/content/${versionId}/confirm-reviewed`, { method: 'POST', body: JSON.stringify({}) }, token),
  transition: (token: string, versionId: number, action: 'submit' | 'withdraw' | 'approve' | 'publish' | 'unpublish' | 'republish', reason?: string) => request<ApiContent>(`/content/${versionId}/${action}`, { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) }, token),
  reject: (token: string, versionId: number, reason: string) => request<ApiContent>(`/content/${versionId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  visitorContent: (poiId: number, languageCode: string) => request<ApiContent>(`/visitor/pois/${poiId}/content?languageCode=${encodeURIComponent(languageCode)}`),
  visitorPoiLanguages: (poiId: number) => request<{ code: string; name: string; isFallback: boolean; hasVoice: boolean }[]>(`/visitor/pois/${poiId}/languages`),
  visitorLocations: () => request<ApiLocation[]>('/locations'),
  visitorPois: (locationId?: number) => request<ApiPoi[]>(`/pois${locationId ? `?locationId=${locationId}` : ''}`),
  languages: (token: string) => request<ApiLanguage[]>('/languages', {}, token),
  locations: (token: string) => request<ApiLocation[]>('/locations', {}, token),
  pois: (token: string) => request<ApiPoi[]>('/pois', {}, token),
  createLanguage: (token: string, code: string, name: string) => request<ApiLanguage>('/languages', { method: 'POST', body: JSON.stringify({ code, name }) }, token),
  updateLanguage: (token: string, code: string, name: string) => request<ApiLanguage>(`/languages/${encodeURIComponent(code)}`, { method: 'PATCH', body: JSON.stringify({ name }) }, token),
  deleteLanguage: (token: string, code: string) => request<{ deleted: boolean }>(`/languages/${encodeURIComponent(code)}`, { method: 'DELETE' }, token),
  setLanguageActive: (token: string, code: string, isActive: boolean) => request<ApiLanguage>(`/languages/${encodeURIComponent(code)}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token),
  createLocation: (token: string, translations: TranslationInput[], address?: string, latitude?: number, longitude?: number) =>
    request<ApiLocation>('/locations', { method: 'POST', body: JSON.stringify({ translations, address, latitude, longitude }) }, token),
  updateLocation: (token: string, id: number, data: { translations?: TranslationInput[]; address?: string; latitude?: number | null; longitude?: number | null; isActive?: boolean }) =>
    request<ApiLocation>(`/locations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  geocodeAddress: (token: string, address: string) =>
    request<{ found: boolean; address: string; latitude?: number; longitude?: number; displayName?: string; message?: string }>(`/locations/geocode?address=${encodeURIComponent(address)}`, {}, token),
  createPoi: (token: string, locationId: number, translations: TranslationInput[]) => request<ApiPoi>(`/locations/${locationId}/pois`, { method: 'POST', body: JSON.stringify({ translations }) }, token),
  createVoice: (token: string, languageCode: string, providerVoiceKey: string) => request<ApiVoice>('/voices', { method: 'POST', body: JSON.stringify({ languageCode, providerVoiceKey }) }, token),
  deleteVoice: (token: string, id: number) => request<{ deleted: boolean }>(`/voices/${id}`, { method: 'DELETE' }, token),
  setDefaultVoice: (token: string, code: string, voiceId: number) => request<ApiLanguage>(`/languages/${encodeURIComponent(code)}/default-voice`, { method: 'PATCH', body: JSON.stringify({ voiceId }) }, token),
  createContent: (token: string, poiId: number, languageCode: string, title: string, narrationText: string) => request<ApiContent>('/content', { method: 'POST', body: JSON.stringify({ poiId, languageCode, title, narrationText }) }, token),
  updateContent: (token: string, versionId: number, title: string, narrationText: string) => request<ApiContent>(`/content/${versionId}`, { method: 'PATCH', body: JSON.stringify({ title, narrationText }) }, token),
  deleteContent: (token: string, versionId: number) => request<{ deleted: boolean }>(`/content/${versionId}`, { method: 'DELETE' }, token),
  translateContent: (token: string, versionId: number, targetLanguageCode: string) => request<ApiContent>(`/content/${versionId}/translate`, { method: 'POST', body: JSON.stringify({ targetLanguageCode }) }, token),
  users: (token: string) => request<ApiUser[]>('/users', {}, token),
  createUser: (token: string, username: string, email: string, password: string, roleName: string, locationIds?: number[]) =>
    request<ApiUser>('/users', { method: 'POST', body: JSON.stringify({ username, email, password, roleName, locationIds }) }, token),
  updateUser: (token: string, id: number, data: { email?: string; roleName?: string }) =>
    request<ApiUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  setUserActive: (token: string, id: number, isActive: boolean) => request<ApiUser>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token),
  unlockUser: (token: string, id: number) => request<ApiUser>(`/users/${id}/unlock`, { method: 'POST', body: JSON.stringify({}) }, token),
  adminResetPassword: (token: string, id: number, newPassword: string) =>
    request<{ success: true; message: string }>(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) }, token),
  assignUserLocation: (token: string, userId: number, locationId: number) => request<void>(`/users/${userId}/locations/${locationId}`, { method: 'POST', body: JSON.stringify({}) }, token),
  unassignUserLocation: (token: string, userId: number, locationId: number) =>
    request<{ success: true; warning?: string; pendingCount?: number }>(`/users/${userId}/locations/${locationId}`, { method: 'DELETE' }, token),
  deleteUser: (token: string, id: number) => request<{ deleted: boolean }>(`/users/${id}`, { method: 'DELETE' }, token),
  userLocations: (token: string, userId: number) => request<number[]>(`/users/${userId}/locations`, {}, token),
  setLocationActive: (token: string, id: number, isActive: boolean) => request<ApiLocation>(`/locations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token),
  deleteLocation: (token: string, id: number) => request<{ deleted: boolean }>(`/locations/${id}`, { method: 'DELETE' }, token),
  setPoiActive: (token: string, id: number, isActive: boolean) => request<ApiPoi>(`/pois/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token),
  deletePoi: (token: string, id: number) => request<{ deleted: boolean }>(`/pois/${id}`, { method: 'DELETE' }, token),
  recordEvent: (event: { eventId: string; eventType: string; poiId?: number; languageCode?: string; anonymousSessionKey?: string }) => request<{ accepted: boolean }>('/visitor/events', { method: 'POST', body: JSON.stringify(event) }),
  recordPresence: (presence: { anonymousSessionKey: string }) => request<{ accepted: boolean }>('/visitor/presence', { method: 'POST', body: JSON.stringify(presence) }),
  analyticsSummary: (token: string) => request<ApiAnalytics>('/visitor/analytics/summary', {}, token),
};
