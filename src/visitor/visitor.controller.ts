import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ActivityEventDto, PublishedContentQueryDto, VisitorPresenceDto } from './visitor.dto';
import { VisitorService } from './visitor.service';

@Controller('visitor')
export class VisitorController {
  private readonly service: VisitorService;
  constructor(service: VisitorService) { this.service = service; }

  @Get('pois/:poiId/content')
  getPoiContent(@Param('poiId', ParseIntPipe) poiId: number, @Query() query: PublishedContentQueryDto) {
    return this.service.getPoiContent(poiId, query.languageCode);
  }

  @Get('pois/:poiId/languages')
  getPoiLanguages(@Param('poiId', ParseIntPipe) poiId: number) {
    return this.service.getPoiLanguages(poiId);
  }

  @Get('qr/:qrId')
  resolveQr(@Param('qrId', ParseIntPipe) qrId: number) { return this.service.resolveQr(qrId); }

  @Post('events')
  recordEvent(@Body() dto: ActivityEventDto) { return this.service.recordEvent(dto); }

  @Post('presence')
  recordPresence(@Body() dto: VisitorPresenceDto) { return this.service.recordPresence(dto); }

  @Get('analytics/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  analyticsSummary() { return this.service.analyticsSummary(); }
}
