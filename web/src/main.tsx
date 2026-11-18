import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QRCodeCanvas } from 'qrcode.react';
import { api, API_URL, type ApiAnalytics, type ApiContent, type ApiVoice, type ApiLanguage, type ApiLocation, type ApiPoi, type ApiQr, type ApiReviewEvent, type ApiUser, ApiError } from './api';
import './styles.css';

type Status = 'Đang soạn' | 'Chờ duyệt' | 'Đã duyệt' | 'Đã xuất bản' | 'Đã gỡ xuất bản' | 'Cần rà soát';
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
  const status: Status = item.status === 'PENDING_REVIEW' ? 'Chờ duyệt' : item.status === 'APPROVED' ? 'Đã duyệt' : item.status === 'PUBLISHED' ? 'Đã xuất bản' : item.status === 'UNPUBLISHED' ? 'Đã gỡ xuất bản' : item.status === 'REJECTED' ? 'Cần rà soát' : 'Đang soạn';
  return { id: index + 1, title: item.title, place: `POI #${item.poiId}`, language: item.languageCode.toUpperCase(), status, updated: 'vừa cập nhật', duration: item.audio ? '02:34' : '—', body: item.narrationText, versionId: item.versionId, versionNumber: item.versionNumber, poiId: item.poiId, hasAudio: Boolean(item.audio && item.audio.isValid && !item.audio.isOutdated), audioUrl: item.audio?.filePath?.startsWith('/media/') ? `${API_URL.replace(/\/api\/?$/, '')}${item.audio.filePath}` : undefined };
}

function Icon({ children }: { children: ReactNode }) { return <span className="icon" aria-hidden="true">{children}</span>; }

function StatusBadge({ status }: { status: Status }) {
  const tone = status === 'Đã xuất bản' ? 'published' : status === 'Chờ duyệt' || status === 'Đã duyệt' ? 'review' : status === 'Cần rà soát' ? 'attention' : 'draft';
  return <span className={`status status--${tone}`}>{status}</span>;
}

function VisitorApp() {
  const params = new URLSearchParams(window.location.search);
  const poiParam = params.get('poiId');
  const poiId = poiParam ? Number(poiParam) : null;
  const isQrSource = params.get('source') === 'qr' || params.has('qr');
  const [language, setLanguage] = useState(params.get('language') || 'en');
  const [content, setContent] = useState<ApiContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [pois, setPois] = useState<ApiPoi[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState('');
  const [history, setHistory] = useState<{ title: string; poiId: number; listenedAt: string }[]>([]);
  const [visitorLanguages, setVisitorLanguages] = useState<ApiLanguage[]>([]);
  const [poiLanguages, setPoiLanguages] = useState<{ code: string; name: string; isFallback: boolean; hasVoice: boolean }[]>([]);

  useEffect(() => {
    const sessionKey = getVisitorSessionKey();
    const sendHeartbeat = () => {
      if (document.visibilityState !== 'visible') return;
      void api.recordPresence({ anonymousSessionKey: sessionKey }).catch(() => undefined);
    };
    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 30_000);
    document.addEventListener('visibilitychange', sendHeartbeat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', sendHeartbeat);
    };
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
      setPoiLanguages([]);
      return;
    }
    api.visitorPoiLanguages(poiId)
      .then((langs) => {
        setPoiLanguages(langs);
        const current = langs.find((l) => l.code === language);
        if (current && !current.hasVoice) {
          const fallback = langs.find((l) => l.hasVoice)?.code ?? 'en';
          if (fallback !== language) {
            setLanguage(fallback);
            const next = new URL(window.location.href);
            next.searchParams.set('language', fallback);
            window.history.replaceState(null, '', next);
          }
        }
      })
      .catch(() => undefined);
  }, [poiId]);

  useEffect(() => {
    if (!poiId) {
      setContent(null);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    api.visitorContent(poiId, language)
      .then((nextContent) => { setContent(nextContent); setError(''); })
      .catch((reason: unknown) => { setContent(null); setError(reason instanceof Error ? reason.message : 'Không tìm thấy nội dung thuyết minh'); })
      .finally(() => setLoading(false));
  }, [poiId, language]);

  useEffect(() => {
    void Promise.all([api.visitorLocations(), api.visitorPois(), api.languages('')]).then(([nextLocations, nextPois, nextLangs]) => {
      setLocations(nextLocations.filter((location) => location.isActive));
      setPois(nextPois.filter((poi) => poi.isActive));
      setVisitorLanguages(nextLangs.filter((l) => l.isActive));
    }).catch((reason: unknown) => setPlacesError(reason instanceof Error ? reason.message : 'Không thể tải địa điểm.')).finally(() => setPlacesLoading(false));
    try { setHistory(JSON.parse(localStorage.getItem('audio-guide-history') ?? '[]')); } catch { setHistory([]); }
  }, []);

  const rememberListening = (title: string) => {
    if (!poiId) return;
    const next = [{ title, poiId, listenedAt: new Date().toISOString() }, ...history.filter((item) => item.poiId !== poiId)].slice(0, 10);
    setHistory(next);
    localStorage.setItem('audio-guide-history', JSON.stringify(next));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('audio-guide-history');
  };

  const removeHistoryItem = (poiIdToRemove: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const next = history.filter((item) => item.poiId !== poiIdToRemove);
    setHistory(next);
    localStorage.setItem('audio-guide-history', JSON.stringify(next));
  };

  const visitorAudioUrl = content?.audio?.filePath
    ? (content.audio.filePath.startsWith('/media/') ? `${API_URL.replace(/\/api\/?$/, '')}${content.audio.filePath}` : content.audio.filePath)
    : undefined;
  const translate = (translations: { languageCode: string; name: string }[]) => translations.find((item) => item.languageCode === language)?.name ?? translations[0]?.name ?? '';
  const visitorShell = (children: ReactNode) => (
    <div className="visitor-page">
      <header className="visitor-nav">
        <a className="visitor-brand" href="/">audio guide</a>
        <nav className="visitor-nav-links" aria-label="Điều hướng visitor">
          <a href="/">Khám phá</a>
          <a href="/admin">Content studio</a>
        </nav>
        <label className="visitor-language">
          Ngôn ngữ
          <select
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value);
              const next = new URL(window.location.href);
              next.searchParams.set('language', event.target.value);
              window.history.replaceState(null, '', next);
            }}
          >
            {poiId && poiLanguages.length > 0
              ? poiLanguages.map((l) => (
                  <option key={l.code} value={l.code} disabled={!l.hasVoice}>
                    {l.name} {!l.hasVoice ? '(Chưa hỗ trợ voice)' : ''}
                  </option>
                ))
              : visitorLanguages.length > 0
              ? visitorLanguages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))
              : (
                <>
                  <option value="en">English</option>
                  <option value="vi">Tiếng Việt</option>
                </>
              )}
          </select>
        </label>
      </header>
      {children}
      <footer className="visitor-footer">
        <a href="/">audio guide</a>
        <span>Thuyết minh đa ngôn ngữ, ngay tại điểm đến.</span>
      </footer>
    </div>
  );
  if (!poiId) {
    return visitorShell(<main className="visitor-home"><section className="visitor-hero"><div className="visitor-hero-copy"><h1>Mỗi điểm đến,<br />một câu chuyện riêng.</h1><p>Chọn một nơi, nghe những câu chuyện theo ngôn ngữ của bạn.</p><a className="visitor-primary" href="#visitor-places">Khám phá địa điểm <span aria-hidden="true">↓</span></a></div><div className="visitor-featured" aria-label="Điểm tham quan nổi bật">{placesLoading ? <p>Đang tải điểm tham quan…</p> : pois.length ? pois.slice(0, 3).map((poi, index) => <a key={poi.id} href={`/visitor?poiId=${poi.id}&language=${language}`}><span>0{index + 1}</span><strong>{translate(poi.translations)}</strong><small>{translate(locations.find((location) => location.id === poi.locationId)?.translations ?? [])}</small><span aria-hidden="true">↗</span></a>) : <p>{placesError || 'Địa điểm sắp được cập nhật.'}</p>}</div></section><section className="visitor-home-section" id="visitor-places"><div className="visitor-home-heading"><div><h2>Chọn nơi bạn muốn đến.</h2></div><span>{pois.length} điểm tham quan</span></div>{placesLoading ? <p className="visitor-loading">Đang tải địa điểm…</p> : placesError ? <p className="visitor-empty">{placesError}</p> : locations.length === 0 ? <p className="visitor-empty">Chưa có địa điểm nào được xuất bản.</p> : <div className="visitor-place-list">{locations.map((location, index) => { const placePois = pois.filter((poi) => poi.locationId === location.id); return <article className="visitor-place" key={location.id}><div className="visitor-place-copy"><h3>{translate(location.translations)}</h3><p>{location.translations.find((item) => item.languageCode === language)?.shortDescription ?? 'Khám phá những câu chuyện và điểm tham quan tại đây.'}</p><div className="visitor-place-pois">{placePois.map((poi) => <a key={poi.id} href={`/visitor?poiId=${poi.id}&language=${language}`}>{translate(poi.translations)} <span aria-hidden="true">↗</span></a>)}</div></div><span className="visitor-place-count">{placePois.length} điểm</span></article>; })}</div>}</section>{history.length > 0 && <section className="visitor-home-section visitor-recent"><div className="visitor-home-heading"><div><h2>Lịch sử nghe trên thiết bị.</h2></div><button className="quiet-button" onClick={clearHistory}>Xóa tất cả lịch sử</button></div>{history.map((item) => <a className="visitor-history-row" key={item.poiId} href={`/visitor?poiId=${item.poiId}&language=${language}`}><span>{item.title}</span><small>{new Date(item.listenedAt).toLocaleDateString('vi-VN')}</small><button type="button" className="history-remove-btn" title="Xóa mục này" aria-label="Xóa mục này khỏi lịch sử" onClick={(event) => removeHistoryItem(item.poiId, event)}>×</button><span aria-hidden="true">↗</span></a>)}</section>}</main>);
  }
  return visitorShell(<main className="visitor-main"><a className="visitor-back" href="/">← Tất cả địa điểm</a><div className="visitor-location"><span className="visitor-marker">⌖</span><span>Điểm tham quan #{poiId}</span></div>{loading ? <div className="visitor-loading">Đang tải thuyết minh…</div> : error ? <div className="visitor-error"><h1>Chưa có nội dung cho điểm này.</h1><p>{error}</p><a href="/">Chọn một địa điểm khác</a></div> : content ? <article className="visitor-story"><h1>{content.title}</h1><p className="visitor-narration">{content.narrationText}</p><div className="visitor-listen">{visitorAudioUrl ? <audio controls preload="metadata" src={visitorAudioUrl} aria-label="Audio thuyết minh" onPlay={() => { setPlaying(true); rememberListening(content.title); void api.recordEvent({ eventId: safeRandomUUID(), eventType: 'AUDIO_START', poiId, languageCode: language }); }} onPause={() => setPlaying(false)} /> : <p className="empty-state">Nội dung này chưa có audio.</p>}</div><p className="visitor-hint">Bạn có thể đổi ngôn ngữ ở phía trên để nghe bản dịch tương ứng.</p></article> : null}</main>);
}

const PRESET_LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', defaultVoice: 'pNInz6obpgDQGcFmaJgB' },
  { code: 'en', name: 'English', defaultVoice: '21m00Tcm4TlvDq8ikWAM' },
  { code: 'ja', name: 'Tiếng Nhật (Japanese)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'ko', name: 'Tiếng Hàn (Korean)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'zh', name: 'Tiếng Trung (Chinese)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'fr', name: 'Tiếng Pháp (French)', defaultVoice: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'es', name: 'Tiếng Tây Ban Nha (Spanish)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'de', name: 'Tiếng Đức (German)', defaultVoice: 'VR6AewLTigWG4xSOukaG' },
  { code: 'ru', name: 'Tiếng Nga (Russian)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
  { code: 'th', name: 'Tiếng Thái (Thai)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
];

function CatalogPanel({ section, token, onToast, onPoisChange, onLanguagesChange, onVoicesChange }: { section: string; token: string; onToast: (message: string) => void; onPoisChange?: (pois: ApiPoi[]) => void; onLanguagesChange?: (languages: ApiLanguage[]) => void; onVoicesChange?: (voices: ApiVoice[]) => void }) {
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [pois, setPois] = useState<ApiPoi[]>([]);
  const [voices, setVoices] = useState<ApiVoice[]>([]);
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [entityKind, setEntityKind] = useState<'location' | 'poi'>('poi');
  const [form, setForm] = useState({ code: 'ja', name: 'Tiếng Nhật (Japanese)', nameVi: '', nameEn: '', locationId: '', title: '', voice: 'ErXwobaYiN019PkySvjV' });
  const [busy, setBusy] = useState(false);
  const [panelMessage, setPanelMessage] = useState('');
  const reload = async () => {
    if (section === 'Ngôn ngữ & giọng đọc') {
      const [nextLanguages, nextVoices] = await Promise.all([api.languages(token), api.voices(token)]);
      setLanguages(nextLanguages);
      setVoices(nextVoices);
      onLanguagesChange?.(nextLanguages);
      onVoicesChange?.(nextVoices);
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
  const toggleLanguage = async (item: ApiLanguage) => {
    if (item.isFallback || item.code.toLowerCase() === 'en') {
      const msg = 'Không thể tắt ngôn ngữ mặc định (tiếng Anh / Fallback).';
      onToast(msg);
      window.alert(msg);
      return;
    }
    if (item.isActive) {
      const confirmed = window.confirm(
        `Bạn có chắc chắn muốn tắt ngôn ngữ "${item.name}" (${item.code.toUpperCase()})?\n\nCảnh báo: Khách tham quan sẽ không thể tiếp cận các bài thuyết minh thuộc ngôn ngữ này trên trang web.`
      );
      if (!confirmed) return;
    }
    try {
      await api.setLanguageActive(token, item.code, !item.isActive);
      await reload();
      onToast(item.isActive ? `Đã tắt ngôn ngữ ${item.code.toUpperCase()}.` : `Đã kích hoạt ngôn ngữ ${item.code.toUpperCase()}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái ngôn ngữ';
      onToast(msg);
      window.alert(msg);
    }
  };
  const deleteVoice = async (id: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Voice #${id}?`)) return;
    try {
      await api.deleteVoice(token, id);
      await reload();
      onToast(`Đã xóa Voice #${id}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Không thể xóa voice';
      onToast(msg);
      window.alert(msg);
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
        const langCode = form.code.trim().toLowerCase();
        let existingLang = languages.find((l) => l.code.toLowerCase() === langCode);
        if (!existingLang && form.name.trim()) {
          existingLang = await api.createLanguage(token, langCode, form.name.trim());
        }
        if (form.voice.trim()) {
          const createdVoice = await api.createVoice(token, langCode, form.voice.trim());
          if (!existingLang?.defaultVoiceId && createdVoice?.id) {
            await api.setDefaultVoice(token, langCode, createdVoice.id).catch(() => undefined);
          }
        }
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
      if (section === 'Ngôn ngữ & giọng đọc') {
        const nextPreset = PRESET_LANGUAGES.find((p) => p.code !== form.code) ?? PRESET_LANGUAGES[0];
        setForm((prev) => ({ ...prev, code: nextPreset.code, name: nextPreset.name, voice: nextPreset.defaultVoice }));
      } else {
        setForm((prev) => ({ ...prev, nameVi: '', nameEn: '' }));
      }
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
            <label>
              Chọn ngôn ngữ
              <select
                value={form.code}
                onChange={(event) => {
                  const val = event.target.value;
                  const match = PRESET_LANGUAGES.find((p) => p.code === val) ?? PRESET_LANGUAGES[0];
                  setForm({ ...form, code: match.code, name: match.name, voice: match.defaultVoice });
                }}
              >
                {PRESET_LANGUAGES.map((preset) => (
                  <option key={preset.code} value={preset.code}>
                    {preset.name} ({preset.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </label>
            <label>
              ElevenLabs voice ID (mặc định gợi ý)
              <input value={form.voice} onChange={(event) => setForm({ ...form, voice: event.target.value })} placeholder="vd: 21m00Tcm4TlvDq8ikWAM" />
            </label>
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
            {languages.map((item) => {
              const langVoices = voices.filter((v) => v.languageCode === item.code);
              const isExpanded = expandedLang === item.code;
              return (
                <div key={item.code} style={{ display: 'contents' }}>
                  <div className="crud-row">
                    <strong>{item.code.toUpperCase()}{item.isFallback ? ' (Mặc định)' : ''}</strong>
                    <span>{item.name}</span>
                    <span className={`status status--${item.isActive ? 'published' : 'draft'}`}>{item.isActive ? 'Hoạt động' : 'Tạm tắt'}</span>
                    <button
                      type="button"
                      className="quiet-button"
                      title={item.isFallback || item.code.toLowerCase() === 'en' ? 'Không thể tắt ngôn ngữ mặc định' : undefined}
                      onClick={() => toggleLanguage(item)}
                    >
                      {item.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      type="button"
                      className="quiet-button"
                      style={isExpanded ? { background: 'var(--cream)', fontWeight: 600 } : {}}
                      title="Xem và quản lý các giọng đọc của ngôn ngữ này"
                      onClick={() => setExpandedLang(isExpanded ? null : item.code)}
                    >
                      Voices ({langVoices.length}) {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ gridColumn: '1 / -1', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 16px', margin: '2px 0 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                          Giọng đọc (Voices) của {item.name} ({item.code.toUpperCase()}):
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{langVoices.length} voice đã lưu</span>
                      </div>
                      {langVoices.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                          Chưa có voice nào cho ngôn ngữ này. Hãy chọn ngôn ngữ và nhập mã ElevenLabs voice ID ở form phía trên để thêm.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {langVoices.map((voice) => {
                            const isDefault = item.defaultVoiceId === voice.id;
                            return (
                              <div key={voice.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--cream)', borderRadius: '6px', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <strong>Voice #{voice.id}</strong>
                                  <code style={{ background: 'var(--paper)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--line)' }}>{voice.providerVoiceKey}</code>
                                  {isDefault ? (
                                    <span className="status status--published" style={{ fontSize: '10px', padding: '2px 6px' }}>★ Voice mặc định</span>
                                  ) : (
                                    <button
                                      type="button"
                                      className="quiet-button"
                                      style={{ fontSize: '11px', padding: '2px 8px' }}
                                      onClick={() => {
                                        void api.setDefaultVoice(token, item.code, voice.id)
                                          .then(reload)
                                          .then(() => onToast(`Đã chọn Voice #${voice.id} làm mặc định cho ${item.name}.`))
                                          .catch((error: unknown) => onToast(error instanceof Error ? error.message : 'Không thể cập nhật voice mặc định'));
                                      }}
                                    >
                                      Đặt làm mặc định
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="quiet-button"
                                  style={{ color: 'var(--coral)', borderColor: 'var(--coral)', fontSize: '11px' }}
                                  onClick={() => deleteVoice(voice.id)}
                                >
                                  Xóa voice
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [selectedId, setSelectedId] = useState(1);
  const [selectedVoiceId, setSelectedVoiceId] = useState<number | undefined>(undefined);
  const [showVisitor, setShowVisitor] = useState(false);
  const [history, setHistory] = useState<ApiReviewEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'PUBLISHED'>('ALL');
  const [newContent, setNewContent] = useState({ poiId: '', languageCode: 'vi', title: '', narrationText: '' });
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? initialItems[0];
  const pendingCount = useMemo(() => items.filter((item) => item.status === 'Chờ duyệt').length, [items]);
  useEffect(() => { setEditTitle(selected.title); setEditBody(selected.body); }, [selected.id, selected.title, selected.body]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([api.content(token), api.voices(token), api.pois(token), api.languages(token)])
      .then(([content, availableVoices, availablePois, availableLanguages]) => {
        setItems(content.map(mapContent));
        setVoices(availableVoices);
        setPois(availablePois);
        setLanguages(availableLanguages);
      })
      .catch((error: unknown) => {
        setToken('');
        localStorage.removeItem('audio-guide-token');
        setLoginError(error instanceof Error ? error.message : 'Không thể tải dữ liệu');
      })
      .finally(() => setLoading(false));
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
      await api.transition(token, selected.versionId, 'publish');
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: 'Đã xuất bản', updated: 'Vừa xong' } : item));
      setToast('Đã xuất bản phiên bản hiện tại.');
    } catch (error) { setToast(error instanceof Error ? error.message : 'Không thể xuất bản'); }
  };

  const transitionSelected = async (action: 'submit' | 'withdraw' | 'approve' | 'unpublish' | 'republish' | 'reject') => {
    if (!selected?.versionId) return;
    const reason = action === 'reject' ? window.prompt('Lý do từ chối phiên bản:')?.trim() : undefined;
    if (action === 'reject' && !reason) return;
    try {
      const result = action === 'reject' ? await api.reject(token, selected.versionId, reason as string) : await api.transition(token, selected.versionId, action);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: result.status === 'PENDING_REVIEW' ? 'Chờ duyệt' : result.status === 'APPROVED' ? 'Đã duyệt' : result.status === 'PUBLISHED' ? 'Đã xuất bản' : result.status === 'UNPUBLISHED' ? 'Đã gỡ xuất bản' : result.status === 'REJECTED' ? 'Cần rà soát' : 'Đang soạn', updated: 'Vừa cập nhật' } : item));
      setToast(`Đã thực hiện: ${action}.`);
    } catch (error) { setToast(error instanceof Error ? error.message : 'Không thể chuyển trạng thái'); }
  };

  const currentLang = languages.find((item) => item.code.toUpperCase() === selected.language);
  const currentLangVoices = voices.filter((item) => item.languageCode.toUpperCase() === selected.language && item.isAvailable);
  const activeVoiceId = selectedVoiceId && currentLangVoices.some((v) => v.id === selectedVoiceId)
    ? selectedVoiceId
    : (currentLang?.defaultVoiceId && currentLangVoices.some((v) => v.id === currentLang.defaultVoiceId)
      ? currentLang.defaultVoiceId
      : currentLangVoices[0]?.id);

  const generateAudio = async () => {
    if (!selected?.versionId) return;
    const voice = currentLangVoices.find((item) => item.id === activeVoiceId) ?? currentLangVoices[0];
    if (!voice) { setToast(`Chưa có giọng đọc khả dụng cho ${selected.language}.`); return; }
    try {
      const generated = await api.elevenLabsAudio(token, selected.versionId, voice.id);
      const next = mapContent(generated, selected.id - 1);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...next, updated: 'Vừa tạo audio ElevenLabs' } : item));
      setToast(`Đã tạo audio bằng ElevenLabs (${voice.providerVoiceKey}).`);
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
      await api.uploadAudio(token, selected.versionId, file);
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, hasAudio: true, duration: '02:34', updated: 'Vừa upload audio' } : item));
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
    const target = window.prompt('Mã ngôn ngữ đích (ví dụ: en):')?.trim().toLowerCase();
    if (!target) return;
    try {
      const translated = await api.translateContent(token, selected.versionId, target);
      const next = mapContent(translated, items.length);
      setItems((current) => [...current, next]);
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
      setShowCreate(false);
      setNewContent({ poiId: '', languageCode: 'vi', title: '', narrationText: '' });
      setToast('Đã tạo nội dung mới ở trạng thái bản nháp.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể tạo nội dung');
    }
  };

  const visibleItems = items.filter((item) => {
    const matchesSearch = `${item.title} ${item.place} ${item.language}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'PENDING_REVIEW' && item.status === 'Chờ duyệt') || (statusFilter === 'PUBLISHED' && item.status === 'Đã xuất bản');
    return matchesSearch && matchesStatus;
  });

  if (!token) {
    return <div className="login-screen"><form className="login-card" onSubmit={signIn}><div className="brand login-brand"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><div><strong>audio guide</strong><small>Content studio</small></div></div><h1>Đăng nhập để quản lý nội dung.</h1><label>Tài khoản<input value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} autoComplete="username" required /></label><label>Mật khẩu<input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} autoComplete="current-password" required /></label>{loginError && <p className="login-error">{loginError}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Đang kết nối…' : 'Đăng nhập'}</button><small className="login-hint">API: {API_URL}</small></form></div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><div><strong>audio guide</strong><small>Content studio</small></div></div>
        <nav className="nav" aria-label="Điều hướng chính">
          {[['Tổng quan', '◌'], ['Nội dung', '▤'], ['Địa điểm & POI', '⌖'], ['Ngôn ngữ & giọng đọc', '文'], ['QR code', '⌁'], ['Người dùng', 'U']].map(([label, icon]) => (
            <button key={label} className={`nav-item ${activeNav === label ? 'is-active' : ''}`} onClick={() => setActiveNav(label)}><Icon>{icon}</Icon><span>{label}</span>{label === 'Nội dung' && <b>{pendingCount}</b>}</button>
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
          <div className="workspace-heading"><div><h2>Những câu chuyện đang chờ bạn hoàn thiện.</h2></div><button className="quiet-button" onClick={() => { setSearch(''); setStatusFilter('ALL'); setToast('Đã xóa bộ lọc.'); }}>Lọc & sắp xếp <span>⌄</span></button></div>
          {toast && <p className="toast" role="status" style={{ margin: '0 0 16px' }}>{toast}</p>}
          {activeNav === 'Tổng quan' ? <OverviewPanel items={items} pois={pois} voices={voices} token={token} /> : activeNav === 'QR code' ? <QrPanel token={token} pois={pois} onToast={setToast} /> : activeNav === 'Người dùng' ? <UserPanel token={token} onToast={setToast} /> : activeNav !== 'Nội dung' ? <CatalogPanel section={activeNav} token={token} onToast={setToast} onPoisChange={setPois} onLanguagesChange={setLanguages} onVoicesChange={setVoices} /> : <div className="content-grid">
            <section className="content-list" aria-label="Danh sách nội dung">
              <div className="list-toolbar"><div className="segmented" role="tablist" aria-label="Lọc trạng thái"><button className={statusFilter === 'ALL' ? 'is-selected' : ''} onClick={() => setStatusFilter('ALL')} role="tab" aria-selected={statusFilter === 'ALL'}>Tất cả <span>{items.length.toString().padStart(2, '0')}</span></button><button className={statusFilter === 'PENDING_REVIEW' ? 'is-selected' : ''} onClick={() => setStatusFilter('PENDING_REVIEW')} role="tab" aria-selected={statusFilter === 'PENDING_REVIEW'}>Chờ duyệt <span>{pendingCount.toString().padStart(2, '0')}</span></button><button className={statusFilter === 'PUBLISHED' ? 'is-selected' : ''} onClick={() => setStatusFilter('PUBLISHED')} role="tab" aria-selected={statusFilter === 'PUBLISHED'}>Đã xuất bản <span>{items.filter((item) => item.status === 'Đã xuất bản').length.toString().padStart(2, '0')}</span></button></div><label className="search-control"><Icon>⌕</Icon><input aria-label="Tìm kiếm nội dung" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm kiếm" /></label></div>
              <div className="list-items">{visibleItems.map((item) => <button className={`content-row ${selected.id === item.id ? 'is-selected' : ''}`} key={item.id} onClick={() => { setSelectedId(item.id); setShowVisitor(false); setToast(''); }}><span className="row-index">0{item.id}</span><span className="row-main"><strong>{item.title}</strong><small>{item.place}</small></span><span className="row-meta"><span className="language-chip">{item.language}</span><StatusBadge status={item.status} /></span><span className="row-time">{item.updated}</span></button>)}</div>
              <button className="load-more" title="Bấm để tải lại danh sách" onClick={() => { if (token) { setLoading(true); api.content(token).then((content) => { setItems(content.map(mapContent)); setToast('Đã làm mới danh sách nội dung.'); }).catch(() => setToast('Không thể làm mới danh sách.')).finally(() => setLoading(false)); } }}>Đang hiển thị {visibleItems.length} nội dung · Bấm để tải lại ⟳</button>
            </section>

            <section className="detail-panel" aria-label="Chi tiết nội dung">
              <div className="detail-topline"><span>Phiên bản #{selected.versionId ?? '—'} · v{selected.versionNumber ?? '—'}</span><StatusBadge status={selected.status} /></div>
              <div className="detail-copy"><p className="detail-kicker">{selected.language} · {selected.place}</p><label className="editor-field">Tiêu đề<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} disabled={selected.status === 'Đã xuất bản'} /></label><label className="editor-field">Nội dung thuyết minh<textarea value={editBody} onChange={(event) => setEditBody(event.target.value)} disabled={selected.status === 'Đã xuất bản'} rows={4} /></label></div>
              <div className="audio-console">
                <div className="audio-console-head"><span><span className="audio-live" /> Audio preview</span><span className="audio-time">{selected.duration}</span></div>
                <div className="waveform" aria-label="Bản xem trước audio">{[24, 42, 18, 54, 35, 68, 32, 48, 74, 44, 26, 58, 38, 65, 30, 50, 25, 45, 70, 38, 24, 52, 33, 60, 42, 28, 54, 38, 68, 45].map((height, index) => <span key={index} style={{ height: `${height}%` }} className={index < (isPlaying ? 19 : 0) ? 'is-played' : ''} />)}</div>
                <div className="audio-controls"><button className="play-button" aria-label={isPlaying ? 'Tạm dừng' : 'Phát audio'} onClick={() => { const el = document.getElementById('studio-audio-player') as HTMLAudioElement | null; if (!el || !selected.audioUrl) { setToast('Chưa có file audio để phát. Hãy tạo audio ElevenLabs hoặc upload MP3.'); return; } if (el.paused) { void el.play(); } else { el.pause(); } }}>{isPlaying ? 'Tạm dừng' : 'Phát'}</button>{selected.audioUrl ? <audio id="studio-audio-player" controls preload="metadata" src={selected.audioUrl} aria-label="Audio thuyết minh" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} /> : <span className="audio-progress">Chưa có file audio thật</span>}<button className="volume-button" aria-label="Bật/Tắt tiếng" title="Bật/Tắt tiếng" onClick={() => { const el = document.getElementById('studio-audio-player') as HTMLAudioElement | null; if (el) { el.muted = !el.muted; setToast(el.muted ? 'Đã tắt tiếng audio.' : 'Đã bật lại tiếng audio.'); } else { setToast('Chưa có audio để điều chỉnh.'); } }}>⌁</button></div>
              </div>
              <div className="detail-actions">
                <button className="quiet-button" onClick={() => setShowVisitor(true)}>Xem như visitor <span>↗</span></button>
                <button className="quiet-button" onClick={openHistory}>Lịch sử workflow</button>
                <button className="quiet-button" onClick={translateSelected}>Dịch bằng provider</button>
                {selected.status !== 'Đã xuất bản' && (
                  <>
                    <button className="quiet-button" onClick={saveContent}>Lưu nội dung</button>
                    <label className="upload-button">Upload audio<input type="file" accept="audio/mp3,audio/mpeg,.mp3" onChange={uploadAudio} /></label>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {currentLangVoices.length > 0 && (
                        <select
                          value={activeVoiceId ?? ''}
                          onChange={(e) => setSelectedVoiceId(Number(e.target.value))}
                          style={{ minHeight: '34px', padding: '0 8px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--paper)', fontSize: '11px', color: 'var(--ink)' }}
                          title="Chọn giọng đọc cho bản ghi này"
                        >
                          {currentLangVoices.map((v) => {
                            const isDefault = currentLang?.defaultVoiceId === v.id;
                            return (
                              <option key={v.id} value={v.id}>
                                {v.providerVoiceKey} {isDefault ? '(Mặc định)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      )}
                      <button className="quiet-button" onClick={generateAudio}>{selected.hasAudio ? 'Tạo lại audio ElevenLabs' : 'Tạo audio ElevenLabs'}</button>
                    </div>
                  </>
                )}
                {selected.status !== 'Đã xuất bản' && selected.status !== 'Chờ duyệt' && (
                  <button type="button" className="quiet-button" style={{ color: 'var(--coral)', borderColor: 'var(--coral)' }} onClick={deleteCurrentContent}>
                    {selected.status === 'Đã gỡ xuất bản' ? 'Xóa bài viết' : 'Xóa bản nháp'}
                  </button>
                )}
                {selected.status === 'Đang soạn' && <button className="primary-button" onClick={() => transitionSelected('submit')}>Gửi duyệt</button>}
                {selected.status === 'Chờ duyệt' && <><button className="quiet-button" onClick={() => transitionSelected('approve')}>Duyệt</button><button className="quiet-button" onClick={() => transitionSelected('reject')}>Từ chối</button></>}
                {selected.status === 'Đã duyệt' && <button className="primary-button" onClick={publishSelected}>Xuất bản phiên bản</button>}
                {selected.status === 'Đã xuất bản' && <button className="quiet-button" onClick={() => transitionSelected('unpublish')}>Gỡ xuất bản</button>}
                {selected.status === 'Đã gỡ xuất bản' && <button className="primary-button" onClick={() => transitionSelected('republish')}>Xuất bản lại</button>}
                {selected.status === 'Cần rà soát' && <button className="primary-button" onClick={() => transitionSelected('submit')}>Gửi duyệt lại</button>}
              </div>
              {toast && <p className="toast" role="status">{toast}</p>}
            </section>
          </div>}
        </section>

        <section className="insight-strip"><div><span className="strip-label">Bước tiếp theo</span><strong>{selected.status === 'Chờ duyệt' ? 'Kiểm tra nội dung trước khi xuất bản' : 'Chọn một bản dịch cần rà soát'}</strong></div><div className="strip-action"><span className="strip-line" /><button onClick={() => { setStatusFilter('PENDING_REVIEW'); setSearch(''); setToast('Đã mở hàng đợi kiểm duyệt.'); }}>Mở hàng đợi <span>↗</span></button></div></section>
      </main>

      {showVisitor && <div className="visitor-overlay" role="dialog" aria-modal="true" aria-labelledby="visitor-title"><div className="visitor-card"><button className="close-button" aria-label="Đóng preview" onClick={() => setShowVisitor(false)}>×</button><span className="visitor-label">Visitor preview · {selected.language}</span><h2 id="visitor-title">{selected.title}</h2><p>{selected.body}</p><div className="visitor-player">{selected.audioUrl ? <audio controls preload="metadata" src={selected.audioUrl} aria-label="Audio thuyết minh" /> : <p className="empty-state">Chưa có audio thực. Hãy upload file hoặc tạo bằng ElevenLabs.</p>}</div></div></div>}
      {showHistory && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="history-title"><div className="modal-card history-card"><button type="button" className="close-button" aria-label="Đóng lịch sử" onClick={() => setShowHistory(false)}>×</button><h2 id="history-title">Lịch sử workflow.</h2><div className="history-list">{history.length ? history.map((event) => <div className="history-row" key={`${event.eventType}-${event.actedAt}`}><strong>{event.eventType}</strong><span>{new Date(event.actedAt).toLocaleString('vi-VN')}</span><small>{event.reason ?? `Actor #${event.actorUserId}`}</small></div>) : <p className="empty-state">Chưa có lịch sử.</p>}</div></div></div>}
      {showCreate && <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-title"><form className="modal-card" onSubmit={createContent}><button type="button" className="close-button" aria-label="Đóng form tạo nội dung" onClick={() => setShowCreate(false)}>×</button><h2 id="create-title">Tạo nội dung mới.</h2><label>Điểm tham quan<select value={newContent.poiId} onChange={(event) => setNewContent({ ...newContent, poiId: event.target.value })} required><option value="">Chọn POI</option>{pois.map((poi) => { const name = poi.translations.find((item) => item.languageCode === 'vi')?.name ?? poi.translations.find((item) => item.languageCode === 'en')?.name ?? 'Unnamed'; return <option key={poi.id} value={poi.id}>POI #{poi.id} · {name}</option>; })}</select></label><label>Ngôn ngữ<select value={newContent.languageCode} onChange={(event) => setNewContent({ ...newContent, languageCode: event.target.value })}>{languages.filter((l) => l.isActive).map((lang) => <option key={lang.code} value={lang.code}>{lang.name} ({lang.code.toUpperCase()}){lang.isFallback ? ' · Mặc định' : ''}</option>)}</select></label><label>Tiêu đề<input value={newContent.title} onChange={(event) => setNewContent({ ...newContent, title: event.target.value })} placeholder="Cổng thành phía Đông" required /></label><label>Nội dung thuyết minh<textarea value={newContent.narrationText} onChange={(event) => setNewContent({ ...newContent, narrationText: event.target.value })} rows={5} placeholder="Nhập lời thuyết minh..." required /></label><div className="modal-actions"><button type="button" className="quiet-button" onClick={() => setShowCreate(false)}>Hủy</button><button type="submit" className="primary-button">Tạo bản nháp</button></div></form></div>}
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

