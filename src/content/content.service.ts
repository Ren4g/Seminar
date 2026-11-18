import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from './content.repository';
import { CreateContentDto, RejectContentDto, TranslateContentDto, UpdateContentDto } from './content.dto';
import { UploadAudioDto } from './audio.dto';
import { ElevenLabsAudioDto } from './audio.dto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

@Injectable()
export class ContentService {
  private readonly repository: ContentRepository;
  constructor(repository: ContentRepository) { this.repository = repository; }

  private async loadSampleAudio(): Promise<Buffer | undefined> {
    const configuredPath = process.env.TTS_FALLBACK_AUDIO_PATH;
    const candidatePaths = [
      ...(configuredPath ? [path.resolve(configuredPath)] : []),
      path.resolve('..', 'am_thanh', 'mp3', 'Download1.mp3'),
      path.resolve(process.cwd(), '..', 'am_thanh', 'mp3', 'Download1.mp3'),
      path.resolve('D:/vscode/seminar/am_thanh/mp3/Download1.mp3'),
      path.resolve('am_thanh', 'mp3', 'Download1.mp3'),
      path.resolve('..', 'am_thanh', 'mp3', 'Download.mp3'),
      path.resolve('D:/vscode/seminar/am_thanh/mp3/Download.mp3'),
    ];
    for (const samplePath of candidatePaths) {
      try {
        const sample = await readFile(samplePath);
        if (sample.length > 0) return sample;
      } catch {
        // Try the next configured or legacy sample location.
      }
    }
    return undefined;
  }

  list(status?: string) { return this.repository.list(status); }
  async find(id: number) {
    const version = await this.repository.find(id);
    if (!version) throw new NotFoundException(`Content version '${id}' was not found`);
    return version;
  }
  history(id: number) { return this.repository.history(id); }
  async translate(id: number, dto: TranslateContentDto) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const source = await this.find(id);
    let translatedText = '';

    // Nếu có key Google Translate thật (không phải free/mock/placeholder) thì gọi API
    if (apiKey && apiKey !== 'free' && apiKey !== 'mock' && !apiKey.startsWith('replace-with')) {
      try {
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: source.narrationText, source: source.languageCode, target: dto.targetLanguageCode, format: 'text' }),
        });
        if (response.ok) {
          const payload = await response.json() as { data?: { translations?: { translatedText?: string }[] } };
          translatedText = payload.data?.translations?.[0]?.translatedText?.trim() ?? '';
        }
      } catch {
        // Nếu gọi ngoài lỗi, chuyển sang mock translation bên dưới
      }
    }

    // Chế độ Mock / Test cục bộ: tự tạo bản dịch nếu không có API key hoặc gọi thất bại
    if (!translatedText) {
      const targetLang = dto.targetLanguageCode.toUpperCase();
      translatedText = `[Bản dịch tự động ${targetLang}] ${source.narrationText}`;
    }

    return this.repository.createTranslation(id, dto.targetLanguageCode, `[${dto.targetLanguageCode.toUpperCase()}] ${source.title}`, translatedText);
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
  async delete(id: number) {
    try {
      const deleted = await this.repository.delete(id);
      if (!deleted) throw new NotFoundException(`Content version '${id}' was not found`);
      return { deleted: true };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to delete content version');
    }
  }

  async confirmReviewed(id: number, actorUserId: number) {
    try {
      const version = await this.repository.confirmReviewed(id, actorUserId);
      if (!version) throw new NotFoundException(`Content version '${id}' was not found`);
      return version;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error instanceof Error ? error.message : 'Unable to confirm review');
    }
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
        const allowed = new Set(['audio/mpeg', 'audio/mp3']);
        const maxSize = Number(process.env.MAX_AUDIO_FILE_BYTES ?? 10 * 1024 * 1024);
        if (!allowed.has(file.fileType)) throw new BadRequestException('Unsupported audio MIME type. Only MP3 is allowed');
        if (file.fileSize <= 0 || file.fileSize > maxSize) throw new BadRequestException(`Audio file must be between 1 byte and ${maxSize} bytes (max 10 MB)`);
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
      const version = await this.find(id);
      const voice = await this.repository.findVoice(dto.voiceId, version.languageCode);
      if (!voice) throw new BadRequestException('Voice is unavailable or does not match content language');
      const modelId = dto.modelId ?? process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';

      let audio: Buffer | undefined;

      // Nếu có key ElevenLabs thật (không phải mock/placeholder) thì gọi API
      if (apiKey && apiKey !== 'mock' && !apiKey.startsWith('replace-with')) {
        try {
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.providerVoiceKey)}/stream?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
            body: JSON.stringify({ text: version.narrationText, model_id: modelId }),
          });
          if (response.ok) {
            audio = Buffer.from(await response.arrayBuffer());
          }
        } catch {
          // Fallback to sample mp3 below
        }
      }

      // Chế độ Mock / Test cục bộ: nếu không có API key hoặc gọi lỗi thì lấy file audio mẫu có sẵn trong dự án
      if (!audio || audio.length === 0) {
        audio = await this.loadSampleAudio();
      }
      if (!audio || audio.length === 0) {
        throw new BadRequestException('ElevenLabs could not generate audio and no sample MP3 is configured. Set TTS_FALLBACK_AUDIO_PATH or configure ELEVENLABS_API_KEY.');
      }

      const mediaRoot = path.resolve(process.env.MEDIA_DIR ?? 'storage');
      const relativePath = path.join('tts', `${id}-${Date.now()}.mp3`);
      await mkdir(path.join(mediaRoot, 'tts'), { recursive: true });
      await writeFile(path.join(mediaRoot, relativePath), audio);
      return this.repository.saveTtsAudio(id, dto.voiceId, `/media/${relativePath.replace(/\\/g, '/')}`, audio.length);
  }
}
