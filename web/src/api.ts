export const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export type ApiUser = { id: number; username: string; email: string; role: string; isActive?: boolean };
export type ApiContent = {
  versionId: number;
  poiId: number;
  languageCode: string;
  versionNumber: number;
  title: string;
  narrationText: string;
  status: string;
  audio?: { filePath: string; fileFormat: string; isValid: boolean; isOutdated: boolean };
};
export type ApiVoice = { id: number; languageCode: string; providerVoiceKey: string; isAvailable: boolean };
export type ApiLanguage = { code: string; name: string; isActive: boolean; isFallback: boolean; defaultVoiceId?: number };
export type ApiLocation = { id: number; isActive: boolean; translations: { languageCode: string; name: string; shortDescription?: string }[] };
export type ApiPoi = ApiLocation & { locationId: number };
export type ApiQr = { id: number; poiId: number; targetUrl: string; imagePath?: string; createdAt: string };
export type ApiReviewEvent = { eventType: string; reason?: string; actedAt: string; actorUserId: number };
export type ApiAnalytics = { pageViews: number; qrOpens: number; audioStarts: number; listeningMs: number; activePois: number; windowDays: number };
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
  transition: (token: string, versionId: number, action: 'submit' | 'withdraw' | 'approve' | 'publish' | 'unpublish' | 'republish', reason?: string) => request<ApiContent>(`/content/${versionId}/${action}`, { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) }, token),
  reject: (token: string, versionId: number, reason: string) => request<ApiContent>(`/content/${versionId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  visitorContent: (poiId: number, languageCode: string) => request<ApiContent>(`/visitor/pois/${poiId}/content?languageCode=${encodeURIComponent(languageCode)}`),
  visitorLocations: () => request<ApiLocation[]>('/locations'),
  visitorPois: (locationId?: number) => request<ApiPoi[]>(`/pois${locationId ? `?locationId=${locationId}` : ''}`),
  languages: (token: string) => request<ApiLanguage[]>('/languages', {}, token),
  locations: (token: string) => request<ApiLocation[]>('/locations', {}, token),
  pois: (token: string) => request<ApiPoi[]>('/pois', {}, token),
  createLanguage: (token: string, code: string, name: string) => request<ApiLanguage>('/languages', { method: 'POST', body: JSON.stringify({ code, name }) }, token),
  createLocation: (token: string, translations: TranslationInput[]) => request<ApiLocation>('/locations', { method: 'POST', body: JSON.stringify({ translations }) }, token),
  createPoi: (token: string, locationId: number, translations: TranslationInput[]) => request<ApiPoi>(`/locations/${locationId}/pois`, { method: 'POST', body: JSON.stringify({ translations }) }, token),
  createVoice: (token: string, languageCode: string, providerVoiceKey: string) => request<ApiVoice>('/voices', { method: 'POST', body: JSON.stringify({ languageCode, providerVoiceKey }) }, token),
  setDefaultVoice: (token: string, code: string, voiceId: number) => request<ApiLanguage>(`/languages/${encodeURIComponent(code)}/default-voice`, { method: 'PATCH', body: JSON.stringify({ voiceId }) }, token),
  createContent: (token: string, poiId: number, languageCode: string, title: string, narrationText: string) => request<ApiContent>('/content', { method: 'POST', body: JSON.stringify({ poiId, languageCode, title, narrationText }) }, token),
  updateContent: (token: string, versionId: number, title: string, narrationText: string) => request<ApiContent>(`/content/${versionId}`, { method: 'PATCH', body: JSON.stringify({ title, narrationText }) }, token),
  translateContent: (token: string, versionId: number, targetLanguageCode: string) => request<ApiContent>(`/content/${versionId}/translate`, { method: 'POST', body: JSON.stringify({ targetLanguageCode }) }, token),
  users: (token: string) => request<ApiUser[]>('/users', {}, token),
  createUser: (token: string, username: string, email: string, password: string, roleName: string) => request<ApiUser>('/users', { method: 'POST', body: JSON.stringify({ username, email, password, roleName }) }, token),
  setUserActive: (token: string, id: number, isActive: boolean) => request<ApiUser>(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token),
  assignUserLocation: (token: string, userId: number, locationId: number) => request<void>(`/users/${userId}/locations/${locationId}`, { method: 'POST', body: JSON.stringify({}) }, token),
  userLocations: (token: string, userId: number) => request<number[]>(`/users/${userId}/locations`, {}, token),
  setLocationActive: (token: string, id: number, isActive: boolean) => request<ApiLocation>(`/locations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token),
  setPoiActive: (token: string, id: number, isActive: boolean) => request<ApiPoi>(`/pois/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token),
  recordEvent: (event: { eventId: string; eventType: string; poiId?: number; languageCode?: string; anonymousSessionKey?: string }) => request<{ accepted: boolean }>('/visitor/events', { method: 'POST', body: JSON.stringify(event) }),
  analyticsSummary: (token: string) => request<ApiAnalytics>('/visitor/analytics/summary', {}, token),
};
