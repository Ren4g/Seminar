import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from './content.repository';
import { CreateContentDto, RejectContentDto, TranslateContentDto, UpdateContentDto } from './content.dto';
import { UploadAudioDto } from './audio.dto';
import { ElevenLabsAudioDto } from './audio.dto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

@Injectable()
export class ContentService {
  private readonly repository: ContentRepository;
  constructor(repository: ContentRepository) { this.repository = repository; }

  list(status?: string) { return this.repository.list(status); }
  async find(id: number) {
    const version = await this.repository.find(id);
    if (!version) throw new NotFoundException(`Content version '${id}' was not found`);
    return version;
  }
  history(id: number) { return this.repository.history(id); }
  async translate(id: number, dto: TranslateContentDto) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) throw new BadRequestException('GOOGLE_TRANSLATE_API_KEY is not configured on the backend');
    const source = await this.find(id);
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: source.narrationText, source: source.languageCode, target: dto.targetLanguageCode, format: 'text' }),
    });
    if (!response.ok) throw new BadRequestException(`Translation provider request failed (${response.status})`);
    const payload = await response.json() as { data?: { translations?: { translatedText?: string }[] } };
    const translatedText = payload.data?.translations?.[0]?.translatedText?.trim();
    if (!translatedText) throw new BadRequestException('Translation provider returned empty text');
    return this.repository.createTranslation(id, dto.targetLanguageCode, source.title, translatedText);
  }
  async create(dto: CreateContentDto) {
    try { return await this.repository.create(dto.poiId, dto.languageCode, dto.title, dto.narrationText); }
    catch (error) { throw new BadRequestException(error instanceof Error ? error.message : 'Unable to create content'); }
  }
  async update(id: number, dto: UpdateContentDto) {
    const version = await this.repository.update(id, dto.title, dto.narrationText);
    if (!version) throw new BadRequestException('Only DRAFT or REJECTED versions can be edited');
    return version;
  }
  async transition(id: number, action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'publish' | 'unpublish' | 'republish', actorUserId: number, reason?: string) {
    try {
      const version = await this.repository.transition(id, action, actorUserId, reason);
      if (!version) throw new NotFoundException(`Content version '${id}' was not found`);
      return version;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid content transition');
    }
  }
  publish(id: number, actorUserId: number) { return this.transition(id, 'publish', actorUserId); }
  reject(id: number, actorUserId: number, dto: RejectContentDto) { return this.transition(id, 'reject', actorUserId, dto.reason); }
  async uploadAudio(id: number, dto: UploadAudioDto | (UploadAudioDto & { buffer: Buffer; fileType: string })) {
    try {
      const file = 'buffer' in dto ? dto as UploadAudioDto & { buffer: Buffer; fileType: string } : undefined;
      if (!file && (!dto.fileName || dto.fileSize === undefined)) throw new BadRequestException('Audio file or file metadata is required');
      if (file) {
        const allowed = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/aac']);
        const maxSize = Number(process.env.MAX_AUDIO_FILE_BYTES ?? 25 * 1024 * 1024);
        if (!allowed.has(file.fileType)) throw new BadRequestException('Unsupported audio MIME type');
        if (file.fileSize <= 0 || file.fileSize > maxSize) throw new BadRequestException(`Audio file must be between 1 byte and ${maxSize} bytes`);
      }
      const audio = file ? await this.repository.saveUploadedAudio(id, file.fileName, file.fileSize, file.buffer, process.env.MEDIA_DIR ?? 'storage') : await this.repository.uploadAudio(id, dto.fileName, dto.fileSize);
      if (!audio) throw new NotFoundException(`Content version '${id}' was not found`);
      return audio;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to save uploaded audio');
    }
  }

  async generateElevenLabsAudio(id: number, dto: ElevenLabsAudioDto) {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) throw new BadRequestException('ELEVENLABS_API_KEY is not configured on the backend');
      const version = await this.find(id);
      const voice = await this.repository.findVoice(dto.voiceId, version.languageCode);
      if (!voice) throw new BadRequestException('Voice is unavailable or does not match content language');
      const modelId = dto.modelId ?? process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.providerVoiceKey)}/stream?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text: version.narrationText, model_id: modelId }),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new BadRequestException(`ElevenLabs request failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ''}`);
      }
      const audio = Buffer.from(await response.arrayBuffer());
      if (audio.length === 0) throw new BadRequestException('ElevenLabs returned an empty audio file');
      const mediaRoot = path.resolve(process.env.MEDIA_DIR ?? 'storage');
      const relativePath = path.join('tts', `${id}-${Date.now()}.mp3`);
      await mkdir(path.join(mediaRoot, 'tts'), { recursive: true });
      await writeFile(path.join(mediaRoot, relativePath), audio);
      return this.repository.saveTtsAudio(id, dto.voiceId, `/media/${relativePath.replace(/\\/g, '/')}`, audio.length);
  }
}
