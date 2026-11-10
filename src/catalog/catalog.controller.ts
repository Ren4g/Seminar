import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateLanguageDto, CreateLocationDto, CreatePoiDto, CreateQrDto, CreateVoiceDto, SetDefaultVoiceDto, UpdateActiveDto } from './catalog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  private readonly service: CatalogService;

  constructor(service: CatalogService) {
    this.service = service;
  }

  @Get('languages')
  listLanguages() {
    return this.service.listLanguages();
  }

  @Post('languages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createLanguage(@Body() dto: CreateLanguageDto) {
    return this.service.createLanguage(dto);
  }

  @Get('locations')
  listLocations() {
    return this.service.listLocations();
  }

  @Get('locations/:id')
  getLocation(@Param('id', ParseIntPipe) id: number) {
    return this.service.getLocation(id);
  }

  @Post('locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createLocation(@Body() dto: CreateLocationDto) {
    return this.service.createLocation(dto);
  }

  @Get('pois')
  listPois(@Query('locationId', new ParseIntPipe({ optional: true })) locationId?: number) {
    return this.service.listPois(locationId);
  }

  @Get('pois/:id')
  getPoi(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPoi(id);
  }

  @Post('locations/:locationId/pois')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONTENT_MANAGER')
  createPoi(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: CreatePoiDto,
  ) {
    return this.service.createPoi(locationId, dto);
  }

  @Patch('locations/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  setLocationActive(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateActiveDto) { return this.service.setLocationActive(id, dto); }

  @Patch('pois/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONTENT_MANAGER')
  setPoiActive(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateActiveDto) { return this.service.setPoiActive(id, dto); }

  @Get('voices')
  listVoices() { return this.service.listVoices(); }

  @Post('voices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createVoice(@Body() dto: CreateVoiceDto) { return this.service.createVoice(dto); }

  @Patch('languages/:code/default-voice')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  setDefaultVoice(@Param('code') code: string, @Body() dto: SetDefaultVoiceDto) {
    return this.service.setDefaultVoice(code, dto.voiceId);
  }

  @Get('qr')
  listQrCodes() { return this.service.listQrCodes(); }

  @Post('pois/:poiId/qr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONTENT_MANAGER')
  upsertQr(@Param('poiId', ParseIntPipe) poiId: number, @Body() dto: CreateQrDto) { return this.service.upsertQr(poiId, dto); }
}
