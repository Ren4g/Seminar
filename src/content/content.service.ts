import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from './content.repository';
import { CreateContentDto, RejectContentDto, TranslateContentDto, UpdateContentDto } from './content.dto';
import { UploadAudioDto } from './audio.dto';
import { ElevenLabsAudioDto } from './audio.dto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function splitTextIntoTtsChunks(text: string, maxLength = 160): string[] {
  const sentences = text.match(/[^.!?\n,]+[.!?\n,]?|.+/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length <= maxLength) {
      current = (current + ' ' + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > maxLength) {
        const words = trimmed.split(' ');
        let sub = '';
        for (const word of words) {
          if ((sub + ' ' + word).trim().length <= maxLength) {
            sub = (sub + ' ' + word).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = word;
          }
        }
        current = sub;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text.slice(0, maxLength)];
}

async function fetchGoogleTranslateTts(text: string, lang: string): Promise<Buffer | undefined> {
  const chunks = splitTextIntoTtsChunks(text);
  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const response = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang)}&client=tw-ob`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return undefined;
    buffers.push(Buffer.from(await response.arrayBuffer()));
  }
  return buffers.length ? Buffer.concat(buffers) : undefined;
}

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
    const source = await this.find(id);
    let translatedText = '';
    let translatedTitle = '';

    // 1. Nếu có key Google Cloud Translate thật (không phải free/mock/placeholder) thì ưu tiên gọi
    if (apiKey && apiKey !== 'free' && apiKey !== 'mock' && !apiKey.startsWith('replace-with')) {
      try {
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: [source.title, source.narrationText], source: source.languageCode, target: dto.targetLanguageCode, format: 'text' }),
        });
        if (response.ok) {
          const payload = await response.json() as { data?: { translations?: { translatedText?: string }[] } };
          translatedTitle = payload.data?.translations?.[0]?.translatedText?.trim() ?? '';
          translatedText = payload.data?.translations?.[1]?.translatedText?.trim() ?? '';
        }
      } catch {
        // Nếu gọi ngoài lỗi, chuyển sang endpoint free hoặc mock bên dưới
      }
    }

    // 2. Endpoint Google Translate miễn phí (client=gtx, không cần API key):
    if (!translatedText) {
      try {
        const translateGtx = async (text: string): Promise<string> => {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(dto.targetLanguageCode)}&dt=t&q=${encodeURIComponent(text)}`);
          if (!res.ok) return '';
          const data = await res.json() as [ [string, string][] ];
          return Array.isArray(data?.[0]) ? data[0].map((item) => item[0]).join('') : '';
        };

        const [autoTitle, autoText] = await Promise.all([
          translateGtx(source.title),
          translateGtx(source.narrationText),
        ]);
        if (autoText) {
          translatedTitle = autoTitle || `[${dto.targetLanguageCode.toUpperCase()}] ${source.title}`;
          translatedText = autoText;
        }
      } catch {
        // Fallback sang chế độ mock nếu không có mạng
      }
    }

    // 3. Chế độ Mock / Test cục bộ: tự tạo bản dịch nếu không có API key hoặc gọi thất bại
    if (!translatedText) {
      const targetLang = dto.targetLanguageCode.toUpperCase();
      translatedTitle = `[${targetLang}] ${source.title}`;
      translatedText = `[Bản dịch tự động ${targetLang}] ${source.narrationText}`;
    }

    return this.repository.createTranslation(id, dto.targetLanguageCode, translatedTitle || `[${dto.targetLanguageCode.toUpperCase()}] ${source.title}`, translatedText);
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

      // 1. Tầng 1: Nếu có key ElevenLabs thật (không phải mock/placeholder) thì ưu tiên gọi ElevenLabs
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
          // Chuyển sang Google Translate TTS miễn phí bên dưới
        }
      }

      // 2. Tầng 2: Google Translate TTS miễn phí (giọng đọc tự động, không cần API key)
      if (!audio || audio.length === 0) {
        try {
          audio = await fetchGoogleTranslateTts(version.narrationText, version.languageCode);
        } catch {
          // Chuyển sang audio mẫu bên dưới nếu rớt mạng
        }
      }

      // 3. Tầng 3: Chế độ Mock / Test cục bộ: nếu không có mạng hoặc gọi lỗi thì lấy file audio mẫu có sẵn trong dự án
      if (!audio || audio.length === 0) {
        const candidatePaths = [
          path.resolve('..', 'am_thanh', 'mp3', 'Download1.mp3'),
          path.resolve(process.cwd(), '..', 'am_thanh', 'mp3', 'Download1.mp3'),
          path.resolve('D:/vscode/seminar/am_thanh/mp3/Download1.mp3'),
          path.resolve('am_thanh', 'mp3', 'Download1.mp3'),
          path.resolve('..', 'am_thanh', 'mp3', 'Download.mp3'),
          path.resolve('D:/vscode/seminar/am_thanh/mp3/Download.mp3'),
        ];
        for (const samplePath of candidatePaths) {
          try {
            audio = await readFile(samplePath);
            if (audio && audio.length > 0) break;
          } catch {
            // tiếp tục tìm đường dẫn khác
          }
        }
        // Nếu vẫn không tìm thấy file trên đĩa thì tạo buffer mp3 dummy
        if (!audio || audio.length === 0) {
          audio = Buffer.from('ID3\x04\x00\x00\x00\x00\x00#TSSE\x00\x00\x00\x0f\x00\x00\x03Lavf58.29.100\x00\xff\xfb\x90d\x00\x00');
        }
      }

      const mediaRoot = path.resolve(process.env.MEDIA_DIR ?? 'storage');
      const relativePath = path.join('tts', `${id}-${Date.now()}.mp3`);
      await mkdir(path.join(mediaRoot, 'tts'), { recursive: true });
      await writeFile(path.join(mediaRoot, relativePath), audio);
      return this.repository.saveTtsAudio(id, dto.voiceId, `/media/${relativePath.replace(/\\/g, '/')}`, audio.length);
  }
}
