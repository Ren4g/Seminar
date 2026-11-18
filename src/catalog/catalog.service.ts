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

  async setLanguageActive(code: string, dto: UpdateActiveDto) {
    const language = await this.repository.getLanguage(code);
    if (!language) {
      throw new NotFoundException(`Language '${code}' was not found`);
    }
    if (!dto.isActive && (language.isFallback || language.code.toLowerCase() === 'en')) {
      throw new BadRequestException('Không được phép tắt ngôn ngữ mặc định (tiếng Anh / Fallback).');
    }
    return this.repository.setLanguageActive(code, dto.isActive);
  }

  async updateLanguage(code: string, dto: { name?: string }) {
    const language = await this.repository.getLanguage(code);
    if (!language) {
      throw new NotFoundException(`Language '${code}' was not found`);
    }
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Tên ngôn ngữ không được để trống');
    }
    return this.repository.updateLanguage(code, dto.name.trim());
  }

  async deleteLanguage(code: string): Promise<{ deleted: boolean }> {
    const language = await this.repository.getLanguage(code);
    if (!language) {
      throw new NotFoundException(`Language '${code}' was not found`);
    }
    if (language.isFallback || code.toLowerCase() === 'en') {
      throw new BadRequestException('Không thể xóa ngôn ngữ mặc định (tiếng Anh / Fallback).');
    }
    const deps = await this.repository.countLanguageDependencies(code);
    if (deps.narrationCount > 0 || deps.locationCount > 0 || deps.poiCount > 0) {
      throw new BadRequestException('Ngôn ngữ này đang có bài viết hoặc bản dịch liên kết, không thể xóa. Đề xuất chuyển sang trạng thái Tạm tắt.');
    }
    await this.repository.deleteLanguage(code);
    return { deleted: true };
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

  async deleteLocation(id: number): Promise<{ deleted: boolean }> {
    const location = await this.repository.getLocation(id);
    if (!location) throw new NotFoundException(`Location '${id}' was not found`);
    const poiCount = await this.repository.countPoisByLocation(id);
    if (poiCount > 0) {
      throw new BadRequestException('Địa điểm đang chứa điểm tham quan (POI), không thể xóa. Đề xuất chuyển sang trạng thái ngừng hoạt động.');
    }
    await this.repository.deleteLocation(id);
    return { deleted: true };
  }

  async deletePoi(id: number): Promise<{ deleted: boolean }> {
    const poi = await this.repository.getPoi(id);
    if (!poi) throw new NotFoundException(`POI '${id}' was not found`);
    const hasPublished = await this.repository.hasPublishedContentByPoi(id);
    if (hasPublished) {
      throw new BadRequestException('Điểm tham quan (POI) đang có nội dung đã xuất bản, không thể xóa. Vui lòng gỡ xuất bản nội dung trước.');
    }
    await this.repository.deletePoi(id);
    return { deleted: true };
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

  async deleteVoice(voiceId: number): Promise<{ deleted: boolean }> {
    try {
      await this.repository.deleteVoice(voiceId);
      return { deleted: true };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to delete voice');
    }
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
      const publicVisitorBase = process.env.PUBLIC_VISITOR_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/visitor` : undefined);
      if (!publicVisitorBase) throw new BadRequestException('PUBLIC_VISITOR_URL must be configured outside Vercel');
      const visitorUrl = new URL(publicVisitorBase);
      visitorUrl.searchParams.set('poiId', String(poiId));
      visitorUrl.searchParams.set('language', process.env.DEFAULT_VISITOR_LANGUAGE ?? 'en');
      visitorUrl.searchParams.set('source', 'qr');
      return await this.repository.upsertQr(poiId, visitorUrl.toString(), dto.imagePath);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof TypeError) throw new BadRequestException('PUBLIC_VISITOR_URL is invalid');
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to save QR code');
    }
  }
}
