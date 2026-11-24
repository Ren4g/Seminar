/**
 * @file ContentAudioConsole.tsx
 * @description Khung nghe thử audio của bài thuyết minh trong trang quản trị Content Studio.
 * @screen Nằm dưới khung kiểm tra điều kiện gửi duyệt bài viết.
 * @activityDiagram Bước "Biên tập viên nghe thử file audio trước khi gửi duyệt".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Giao diện console: Class `.audio-console`, `.audio-empty` trong `styles.css`.
 */

import type { ContentItem } from '../../types/content';

type ContentAudioConsoleProps = {
  selected: ContentItem;
};

// [TÍNH NĂNG: Khung nghe thử file audio bài viết trong Admin]
export function ContentAudioConsole({ selected }: ContentAudioConsoleProps) {
  return (
    <div className="audio-console">
      {selected.audioUrl ? (
        <>
          <div className="audio-console-head">
            <strong>Audio preview</strong>
            <span>{selected.duration}</span>
          </div>
          <audio controls preload="metadata" src={selected.audioUrl} aria-label="Narration audio" />
        </>
      ) : (
        <div className="audio-empty">
          <strong>Chưa có audio</strong>
          <span>Tạo bằng ElevenLabs hoặc tải lên MP3 để tiếp tục.</span>
        </div>
      )}
    </div>
  );
}
