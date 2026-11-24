/**
 * @file VisitorStickyPlayer.tsx
 * @description Thanh phát audio mini ghim dính ở chân màn hình điện thoại khi khách cuộn trang.
 * @screen Màn hình chi tiết điểm tham quan khi có audio hợp lệ.
 * @activityDiagram Bước "Khách vừa cuộn đọc nội dung vừa nghe thuyết minh".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Giao diện ghim đáy: Class `.visitor-sticky-player`, `.visitor-sticky-play` trong `styles.css`.
 */

import { formatTime } from '../../utils/formatters';

type VisitorStickyPlayerProps = {
  title: string;
  audioPlaying: boolean;
  audioTime: number;
  audioDuration: number;
  playbackRate: number;
  onToggleAudio: () => void;
  onSetRate: () => void;
};

// [TÍNH NĂNG: Thanh phát nhạc mini cố định dưới đáy màn hình]
export function VisitorStickyPlayer({
  title,
  audioPlaying,
  audioTime,
  audioDuration,
  playbackRate,
  onToggleAudio,
  onSetRate,
}: VisitorStickyPlayerProps) {
  const progressPercent = audioDuration ? Math.min(100, (audioTime / audioDuration) * 100) : 0;

  return (
    <div className="visitor-sticky-player">
      <div className="visitor-sticky-progress">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <button
        type="button"
        className="visitor-sticky-play"
        onClick={onToggleAudio}
        aria-label={audioPlaying ? 'Pause' : 'Play'}
      >
        {audioPlaying ? '❚❚' : '▶'}
      </button>

      <div>
        <strong>{title}</strong>
        <p>
          {formatTime(audioTime)} / {formatTime(audioDuration)}
        </p>
      </div>

      <button type="button" className="visitor-sticky-rate" onClick={onSetRate}>
        {playbackRate}&times;
      </button>
    </div>
  );
}
