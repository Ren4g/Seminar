
// Shared state, demo data, and helpers loaded before the feature scripts.
"use strict";

  const DB_KEY = "didau.prototype.db.v1";
  const SESSION_KEY = "didau.prototype.session.v1";
  const HISTORY_KEY = "didau.prototype.history.v1";
  const LANG_KEY = "didau.prototype.language.v1";
  const STATUS = {
    draft: ["Bản nháp", "gray"],
    review: ["Chờ duyệt", "yellow"],
    rejected: ["Bị từ chối", "red"],
    published: ["Đã xuất bản", "green"],
    removed: ["Đã gỡ", "gray"],
    replaced: ["Đã thay thế", "gray"],
  };
  const LABELS = {
    dashboard: "Tổng quan", locations: "Địa điểm", pois: "Điểm POI",
    contents: "Nội dung thuyết minh", reviews: "Kiểm duyệt",
    languages: "Ngôn ngữ & giọng đọc", staff: "Tài khoản nhân sự",
    audio: "Quản lý audio", qr: "Mã QR", analytics: "Thống kê",
    visitor: "Trang tham quan", history: "Lịch sử nghe",
  };
  const UI_TEXT = {
    en: {
      interfaceLanguage: "Language", history: "Listening history", login: "Sign in",
      heroKicker: "Travel slowly. Listen closely.", heroTitle: "Every place has a story worth hearing.",
      heroText: "Local stories, told in your language. Choose a destination and start listening.",
      heroCta: "Explore points of interest", discover: "Discover", points: "points of interest",
      noPois: "No active points of interest at this destination.", help: "Need a hand?",
      helpText: "Scan the QR code at each stop to open its narration directly.",
      footer: "DiDau · Multilingual audio guides for memorable journeys",
      back: "All destinations", unavailablePoi: "This point of interest is currently unavailable.",
      noNarration: "No published narration is available for this point yet.",
      noFallback: "No English fallback narration is available for this point.",
      fallback: "No {language} narration is available; showing English instead.",
      listen: "Listen to the story", deviceVoice: "Device voice", startPlayback: "Tap play to start listening",
      playing: "Playing audio", speaking: "Reading with your browser voice", paused: "Paused",
      ended: "Finished listening", stopped: "Stopped", seek: "Seek audio", audioError: "Audio could not be loaded. The narration text is still available.",
      chooseFromTop: "Use the language selector in the top bar", relatedPois: "Points of interest",
      locationPrefix: "Explore", searchPrompt: "Choose a destination", emptyHistory: "You have not listened to a story on this device yet.",
      clearHistory: "Clear history", historyTitle: "Listening history", historySubtitle: "Stories listened to on this device.",
      poiColumn: "Point of interest", locationColumn: "Destination", lastListened: "Last listened",
      openPoi: "Open point", localHistory: "History is stored on this device only. Clearing browser data removes it.",
      visit: "Explore point", loading: "Preparing narration", historyEmptyTitle: "Your next story is waiting",
    },
    vi: {
      interfaceLanguage: "Ngôn ngữ", history: "Lịch sử nghe", login: "Đăng nhập",
      heroKicker: "Đi chậm. Nghe thật nhiều.", heroTitle: "Chạm vào câu chuyện của mỗi nơi.",
      heroText: "Những câu chuyện địa phương, được kể bằng ngôn ngữ của bạn. Chỉ cần chọn điểm đến và bắt đầu lắng nghe.",
      heroCta: "Khám phá điểm tham quan", discover: "Cùng khám phá", points: "điểm tham quan",
      noPois: "Địa điểm này chưa có điểm tham quan hoạt động.", help: "Cần trợ giúp?",
      helpText: "Quét mã QR tại mỗi điểm để mở thuyết minh trực tiếp.",
      footer: "DiDau · Thuyết minh đa ngôn ngữ cho những hành trình đáng nhớ",
      back: "Tất cả địa điểm", unavailablePoi: "Điểm tham quan này hiện không khả dụng.",
      noNarration: "Chưa có nội dung thuyết minh được xuất bản cho điểm này.",
      noFallback: "Chưa có nội dung tiếng Anh dự phòng cho điểm tham quan này.",
      fallback: "Chưa có nội dung {language}; đang hiển thị tiếng Anh.",
      listen: "Nghe thuyết minh", deviceVoice: "Giọng đọc trên thiết bị", startPlayback: "Nhấn phát để bắt đầu nghe",
      playing: "Đang phát audio", speaking: "Đang đọc bằng giọng trình duyệt", paused: "Đã tạm dừng",
      ended: "Đã nghe xong", stopped: "Đã dừng", seek: "Tua audio", audioError: "Không tải được audio. Văn bản thuyết minh vẫn hiển thị.",
      chooseFromTop: "Dùng bộ chọn trên thanh đầu trang", relatedPois: "Điểm tham quan",
      locationPrefix: "Cùng khám phá", searchPrompt: "Khám phá địa điểm", emptyHistory: "Bạn chưa nghe thuyết minh nào trên thiết bị này.",
      clearHistory: "Xóa lịch sử", historyTitle: "Lịch sử nghe", historySubtitle: "Danh sách POI đã nghe trên thiết bị này.",
      poiColumn: "Điểm tham quan", locationColumn: "Địa điểm", lastListened: "Nghe gần nhất",
      openPoi: "Mở POI", localHistory: "Lịch sử chỉ lưu trên trình duyệt này. Xóa dữ liệu trình duyệt sẽ xóa lịch sử nghe.",
      visit: "Khám phá điểm đến", loading: "Đang chuẩn bị nội dung", historyEmptyTitle: "Câu chuyện tiếp theo đang chờ bạn",
    },
    fr: {
      interfaceLanguage: "Langue", history: "Historique d’écoute", login: "Connexion",
      heroKicker: "Prenez le temps. Écoutez.", heroTitle: "Chaque lieu a une histoire à raconter.",
      heroText: "Des récits locaux dans votre langue. Choisissez une destination et commencez l’écoute.",
      heroCta: "Explorer les points d’intérêt", discover: "À découvrir", points: "points d’intérêt",
      noPois: "Aucun point d’intérêt actif dans cette destination.", help: "Besoin d’aide ?",
      helpText: "Scannez le QR code à chaque arrêt pour ouvrir directement son récit.",
      footer: "DiDau · Des audioguides multilingues pour de beaux voyages",
      back: "Toutes les destinations", unavailablePoi: "Ce point d’intérêt est actuellement indisponible.",
      noNarration: "Aucun récit publié n’est disponible pour ce point.",
      noFallback: "Aucun récit anglais de secours n’est disponible pour ce point.",
      fallback: "Le récit en {language} est indisponible ; affichage en anglais.",
      listen: "Écouter le récit", deviceVoice: "Voix de l’appareil", startPlayback: "Appuyez sur lecture pour écouter",
      playing: "Lecture audio", speaking: "Lecture avec la voix du navigateur", paused: "En pause",
      ended: "Écoute terminée", stopped: "Arrêté", seek: "Rechercher dans l’audio", audioError: "Audio indisponible. Le texte du récit reste accessible.",
      chooseFromTop: "Utilisez le sélecteur de langue en haut de page", relatedPois: "Points d’intérêt",
      locationPrefix: "À découvrir", searchPrompt: "Choisir une destination", emptyHistory: "Vous n’avez pas encore écouté de récit sur cet appareil.",
      clearHistory: "Effacer l’historique", historyTitle: "Historique d’écoute", historySubtitle: "Récits écoutés sur cet appareil.",
      poiColumn: "Point d’intérêt", locationColumn: "Destination", lastListened: "Dernière écoute",
      openPoi: "Ouvrir", localHistory: "L’historique reste sur cet appareil. L’effacement des données du navigateur le supprime.",
      visit: "Découvrir", loading: "Préparation du récit", historyEmptyTitle: "Votre prochaine histoire vous attend",
    },
  };
  const ICONS = {
    dashboard: "▦", locations: "⌖", pois: "◉", contents: "▤",
    reviews: "✓", languages: "文", staff: "♙", audio: "♫",
    qr: "▧", analytics: "↗", visitor: "⌂", history: "◷",
  };

  const now = () => new Date().toISOString();
  const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const dateLabel = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "—";
  const hashText = (value) => {
    let hash = 2166136261;
    for (const char of String(value || "")) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return (hash >>> 0).toString(16);
  };
  const audioReady = (version) => Boolean(version?.audio && version.audio.hash === hashText(version.body));

  function initialData() {
    const locationId = "loc-hoian";
    const poi1 = "poi-japanese-bridge";
    const poi2 = "poi-tan-ky";
    const poi3 = "poi-river";
    const createPublished = (id, poiId, language, title, body, audioType = "speech") => ({
      id, poiId, language, title, body, status: "published", audio: { type: audioType, voice: "", hash: hashText(body) },
      needsReview: false, createdAt: "2026-03-08T09:00:00.000Z", updatedAt: "2026-03-08T09:00:00.000Z",
      sourceVersionId: null, rejectionReason: "",
    });
    const published = [
      createPublished("ver-bridge-en", poi1, "en", "The Japanese Covered Bridge",
        "Built in the 17th century, the Japanese Covered Bridge connected the Japanese and Chinese quarters of Hoi An. Its graceful wooden roof shelters a small temple at the heart of the old town."),
      createPublished("ver-bridge-vi", poi1, "vi", "Chùa Cầu",
        "Được xây dựng vào thế kỷ 17, Chùa Cầu nối liền khu phố Nhật Bản và khu phố Hoa tại Hội An. Mái ngói cong che chở một ngôi miếu nhỏ, trở thành biểu tượng của phố cổ.", "speech"),
      createPublished("ver-house-en", poi2, "en", "Tan Ky Ancient House",
        "For more than two centuries, seven generations of the Le family have called this house home. Its architecture blends Vietnamese, Japanese and Chinese influences."),
      createPublished("ver-river-en", poi3, "en", "Thu Bon River",
        "The Thu Bon River has carried merchants and stories through Hoi An for centuries. At sunset, lanterns shimmer across the water and the old town slows to the rhythm of the river."),
    ];
    published[1].sourceVersionId = published[0].id;
    const sampleAudio = { type: "speech", voice: "", hash: hashText("Bản nháp minh họa về lịch sử Chùa Cầu, điểm nối giữa các nền văn hóa ở Hội An.") };
    const draft = {
      id: "ver-bridge-draft", poiId: poi1, language: "vi", title: "Lịch sử Chùa Cầu",
      body: "Bản nháp minh họa về lịch sử Chùa Cầu, điểm nối giữa các nền văn hóa ở Hội An.",
      status: "draft", audio: sampleAudio, needsReview: false, createdAt: now(), updatedAt: now(),
      sourceVersionId: null, rejectionReason: "",
    };
    const review = {
      id: "ver-house-review", poiId: poi2, language: "vi", title: "Nhà cổ Tấn Ký",
      body: "Ngôi nhà đã trải qua hơn hai thế kỷ và bảy thế hệ của gia đình họ Lê. Kiến trúc là sự giao thoa giữa Việt Nam, Nhật Bản và Trung Hoa.",
      status: "review", audio: { type: "speech", voice: "", hash: hashText("Ngôi nhà đã trải qua hơn hai thế kỷ và bảy thế hệ của gia đình họ Lê. Kiến trúc là sự giao thoa giữa Việt Nam, Nhật Bản và Trung Hoa.") },
      needsReview: false, createdAt: now(), updatedAt: now(), sourceVersionId: "ver-house-en", rejectionReason: "",
    };
    return {
      users: [
        { id: "user-admin", username: "admin", email: "admin@didau.demo", name: "Minh Anh", role: "admin", active: true, locationIds: [], password: "admin123" },
        { id: "user-editor", username: "editor", email: "editor@didau.demo", name: "Content Editor", role: "manager", active: true, locationIds: [locationId], password: "editor123" },
      ],
      languages: [
        { code: "en", name: "English", nativeName: "English", active: true, voices: ["English (US)", "English (UK)"], defaultVoice: "English (US)" },
        { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", active: true, voices: ["Vietnamese"], defaultVoice: "Vietnamese" },
        { code: "fr", name: "French", nativeName: "Français", active: true, voices: ["French"], defaultVoice: "French" },
      ],
      locations: [{
        id: locationId, names: { en: "Hoi An Ancient Town", vi: "Phố cổ Hội An", fr: "Vieille ville de Hội An" },
        descriptions: { en: "A riverside trading port where cultures meet and lanterns light the night.",
          vi: "Thương cảng bên sông, nơi giao thoa văn hóa và đèn lồng thắp sáng phố cổ.",
          fr: "Un ancien port marchand au bord de la rivière." }, active: true, createdAt: now(),
      }],
      pois: [
        { id: poi1, locationId, names: { en: "Japanese Covered Bridge", vi: "Chùa Cầu" }, descriptions: { en: "A beloved landmark connecting two historic quarters.", vi: "Biểu tượng nối hai khu phố cổ." }, active: true, icon: "🌉", qrUrl: "" },
        { id: poi2, locationId, names: { en: "Tan Ky Ancient House", vi: "Nhà cổ Tấn Ký" }, descriptions: { en: "A 200-year-old merchant home.", vi: "Ngôi nhà thương nhân hơn 200 năm tuổi." }, active: true, icon: "🏮", qrUrl: "" },
        { id: poi3, locationId, names: { en: "Thu Bon Riverside", vi: "Bờ sông Thu Bồn" }, descriptions: { en: "Lanterns and river life at sunset.", vi: "Nhịp sống ven sông khi hoàng hôn." }, active: true, icon: "🛶", qrUrl: "" },
      ],
      versions: [...published, draft, review],
      events: [],
      publicBaseUrl: "",
      audit: [{ id: makeId("audit"), action: "Khởi tạo dữ liệu mẫu", detail: "Tạo không gian demo DiDau", at: now(), actor: "system" }],
    };
  }

  function loadDb() {
    try {
      const saved = localStorage.getItem(DB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.versions)) return parsed;
      }
    } catch (error) {
      console.error("Không thể đọc dữ liệu DiDau:", error);
    }
    const data = initialData();
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    return data;
  }

  let db = loadDb();
  let session = null;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch (error) { console.error(error); }
  let currentPage = "visitor";
  let selectedPoiId = new URLSearchParams(location.search).get("poi") || "";
  let currentLocale = "";
  try { currentLocale = localStorage.getItem(LANG_KEY) || ""; } catch (error) { console.error("Không thể đọc tùy chọn ngôn ngữ:", error); }
  let toastTimer;
  let utterance = null;
  let analyticsPeriod = "30";
  let contentFilter = "all";

  const root = document.getElementById("app");
  const dialog = document.getElementById("dialog");
  const toastNode = document.getElementById("toast");

  function save() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
  function actor() {
    return session ? db.users.find((item) => item.id === session.userId) || null : null;
  }
  function isAdmin() {
    return actor()?.role === "admin";
  }
  function canAccessPoi(poi) {
    const user = actor();
    if (!user || !poi) return false;
    if (user.role === "admin") return true;
    const place = db.locations.find((item) => item.id === poi.locationId);
    return Boolean(place && user.locationIds?.includes(place.id));
  }
  function allowedPois() {
    return db.pois.filter((poi) => canAccessPoi(poi));
  }
  function getLocation(id) {
    return db.locations.find((place) => place.id === id);
  }
  function getPoi(id) {
    return db.pois.find((poi) => poi.id === id);
  }
  function getLanguage(code) {
    return db.languages.find((language) => language.code === code);
  }
  function langName(code) {
    return getLanguage(code)?.nativeName || code.toUpperCase();
  }
  function ui(key, vars = {}) {
    const language = currentLocale || detectLanguage();
    let value = UI_TEXT[language]?.[key] || UI_TEXT.en[key] || key;
    for (const [name, replacement] of Object.entries(vars)) value = value.replace(`{${name}}`, replacement);
    return value;
  }
  function localized(record, field, code) {
    const values = record?.[field] || {};
    return values[code] || values.en || Object.values(values).find(Boolean) || "";
  }
  function publishedVersion(poiId, language) {
    return db.versions.find((item) => item.poiId === poiId && item.language === language && item.status === "published") || null;
  }
  function editingVersion(poiId, language) {
    return db.versions.find((item) => item.poiId === poiId && item.language === language && ["draft", "review", "rejected"].includes(item.status)) || null;
  }
  function currentVersion(poiId, language) {
    return editingVersion(poiId, language) || publishedVersion(poiId, language);
  }
  function statusBadge(status) {
    const label = STATUS[status] || [status, "gray"];
    return `<span class="badge badge-${label[1]}">${safe(label[0])}</span>`;
  }
  function addAudit(action, detail) {
    db.audit.unshift({ id: makeId("audit"), action, detail, at: now(), actor: actor()?.username || "Visitor" });
    db.audit = db.audit.slice(0, 500);
  }
  function recordEvent(type, poiId = "", language = "") {
    const poi = getPoi(poiId);
    db.events.push({ id: makeId("event"), type, poiId, locationId: poi?.locationId || "", language, at: now(), seconds: 0 });
    save();
  }
  function notify(message) {
    toastNode.textContent = message;
    toastNode.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNode.classList.remove("show"), 3000);
  }
  function heading(title, subtitle, actions = "") {
    return `<div class="page-heading"><div><div class="eyebrow">Không gian quản trị</div><h1>${safe(title)}</h1><p class="page-subtitle">${safe(subtitle)}</p></div><div class="actions">${actions}</div></div>`;
  }
  function button(label, action, style = "btn-outline", extra = "") {
    return `<button class="btn ${style}" data-action="${safe(action)}" ${extra}>${label}</button>`;
  }
  function tableEmpty(message, colspan) {
    return `<tr><td colspan="${colspan}"><div class="empty"><div class="empty-icon">⌕</div>${safe(message)}</div></td></tr>`;
  }
  function pageShell(content) {
    const user = actor();
    const nav = isAdmin()
      ? ["dashboard", "locations", "pois", "contents", "reviews", "languages", "staff", "audio", "qr", "analytics"]
      : ["dashboard", "locations", "pois", "contents", "audio", "qr"];
    const pending = db.versions.filter((item) => item.status === "review").length;
    return `<div class="app-shell">
      <header class="topbar"><a class="brand" href="#" data-action="home"><span class="brand-mark">d</span> didau<span class="small-note">/ studio</span></a>
        <div class="top-actions"><span class="top-user"><span class="avatar">${safe(user?.name?.slice(0, 1) || "D")}</span>${safe(user?.name || "Khách")}&nbsp;·&nbsp;${user?.role === "admin" ? "Administrator" : "Content Manager"}</span>
          <button class="btn btn-outline btn-sm" data-action="visitor">↗&nbsp; Xem website</button>
          <button class="icon-btn" title="Tài khoản" data-action="account-menu">⋯</button>
        </div>
      </header><div class="layout"><aside class="sidebar">
        <div class="nav-caption">Workspace</div>
        ${nav.map((page) => `<button class="nav-link ${currentPage === page ? "active" : ""}" data-page="${page}"><span class="nav-icon">${ICONS[page]}</span>${LABELS[page]}${page === "reviews" && pending ? `<span class="nav-count">${pending}</span>` : ""}</button>`).join("")}
        <div class="nav-caption">Cá nhân</div>
        <button class="nav-link" data-action="change-password"><span class="nav-icon">⌑</span>Đổi mật khẩu</button>
        <button class="nav-link" data-action="logout"><span class="nav-icon">⇥</span>Đăng xuất</button>
      </aside><main class="content">${content}</main></div></div>`;
  }

  function locationName(id, language = "en") {
    return localized(getLocation(id), "names", language) || "Địa điểm";
  }
  function publicPoiUrl(poiId) {
    const base = db.publicBaseUrl || (location.protocol === "file:" ? "" : `${location.origin}${location.pathname}`);
    if (!base) return "";
    try {
      const url = new URL(base);
      if (!["http:", "https:"].includes(url.protocol)) return "";
      url.search = "";
      url.hash = "";
      url.searchParams.set("poi", poiId);
      return url.href;
    } catch (error) {
      console.error("URL website công khai không hợp lệ:", error);
      return "";
    }
  }
  function poiName(id, language = "en") {
    return localized(getPoi(id), "names", language) || "Điểm tham quan";
  }
  function versionLabel(version) {
    const poi = getPoi(version.poiId);
    return `${poiName(version.poiId, "en")} · ${langName(version.language)}`;
  }
  function contentTitle(version) {
    return version?.title || poiName(version?.poiId, currentLocale || "en");
  }
