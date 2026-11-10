import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityEventDto } from './visitor.dto';
import { VisitorRepository } from './visitor.repository';

@Injectable()
export class VisitorService {
  private readonly repository: VisitorRepository;
  constructor(repository: VisitorRepository) { this.repository = repository; }

  async getPoiContent(poiId: number, languageCode?: string) {
    const content = await this.repository.getPublishedPoi(poiId, languageCode);
    if (!content) throw new NotFoundException(`No published content found for POI '${poiId}'`);
    return content;
  }

  async resolveQr(qrId: number) {
    const qr = await this.repository.resolveQr(qrId);
    if (!qr) throw new NotFoundException(`QR code '${qrId}' was not found`);
    if (!qr.poi_active || !qr.location_active) throw new BadRequestException('POI is not available');
    return { qrId: Number(qr.qr_id), poiId: Number(qr.poi_id), locationId: Number(qr.location_id), targetUrl: qr.target_url };
  }

  async recordEvent(dto: ActivityEventDto) {
    if (dto.eventType === 'AUDIO_PLAY_DURATION' && dto.durationMs === undefined) {
      throw new BadRequestException('durationMs is required for AUDIO_PLAY_DURATION');
    }
    if (dto.eventType !== 'AUDIO_PLAY_DURATION' && dto.durationMs !== undefined) {
      throw new BadRequestException('durationMs is only valid for AUDIO_PLAY_DURATION');
    }
    await this.repository.recordEvent(dto);
    return { accepted: true, eventId: dto.eventId };
  }
  analyticsSummary() { return this.repository.analyticsSummary(); }
}
