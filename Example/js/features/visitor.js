"use strict";

// visitor domain functions.

function renderHistory() {
    const history = readHistory();
    return `<div class="page-heading"><div><div class="eyebrow">DiDau</div><h1>${safe(ui("historyTitle"))}</h1><p class="page-subtitle">${safe(ui("historySubtitle"))}</p></div><div class="actions">${button(safe(ui("clearHistory")), "clear-history", "btn-outline")}</div></div>
      <div class="card table-wrap"><table><thead><tr><th>${safe(ui("poiColumn"))}</th><th>${safe(ui("locationColumn"))}</th><th>${safe(ui("lastListened"))}</th><th></th></tr></thead><tbody>
      ${history.length ? history.map((entry) => {
        const poi = getPoi(entry.poiId);
        return poi ? `<tr><td><div class="table-primary">${safe(poiName(poi.id, currentLocale || "en"))}</div></td><td>${safe(locationName(poi.locationId, currentLocale || "en"))}</td><td>${dateLabel(entry.at)}</td><td><button class="btn btn-soft btn-sm" data-action="open-visitor-poi" data-id="${poi.id}">${safe(ui("openPoi"))}</button></td></tr>` : "";
      }).join("") : tableEmpty(ui("emptyHistory"), 4)}
      </tbody></table></div><div class="notice notice-info">${safe(ui("localHistory"))}</div>`;
  }


  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch (error) { console.error("Không thể đọc lịch sử nghe:", error); notify("Không thể đọc lịch sử nghe trên thiết bị."); return []; }
  }

  function saveHistory(poiId) {
    const history = readHistory().filter((entry) => entry.poiId !== poiId);
    history.unshift({ poiId, at: now() });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100))); }
    catch (error) { notify("Không thể lưu lịch sử nghe trên thiết bị."); console.error(error); }
  }

  function supportedLanguages() {
    return db.languages.filter((language) => language.active);
  }

  function detectLanguage() {
    if (currentLocale && getLanguage(currentLocale)?.active) return currentLocale;
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    currentLocale = getLanguage(browser)?.active ? browser : "en";
    try { localStorage.setItem(LANG_KEY, currentLocale); }
    catch (error) { console.error("Không thể lưu ngôn ngữ:", error); }
    return currentLocale;
  }

  function resolveVisitorContent(poiId, language) {
    let version = publishedVersion(poiId, language);
    let fallback = false;
    if (!version && language !== "en") {
      version = publishedVersion(poiId, "en");
      fallback = Boolean(version);
    }
    return { version, fallback };
  }

  function renderVisitor() {
    const language = detectLanguage();
    const selectedLocation = selectedPoiId ? getPoi(selectedPoiId)?.locationId : "";
    const locations = db.locations.filter((place) => place.active);
    const locationId = selectedLocation || locations[0]?.id || "";
    const location = getLocation(locationId);
    const activePois = db.pois.filter((poi) => poi.active && poi.locationId === locationId);
    const detailPoi = selectedPoiId ? getPoi(selectedPoiId) : null;
    const { version, fallback } = detailPoi ? resolveVisitorContent(detailPoi.id, language) : { version: null, fallback: false };
    const placeSelect = `<select class="select" id="visitor-location">${locations.map((place) => `<option value="${place.id}" ${place.id === locationId ? "selected" : ""}>${safe(localized(place, "names", language))}</option>`).join("")}</select>`;
    const historyButton = `<button class="btn btn-outline btn-sm" data-action="visitor-history">◷&nbsp; ${safe(ui("history"))}</button>`;
    if (detailPoi) {
      if (!detailPoi.active) {
        return visitorShell(`${historyButton}`, `<div class="visitor-section"><button class="text-link" data-action="back-locations">← ${safe(ui("back"))}</button><div class="card empty" style="margin-top:20px"><div class="empty-icon">!</div>${safe(ui("unavailablePoi"))}</div></div>`);
      }
      if (!version) {
        const message = language !== "en" && !publishedVersion(detailPoi.id, language) ? ui("noFallback") : ui("noNarration");
        return visitorShell(`${historyButton}`, `<div class="visitor-section"><button class="text-link" data-action="back-locations">← ${safe(locationName(detailPoi.locationId, language))}</button><div class="card empty" style="margin-top:20px"><div class="empty-icon">♫</div>${safe(message)}</div></div>`);
      }
      const audio = version.audio;
      const player = audio?.type === "upload"
        ? `<audio id="visitor-audio" preload="metadata" src="${safe(audio.dataUrl)}"></audio>`
        : `<audio id="visitor-audio" hidden></audio>`;
      return visitorShell(`${historyButton}`, `<div class="visitor-section"><button class="text-link" data-action="back-locations">← ${safe(locationName(detailPoi.locationId, language))}</button>
        <div class="detail-panel"><article class="card detail-main"><div class="eyebrow">${safe(locationName(detailPoi.locationId, language))} · ${safe(langName(version.language))}</div>
          <div class="detail-title">${safe(version.title || poiName(detailPoi.id, language))}</div>
          <p class="page-subtitle">${safe(localized(detailPoi, "descriptions", language))}</p>
          ${fallback ? `<div class="notice notice-warn">${safe(ui("fallback", { language: langName(language) }))}</div>` : ""}
          <div class="audio-box">${player}<div class="audio-controls"><button class="play-btn" data-action="visitor-play" data-id="${version.id}" aria-label="${safe(ui("listen"))}">▶</button><div class="audio-info"><strong>${safe(ui("listen"))}</strong><span>${audio?.type === "upload" ? safe(audio.name || "Audio") : safe(ui("deviceVoice"))}</span></div><button class="icon-btn" data-action="visitor-stop" title="${safe(ui("stopped"))}">■</button></div>
            ${audio?.type === "upload" ? `<input class="audio-seek" type="range" id="visitor-seek" min="0" max="0" value="0" aria-label="${safe(ui("seek"))}">` : `<div class="audio-progress"><span id="visitor-progress"></span></div>`}
            <div class="small-note" id="audio-status" style="margin-top:8px">${safe(ui("startPlayback"))}</div></div>
          <div class="detail-body">${safe(version.body)}</div>
        </article>                <aside class="card detail-aside"><div class="section-head"><div><h3>${safe(ui("interfaceLanguage"))}</h3><p>${safe(ui("chooseFromTop"))}</p></div></div>
          <hr class="divider"><div class="section-head"><div><h3>${safe(ui("relatedPois"))}</h3><p>${safe(locationName(detailPoi.locationId, language))}</p></div></div>
          ${db.pois.filter((poi) => poi.active && poi.locationId === detailPoi.locationId).map((poi) => `<button class="nav-link ${poi.id === detailPoi.id ? "active" : ""}" data-action="open-visitor-poi" data-id="${poi.id}">${safe(poi.icon || "◉")} &nbsp;${safe(poiName(poi.id, language))}</button>`).join("")}
        </aside></div></div>`);
    }
    const cards = activePois.map((poi) => {
      const content = resolveVisitorContent(poi.id, language);
      return `<article class="card poi-card"><div class="poi-cover">${safe(poi.icon || "🌿")}</div><div class="poi-content"><div class="poi-title-row"><h3>${safe(content.version?.title || poiName(poi.id, language))}</h3>${content.fallback ? `<span class="badge badge-gray">EN</span>` : ""}</div>
        <div class="poi-meta">${safe(locationName(poi.locationId, language))}</div><p>${safe(localized(poi, "descriptions", language) || "Khám phá câu chuyện tại điểm tham quan này.")}</p>
        ${content.version ? `<button class="btn btn-primary btn-sm" data-action="open-visitor-poi" data-id="${poi.id}">${safe(ui("visit"))}&nbsp; →</button>` : `<span class="small-note">${safe(ui("loading"))}</span>`}
      </div></article>`;
    }).join("");
    const hero = `<section class="visitor-hero"><div class="hero-copy"><div class="hero-kicker">${safe(ui("heroKicker"))}</div><h1>${safe(ui("heroTitle"))}</h1><p>${safe(ui("heroText"))}</p><button class="btn hero-cta" data-action="scroll-pois">${safe(ui("heroCta"))}&nbsp; ↓</button></div></section>`;
    const placeBar = locations.length > 1 ? `<div class="filters" style="margin-top:19px"><span class="filter-label">${safe(ui("searchPrompt"))}</span>${placeSelect}</div>` : "";
    const content = `${hero}${placeBar}<section class="visitor-section" id="visitor-pois"><div class="visitor-section-head"><div><div class="eyebrow">${safe(ui("discover"))}</div><h2>${safe(location ? localized(location, "names", language) : "—")}</h2></div><span>${activePois.length} ${safe(ui("points"))}</span></div>
      ${activePois.length ? `<div class="poi-grid">${cards}</div>` : `<div class="card empty">${safe(ui("noPois"))}</div>`}</section>
      <section class="visitor-section"><div class="card card-pad"><div class="section-head"><div><h2>${safe(ui("help"))}</h2><p>${safe(ui("helpText"))}</p></div><span style="font-size:23px">▧</span></div></div></section>`;
    return visitorShell(`${historyButton}`, content);
  }

  function visitorShell(actions, content) {
    return `<div class="app-shell"><header class="topbar"><a class="brand" href="#" data-action="visitor"><span class="brand-mark">d</span> didau</a>
      <div class="top-actions"><div class="language-top"><label for="visitor-language">${safe(ui("interfaceLanguage"))}</label>${supportedLanguages().length ? `<select class="select" id="visitor-language">${supportedLanguages().map((item) => `<option value="${item.code}" ${item.code === detectLanguage() ? "selected" : ""}>${safe(item.nativeName)}</option>`).join("")}</select>` : ""}</div>
      ${actions}<button class="btn btn-outline btn-sm" data-action="login">${safe(ui("login"))}</button></div></header><main class="visitor-body">${content}
      <footer style="text-align:center;color:#9aa19a;font-size:10px;margin-top:45px">${safe(ui("footer"))}</footer></main></div>`;
  }

  function navigatePoi(id) {
    const poi = getPoi(id);
    if (!poi || !poi.active) return notify("Điểm tham quan không khả dụng.");
    selectedPoiId = id;
    currentPage = "visitor";
    const url = new URL(location.href);
    url.searchParams.set("poi", id);
    history.pushState({ poiId: id }, "", url);
    recordEvent("visit", id, detectLanguage());
    render();
  }

  function switchVisitorLanguage(code) {
    const language = getLanguage(code);
    if (!language?.active) return notify("Ngôn ngữ đã bị tắt. Hãy chọn lại.");
    currentLocale = code;
    try { localStorage.setItem(LANG_KEY, code); }
    catch (error) { console.error("Không thể lưu ngôn ngữ:", error); notify("Không thể lưu ngôn ngữ trên thiết bị; lựa chọn chỉ áp dụng trong phiên này."); }
    if (selectedPoiId) {
      const result = resolveVisitorContent(selectedPoiId, code);
      if (!result.version) notify(ui("noFallback"));
    }
    render();
  }

  function logListen(version) {
    const event = { id: makeId("event"), type: "listen", poiId: version.poiId, locationId: getPoi(version.poiId)?.locationId || "", language: version.language, at: now(), seconds: 0 };
    db.events.push(event);
    saveHistory(version.poiId);
    save();
    return event;
  }

  function playVisitor(id) {
    const version = db.versions.find((item) => item.id === id && item.status === "published");
    if (!version || !getPoi(version.poiId)?.active) return notify("Nội dung không còn khả dụng.");
    if (!audioReady(version)) return notify("Audio không tải được. Văn bản thuyết minh vẫn hiển thị.");
    const audio = document.getElementById("visitor-audio");
    const buttonNode = document.querySelector(`[data-action="visitor-play"][data-id="${CSS.escape(id)}"]`);
    const statusNode = document.getElementById("audio-status");
    if (version.audio.type === "upload" && audio) {
      if (!audio.paused && !audio.ended) { audio.pause(); return; }
      if (audio.paused && audio.currentTime > 0 && !audio.ended) {
        audio.play().catch((error) => { console.error(error); notify("Không thể tiếp tục phát audio."); });
        return;
      }
      if (audio.ended) audio.currentTime = 0;
      const event = logListen(version);
      let segmentStart = 0;
      const finishSegment = () => {
        if (!segmentStart) return;
        event.seconds += Math.max(0, Math.round((Date.now() - segmentStart) / 1000));
        segmentStart = 0;
        save();
      };
      audio.onended = () => { finishSegment(); if (buttonNode) buttonNode.textContent = "▶"; if (statusNode) statusNode.textContent = ui("ended"); };
      audio.onerror = () => notify(ui("audioError"));
      audio.onloadedmetadata = () => {
        const seek = document.getElementById("visitor-seek");
        if (seek && Number.isFinite(audio.duration)) seek.max = String(audio.duration);
      };
      audio.ontimeupdate = () => {
        const seek = document.getElementById("visitor-seek");
        if (seek) seek.value = String(audio.currentTime);
      };
      audio.onplay = () => { segmentStart = Date.now(); if (buttonNode) buttonNode.textContent = "Ⅱ"; if (statusNode) statusNode.textContent = ui("playing"); };
      audio.onpause = () => { finishSegment(); if (buttonNode) buttonNode.textContent = "▶"; if (statusNode) statusNode.textContent = ui("paused"); };
      audio.play().catch((error) => { console.error(error); notify("Không thể phát audio. Hãy thử lại."); });
    } else {
      if (!("speechSynthesis" in window)) return notify("Trình duyệt này không hỗ trợ phát giọng đọc.");
      if (window.speechSynthesis?.speaking) {
        if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); if (statusNode) statusNode.textContent = ui("speaking"); }
        else { window.speechSynthesis.pause(); if (statusNode) statusNode.textContent = ui("paused"); }
        if (buttonNode) buttonNode.textContent = window.speechSynthesis.paused ? "▶" : "Ⅱ";
        return;
      }
      const event = logListen(version);
      let segmentStart = 0;
      const finishSegment = () => {
        if (!segmentStart) return;
        event.seconds += Math.max(0, Math.round((Date.now() - segmentStart) / 1000));
        segmentStart = 0;
        save();
      };
      const spoken = speakVersion(version);
      if (!spoken || typeof spoken === "boolean") return;
      spoken.onstart = () => { segmentStart = Date.now(); if (buttonNode) buttonNode.textContent = "Ⅱ"; if (statusNode) statusNode.textContent = ui("speaking"); };
      spoken.onpause = () => { finishSegment(); if (buttonNode) buttonNode.textContent = "▶"; if (statusNode) statusNode.textContent = ui("paused"); };
      spoken.onresume = () => { segmentStart = Date.now(); if (buttonNode) buttonNode.textContent = "Ⅱ"; };
      spoken.onend = () => { finishSegment(); if (buttonNode) buttonNode.textContent = "▶"; if (statusNode) statusNode.textContent = ui("ended"); };
    }
  }
