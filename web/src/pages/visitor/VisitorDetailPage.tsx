/**
 * @file VisitorDetailPage.tsx
 * @description Màn hình Chi tiết điểm tham quan: Ghép nối Header chi tiết, Audio Player, văn bản thuyết minh, Transcript và Actions.
 * @screen Màn hình chi tiết điểm tham quan (URL: `/visitor?poiId=...`).
 * @activityDiagram Bước "Khách nghe thuyết minh tự động" -> "Đọc văn bản, chia sẻ hoặc chuyển điểm tiếp theo".
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Nút quay lại: Thẻ `<a className="visitor-detail-back">`.
 *  - Trình phát audio: Thẻ `<VisitorAudioPlayer />`.
 */

import { type RefObject } from 'react';
import type { ApiContent, ApiLocation, ApiPoi } from '../../api';
import type { VisitorCopy } from '../../constants/visitorCopy';
import { VisitorDetailHeader } from '../../components/visitor/VisitorDetailHeader';
import { VisitorAudioPlayer } from '../../components/visitor/VisitorAudioPlayer';
import { VisitorStickyPlayer } from '../../components/visitor/VisitorStickyPlayer';
import { VisitorTranscript } from '../../components/visitor/VisitorTranscript';
import { VisitorDetailActions } from '../../components/visitor/VisitorDetailActions';

type VisitorDetailPageProps = {
  content: ApiContent | null;
  loading: boolean;
  error: string;
  point?: ApiPoi;
  parentLocation?: ApiLocation;
  language: string;
  copy: VisitorCopy;
  visitorAudioUrl?: string;
  audioRef: RefObject<HTMLAudioElement | null>;
  audioPlaying: boolean;
  audioTime: number;
  audioDuration: number;
  playbackRate: number;
  transcriptExpanded: boolean;
  nextPoi?: ApiPoi;
  onToggleAudio: () => void;
  onSeekAudio: (seconds: number) => void;
  onSetRate: () => void;
  onTimeChange: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onTimeUpdate: (currentTime: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onToggleTranscript: () => void;
  translate: (translations: { languageCode: string; name: string }[]) => string;
  translateLocation: (translations: ApiLocation['translations']) => string;
};

// [TÍNH NĂNG: Toàn bộ màn hình Chi tiết bài thuyết minh điểm tham quan]
export function VisitorDetailPage({
  content,
  loading,
  error,
  point,
  parentLocation,
  language,
  copy,
  visitorAudioUrl,
  audioRef,
  audioPlaying,
  audioTime,
  audioDuration,
  playbackRate,
  transcriptExpanded,
  nextPoi,
  onToggleAudio,
  onSeekAudio,
  onSetRate,
  onTimeChange,
  onLoadedMetadata,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onToggleTranscript,
  translate,
  translateLocation,
}: VisitorDetailPageProps) {
  const pointName = translate(point?.translations ?? []);
  const locationName = translateLocation(parentLocation?.translations ?? []);
  const fallback = Boolean(content && content.languageCode.toLowerCase() !== language.toLowerCase());

  return (
    <main className="visitor-detail">
      {/* [TÍNH NĂNG: Nút quay lại danh sách tất cả địa điểm] */}
      <a className="visitor-detail-back" href="/">
        <span aria-hidden="true">&#x2190;</span> {copy.back}
      </a>

      {loading ? (
        <div className="visitor-loading">{copy.loadingContent}</div>
      ) : error ? (
        <div className="visitor-error">
          <h1>{copy.missingContent}</h1>
          <p>{error}</p>
          <a href="/">{copy.chooseOther}</a>
        </div>
      ) : content ? (
        <>
          {/* [TÍNH NĂNG: Ảnh bìa di tích & Tiêu đề bài thuyết minh] */}
          <VisitorDetailHeader
            locationName={locationName}
            pointName={pointName}
            contentTitle={content.title}
            contentLanguageCode={content.languageCode}
            language={language}
            fallback={fallback}
            copy={copy}
          />

          <section className="visitor-detail-content" style={{ paddingTop: 0 }}>
            {/* [TÍNH NĂNG: Trình phát audio chính] */}
            <VisitorAudioPlayer
              audioRef={audioRef}
              visitorAudioUrl={visitorAudioUrl}
              audioPlaying={audioPlaying}
              audioTime={audioTime}
              audioDuration={audioDuration}
              playbackRate={playbackRate}
              language={language}
              contentLanguageCode={content.languageCode}
              copy={copy}
              onToggleAudio={onToggleAudio}
              onSeekAudio={onSeekAudio}
              onSetRate={onSetRate}
              onTimeChange={onTimeChange}
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              onPlay={onPlay}
              onPause={onPause}
              onEnded={onEnded}
            />

            {/* [TÍNH NĂNG: Nội dung bài thuyết minh bằng văn bản] */}
            <p className="visitor-narration">{content.narrationText}</p>

            {/* [TÍNH NĂNG: Bản chép lời mở rộng / thu gọn] */}
            <VisitorTranscript
              narrationText={content.narrationText}
              language={language}
              isExpanded={transcriptExpanded}
              onToggle={onToggleTranscript}
            />

            {/* [TÍNH NĂNG: Điểm tham quan tiếp theo, nút chia sẻ và báo lỗi] */}
            <VisitorDetailActions
              nextPoi={nextPoi}
              locationName={locationName}
              language={language}
              contentTitle={content.title}
              translate={translate}
            />
          </section>

          {/* [TÍNH NĂNG: Mini player ghim cố định dưới đáy màn hình] */}
          {visitorAudioUrl && (
            <VisitorStickyPlayer
              title={content.title}
              audioPlaying={audioPlaying}
              audioTime={audioTime}
              audioDuration={audioDuration}
              playbackRate={playbackRate}
              onToggleAudio={onToggleAudio}
              onSetRate={onSetRate}
            />
          )}
        </>
      ) : null}
    </main>
  );
}
