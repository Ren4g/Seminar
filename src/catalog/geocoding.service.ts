import { Injectable, Logger } from '@nestjs/common';

export type GeocodingResult = {
  latitude: number;
  longitude: number;
  displayName?: string;
};

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocode(address: string): Promise<GeocodingResult | null> {
    if (!address || !address.trim()) {
      return null;
    }

    const trimmedAddress = address.trim();
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmedAddress)}&format=json&limit=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MultilingualAudioGuide/1.0 (contact@audio-guide.local)',
          'Accept-Language': 'vi,en;q=0.9',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.warn(`Geocoding HTTP error ${response.status} for address: "${trimmedAddress}"`);
        return null;
      }

      const data = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name?: string;
      }>;

      if (!Array.isArray(data) || data.length === 0) {
        this.logger.log(`No geocoding results found for address: "${trimmedAddress}"`);
        return null;
      }

      const first = data[0];
      const latitude = Number(first.lat);
      const longitude = Number(first.lon);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        this.logger.warn(`Invalid coordinates received for address: "${trimmedAddress}"`);
        return null;
      }

      return {
        latitude: Number(latitude.toFixed(7)),
        longitude: Number(longitude.toFixed(7)),
        displayName: first.display_name,
      };
    } catch (error) {
      this.logger.warn(
        `Geocoding request failed for address: "${trimmedAddress}" - ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
