export type Language = {
  code: string;
  name: string;
  isActive: boolean;
  isFallback: boolean;
  defaultVoiceId?: number;
};

export type Translation = {
  languageCode: string;
  name: string;
  shortDescription?: string;
};

export type Location = {
  id: number;
  isActive: boolean;
  translations: Translation[];
};

export type Poi = {
  id: number;
  locationId: number;
  isActive: boolean;
  translations: Translation[];
};

export type Voice = { id: number; languageCode: string; providerVoiceKey: string; isAvailable: boolean };
export type QrCode = { id: number; poiId: number; targetUrl: string; imagePath?: string; createdAt: string };
