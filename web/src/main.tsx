import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QRCodeCanvas } from 'qrcode.react';
import { api, API_URL, type ApiAnalytics, type ApiContent, type ApiVoice, type ApiLanguage, type ApiLocation, type ApiPoi, type ApiQr, type ApiReviewEvent, type ApiUser, ApiError } from './api';
import './styles.css';

type Status = '\u0110ang so\u1ea1n' | 'Ch\u1edd duy\u1ec7t' | '\u0110\u00e3 duy\u1ec7t' | '\u0110\u00e3 xu\u1ea5t b\u1ea3n' | '\u0110\u00e3 g\u1ee1 xu\u1ea5t b\u1ea3n' | 'C\u1ea7n r\u00e0 so\u00e1t' | 'B\u1ecb t\u1eeb ch\u1ed1i';
type ContentItem = {
  id: number;
  title: string;
  place: string;
  language: string;
  status: Status;
  updated: string;
  duration: string;
  body: string;
  versionId?: number;
  versionNumber?: number;
  poiId?: number;
  hasAudio?: boolean;
  needsReview?: boolean;
  rawStatus?: string;
  languageCode?: string;
  sourceTitle?: string;
  sourceBody?: string;
  audioUrl?: string;
};

function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getVisitorSessionKey(): string {
  const key = 'audio-guide-session';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = safeRandomUUID();
  sessionStorage.setItem(key, created);
  return created;
}

const initialItems: ContentItem[] = [
  { id: 1, title: 'Cổng thành phía Đông', place: 'Khu di tích Hoàng Thành', language: 'VI', status: 'Chờ duyệt', updated: '12 phút trước', duration: '02:34', body: 'Bạn đang đứng trước cổng thành phía Đông, lối vào từng đón những đoàn khách đầu tiên của kinh thành.' },
  { id: 2, title: 'The eastern gate', place: 'Imperial Citadel', language: 'EN', status: 'Cần rà soát', updated: 'Hôm qua', duration: '02:34', body: 'You are standing at the eastern gate, once the first threshold into the imperial citadel.' },
  { id: 3, title: 'Nhà D67', place: 'Khu di tích Hoàng Thành', language: 'VI', status: 'Đã xuất bản', updated: '06 tháng 11', duration: '03:12', body: 'Nhà D67 giữ lại những lớp ký ức rất riêng của một giai đoạn lịch sử nhiều biến động.' },
];

function mapContent(item: ApiContent, index: number): ContentItem {
  const status: Status = item.status === 'PENDING_REVIEW' ? 'Chờ duyệt' : item.status === 'APPROVED' ? 'Đã duyệt' : item.status === 'PUBLISHED' ? 'Đã xuất bản' : item.status === 'UNPUBLISHED' ? 'Đã gỡ xuất bản' : item.status === 'REJECTED' ? 'Bị từ chối' : 'Đang soạn';
  return { id: Number(item.versionId ?? index + 1), title: item.title, place: `POI #${item.poiId}`, language: item.languageCode.toUpperCase(), languageCode: item.languageCode, rawStatus: item.status, status, updated: '\u0056\u1eeba c\u1eadp nh\u1eadt', duration: item.audio ? '02:34' : '--', body: item.narrationText, versionId: item.versionId, versionNumber: item.versionNumber, poiId: item.poiId, needsReview: Boolean(item.needsReview), hasAudio: Boolean(item.audio && item.audio.isValid && !item.audio.isOutdated), audioUrl: item.audio && item.audio.isValid && !item.audio.isOutdated && item.audio.filePath.startsWith('/media/') ? `${API_URL.replace(/\/api\/?$/, '')}${item.audio.filePath}` : undefined };
}

function languageName(code: string, locale = 'vi'): string {
  try { return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code.toUpperCase(); } catch { return code.toUpperCase(); }
}

function Icon({ children }: { children: ReactNode }) { return <span className="icon" aria-hidden="true">{children}</span>; }

function StatusBadge({ status }: { status: Status }) {
  const tone = status === 'Đã xuất bản' ? 'published' : status === 'Chờ duyệt' || status === 'Đã duyệt' ? 'review' : status === 'Cần rà soát' || status === 'Bị từ chối' ? 'attention' : 'draft';
  return <span className={`status status--${tone}`}>{status}</span>;
}

const VISITOR_COPY = {
  vi: {
    discover: 'Kh\u00e1m ph\u00e1', language: 'Ng\u00f4n ng\u1eef', footer: 'Thuy\u1ebft minh \u0111a ng\u00f4n ng\u1eef, ngay t\u1ea1i \u0111i\u1ec3m \u0111\u1ebfn.',
    heroLine1: 'M\u1ed7i \u0111i\u1ec3m \u0111\u1ebfn,', heroLine2: 'm\u1ed9t c\u00e2u chuy\u1ec7n ri\u00eang.', heroSubtitle: 'Ch\u1ecdn m\u1ed9t n\u01a1i, nghe nh\u1eefng c\u00e2u chuy\u1ec7n theo ng\u00f4n ng\u1eef c\u1ee7a b\u1ea1n.',
    explore: 'Kh\u00e1m ph\u00e1 \u0111\u1ecba \u0111i\u1ec3m', featured: '\u0110i\u1ec3m tham quan n\u1ed5i b\u1eadt', loadingFeatured: '\u0110ang t\u1ea3i \u0111i\u1ec3m tham quan\u2026',
    featuredEmpty: '\u0110\u1ecba \u0111i\u1ec3m s\u1eafp \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt.', placesHeading: 'Ch\u1ecdn n\u01a1i b\u1ea1n mu\u1ed1n \u0111\u1ebfn.', poiSingular: '\u0111i\u1ec3m tham quan', poiPlural: '\u0111i\u1ec3m tham quan',
    loadingPlaces: '\u0110ang t\u1ea3i \u0111\u1ecba \u0111i\u1ec3m\u2026', noPlaces: 'Ch\u01b0a c\u00f3 \u0111\u1ecba \u0111i\u1ec3m n\u00e0o \u0111\u01b0\u1ee3c xu\u1ea5t b\u1ea3n.',
    defaultLocationDescription: 'Kh\u00e1m ph\u00e1 nh\u1eefng c\u00e2u chuy\u1ec7n v\u00e0 \u0111i\u1ec3m tham quan t\u1ea1i \u0111\u00e2y.', placeCount: '\u0111i\u1ec3m', historyHeading: 'L\u1ecbch s\u1eed nghe tr\u00ean thi\u1ebft b\u1ecb.', clearHistory: 'X\u00f3a t\u1ea5t c\u1ea3 l\u1ecbch s\u1eed', removeHistory: 'X\u00f3a m\u1ee5c n\u00e0y kh\u1ecfi l\u1ecbch s\u1eed',
    back: 'T\u1ea5t c\u1ea3 \u0111\u1ecba \u0111i\u1ec3m', locationPrefix: '\u0110i\u1ec3m', loadingContent: '\u0110ang t\u1ea3i thuy\u1ebft minh\u2026', missingContent: 'Ch\u01b0a c\u00f3 n\u1ed9i dung cho \u0111i\u1ec3m n\u00e0y.', chooseOther: 'Ch\u1ecdn m\u1ed9t \u0111i\u1ec3m kh\u00e1c', noAudio: 'N\u1ed9i dung n\u00e0y ch\u01b0a c\u00f3 audio.',
    languageHint: 'B\u1ea1n c\u00f3 th\u1ec3 \u0111\u1ed5i ng\u00f4n ng\u1eef \u1edf ph\u00eda tr\u00ean \u0111\u1ec3 nghe b\u1ea3n d\u1ecbch t\u01b0\u01a1ng \u1ee9ng.',
    fallbackLead: 'Ch\u01b0a c\u00f3 b\u1ea3n ', fallbackMiddle: ', \u0111ang hi\u1ec3n th\u1ecb ', fallbackEnd: '.',
  },
  en: {
    discover: 'Discover', language: 'Language', footer: 'Multilingual audio stories, right where you are.',
    heroLine1: 'Every destination,', heroLine2: 'a story of its own.', heroSubtitle: 'Choose a place and hear its stories in your language.',
    explore: 'Explore places', featured: 'Featured points of interest', loadingFeatured: 'Loading points of interest...',
    featuredEmpty: 'Places will be added soon.', placesHeading: 'Choose a place to explore.', poiSingular: 'point of interest', poiPlural: 'points of interest',
    loadingPlaces: 'Loading places...', noPlaces: 'No published places yet.', defaultLocationDescription: 'Explore the stories and points of interest here.',
    placeCount: 'points', historyHeading: 'Recently played on this device.', clearHistory: 'Clear listening history', removeHistory: 'Remove this item from history',
    back: 'All places', locationPrefix: 'At', loadingContent: 'Loading narration...', missingContent: 'No narration is available for this place yet.',
    chooseOther: 'Choose another place', noAudio: 'Audio is not available for this story yet.',
    languageHint: 'Choose another language above to hear its version of this story.',
    fallbackLead: 'No ', fallbackMiddle: ' version is available; showing ', fallbackEnd: '.',
  },
} as const;

type VisitorCopy = typeof VISITOR_COPY[keyof typeof VISITOR_COPY];

function VisitorApp() {
  const params = new URLSearchParams(window.location.search);
  const poiParam = params.get('poiId');
  const poiId = poiParam ? Number(poiParam) : null;
  const isQrSource = params.get('source') === 'qr' || params.has('qr');
  const [language, setLanguage] = useState(params.get('language') ?? 'vi');
  const [content, setContent] = useState<ApiContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [pois, setPois] = useState<ApiPoi[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState('');
  const [history, setHistory] = useState<{ title: string; poiId: number; listenedAt: string }[]>([]);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [availableLanguages, setAvailableLanguages] = useState<ApiLanguage[]>([
    { code: 'vi', name: 'Tiếng Việt', isActive: true, isFallback: false },
    { code: 'en', name: 'English', isActive: true, isFallback: true },
  ]);
  const copy: VisitorCopy = language.toLowerCase() === 'vi' ? VISITOR_COPY.vi : VISITOR_COPY.en;

  useEffect(() => {
    let mounted = true;
    void api.languages('').then((configured) => {
      if (!mounted) return;
      const byCode = new Map<string, ApiLanguage>([
        ['vi', { code: 'vi', name: 'Tiếng Việt', isActive: true, isFallback: false }],
        ['en', { code: 'en', name: 'English', isActive: true, isFallback: true }],
        ...configured.filter((item) => item.isActive).map((item) => [item.code, item] as [string, ApiLanguage]),
      ]);
      setAvailableLanguages([...byCode.values()]);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const sessionKey = getVisitorSessionKey();
    const sendHeartbeat = () => {
      if (document.visibilityState !== 'visible') return;
      void api.recordPresence({ anonymousSessionKey: sessionKey }).catch(() => undefined);
    };
    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 30_000);
    document.addEventListener('visibilitychange', sendHeartbeat);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', sendHeartbeat); };
  }, []);

  useEffect(() => {
    const sessionKey = getVisitorSessionKey();
    void api.recordEvent({
      eventId: safeRandomUUID(),
      eventType: 'PAGE_VIEW',
      poiId: poiId ?? undefined,
      languageCode: language,
      anonymousSessionKey: sessionKey,
    }).catch(() => undefined);

    if (isQrSource) {
      void api.recordEvent({
        eventId: safeRandomUUID(),
        eventType: 'QR_OPEN',
        poiId: poiId ?? undefined,
        languageCode: language,
        anonymousSessionKey: sessionKey,
      }).catch(() => undefined);
    }
  }, [poiId]);

  useEffect(() => {
    if (!poiId) {
      setContent(null); setError(''); setLoading(false); return;
    }
    setLoading(true);
    api.visitorContent(poiId, language)
      .then((nextContent) => { setContent(nextContent); setError(''); })
      .catch((reason: unknown) => { setContent(null); setError(reason instanceof Error ? reason.message : 'Content is unavailable'); })
      .finally(() => setLoading(false));
  }, [poiId, language]);

  useEffect(() => {
    if (!poiId) return;
    let mounted = true;
    const refreshContent = () => { void api.visitorContent(poiId, language).then((next) => { if (mounted) { setContent(next); setError(''); } }).catch((reason: unknown) => { if (mounted) { setContent(null); setError(reason instanceof Error ? reason.message : 'Content is unavailable'); } }); };
    const timer = window.setInterval(refreshContent, 15_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [poiId, language]);

  useEffect(() => {
    let mounted = true;
    const refreshPlaces = () => { void Promise.all([api.visitorLocations(), api.visitorPois()]).then(([nextLocations, nextPois]) => { if (!mounted) return; setLocations(nextLocations.filter((location) => location.isActive)); setPois(nextPois.filter((poi) => poi.isActive)); setPlacesError(''); }).catch((reason: unknown) => { if (mounted) setPlacesError(reason instanceof Error ? reason.message : 'Could not load places'); }).finally(() => { if (mounted) setPlacesLoading(false); }); };
    refreshPlaces();
    const timer = window.setInterval(refreshPlaces, 15_000);
    try { setHistory(JSON.parse(localStorage.getItem('audio-guide-history') ?? '[]')); } catch { setHistory([]); }
    return () => { mounted = false; window.clearInterval(timer); };
  }, []);

  const rememberListening = (title: string) => {
    if (!poiId) return;
    const next = [{ title, poiId, listenedAt: new Date().toISOString() }, ...history.filter((item) => item.poiId !== poiId)].slice(0, 10);
    setHistory(next); localStorage.setItem('audio-guide-history', JSON.stringify(next));
  };
  const clearHistory = () => { setHistory([]); localStorage.removeItem('audio-guide-history'); };
  const removeHistoryItem = (removeId: number, event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    const next = history.filter((item) => item.poiId !== removeId);
    setHistory(next); localStorage.setItem('audio-guide-history', JSON.stringify(next));
  };
  const visitorAudioUrl = content?.audio?.filePath?.startsWith('/media/') ? `${API_URL.replace(/\/api\/?$/, '')}${content.audio.filePath}` : undefined;
  const translate = (translations: { languageCode: string; name: string }[]) => translations.find((item) => item.languageCode === language)?.name ?? translations.find((item) => item.languageCode === 'en')?.name ?? '';
  const translateLocation = (translations: ApiLocation['translations']) => translations.find((item) => item.languageCode === language)?.name ?? translations.find((item) => item.languageCode === 'en')?.name ?? '';
  const point = pois.find((item) => item.id === poiId);
  const pointName = translate(point?.translations ?? []);
  const parentLocation = locations.find((item) => item.id === point?.locationId);
  const locationName = translateLocation(parentLocation?.translations ?? []);
  const visitorShell = (children: ReactNode) => <div className="visitor-page"><header className="visitor-nav"><a className="visitor-brand" href="/">audio guide</a><nav className="visitor-nav-links" aria-label={copy.discover}><a href="/">{copy.discover}</a></nav><label className="visitor-language">{copy.language}<select value={language} onChange={(event) => { setLanguage(event.target.value); const next = new URL(window.location.href); next.searchParams.set('language', event.target.value); window.history.replaceState(null, '', next); }}>{availableLanguages.filter((item) => item.isActive).map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label></header>{children}<footer className="visitor-footer"><a href="/">audio guide</a><span>{copy.footer}</span></footer></div>;

  if (!poiId) {
    return visitorShell(<main className="visitor-home"><section className="visitor-hero"><div className="visitor-hero-copy"><h1>{copy.heroLine1}<br />{copy.heroLine2}</h1><p>{copy.heroSubtitle}</p><a className="visitor-primary" href="#visitor-places">{copy.explore} <span aria-hidden="true">&#x2193;</span></a></div><div className="visitor-featured" aria-label={copy.featured}>{placesLoading ? <p>{copy.loadingFeatured}</p> : pois.length ? pois.slice(0, 3).map((poi, index) => <a key={poi.id} href={`/visitor?poiId=${poi.id}&language=${language}`}><span>0{index + 1}</span><strong>{translate(poi.translations)}</strong><small>{translateLocation(locations.find((location) => location.id === poi.locationId)?.translations ?? [])}</small><span aria-hidden="true">&#x2197;</span></a>) : <p>{placesError || copy.featuredEmpty}</p>}</div></section><section className="visitor-home-section" id="visitor-places"><div className="visitor-home-heading"><div><h2>{copy.placesHeading}</h2></div><span>{pois.length} {pois.length === 1 ? copy.poiSingular : copy.poiPlural}</span></div>{placesLoading ? <p className="visitor-loading">{copy.loadingPlaces}</p> : placesError ? <p className="visitor-empty">{placesError}</p> : locations.length === 0 ? <p className="visitor-empty">{copy.noPlaces}</p> : <div className="visitor-place-list">{locations.map((location) => { const placePois = pois.filter((poi) => poi.locationId === location.id); const placeDescription = location.translations.find((item) => item.languageCode === language)?.shortDescription ?? location.translations.find((item) => item.languageCode === 'en')?.shortDescription ?? copy.defaultLocationDescription; return <article className="visitor-place" key={location.id}><div className="visitor-place-copy"><h3>{translateLocation(location.translations)}</h3><p>{placeDescription}</p><div className="visitor-place-pois">{placePois.map((poi) => <a key={poi.id} href={`/visitor?poiId=${poi.id}&language=${language}`}>{translate(poi.translations)} <span aria-hidden="true">&#x2197;</span></a>)}</div></div><span className="visitor-place-count">{placePois.length} {copy.placeCount}</span></article>; })}</div>}</section>{history.length > 0 && <section className="visitor-home-section visitor-recent"><div className="visitor-home-heading"><div><h2>{copy.historyHeading}</h2></div><button className="quiet-button" onClick={clearHistory}>{copy.clearHistory}</button></div>{history.map((item) => <a className="visitor-history-row" key={item.poiId} href={`/visitor?poiId=${item.poiId}&language=${language}`}><span>{item.title}</span><small>{new Date(item.listenedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</small><button type="button" className="history-remove-btn" title={copy.removeHistory} aria-label={copy.removeHistory} onClick={(event) => removeHistoryItem(item.poiId, event)}>&times;</button><span aria-hidden="true">&#x2197;</span></a>)}</section>}</main>);
  }

  const fallback = Boolean(content && content.languageCode.toLowerCase() !== language.toLowerCase());
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const nextPoi = point ? pois.find((item) => item.locationId === point.locationId && item.id !== point.id) : undefined;
  const toggleAudio = () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) void audio.play(); else audio.pause(); };
  const seekAudio = (seconds: number) => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audioDuration, audioTime + seconds)); };
  const setRate = () => { const next = playbackRate >= 2 ? 0.75 : playbackRate + 0.25; setPlaybackRate(next); if (audioRef.current) audioRef.current.playbackRate = next; };
  const audioLabel = language === 'vi' ? 'Thuy\u1ebft minh' : 'Narration';
  return visitorShell(<main className="visitor-detail"><a className="visitor-detail-back" href="/"><span aria-hidden="true">&#x2190;</span> {copy.back}</a>{loading ? <div className="visitor-loading">{copy.loadingContent}</div> : error ? <div className="visitor-error"><h1>{copy.missingContent}</h1><p>{error}</p><a href="/">{copy.chooseOther}</a></div> : content ? <><div className="visitor-cover" role="img" aria-label={locationName || pointName} /><section className="visitor-detail-content">{fallback && <p className="visitor-fallback-note">{copy.fallbackLead}{languageName(language, language.toLowerCase() === 'vi' ? 'vi' : 'en')}{copy.fallbackMiddle}{languageName(content.languageCode, language.toLowerCase() === 'vi' ? 'vi' : 'en')}{copy.fallbackEnd}</p>}<p className="visitor-kicker">{locationName || (language === 'vi' ? '\u0110i\u1ec3m tham quan' : 'Point of interest')}</p><h1>{content.title || pointName}</h1><section className="visitor-audio-card" aria-label={audioLabel}>{visitorAudioUrl ? <audio ref={audioRef} preload="metadata" src={visitorAudioUrl} onLoadedMetadata={(event) => setAudioDuration(event.currentTarget.duration || 0)} onTimeUpdate={(event) => setAudioTime(event.currentTarget.currentTime)} onPlay={() => { setAudioPlaying(true); rememberListening(content.title); void api.recordEvent({ eventId: crypto.randomUUID(), eventType: 'AUDIO_START', poiId, languageCode: language }); }} onPause={() => setAudioPlaying(false)} onEnded={() => setAudioPlaying(false)} /> : null}<div className="visitor-audio-heading"><button className="visitor-audio-play" disabled={!visitorAudioUrl} onClick={toggleAudio} aria-label={audioPlaying ? (language === 'vi' ? 'T\u1ea1m d\u1eebng' : 'Pause') : (language === 'vi' ? 'Ph\u00e1t thuy\u1ebft minh' : 'Play narration')}>{audioPlaying ? <span aria-hidden="true">&#x275A;&#x275A;</span> : <span aria-hidden="true">&#x25B6;</span>}</button><div><strong>{language === 'vi' ? 'Nghe thuy\u1ebft minh' : 'Listen to the story'}</strong><p>{visitorAudioUrl ? `${formatTime(audioDuration)} ? ${languageName(content.languageCode, language === 'vi' ? 'vi' : 'en')}` : copy.noAudio}</p></div></div>{visitorAudioUrl && <><input className="visitor-audio-progress" aria-label={language === 'vi' ? 'V\u1ecb tr\u00ed ph\u00e1t' : 'Playback position'} type="range" min={0} max={audioDuration || 1} value={Math.min(audioTime, audioDuration || 1)} onChange={(event) => { const time = Number(event.target.value); setAudioTime(time); if (audioRef.current) audioRef.current.currentTime = time; }} /><div className="visitor-audio-controls"><button onClick={() => seekAudio(-15)}>&minus;15 {language === 'vi' ? 'gi\u00e2y' : 'sec'}</button><span>{formatTime(audioTime)} / {formatTime(audioDuration)}</span><button onClick={setRate}>{playbackRate}&times;</button><button onClick={() => seekAudio(15)}>+15 {language === 'vi' ? 'gi\u00e2y' : 'sec'}</button></div></>}</section><p className="visitor-narration">{content.narrationText}</p><section className="visitor-transcript"><button onClick={() => setTranscriptExpanded((value) => !value)}><span>{language === 'vi' ? 'B\u1ea3n ch\u00e9p l\u1eddi' : 'Transcript'}</span><span aria-hidden="true">{transcriptExpanded ? '\u2212' : '+'}</span></button>{transcriptExpanded && <div className="visitor-transcript-text">{content.narrationText}</div>}</section>{nextPoi && <a className="visitor-next-poi" href={`/visitor?poiId=${nextPoi.id}&language=${language}`}><span className="visitor-kicker">{language === 'vi' ? '\u0110i\u1ec3m ti\u1ebfp theo trong' : 'Next point in'} {locationName}</span><strong>{translate(nextPoi.translations)}</strong><span aria-hidden="true">&#x2192;</span></a>}<div className="visitor-detail-actions"><button onClick={() => { if (navigator.share) void navigator.share({ title: content.title, url: window.location.href }); else void navigator.clipboard?.writeText(window.location.href); }}>{language === 'vi' ? 'Chia s\u1ebb' : 'Share'}</button><a href={`mailto:?subject=${encodeURIComponent(language === 'vi' ? 'B\u00e1o l\u1ed7i n\u1ed9i dung' : 'Report content issue')}&body=${encodeURIComponent(window.location.href)}`}>{language === 'vi' ? 'B\u00e1o l\u1ed7i n\u1ed9i dung' : 'Report an issue'}</a></div></section>{visitorAudioUrl && <div className="visitor-sticky-player"><div className="visitor-sticky-progress"><span style={{ width: `${audioDuration ? Math.min(100, audioTime / audioDuration * 100) : 0}%` }} /></div><button className="visitor-sticky-play" onClick={toggleAudio} aria-label={audioPlaying ? 'Pause' : 'Play'}>{audioPlaying ? '\u275A\u275A' : '\u25B6'}</button><div><strong>{content.title}</strong><p>{formatTime(audioTime)} / {formatTime(audioDuration)}</p></div><button className="visitor-sticky-rate" onClick={setRate}>{playbackRate}&times;</button></div>}</> : null}</main>);
}

function CatalogPanel({ section, token, onToast, onPoisChange }: { section: string; token: string; onToast: (message: string) => void; onPoisChange?: (pois: ApiPoi[]) => void }) {
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [pois, setPois] = useState<ApiPoi[]>([]);
  const [voices, setVoices] = useState<ApiVoice[]>([]);
  const [entityKind, setEntityKind] = useState<'location' | 'poi'>('poi');
  const [form, setForm] = useState({ code: 'vi', name: '', nameVi: '', nameEn: '', locationId: '', title: '', voice: '' });
  const [busy, setBusy] = useState(false);
  const [panelMessage, setPanelMessage] = useState('');
  const reload = async () => {
    if (section === 'Ngôn ngữ & giọng đọc') {
      const [nextLanguages, nextVoices] = await Promise.all([api.languages(token), api.voices(token)]);
      setLanguages(nextLanguages);
      setVoices(nextVoices);
    }
    if (section === 'Địa điểm & POI') {
      const [nextLocations, nextPois] = await Promise.all([api.locations(token), api.pois(token)]);
      setLocations(nextLocations);
      setPois(nextPois);
      onPoisChange?.(nextPois);
    }
  };
  const toggleCatalog = async (kind: 'location' | 'poi', id: number, isActive: boolean) => {
    try {
      if (kind === 'location') await api.setLocationActive(token, id, !isActive);
      else await api.setPoiActive(token, id, !isActive);
      await reload();
      onToast(isActive ? 'Đã tắt bản ghi.' : 'Đã bật bản ghi.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái');
    }
  };
  const deleteLocation = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) return;
    try {
      await api.deleteLocation(token, id);
      await reload();
      setPanelMessage('Đã xóa địa điểm thành công.');
      onToast('Đã xóa địa điểm.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể xóa địa điểm';
      setPanelMessage(msg);
      onToast(msg);
      window.alert(msg);
    }
  };
  const deletePoi = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa điểm tham quan (POI) này?')) return;
    try {
      await api.deletePoi(token, id);
      await reload();
      setPanelMessage('Đã xóa POI thành công.');
      onToast('Đã xóa POI.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể xóa POI';
      setPanelMessage(msg);
      onToast(msg);
      window.alert(msg);
    }
  };
  useEffect(() => { void reload().catch((error: unknown) => onToast(error instanceof Error ? error.message : 'Không thể tải dữ liệu')); }, [section]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (section === 'Ngôn ngữ & giọng đọc') {
        if (form.name) await api.createLanguage(token, form.code, form.name);
        if (form.voice) await api.createVoice(token, form.code, form.voice);
      } else if (section === 'Địa điểm & POI') {
        if (entityKind === 'location') {
          const viName = form.nameVi.trim();
          const enName = form.nameEn.trim() || viName;
          if (!enName) {
            onToast('Vui lòng nhập tên địa điểm');
            setBusy(false);
            return;
          }
          const translations = [
            { languageCode: 'en', name: enName },
            ...(viName && viName !== enName ? [{ languageCode: 'vi', name: viName }] : [{ languageCode: 'vi', name: viName || enName }]),
          ];
          await api.createLocation(token, translations);
        } else {
          if (!form.locationId) {
            onToast('Vui lòng chọn Địa điểm cha cho POI');
            setBusy(false);
            return;
          }
          const viName = form.nameVi.trim();
          const enName = form.nameEn.trim() || viName;
          if (!enName) {
            onToast('Vui lòng nhập tên điểm tham quan (POI)');
            setBusy(false);
            return;
          }
          const translations = [
            { languageCode: 'en', name: enName },
            ...(viName && viName !== enName ? [{ languageCode: 'vi', name: viName }] : [{ languageCode: 'vi', name: viName || enName }]),
          ];
          await api.createPoi(token, Number(form.locationId), translations);
        }
      }
      await reload();
      setForm({ ...form, name: '', nameVi: '', nameEn: '', voice: '' });
      onToast('Đã lưu thay đổi.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Không thể lưu');
    } finally {
      setBusy(false);
    }
  };
  const isLanguage = section === 'Ngôn ngữ & giọng đọc';
  return (
    <section className="catalog-panel">
      <div className="catalog-heading">
        <div><h2>{isLanguage ? 'Ngôn ngữ và giọng đọc.' : 'Địa điểm và điểm tham quan.'}</h2></div>
        <span className="catalog-count">{isLanguage ? `${languages.length} ngôn ngữ · ${voices.length} voice` : `${locations.length} địa điểm · ${pois.length} POI`}</span>
      </div>

      {!isLanguage && (
        <div className="segmented" style={{ width: 'fit-content', marginBottom: '18px' }} role="tablist" aria-label="Chọn loại bản ghi cần tạo">
          <button type="button" className={entityKind === 'location' ? 'is-selected' : ''} onClick={() => setEntityKind('location')}>
            Tạo Địa điểm (Location)
          </button>
          <button type="button" className={entityKind === 'poi' ? 'is-selected' : ''} onClick={() => setEntityKind('poi')}>
            Tạo Điểm tham quan (POI)
          </button>
        </div>
      )}

      <form className="crud-form" onSubmit={submit}>
        {isLanguage ? (
          <>
            <label>Mã ngôn ngữ<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="vi" required /></label>
            <label>Tên ngôn ngữ<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tiếng Việt" /></label>
            <label>ElevenLabs voice ID<input value={form.voice} onChange={(event) => setForm({ ...form, voice: event.target.value })} placeholder="21m00Tcm4TlvDq8ikWAM" /></label>
          </>
        ) : entityKind === 'location' ? (
          <>
            <label>Tên địa điểm (tiếng Việt)<input value={form.nameVi} onChange={(event) => setForm({ ...form, nameVi: event.target.value })} placeholder="Ví dụ: Hoàng Thành Thăng Long" required /></label>
            <label>Tên tiếng Anh (English)<input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} placeholder="Ví dụ: Imperial Citadel of Thang Long" /></label>
          </>
        ) : (
          <>
            <label>Thuộc địa điểm (Location cha)<select value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })} required><option value="">-- Chọn Địa điểm cha --</option>{locations.map((loc) => { const vi = loc.translations.find((t) => t.languageCode === 'vi')?.name; const en = loc.translations.find((t) => t.languageCode === 'en')?.name; return <option key={loc.id} value={loc.id}>{vi || en || `Location #${loc.id}`} (#{loc.id})</option>; })}</select></label>
            <label>Tên điểm tham quan (tiếng Việt)<input value={form.nameVi} onChange={(event) => setForm({ ...form, nameVi: event.target.value })} placeholder="Ví dụ: Kỳ Đài" required /></label>
            <label>Tên tiếng Anh (English)<input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} placeholder="Ví dụ: Flag Tower" /></label>
          </>
        )}
        <button className="primary-button" disabled={busy || (!isLanguage && entityKind === 'poi' && locations.length === 0)}>
          {busy ? 'Đang lưu…' : isLanguage ? 'Tạo bản ghi' : entityKind === 'location' ? 'Tạo địa điểm' : 'Tạo POI'}
        </button>
      </form>

      {panelMessage && <p className="toast" role="status" style={{ margin: '14px 0' }}>{panelMessage}</p>}

      <div className="crud-table">
        {isLanguage ? (
          <>
            {languages.map((item) => (
              <div className="crud-row" key={item.code}>
                <strong>{item.code.toUpperCase()}</strong>
                <span>{item.name}</span>
                <select value={item.defaultVoiceId ?? ''} onChange={(event) => { if (event.target.value) void api.setDefaultVoice(token, item.code, Number(event.target.value)).then(reload).then(() => onToast('Đã cập nhật voice mặc định.')).catch((error: unknown) => onToast(error instanceof Error ? error.message : 'Không thể cập nhật voice mặc định')); }}>
                  <option value="">Chọn voice mặc định</option>
                  {voices.filter((voice) => voice.languageCode === item.code && voice.isAvailable).map((voice) => <option key={voice.id} value={voice.id}>{voice.providerVoiceKey}</option>)}
                </select>
                <span className={`status status--${item.isActive ? 'published' : 'draft'}`}>{item.isActive ? 'Hoạt động' : 'Tạm tắt'}</span>
              </div>
            ))}
            {voices.map((voice) => (
              <div className="crud-row" key={voice.id}>
                <strong>Voice #{voice.id}</strong>
                <span>{voice.languageCode} · {voice.providerVoiceKey}</span>
                <span>{voice.isAvailable ? 'Sẵn sàng' : 'Tắt'}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ padding: '8px 4px 4px', gridColumn: '1 / -1', fontWeight: 600, color: 'var(--ink)' }}>
              1. Danh sách Địa điểm (Locations)
            </div>
            {locations.length === 0 ? <p className="empty-state">Chưa có địa điểm nào.</p> : locations.map((item) => (
              <div className="crud-row" key={`location-${item.id}`}>
                <strong>Location #{item.id}</strong>
                <span>{item.translations.map((translation) => translation.name).join(' · ')}</span>
                <span>{pois.filter((poi) => poi.locationId === item.id).length} POI trực thuộc</span>
                <span className={`status status--${item.isActive ? 'published' : 'draft'}`}>{item.isActive ? 'Hoạt động' : 'Tạm tắt'}</span>
                <button className="quiet-button" onClick={() => toggleCatalog('location', item.id, item.isActive)}>{item.isActive ? 'Tắt' : 'Bật'}</button>
                <button className="quiet-button" onClick={() => deleteLocation(item.id)}>Xóa</button>
              </div>
            ))}

            <div style={{ padding: '16px 4px 4px', gridColumn: '1 / -1', fontWeight: 600, color: 'var(--ink)' }}>
              2. Danh sách Điểm tham quan (POIs)
            </div>
            {pois.length === 0 ? <p className="empty-state">Chưa có POI nào.</p> : pois.map((item) => {
              const parentLoc = locations.find((l) => l.id === item.locationId);
              const parentName = parentLoc?.translations.find((t) => t.languageCode === 'vi')?.name || parentLoc?.translations[0]?.name || `Location #${item.locationId}`;
              return (
                <div className="crud-row" key={`poi-${item.id}`}>
                  <strong>POI #{item.id}</strong>
                  <span>{item.translations.map((translation) => translation.name).join(' · ')}</span>
                  <span>Thuộc: <strong>{parentName}</strong></span>
                  <span className={`status status--${item.isActive ? 'published' : 'draft'}`}>{item.isActive ? 'Hoạt động' : 'Tạm tắt'}</span>
                  <button className="quiet-button" onClick={() => toggleCatalog('poi', item.id, item.isActive)}>{item.isActive ? 'Tắt' : 'Bật'}</button>
                  <button className="quiet-button" onClick={() => deletePoi(item.id)}>Xóa</button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}

function QrPanel({ token, pois, onToast }: { token: string; pois: ApiPoi[]; onToast: (message: string) => void }) {
  const [codes, setCodes] = useState<ApiQr[]>([]);
  const [poiId, setPoiId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const reload = async () => setCodes(await api.qrCodes());
  useEffect(() => {
    void reload().catch((error: unknown) => {
      const text = error instanceof Error ? error.message : 'Không thể tải QR code';
      setMessage(text);
      onToast(text);
    });
  }, []);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!poiId) {
      setMessage('Vui lòng chọn POI trước khi tạo QR.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await api.saveQr(token, Number(poiId));
      await reload();
      setPoiId('');
      setMessage('Đã tạo hoặc cập nhật QR code thành công.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Không thể lưu QR code';
      setMessage(text);
      onToast(text);
    }
    finally { setBusy(false); }
  };
  const refreshAll = async () => {
    setBusy(true);
    setMessage('');
    try {
      await Promise.all(codes.map((code) => api.saveQr(token, code.poiId)));
      await reload();
      setMessage('Đã cập nhật link cho tất cả QR code.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Không thể cập nhật các link QR';
      setMessage(text);
      onToast(text);
    } finally { setBusy(false); }
  };
  const download = (code: ApiQr) => {
    const canvas = document.getElementById(`qr-canvas-${code.id}`) as HTMLCanvasElement | null;
    if (!canvas) {
      setMessage('Không thể tạo ảnh QR để tải xuống.');
      return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-poi-${code.poiId}.png`;
    link.click();
  };
  return <section className="catalog-panel"><div className="catalog-heading"><div><h2>QR code cho từng điểm tham quan.</h2><p className="form-note">Ảnh QR được tạo từ đường dẫn visitor và có thể tải xuống để in.</p></div><span className="catalog-count">{codes.length} QR code</span></div><form className="crud-form qr-form" onSubmit={save}><label>POI<select value={poiId} onChange={(event) => setPoiId(event.target.value)} required disabled={busy}><option value="">Chọn POI</option>{pois.map((poi) => { const name = poi.translations.find((item) => item.languageCode === 'vi')?.name ?? poi.translations.find((item) => item.languageCode === 'en')?.name ?? `POI #${poi.id}`; return <option key={poi.id} value={poi.id}>POI #{poi.id} · {name}</option>; })}</select></label><p className="form-note">Đường dẫn visitor sẽ được hệ thống tự tạo theo POI và ngôn ngữ mặc định.</p>{pois.length === 0 && <p className="empty-state">Chưa có POI khả dụng. Hãy tạo POI ở mục “Địa điểm & POI” trước.</p>}<button type="submit" className="primary-button" disabled={busy || pois.length === 0}>{busy ? 'Đang lưu…' : 'Tạo hoặc cập nhật QR'}</button>{message && <p className="toast" role="status">{message}</p>}</form>{codes.length > 0 && <button className="quiet-button qr-refresh-all" type="button" disabled={busy} onClick={() => void refreshAll()}>{busy ? 'Đang cập nhật…' : 'Cập nhật link cho tất cả QR'}</button>}<div className="qr-card-grid">{codes.map((code) => { const poi = pois.find((item) => item.id === code.poiId); const name = poi?.translations.find((item) => item.languageCode === 'vi')?.name ?? poi?.translations.find((item) => item.languageCode === 'en')?.name ?? `POI #${code.poiId}`; return <article className="qr-card" key={code.id}><div className="qr-card-image"><QRCodeCanvas id={`qr-canvas-${code.id}`} value={code.targetUrl} size={224} level="H" marginSize={2} title={`QR code for ${name}`} /></div><div className="qr-card-content"><div><span className="qr-card-kicker">QR #{code.id}</span><h3>{name}</h3></div><a className="qr-card-url" href={code.targetUrl} target="_blank" rel="noreferrer">{code.targetUrl}</a><div className="qr-card-actions"><a className="quiet-button" href={code.targetUrl} target="_blank" rel="noreferrer">Mở visitor ↗</a><button className="primary-button" type="button" onClick={() => download(code)}>Tải PNG</button></div></div></article>; })}{codes.length === 0 && <p className="empty-state">Chưa có QR code. Chọn POI để tạo đường dẫn tự động.</p>}</div></section>;
}

function UserPanel({ token, onToast }: { token: string; onToast: (message: string) => void }) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [assignments, setAssignments] = useState<Record<number, number[]>>({});
  const [form, setForm] = useState({ username: '', email: '', password: '', roleName: 'CONTENT_MANAGER' });
  const [busy, setBusy] = useState(false);
  const reload = async () => {
    const [nextUsers, nextLocations] = await Promise.all([api.users(token), api.locations(token)]);
    setUsers(nextUsers); setLocations(nextLocations);
    const pairs = await Promise.all(nextUsers.map(async (user) => [user.id, await api.userLocations(token, user.id)] as const));
    setAssignments(Object.fromEntries(pairs));
  };
  useEffect(() => { void reload().catch((error: unknown) => onToast(error instanceof Error ? error.message : 'Không thể tải người dùng')); }, []);
  const create = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try { await api.createUser(token, form.username, form.email, form.password, form.roleName); await reload(); setForm({ username: '', email: '', password: '', roleName: 'CONTENT_MANAGER' }); onToast('Đã tạo người dùng.'); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Không thể tạo người dùng'); }
    finally { setBusy(false); }
  };
  const toggle = async (user: ApiUser) => {
    try { await api.setUserActive(token, user.id, !user.isActive); await reload(); onToast(user.isActive ? 'Đã khóa tài khoản.' : 'Đã kích hoạt tài khoản.'); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Không thể cập nhật tài khoản'); }
  };
  const assign = async (userId: number, locationId: number) => {
    try { await api.assignUserLocation(token, userId, locationId); setAssignments((current) => ({ ...current, [userId]: [...(current[userId] ?? []), locationId] })); onToast('Đã gán location cho người dùng.'); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Không thể gán location'); }
  };
  return <section className="catalog-panel"><div className="catalog-heading"><div><h2>Người dùng workspace.</h2></div><span className="catalog-count">{users.length} tài khoản</span></div><form className="crud-form user-form" onSubmit={create}><label>Tên đăng nhập<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Mật khẩu<input type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label><label>Vai trò<select value={form.roleName} onChange={(event) => setForm({ ...form, roleName: event.target.value })}><option value="CONTENT_MANAGER">Content Manager</option><option value="ADMIN">Admin</option></select></label><button className="primary-button" disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo người dùng'}</button></form><div className="crud-table">{users.map((user) => <div className="crud-row user-row" key={user.id}><strong>{user.username}</strong><span>{user.email}</span><span>{user.role === 'CONTENT_MANAGER' ? 'Content Manager' : user.role}</span><select value="" onChange={(event) => { if (event.target.value) void assign(user.id, Number(event.target.value)); }}><option value="">Gán location…</option>{locations.filter((location) => !(assignments[user.id] ?? []).includes(location.id)).map((location) => <option key={location.id} value={location.id}>Location #{location.id}</option>)}</select><small>{(assignments[user.id] ?? []).map((id) => `Location #${id}`).join(', ') || 'Chưa gán location'}</small><button className="quiet-button" onClick={() => toggle(user)}>{user.isActive ? 'Khóa' : 'Kích hoạt'}</button></div>)}</div></section>;
}

function OverviewPanel({ items, pois, voices, token }: { items: ContentItem[]; pois: ApiPoi[]; voices: ApiVoice[]; token: string }) {
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  useEffect(() => {
    let mounted = true;
    const refresh = () => { void api.analyticsSummary(token).then((result) => { if (mounted) setAnalytics(result); }).catch(() => undefined); };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [token]);
  const published = items.filter((item) => item.status === 'Đã xuất bản').length;
  const review = items.filter((item) => item.status === 'Chờ duyệt').length;
  return <section className="overview-panel"><div className="overview-intro"><h2>Hệ thống đang giữ nhịp cho những câu chuyện địa phương.</h2><p className="overview-range">{analytics ? `${analytics.windowDays} ngày gần nhất` : 'Đang tải analytics'}</p><p>Kiểm tra nội dung, audio và điểm truy cập visitor từ một nơi.</p></div><div className="overview-metrics"><article><strong>{items.length}</strong><span>phiên bản nội dung</span></article><article><strong>{published}</strong><span>đã xuất bản</span></article><article><strong>{review}</strong><span>chờ duyệt</span></article><article><strong>{pois.length}</strong><span>điểm tham quan · {voices.length} giọng đọc</span></article><article><strong>{analytics?.pageViews ?? '—'}</strong><span>lượt mở visitor</span></article><article><strong>{analytics?.qrOpens ?? '—'}</strong><span>lượt mở QR</span></article><article><strong>{analytics?.audioStarts ?? '—'}</strong><span>lượt bắt đầu audio</span></article><article><strong>{analytics ? `${Math.round(analytics.listeningMs / 60000)}m` : '—'}</strong><span>thời lượng nghe</span></article><article><strong>{analytics?.activeVisitors ?? '—'}</strong><span>đang truy cập · 2 phút gần nhất</span></article></div><div className="overview-actions"><button className="quiet-button" onClick={() => window.open('/visitor', '_blank')}>Mở trang visitor <span>↗</span></button><span>Analytics lấy trực tiếp từ activity_event; lượt đang truy cập cập nhật mỗi 30 giây.</span></div></section>;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('audio-guide-token') ?? '');
  const [login, setLogin] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState('Nội dung');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [voices, setVoices] = useState<ApiVoice[]>([]);
  const [pois, setPois] = useState<ApiPoi[]>([]);
  const [selectedId, setSelectedId] = useState(1);
  const [showVisitor, setShowVisitor] = useState(false);
  const [history, setHistory] = useState<ApiReviewEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'NEEDS_REVIEW' | 'PUBLISHED'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [showDetail, setShowDetail] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isContentPage = activeNav === 'N\u1ed9i dung';
  const [newContent, setNewContent] = useState({ poiId: '', languageCode: 'vi', title: '', narrationText: '' });
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? initialItems[0];
  const isDirty = editTitle !== selected.title || editBody !== selected.body;
  const audioReady = Boolean(selected.hasAudio && !isDirty);
  const fieldsReady = Boolean(editTitle.trim() && editBody.trim());
  const sourceCounterpart = items.find((item) => item.poiId === selected.poiId && item.languageCode !== selected.languageCode);
  const pendingCount = useMemo(() => items.filter((item) => item.status === 'Chờ duyệt').length, [items]);
  useEffect(() => { setEditTitle(selected.title); setEditBody(selected.body); }, [selected.id, selected.title, selected.body]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const refresh = async (initial = false) => {
      try {
        const [content, availableVoices, availablePois] = await Promise.all([api.content(token), api.voices(token), api.pois(token)]);
        if (!mounted) return;
        const nextItems = content.map(mapContent);
        setItems(nextItems);
        setSelectedId((current) => nextItems.some((item) => item.id === current) ? current : nextItems[0]?.id ?? current);
        setVoices(availableVoices);
        setPois(availablePois);
      } catch (error) {
        if (!mounted) return;
        if (initial) {
          setToken('');
          localStorage.removeItem('audio-guide-token');
          setLoginError(error instanceof Error ? error.message : 'Could not load content');
        } else setToast(error instanceof Error ? error.message : 'Could not refresh content');
      } finally { if (mounted && initial) setLoading(false); }
    };
    setLoading(true);
    void refresh(true);
    const timer = window.setInterval(() => { void refresh(); }, 15_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [token]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const result = await api.login(login.username, login.password);
      localStorage.setItem('audio-guide-token', result.accessToken);
      setToken(result.accessToken);
    } catch (error) {
      setLoginError(error instanceof ApiError ? error.message : 'Đăng nhập thất bại');
    } finally { setLoading(false); }
  };

  const publishSelected = async () => {
    if (!selected?.versionId) return;
    try {
      const published = await api.transition(token, selected.versionId, 'publish');
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, rawStatus: published.status, status: 'Đã xuất bản', updated: 'Vừa xong' } : item));
      setToast('Đã xuất bản phiên bản hiện tại.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Không thể xuất bản'); }
  };

  const transitionSelected = async (action: 'submit' | 'withdraw' | 'approve' | 'unpublish' | 'republish' | 'reject') => {
    if (!selected?.versionId) return;
    const reason = action === 'reject' ? window.prompt('Lý do từ chối phiên bản:')?.trim() : undefined;
    if (action === 'reject' && !reason) return;
    try {
      const result = action === 'reject' ? await api.reject(token, selected.versionId, reason as string) : await api.transition(token, selected.versionId, action);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, rawStatus: result.status, needsReview: Boolean(result.needsReview), status: result.status === 'PENDING_REVIEW' ? 'Chờ duyệt' : result.status === 'APPROVED' ? 'Đã duyệt' : result.status === 'PUBLISHED' ? 'Đã xuất bản' : result.status === 'UNPUBLISHED' ? 'Đã gỡ xuất bản' : result.status === 'REJECTED' ? 'Cần rà soát' : 'Đang soạn', updated: 'Vừa cập nhật' } : item));
      setToast(`Đã thực hiện: ${action}.`);
    } catch (error) { setToast(error instanceof Error ? error.message : 'Không thể chuyển trạng thái'); }
  };

  const generateAudio = async () => {
    if (!selected?.versionId) return;
    const voice = voices.find((item) => item.languageCode.toUpperCase() === selected.language && item.isAvailable);
    if (!voice) { setToast(`Chưa có giọng đọc khả dụng cho ${selected.language}.`); return; }
    try {
      const generated = await api.elevenLabsAudio(token, selected.versionId, voice.id);
      const next = mapContent(generated, selected.id - 1);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...next, updated: 'Vừa tạo audio ElevenLabs' } : item));
      setToast('Đã tạo audio thật bằng ElevenLabs.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Không thể tạo audio'); }
  };

  const uploadAudio = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selected?.versionId) return;
    if (!['audio/mpeg', 'audio/mp3'].includes(file.type) && !file.name.toLowerCase().endsWith('.mp3')) {
      setToast('Chỉ hỗ trợ file định dạng MP3.');
      event.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast('Dung lượng audio tối đa là 10 MB.');
      event.target.value = '';
      return;
    }
    try {
      const uploaded = await api.uploadAudio(token, selected.versionId, file);
      const next = mapContent(uploaded, selected.id - 1);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...next, updated: 'Uploaded just now' } : item));
      setToast(`Đã ghi nhận file ${file.name}.`);
    } catch (error) { setToast(error instanceof Error ? error.message : 'Không thể upload audio'); }
    event.target.value = '';
  };

  const saveContent = async () => {
    if (!selected.versionId) return;
    try {
      const updated = await api.updateContent(token, selected.versionId, editTitle, editBody);
      const isTextSame = selected.body === editBody;
      const keepAudio = isTextSame && Boolean(selected.hasAudio);
      setItems((current) => current.map((item) => item.id === selected.id ? {
        ...item,
        title: updated.title,
        body: updated.narrationText,
        updated: 'Vừa chỉnh sửa',
        hasAudio: keepAudio,
        audioUrl: keepAudio ? item.audioUrl : undefined,
      } : item));
      setToast(isTextSame ? 'Đã lưu tiêu đề mới (audio được giữ nguyên).' : 'Đã lưu nội dung. Audio cũ đã hết hạn, cần tạo lại.');
      const next = mapContent(updated, selected.id - 1);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...next, updated: '\u0056\u1eeba c\u1eadp nh\u1eadt' } : item));
      setToast('Đã lưu nội dung. Audio cũ cần tạo lại.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Không thể lưu nội dung'); }
  };

  const deleteCurrentContent = async () => {
    if (!selected?.versionId) return;
    const actionName = selected.status === 'Đã gỡ xuất bản' ? 'bài viết đã gỡ xuất bản' : 'bản nháp';
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${actionName} "${selected.title}" (Phiên bản #${selected.versionId})?`)) return;
    try {
      await api.deleteContent(token, selected.versionId);
      const remaining = items.filter((item) => item.versionId !== selected.versionId);
      setItems(remaining);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
      setToast('Đã xóa thành công.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể xóa');
    }
  };

  const translateSelected = async () => {
    if (!selected?.versionId) return;
    const target = selected.languageCode === 'vi' ? 'en' : 'vi';
    try {
      const translated = await api.translateContent(token, selected.versionId, target);
      const next = mapContent(translated, items.length);
      setItems((current) => [...current, next]);
      setSelectedId(next.id);
      setSelectedId(next.id);
      setToast('Đã tạo bản dịch nháp, cần rà soát trước khi gửi duyệt.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Không thể dịch nội dung'); }
  };

  const openHistory = async () => {
    if (!selected.versionId) return;
    try { setHistory(await api.contentHistory(token, selected.versionId)); setShowHistory(true); }
    catch (error) { setToast(error instanceof Error ? error.message : 'Không thể tải lịch sử phiên bản'); }
  };

  const createContent = async (event: FormEvent) => {
    event.preventDefault();
    if (!newContent.poiId || !newContent.title.trim() || !newContent.narrationText.trim()) {
      setToast('Vui lòng nhập POI, tiêu đề và nội dung.');
      return;
    }
    try {
      const created = await api.createContent(token, Number(newContent.poiId), newContent.languageCode, newContent.title.trim(), newContent.narrationText.trim());
      const next = mapContent(created, items.length);
      setItems((current) => [...current, next]);
      setSelectedId(next.id);
      setShowDetail(true);
      setShowCreate(false);
      setNewContent({ poiId: '', languageCode: 'vi', title: '', narrationText: '' });
      setToast('Đã tạo nội dung mới ở trạng thái bản nháp.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể tạo nội dung');
    }
  };

  const visibleItems = items.filter((item) => {
    const matchesSearch = `${item.title} ${item.place} ${item.language}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'NEEDS_REVIEW' ? Boolean(item.needsReview) : item.rawStatus === statusFilter);
    return matchesSearch && matchesStatus;
  });

  if (!token) {
    return <div className="login-screen"><form className="login-card" onSubmit={signIn}><div className="brand login-brand"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><div><strong>audio guide</strong><small>Content studio</small></div></div><h1>Đăng nhập để quản lý nội dung.</h1><label>Tài khoản<input value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} autoComplete="username" required /></label><label>Mật khẩu<input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} autoComplete="current-password" required /></label>{loginError && <p className="login-error">{loginError}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Đang kết nối…' : 'Đăng nhập'}</button><small className="login-hint">API: {API_URL}</small></form></div>;
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><div><strong>audio guide</strong><small>Content studio</small></div><button type="button" className="sidebar-toggle" aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={() => setSidebarCollapsed((value) => !value)}>{sidebarCollapsed ? '\u00bb' : '\u00ab'}</button></div>
        <nav className="nav" aria-label="Điều hướng chính">
          {[['Tổng quan', '◌'], ['Nội dung', '▤'], ['Địa điểm & POI', '⌖'], ['Ngôn ngữ & giọng đọc', '文'], ['QR code', '⌁'], ['Người dùng', 'U']].map(([label, icon]) => (
            <button key={label} className={`nav-item ${activeNav === label ? 'is-active' : ''}`} onClick={() => { setActiveNav(label); setShowDetail(false); }}><Icon>{icon}</Icon><span>{label}</span>{label === 'Nội dung' && <b>{pendingCount}</b>}</button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="system-state"><span className="signal" /> Hệ thống đang hoạt động</div>
          <button className="account" onClick={() => { localStorage.removeItem('audio-guide-token'); setToken(''); setToast('Đã đăng xuất.'); }}><span className="avatar">AN</span><span><strong>An Nguyễn</strong><small>Đăng xuất</small></span><span className="account-chevron">⌄</span></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="breadcrumb">Studio / {activeNav}</span><h1>{activeNav}</h1></div>
          <div className="top-actions"><button className="quiet-button" aria-label="Thông báo" onClick={() => setToast(pendingCount > 0 ? `Có ${pendingCount} bài đang chờ duyệt.` : 'Không có thông báo mới.')}>Thông báo {pendingCount > 0 ? `(${pendingCount})` : ''}</button><button className="lang-button" title="Giao diện Content Studio (Tiếng Việt)">VI</button><button className="primary-button" onClick={() => setShowCreate(true)}>+ Tạo nội dung</button></div>
        </header>

        <section className="workspace">
          {(!isContentPage || !showDetail) && <div className="workspace-heading"><div><h2>Những câu chuyện đang chờ bạn hoàn thiện.</h2></div><button className="quiet-button" onClick={() => { setSearch(''); setStatusFilter('ALL'); setToast('Đã xóa bộ lọc.'); }}>Lọc & sắp xếp <span>⌄</span></button></div>}
          {toast && <p className="toast" role="status" style={{ margin: '0 0 16px' }}>{toast}</p>}
          {activeNav === 'Tổng quan' ? <OverviewPanel items={items} pois={pois} voices={voices} token={token} /> : activeNav === 'QR code' ? <QrPanel token={token} pois={pois} onToast={setToast} /> : activeNav === 'Người dùng' ? <UserPanel token={token} onToast={setToast} /> : activeNav !== 'Nội dung' ? <CatalogPanel section={activeNav} token={token} onToast={setToast} /> : <div className={`content-grid ${showDetail ? 'is-detail' : ''}`}>
            {!showDetail && <section className="content-list" aria-label="Content list">
              <div className="list-toolbar"><div className="content-filters" role="tablist" aria-label="Filter by status">{([['ALL','T\u1ea5t c\u1ea3'],['DRAFT','B\u1ea3n nh\u00e1p'],['PENDING_REVIEW','Ch\u1edd duy\u1ec7t'],['REJECTED','B\u1ecb t\u1eeb ch\u1ed1i'],['NEEDS_REVIEW','C\u1ea7n r\u00e0 so\u00e1t'],['PUBLISHED','\u0110\u00e3 xu\u1ea5t b\u1ea3n']] as const).map(([value,label]) => <button key={value} className={statusFilter === value ? 'is-selected' : ''} onClick={() => setStatusFilter(value)}>{label}<span>{value === 'ALL' ? items.length : items.filter((item) => value === 'NEEDS_REVIEW' ? item.needsReview : item.rawStatus === value).length}</span></button>)}</div><div className="list-tools"><label className="search-control"><Icon>&#x2315;</Icon><input aria-label={'T\u00ecm ki\u1ebfm n\u1ed9i dung'} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={'T\u00ecm ki\u1ebfm n\u1ed9i dung'} /></label><button className="quiet-button" onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}>{viewMode === 'list' ? 'Xem ma tr\u1eadn' : 'Xem danh s\u00e1ch'}</button></div></div>
              {viewMode === 'list' ? <div className="list-items">{visibleItems.map((item) => <button className="content-row" key={item.versionId ?? item.id} onClick={() => { setSelectedId(item.id); setShowDetail(true); setShowVisitor(false); setToast(''); }}><span className="row-index">{item.languageCode?.toUpperCase()}</span><span className="row-main"><strong>{item.title}</strong><small>{pois.find((poi) => poi.id === item.poiId)?.translations.find((translation) => translation.languageCode === 'en')?.name ?? item.place}</small></span><span className="row-meta"><span className="language-chip">{languageName(item.languageCode ?? item.language)}</span><StatusBadge status={item.status} /></span><span className="row-time">{item.updated}</span></button>)}</div> : <div className="content-matrix"><div className="matrix-row matrix-head"><strong>&#x110;i&#x1EC3;m tham quan</strong><span>Ti&#x1EBF;ng Vi&#x1EC7;t</span><span>Ti&#x1EBF;ng Anh</span></div>{pois.map((poi) => <div className="matrix-row" key={poi.id}><strong>{poi.translations.find((translation) => translation.languageCode === 'en')?.name ?? `POI #${poi.id}`}</strong>{['vi','en'].map((languageCode) => { const cell = items.find((item) => item.poiId === poi.id && item.languageCode === languageCode); return cell ? <button key={languageCode} className="matrix-cell" onClick={() => { setSelectedId(cell.id); setViewMode('list'); setShowDetail(true); }}>{cell.needsReview ? 'C\u1ea7n r\u00e0 so\u00e1t' : cell.status}</button> : <button key={languageCode} className="matrix-cell is-empty" onClick={() => setToast('Chua co noi dung cho ngon ngu nay. Hay tao ban nhap moi.')}>Ch&#x1B0;a c&#xF3;</button>; })}</div>)}</div>}
              <button className="load-more" onClick={() => setToast(`${visibleItems.length} n&#x1ED9;i dung`)}>{visibleItems.length} n&#x1ED9;i dung</button>
            </section>}

            {showDetail && <section className="detail-panel content-studio" aria-label="Content details">
              <button type="button" className="detail-back quiet-button" onClick={() => setShowDetail(false)}>&#x2190; Quay l&#x1EA1;i danh s&#xE1;ch</button>
              <div className="studio-title-row"><div><p className="studio-eyebrow">CONTENT STUDIO / {languageName(selected.languageCode ?? selected.language)}</p><h2>{selected.title}</h2></div><StatusBadge status={selected.status} /></div>
              <div className="studio-steps"><span className={isDirty || !fieldsReady ? 'is-current' : 'is-complete'}>1 Draft</span><span className={selected.needsReview ? 'is-current' : 'is-complete'}>2 Translate</span><span className={!audioReady ? 'is-current' : 'is-complete'}>3 Audio</span><span className={fieldsReady && audioReady && !selected.needsReview && !isDirty ? 'is-current' : ''}>4 Submit</span></div>
              <div className="studio-editor-grid">
                <section className="source-column"><div className="column-heading"><div><small>B&#x1EA3;n ngu&#x1ED3;n / Ch&#x1EC9; &#x111;&#x1ECD;c</small><strong>{sourceCounterpart?.title ?? 'No source version to compare'}</strong></div><span>{sourceCounterpart?.languageCode ? languageName(sourceCounterpart.languageCode) : ''}</span></div><p className="source-copy">{sourceCounterpart?.body ?? 'The source text appears here for translated versions.'}</p><small className="character-count">{(sourceCounterpart?.body ?? '').length.toLocaleString('vi-VN')} characters</small></section>
                <section className="translation-column"><div className="column-heading"><div><small>B&#x1EA3;n &#x111;ang so&#x1EA1;n / C&#xF3; th&#x1EC3; ch&#x1EC9;nh s&#x1EED;a</small><strong>{pois.find((poi) => poi.id === selected.poiId)?.translations.find((translation) => translation.languageCode === 'en')?.name ?? selected.place}</strong></div><span>{languageName(selected.languageCode ?? selected.language)}</span></div><label className="editor-field">Ti&#xEA;u &#x111;&#x1EC1;<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} disabled={!['DRAFT', 'REJECTED'].includes(selected.rawStatus ?? '')} /></label><label className="editor-field">N&#x1ED9;i dung thuy&#x1EBF;t minh<textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} disabled={!['DRAFT', 'REJECTED'].includes(selected.rawStatus ?? '')} rows={7} /></label><div className="editor-meta"><span>{editBody.length.toLocaleString('vi-VN')} k&#xFD; t&#x1EF1;</span></div></section>
              </div>
              <section className="readiness-card"><div><strong>&#x110;i&#x1EC1;u ki&#x1EC7;n g&#x1EED;i duy&#x1EC7;t</strong><span>Ho&#xE0;n t&#x1EA5;t c&#xE1;c m&#x1EE5;c c&#xF2;n thi&#x1EBF;u tr&#x1B0;&#x1EDB;c khi g&#x1EED;i duy&#x1EC7;t.</span></div><ul><li className={editTitle.trim() ? 'is-ready' : 'is-missing'}>{editTitle.trim() ? <span>&#x2713;</span> : <span>&#x25CB;</span>} C&#xF3; ti&#xEA;u &#x111;&#x1EC1;</li><li className={editBody.trim() ? 'is-ready' : 'is-missing'}>{editBody.trim() ? <span>&#x2713;</span> : <span>&#x25CB;</span>} C&#xF3; v&#x103;n b&#x1EA3;n</li><li className={audioReady ? 'is-ready' : 'is-missing'}>{audioReady ? <span>&#x2713;</span> : <span>&#x25CB;</span>} Audio h&#x1EE3;p l&#x1EC7;, m&#x1EDB;i nh&#x1EA5;t</li><li className={!selected.needsReview ? 'is-ready' : 'is-missing'}>{!selected.needsReview ? <span>&#x2713;</span> : <span>&#x25CB;</span>} &#x110;&#xE3; ho&#xE0;n t&#x1EA5;t r&#xE0; so&#xE1;t</li></ul>{selected.needsReview && <button className="primary-button" onClick={async () => { if (!selected.versionId) return; try { const reviewed = await api.confirmReviewed(token, selected.versionId); const next = mapContent(reviewed, selected.id - 1); setItems((current) => current.map((item) => item.versionId === selected.versionId ? { ...item, ...next } : item)); setToast('Review confirmed.'); } catch (error) { setToast(error instanceof Error ? error.message : 'Could not confirm review'); } }}>X&#xE1;c nh&#x1EAD;n &#x111;&#xE3; r&#xE0; so&#xE1;t</button>}</section>
              <div className="audio-console">{selected.audioUrl ? <><div className="audio-console-head"><strong>Audio preview</strong><span>{selected.duration}</span></div><audio controls preload="metadata" src={selected.audioUrl} aria-label="Narration audio" /></> : <div className="audio-empty"><strong>Ch&#x1B0;a c&#xF3; audio</strong><span>T&#x1EA1;o b&#x1EB1;ng ElevenLabs ho&#x1EB7;c t&#x1EA3;i l&#xEA;n MP3 &#x111;&#x1EC3; ti&#x1EBF;p t&#x1EE5;c.</span></div>}</div>
              <div className="detail-actions workflow-actions"><div className="secondary-actions"><button className="quiet-button" onClick={() => setShowVisitor(true)}>Xem tr&#x1B0;&#x1EDB;c nh&#x1B0; visitor</button><button className="quiet-button" onClick={openHistory}>L&#x1ECB;ch s&#x1EED; duy&#x1EC7;t</button><button className="quiet-button" onClick={translateSelected}>D&#x1ECB;ch t&#x1EF1; &#x111;&#x1ED9;ng / {editBody.length.toLocaleString('vi-VN')} characters</button></div><div className="primary-action-group">{selected.rawStatus !== 'PUBLISHED' && <button className={isDirty || !fieldsReady ? 'primary-button' : 'quiet-button'} disabled={!fieldsReady} onClick={saveContent}>L&#x1B0;u b&#x1EA3;n nh&#xE1;p</button>}{selected.rawStatus !== 'PUBLISHED' && <label className="upload-button">T&#x1EA3;i l&#xEA;n MP3<input type="file" accept="audio/mp3,audio/mpeg,.mp3" onChange={uploadAudio} /></label>}{selected.rawStatus !== 'PUBLISHED' && <button className={!isDirty && fieldsReady && !selected.needsReview && !audioReady ? 'primary-button' : 'quiet-button'} disabled={isDirty || !fieldsReady} title={isDirty ? 'Save your edits before generating audio.' : ''} onClick={generateAudio}>T&#x1EA1;o audio ElevenLabs / {editBody.length.toLocaleString('vi-VN')} k&#xFD; t&#x1EF1;</button>}{['DRAFT', 'REJECTED'].includes(selected.rawStatus ?? '') && <button className={fieldsReady && audioReady && !selected.needsReview && !isDirty ? 'primary-button' : 'quiet-button'} disabled={!fieldsReady || !audioReady || Boolean(selected.needsReview) || isDirty} title={isDirty ? 'Save your edits before submitting.' : !audioReady ? 'A valid, current audio file is required before submitting.' : selected.needsReview ? 'Confirm that the translation review is complete.' : ''} onClick={() => transitionSelected('submit')}>G&#x1EED;i duy&#x1EC7;t</button>}{selected.rawStatus === 'PENDING_REVIEW' && <><button className="primary-button" onClick={() => transitionSelected('approve')}>Duy&#x1EC7;t</button><button className="quiet-button" onClick={() => transitionSelected('reject')}>T&#x1EEB; ch&#x1ED1;i</button></>}{selected.rawStatus === 'APPROVED' && <button className="primary-button" onClick={publishSelected}>Xu&#x1EA5;t b&#x1EA3;n</button>}{selected.rawStatus === 'PUBLISHED' && <button className="quiet-button" onClick={() => transitionSelected('unpublish')}>G&#x1EE1; xu&#x1EA5;t b&#x1EA3;n</button>}{selected.rawStatus === 'UNPUBLISHED' && <button className="primary-button" onClick={() => transitionSelected('republish')}>Xu&#x1EA5;t b&#x1EA3;n l&#x1EA1;i</button>}</div></div>
            </section>}
          </div>}
        </section>

        {!isContentPage && <section className="insight-strip"><div><span className="strip-label">Bước tiếp theo</span><strong>{selected.status === 'Chờ duyệt' ? 'Kiểm tra nội dung trước khi xuất bản' : 'Chọn một bản dịch cần rà soát'}</strong></div><div className="strip-action"><span className="strip-line" /><button onClick={() => { setStatusFilter('PENDING_REVIEW'); setSearch(''); setToast('Đã mở hàng đợi kiểm duyệt.'); }}>Mở hàng đợi <span>↗</span></button></div></section>}
      </main>

      {showVisitor && <div className="visitor-overlay" role="dialog" aria-modal="true" aria-labelledby="visitor-title"><div className="visitor-card"><button className="close-button" aria-label="Đóng preview" onClick={() => setShowVisitor(false)}>×</button><span className="visitor-label">Visitor preview · {selected.language}</span><h2 id="visitor-title">{selected.title}</h2><p>{selected.body}</p><div className="visitor-player">{selected.audioUrl ? <audio controls preload="metadata" src={selected.audioUrl} aria-label="Audio thuyết minh" /> : <p className="empty-state">Chưa có audio thực. Hãy upload file hoặc tạo bằng ElevenLabs.</p>}</div></div></div>}
      {showHistory && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="history-title"><div className="modal-card history-card"><button type="button" className="close-button" aria-label="Đóng lịch sử" onClick={() => setShowHistory(false)}>×</button><h2 id="history-title">Lịch sử workflow.</h2><div className="history-list">{history.length ? history.map((event) => <div className="history-row" key={`${event.eventType}-${event.actedAt}`}><strong>{event.eventType}</strong><span>{new Date(event.actedAt).toLocaleString('vi-VN')}</span><small>{event.reason ?? `Actor #${event.actorUserId}`}</small></div>) : <p className="empty-state">Chưa có lịch sử.</p>}</div></div></div>}
      {showCreate && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-title"><form className="modal-card" onSubmit={createContent}><button type="button" className="close-button" aria-label="Đóng form tạo nội dung" onClick={() => setShowCreate(false)}>×</button><h2 id="create-title">Tạo nội dung mới.</h2><label>Điểm tham quan<select value={newContent.poiId} onChange={(event) => setNewContent({ ...newContent, poiId: event.target.value })} required><option value="">Chọn POI</option>{pois.map((poi) => { const name = poi.translations.find((item) => item.languageCode === 'vi')?.name ?? poi.translations.find((item) => item.languageCode === 'en')?.name ?? 'Unnamed'; return <option key={poi.id} value={poi.id}>POI #{poi.id} · {name}</option>; })}</select></label><label>Ngôn ngữ<select value={newContent.languageCode} onChange={(event) => setNewContent({ ...newContent, languageCode: event.target.value })}><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label><label>Tiêu đề<input value={newContent.title} onChange={(event) => setNewContent({ ...newContent, title: event.target.value })} placeholder="Cổng thành phía Đông" required /></label><label>Nội dung thuyết minh<textarea value={newContent.narrationText} onChange={(event) => setNewContent({ ...newContent, narrationText: event.target.value })} rows={5} placeholder="Nhập lời thuyết minh..." required /></label><div className="modal-actions"><button type="button" className="quiet-button" onClick={() => setShowCreate(false)}>Hủy</button><button type="submit" className="primary-button">Tạo bản nháp</button></div></form></div>}
    </div>
  );
}

export default App;

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Application root element was not found');
const runtime = globalThis as typeof globalThis & { __audioGuideRoot?: Root };
const root = runtime.__audioGuideRoot ?? createRoot(rootElement);
runtime.__audioGuideRoot = root;
root.render(window.location.pathname.startsWith('/admin') ? <App /> : <VisitorApp />);

