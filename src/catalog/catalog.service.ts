import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLanguageDto, CreateLocationDto, CreatePoiDto, CreateQrDto, CreateVoiceDto, UpdateActiveDto } from './catalog.dto';
import { CatalogRepository } from './catalog.repository';

@Injectable()
export class CatalogService {
  private readonly repository: CatalogRepository;

  constructor(repository: CatalogRepository) {
    this.repository = repository;
  }

  async listLanguages() {
    return this.repository.listLanguages();
  }

  async createLanguage(dto: CreateLanguageDto) {
    try {
      return this.repository.addLanguage(dto.code, dto.name, dto.isActive ?? true);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to create language');
    }
  }

  async listLocations() {
    return this.repository.listLocations();
  }

  async getLocation(id: number) {
    const location = await this.repository.getLocation(id);
    if (!location) {
      throw new NotFoundException(`Location '${id}' was not found`);
    }
    return location;
  }

  async createLocation(dto: CreateLocationDto) {
    try {
      return this.repository.addLocation(dto.translations);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to create location');
    }
  }

  async listPois(locationId?: number) {
    if (locationId !== undefined && !await this.repository.getLocation(locationId)) {
      throw new NotFoundException(`Location '${locationId}' was not found`);
    }
    return this.repository.listPois(locationId);
  }

  async getPoi(id: number) {
    const poi = await this.repository.getPoi(id);
    if (!poi) {
      throw new NotFoundException(`POI '${id}' was not found`);
    }
    return poi;
  }

  async createPoi(locationId: number, dto: CreatePoiDto) {
    try {
      return this.repository.addPoi(locationId, dto.translations, dto.isActive ?? true);
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to create POI');
    }
  }

  async setLocationActive(id: number, dto: UpdateActiveDto) {
      const location = await this.repository.setLocationActive(id, dto.isActive);
      if (!location) throw new NotFoundException(`Location '${id}' was not found`);
      return location;
    }

  async setPoiActive(id: number, dto: UpdateActiveDto) {
      const poi = await this.repository.setPoiActive(id, dto.isActive);
      if (!poi) throw new NotFoundException(`POI '${id}' was not found`);
      return poi;
    }

  listVoices() { return this.repository.listVoices(); }

  async createVoice(dto: CreateVoiceDto) {
      try { return await this.repository.addVoice(dto.languageCode, dto.providerVoiceKey, dto.isAvailable ?? true); }
      catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Unable to create voice'); }
    }

  async setDefaultVoice(languageCode: string, voiceId: number) {
    try { return await this.repository.setDefaultVoice(languageCode, voiceId); }
    catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Unable to set default voice'); }
  }

  async listQrCodes() { return this.repository.listQrCodes(); }

  async upsertQr(poiId: number, dto: CreateQrDto) {
    const poi = await this.repository.getPoi(poiId);
    if (!poi) throw new NotFoundException(`POI '${poiId}' was not found`);
    try {
      const visitorUrl = new URL(process.env.PUBLIC_VISITOR_URL ?? 'http://localhost:5173/visitor');
      visitorUrl.searchParams.set('poiId', String(poiId));
      visitorUrl.searchParams.set('language', process.env.DEFAULT_VISITOR_LANGUAGE ?? 'vi');
      return await this.repository.upsertQr(poiId, visitorUrl.toString(), dto.imagePath);
    } catch (error) {
      if (error instanceof TypeError) throw new BadRequestException('PUBLIC_VISITOR_URL is invalid');
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to save QR code');
    }
  }
}
