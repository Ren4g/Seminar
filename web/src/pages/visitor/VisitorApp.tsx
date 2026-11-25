/**
 * @file VisitorApp.tsx
 * @description Bộ điều phối phân hệ khách tham quan: Quản lý URL, điều hướng giữa Bản đồ số, Trang chủ và Chi tiết điểm, tích hợp âm thanh.
 * @screen Toàn bộ giao diện khách tham quan (URL: `/` hoặc `/map` hoặc `/visitor`).
 * @activityDiagram Quản lý toàn bộ luồng hoạt động của khách từ quét QR, xem bản đồ đến nghe thuyết minh.
 * 
 * @customization Điểm cấu hình & Tùy biến nhanh:
 *  - Chuyển chế độ xem bản đồ / danh sách: Hàm `handleNavigateHome()`, `handleNavigateMap()`.
 */

import { useRef, useState } from 'react';
import { api, API_URL, type ApiLocation, type ApiPoi } from '../../api';
import { VISITOR_COPY, type VisitorCopy } from '../../constants/visitorCopy';
import { safeRandomUUID } from '../../utils/session';
import { useVisitorSession } from '../../hooks/useVisitorSession';
import { useVisitorData } from '../../hooks/useVisitorData';
import { VisitorShell } from '../../components/visitor/VisitorShell';
import { VisitorMap } from '../../VisitorMap';
import { VisitorHomePage } from './VisitorHomePage';
import { VisitorDetailPage } from './VisitorDetailPage';

export function VisitorApp() {
  const params = new URLSearchParams(window.location.search);
  const poiParam = params.get('poiId');
  const poiId = poiParam ? Number(poiParam) : null;
  const isQrSource = params.get('source') === 'qr' || params.has('qr');
  const isMapRoute = window.location.pathname === '/map' || params.get('tab') === 'map' || params.get('view') === 'map';

  const [viewMode, setViewMode] = useState<'list' | 'map'>(isMapRoute ? 'map' : 'list');
  const [language, setLanguage] = useState(params.get('language') || 'en');
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const copy: VisitorCopy = language.toLowerCase() === 'vi' ? VISITOR_COPY.vi : VISITOR_COPY.en;

  // [TÍNH NĂNG: Khởi tạo phiên truy cập và ghi nhận sự kiện Analytics]
  useVisitorSession(poiId, language, isQrSource);

  // [TÍNH NĂNG: Nạp dữ liệu bài viết, danh mục và lịch sử LocalStorage]
  const {
    content,
    loading,
    error,
    locations,
    pois,
    placesLoading,
    placesError,
    history,
    poiLanguages,
    availableLanguages,
    rememberListening,
    clearHistory,
    removeHistoryItem,
  } = useVisitorData(poiId, language, (fallback) => {
    setLanguage(fallback);
    const next = new URL(window.location.href);
    next.searchParams.set('language', fallback);
    window.history.replaceState(null, '', next);
  });

  const visitorAudioUrl = content?.audio?.filePath
    ? (content.audio.filePath.startsWith('/media/') ? `${API_URL.replace(/\/api\/?$/, '')}${content.audio.filePath}` : content.audio.filePath)
    : undefined;

  const translate = (translations: { languageCode: string; name: string }[]) =>
    translations.find((item) => item.languageCode === language)?.name ?? translations.find((item) => item.languageCode === 'en')?.name ?? '';

  const translateLocation = (translations: ApiLocation['translations']) =>
    translations.find((item) => item.languageCode === language)?.name ?? translations.find((item) => item.languageCode === 'en')?.name ?? '';

  const point = pois.find((item) => item.id === poiId);
  const parentLocation = locations.find((item) => item.id === point?.locationId);
  const nextPoi = point ? pois.find((item) => item.locationId === point.locationId && item.id !== point.id) : undefined;

  // [TÍNH NĂNG: Điều khiển phát / tạm dừng audio]
  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const seekAudio = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioDuration, audioTime + seconds));
    }
  };

  const setRate = () => {
    const next = playbackRate >= 2 ? 0.75 : playbackRate + 0.25;
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleSelectLanguage = (langCode: string) => {
    setLanguage(langCode);
    const next = new URL(window.location.href);
    next.searchParams.set('language', langCode);
    window.history.replaceState(null, '', next);
  };

  const handleNavigateHome = () => {
    setViewMode('list');
    if (poiId) window.location.href = `/?language=${language}`;
    else {
      const next = new URL(window.location.href);
      next.pathname = '/';
      next.searchParams.delete('view');
      next.searchParams.delete('tab');
      window.history.pushState(null, '', next);
    }
  };

  const handleNavigateMap = () => {
    setViewMode('map');
    if (poiId) window.location.href = `/map?language=${language}`;
    else {
      const next = new URL(window.location.href);
      next.pathname = '/map';
      window.history.pushState(null, '', next);
    }
  };

  return (
    <VisitorShell
      viewMode={viewMode}
      poiId={poiId}
      language={language}
      copy={copy}
      availableLanguages={availableLanguages}
      poiLanguages={poiLanguages}
      onSelectLanguage={handleSelectLanguage}
      onNavigateHome={handleNavigateHome}
      onNavigateMap={handleNavigateMap}
    >
      {!poiId ? (
        viewMode === 'map' ? (
          <VisitorMap
            locations={locations}
            pois={pois}
            language={language}
            onNavigateToPoi={(id) => {
              window.location.href = `/visitor?poiId=${id}&language=${language}`;
            }}
            onSwitchToList={handleNavigateHome}
          />
        ) : (
          <VisitorHomePage
            copy={copy}
            language={language}
            locations={locations}
            pois={pois}
            placesLoading={placesLoading}
            placesError={placesError}
            history={history}
            onViewMap={handleNavigateMap}
            onClearHistory={clearHistory}
            onRemoveHistoryItem={removeHistoryItem}
            translate={translate}
            translateLocation={translateLocation}
          />
        )
      ) : (
        <VisitorDetailPage
          content={content}
          loading={loading}
          error={error}
          point={point}
          parentLocation={parentLocation}
          language={language}
          copy={copy}
          visitorAudioUrl={visitorAudioUrl}
          audioRef={audioRef}
          audioPlaying={audioPlaying}
          audioTime={audioTime}
          audioDuration={audioDuration}
          playbackRate={playbackRate}
          transcriptExpanded={transcriptExpanded}
          nextPoi={nextPoi}
          onToggleAudio={toggleAudio}
          onSeekAudio={seekAudio}
          onSetRate={setRate}
          onTimeChange={(time) => {
            setAudioTime(time);
            if (audioRef.current) audioRef.current.currentTime = time;
          }}
          onLoadedMetadata={setAudioDuration}
          onTimeUpdate={setAudioTime}
          onPlay={() => {
            setAudioPlaying(true);
            if (content?.title) rememberListening(content.title);
            void api.recordEvent({
              eventId: safeRandomUUID(),
              eventType: 'AUDIO_START',
              poiId,
              languageCode: language,
            });
          }}
          onPause={() => setAudioPlaying(false)}
          onEnded={() => setAudioPlaying(false)}
          onToggleTranscript={() => setTranscriptExpanded((value) => !value)}
          translate={translate}
          translateLocation={translateLocation}
        />
      )}
    </VisitorShell>
  );
}
