import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedRequest } from '../auth/request.types';
import { ContentListQueryDto, CreateContentDto, RejectContentDto, TranslateContentDto, UpdateContentDto } from './content.dto';
import { ElevenLabsAudioDto, UploadAudioDto } from './audio.dto';
import { ContentService } from './content.service';

@Controller('content')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentController {
  private readonly service: ContentService;
  constructor(service: ContentService) { this.service = service; }

  @Get()
  @Roles('ADMIN', 'CONTENT_MANAGER')
  list(@Query() query: ContentListQueryDto) { return this.service.list(query.status); }

  @Get(':id/history')
  @Roles('ADMIN', 'CONTENT_MANAGER')
  history(@Param('id', ParseIntPipe) id: number) { return this.service.history(id); }

  @Get(':id')
  @Roles('ADMIN', 'CONTENT_MANAGER')
  find(@Param('id', ParseIntPipe) id: number) { return this.service.find(id); }

  @Post(':id/translate')
  @Roles('ADMIN', 'CONTENT_MANAGER')
  translate(@Param('id', ParseIntPipe) id: number, @Body() dto: TranslateContentDto) {
    return this.service.translate(id, dto);
  }

  @Post()
  @Roles('ADMIN', 'CONTENT_MANAGER')
  create(@Body() dto: CreateContentDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles('ADMIN', 'CONTENT_MANAGER')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContentDto) { return this.service.update(id, dto); }

  @Post(':id/submit')
  @Roles('ADMIN', 'CONTENT_MANAGER')
  submit(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) { return this.service.transition(id, 'submit', req.user.userId); }

  @Post(':id/withdraw')
  @Roles('ADMIN', 'CONTENT_MANAGER')
  withdraw(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) { return this.service.transition(id, 'withdraw', req.user.userId); }

  @Post(':id/approve')
  @Roles('ADMIN')
  approve(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) { return this.service.transition(id, 'approve', req.user.userId); }

  @Post(':id/reject')
  @Roles('ADMIN')
  reject(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest, @Body() dto: RejectContentDto) { return this.service.reject(id, req.user.userId, dto); }

  @Post(':id/publish')
  @Roles('ADMIN')
  publish(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) { return this.service.publish(id, req.user.userId); }

  @Post(':id/audio/tts')
  @Roles('ADMIN', 'CONTENT_MANAGER')
  generateElevenLabsAudio(@Param('id', ParseIntPipe) id: number, @Body() dto: ElevenLabsAudioDto) {
    return this.service.generateElevenLabsAudio(id, dto);
  }

  @Post(':id/audio/upload')
  @UseInterceptors(FileInterceptor('file'))
  @Roles('ADMIN', 'CONTENT_MANAGER')
  uploadAudio(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined, @Body() dto: UploadAudioDto) {
    return this.service.uploadAudio(id, file ? { fileName: file.originalname, fileType: file.mimetype, fileSize: file.size, buffer: file.buffer } : dto);
  }

  @Post(':id/unpublish')
  @Roles('ADMIN')
  unpublish(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) { return this.service.transition(id, 'unpublish', req.user.userId); }

  @Post(':id/republish')
  @Roles('ADMIN')
  republish(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) { return this.service.transition(id, 'republish', req.user.userId); }
}
