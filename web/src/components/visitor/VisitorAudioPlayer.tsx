/**
 * @file VisitorAudioPlayer.tsx
 * @description Trình phát audio chính trên trang chi tiết: Nút Play/Pause, thanh trượt thời gian, tua ±15s, đổi tốc độ đọc.
 * @screen Màn hình chi tiết điểm tham quan (Visitor Detail).
 * @activityDiagram Bước "Khách nghe thuyết minh tự động" -> "Điều khiển phát audio".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Đổi số giây tua nhanh/chậm (mặc định 15s): Biến `SEEK_SECONDS` bên dưới.
 *  - Dải tốc độ phát (0.75x -> 2.0x): Mảng `PLAYBACK_RATES`.
 *  - Giao diện nút Play và thanh tiến trình: Class `.visitor-audio-card`, `.visitor-audio-play` trong `styles.css`.
 */

import { type RefObject } from 'react';
import type { VisitorCopy } from '../../constants/visitorCopy';
import { formatTime, languageName } from '../../utils/formatters';

// ==================== CẤU HÌNH TRÌNH PHÁT (CONFIG) ====================
export const SEEK_SECONDS = 15; // Thầy yêu cầu đổi bước tua 10s hay 30s -> sửa số này
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

type VisitorAudioPlayerProps = {
  audioRef: RefObject<HTMLAudioElement | null>;
  visitorAudioUrl?: string;
  audioPlaying: boolean;
  audioTime: number;
  audioDuration: number;
  playbackRate: number;
  language: string;
  contentLanguageCode: string;
  copy: VisitorCopy;
  onToggleAudio: () => void;
  onSeekAudio: (seconds: number) => void;
  onSetRate: () => void;
  onTimeChange: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onTimeUpdate: (currentTime: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
};

// [TÍNH NĂNG: Khung trình phát audio thuyết minh]
export function VisitorAudioPlayer({
  audioRef,
  visitorAudioUrl,
  audioPlaying,
  audioTime,
  audioDuration,
  playbackRate,
  language,
  contentLanguageCode,
  copy,
  onToggleAudio,
  onSeekAudio,
  onSetRate,
  onTimeChange,
  onLoadedMetadata,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
}: VisitorAudioPlayerProps) {
  const isVi = language === 'vi';
  const audioLabel = isVi ? 'Thuyết minh' : 'Narration';

  return (
    <section className="visitor-audio-card" aria-label={audioLabel}>
      {/* [TÍNH NĂNG: Thẻ audio HTML5 ẩn điều khiển native] */}
      {visitorAudioUrl ? (
        <audio
          ref={audioRef}
          preload="metadata"
          src={visitorAudioUrl}
          onLoadedMetadata={(event) => onLoadedMetadata(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
        />
      ) : null}

      <div className="visitor-audio-heading">
        {/* [TÍNH NĂNG: Nút Play / Pause tròn to] */}
        <button
          className="visitor-audio-play"
          disabled={!visitorAudioUrl}
          onClick={onToggleAudio}
          aria-label={audioPlaying ? (isVi ? 'Tạm dừng' : 'Pause') : (isVi ? 'Phát thuyết minh' : 'Play narration')}
        >
          {audioPlaying ? <span aria-hidden="true">&#x275A;&#x275A;</span> : <span aria-hidden="true">&#x25B6;</span>}
        </button>

        <div>
          <strong>{isVi ? 'Nghe thuyết minh' : 'Listen to the story'}</strong>
          <p>
            {visitorAudioUrl
              ? `${formatTime(audioDuration)} · ${languageName(contentLanguageCode, isVi ? 'vi' : 'en')}`
              : copy.noAudio}
          </p>
        </div>
      </div>

      {visitorAudioUrl && (
        <>
          {/* [TÍNH NĂNG: Thanh kéo trượt tiến trình phát] */}
          <input
            className="visitor-audio-progress"
            aria-label={isVi ? 'Vị trí phát' : 'Playback position'}
            type="range"
            min={0}
            max={audioDuration || 1}
            value={Math.min(audioTime, audioDuration || 1)}
            onChange={(event) => onTimeChange(Number(event.target.value))}
          />

          {/* [TÍNH NĂNG: Các nút điều khiển tua và tốc độ] */}
          <div className="visitor-audio-controls">
            <button type="button" onClick={() => onSeekAudio(-SEEK_SECONDS)}>
              &minus;{SEEK_SECONDS} {isVi ? 'giây' : 'sec'}
            </button>
            <span>
              {formatTime(audioTime)} / {formatTime(audioDuration)}
            </span>
            <button type="button" onClick={onSetRate}>
              {playbackRate}&times;
            </button>
            <button type="button" onClick={() => onSeekAudio(SEEK_SECONDS)}>
              +{SEEK_SECONDS} {isVi ? 'giây' : 'sec'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
