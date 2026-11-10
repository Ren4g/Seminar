"use strict";

// Wire UI events and initialize the selected route.
const handleClick = (event) => {
    const target = event.target.closest("[data-action], [data-page]");
    if (!target) return;
    const { action, page, id } = target.dataset;
    if (page) return changePage(page);
    switch (action) {
      case "home": case "visitor": currentPage = "visitor"; selectedPoiId = ""; history.replaceState({}, "", location.pathname); recordEvent("visit", "", detectLanguage()); render(); break;
      case "login": openLogin(); break;
      case "logout": logOut(); break;
      case "account-menu": openAccountMenu(); break;
      case "close-modal": closeModal(); break;
      case "change-password": openChangePassword(); break;
      case "forgot-password": openForgotPassword(); break;
      case "reset-demo": resetDemo(); break;
      case "new-location": openPlaceForm(); break;
      case "edit-location": openPlaceForm(id); break;
      case "view-place": {
        const place = getLocation(id);
        showModal("Chi tiết địa điểm", `<h2>${safe(locationName(id, "en"))}</h2><p class="copy">${safe(localized(place, "descriptions", currentLocale || "en"))}</p>
          <div class="mini-list">${db.pois.filter((poi) => poi.locationId === id).map((poi) => `<div class="mini-row"><div><div class="mini-row-title">${safe(poiName(poi.id, "en"))}</div><div class="mini-row-sub">${db.versions.filter((v) => v.poiId === poi.id).length} phiên bản nội dung</div></div>${poi.active ? `<span class="badge badge-green">Đang hoạt động</span>` : `<span class="badge badge-gray">Ngừng hoạt động</span>`}</div>`).join("") || "Chưa có POI."}</div>${isAdmin() ? `<div class="form-footer"><button class="btn btn-danger" data-action="delete-location" data-id="${id}">Xóa địa điểm</button><button class="btn btn-primary" data-action="edit-location" data-id="${id}">Chỉnh sửa</button></div>` : ""}`);
        break;
      }
      case "delete-location": {
        const place = getLocation(id);
        if (db.pois.some((poi) => poi.locationId === id)) return notify("Không thể xóa địa điểm đang chứa POI. Hãy ngừng hoạt động thay vì xóa.");
        if (!confirm(`Xóa địa điểm ${locationName(id, "en")}?`)) return;
        db.locations = db.locations.filter((item) => item.id !== id);
        addAudit("Xóa địa điểm", place?.names?.en || id);
        save(); closeModal(); render(); notify("Đã xóa địa điểm."); break;
      }
      case "new-poi": openPoiForm(); break;
      case "edit-poi": openPoiForm(id); break;
      case "open-poi-content": currentPage = "contents"; render(); openContentForm("", id); break;
      case "new-content": openContentForm(); break;
      case "edit-content": openContentForm(id); break;
      case "review-version": openReview(id); break;
      case "go-reviews": changePage("reviews"); break;
      case "approve-version": approveVersion(id); break;
      case "reject-version": rejectVersion(id); break;
      case "make-audio": createBrowserAudio(id); break;
      case "upload-audio": uploadAudio(id); break;
      case "preview-audio": previewVersion(id); break;
      case "new-language": openLanguageForm(); break;
      case "edit-language": openLanguageForm(id); break;
      case "new-user": openUserForm(); break;
      case "edit-user": openUserForm(id); break;
      case "toggle-user": {
        const user = db.users.find((item) => item.id === id);
        if (!user) return;
        if (user.id === actor()?.id && user.active) return notify("Bạn không thể tự khóa tài khoản đang đăng nhập.");
        if (user.role === "admin" && user.active && db.users.filter((item) => item.active && item.role === "admin").length <= 1) return notify("Không thể khóa Administrator cuối cùng.");
        if (user.role === "manager" && user.active && db.versions.some((version) => version.status === "review" && user.locationIds.includes(getPoi(version.poiId)?.locationId))) {
          if (!confirm("Tài khoản có nội dung đang chờ duyệt. Khóa tài khoản và giữ nội dung cho Administrator xử lý?")) return;
        }
        user.active = !user.active;
        addAudit(user.active ? "Mở khóa tài khoản" : "Khóa tài khoản", user.username);
        save(); render(); notify(user.active ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản."); break;
      }
      case "reset-user-password": {
        const user = db.users.find((item) => item.id === id);
        if (!user) return;
        showModal("Đặt lại mật khẩu", `<form data-form="admin-reset" data-id="${id}">${field("Mật khẩu mới", "password", "", { type: "password", required: true })}${formFooter("Hủy", "Đặt lại mật khẩu")}</form>`);
        break;
      }
      case "show-qr": openQr(id); break;
      case "configure-public-url": openPublicUrlForm(); break;
      case "download-qr": {
        const poi = getPoi(id);
        if (!poi) return notify("Không tìm thấy POI.");
        if (!poi.qrUrl) { openQr(id); return; }
        fetch(poi.qrUrl).then((response) => {
          if (!response.ok) throw new Error(`QR provider returned ${response.status}`);
          return response.blob();
        }).then((blob) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `didau-${poi.id}-qr.png`;
          link.click();
          URL.revokeObjectURL(link.href);
        }).catch((error) => { console.error("Không thể tải mã QR:", error); window.open(poi.qrUrl, "_blank", "noopener"); notify("Không thể tải xuống QR. Đã mở ảnh QR trong tab mới."); });
        break;
      }
      case "visitor-history": currentPage = "history"; render(); break;
      case "clear-history": if (confirm("Xóa toàn bộ lịch sử nghe trên thiết bị này?")) { localStorage.removeItem(HISTORY_KEY); render(); notify("Đã xóa lịch sử nghe."); } break;
      case "open-visitor-poi": navigatePoi(id); break;
      case "back-locations": currentPage = "visitor"; selectedPoiId = ""; history.replaceState({}, "", location.pathname); render(); break;
      case "visitor-play": playVisitor(id); break;
      case "visitor-stop": {
        window.speechSynthesis?.cancel();
        const audio = document.getElementById("visitor-audio");
        if (audio) { audio.pause(); audio.currentTime = 0; }
        const seek = document.getElementById("visitor-seek");
        if (seek) seek.value = "0";
        const playButton = document.querySelector('[data-action="visitor-play"]');
        if (playButton) playButton.textContent = "▶";
        const status = document.getElementById("audio-status");
        if (status) status.textContent = ui("stopped");
        break;
      }
      case "scroll-pois": document.getElementById("visitor-pois")?.scrollIntoView({ behavior: "smooth" }); break;
      case "submit-for-review": {
        const version = db.versions.find((item) => item.id === id);
        if (version) submitForReview(version);
        break;
      }
      case "withdraw-review": {
        const version = db.versions.find((item) => item.id === id && item.status === "review");
        if (!version || !canAccessPoi(getPoi(version.poiId))) return notify("Không thể thu hồi phiên bản này.");
        version.status = "draft"; version.updatedAt = now();
        addAudit("Thu hồi nội dung chờ duyệt", version.title);
        save(); render(); notify("Đã thu hồi về bản nháp."); break;
      }
      case "delete-draft": {
        const version = db.versions.find((item) => item.id === id);
        if (!version || !["draft", "rejected"].includes(version.status) || !canAccessPoi(getPoi(version.poiId))) return notify("Chỉ có thể xóa bản nháp hoặc bản bị từ chối.");
        if (!confirm("Xóa phiên bản nội dung này?")) return;
        db.versions = db.versions.filter((item) => item.id !== id);
        addAudit("Xóa bản nháp", version.title);
        save(); render(); notify("Đã xóa phiên bản."); break;
      }
      case "delete-poi": {
        const poi = getPoi(id);
        if (!poi || !canAccessPoi(poi)) return notify("Không tìm thấy POI hoặc bạn không có quyền.");
        const everPublished = db.versions.some((version) => version.poiId === id && ["published", "removed", "replaced"].includes(version.status));
        if (everPublished) return notify("POI đã từng có nội dung xuất bản. Hãy ngừng hoạt động thay vì xóa.");
        if (!confirm(`Xóa POI ${poiName(id, "en")}?`)) return;
        const name = poiName(id, "en");
        db.versions = db.versions.filter((version) => version.poiId !== id);
        db.pois = db.pois.filter((item) => item.id !== id);
        addAudit("Xóa POI", name);
        save(); render(); notify("Đã xóa POI."); break;
      }
      case "delete-audio": {
        const version = db.versions.find((item) => item.id === id);
        if (!version || !["draft", "rejected"].includes(version.status)) return notify("Chỉ có thể xóa audio của bản nháp hoặc bản bị từ chối.");
        version.audio = null; version.updatedAt = now();
        addAudit("Xóa audio", version.title);
        save(); render(); notify("Đã xóa audio."); break;
      }
      case "unpublish": {
        if (!isAdmin()) return notify("Chỉ Administrator được gỡ xuất bản.");
        const version = db.versions.find((item) => item.id === id && item.status === "published");
        if (!version) return notify("Không có phiên bản đang xuất bản.");
        showModal("Gỡ xuất bản", `<form data-form="unpublish" data-id="${id}"><div class="notice notice-warn">${version.language === "en" ? "Đây là nội dung tiếng Anh dự phòng. Gỡ nội dung có thể khiến Visitor không xem được POI." : "Nội dung sẽ không còn hiển thị cho Visitor."}</div>${field("Lý do gỡ xuất bản (bắt buộc)", "reason", "", { type: "textarea", rows: 3, required: true })}${formFooter("Hủy", "Gỡ xuất bản")}</form>`);
        break;
      }
      case "republish": {
        if (!isAdmin()) return notify("Chỉ Administrator được xuất bản lại.");
        const version = db.versions.find((item) => item.id === id && item.status === "removed");
        if (!version) return notify("Không tìm thấy phiên bản đã gỡ.");
        if (confirm("Xuất bản lại phiên bản này?")) {
          if (publishVersion(version, "Xuất bản lại nội dung")) { render(); notify("Đã xuất bản lại."); }
        }
        break;
      }
      case "translate": {
        const version = db.versions.find((item) => item.id === id);
        if (!version) return notify("Không tìm thấy nội dung nguồn.");
        showModal("Tạo bản dịch demo", `<div class="notice notice-warn">Bản dịch tự động chưa kết nối dịch vụ thật. Bản demo cần được biên tập trước khi xác nhận rà soát.</div>
          <div class="content-preview">${safe(version.title)}<br>${safe(version.body.slice(0, 260))}${version.body.length > 260 ? "…" : ""}</div><form data-form="translate" data-id="${id}" style="margin-top:15px">${selectField("Ngôn ngữ đích", "language", supportedLanguages().filter((language) => language.code !== version.language).map((language) => ({ value: language.code, label: language.nativeName })), "")}${formFooter("Hủy", "Tạo bản dịch")}</form>`);
        break;
      }
      case "review-translation": {
        const version = db.versions.find((item) => item.id === id);
        if (!version || !version.needsReview) return notify("Nội dung không còn cần rà soát.");
        const source = version.sourceVersionId ? db.versions.find((item) => item.id === version.sourceVersionId) : null;
        showModal("Rà soát bản dịch", `<div class="review-layout"><div><div class="small-note">NỘI DUNG NGUỒN</div><div class="review-text">${safe(source?.body || "Không tìm thấy bản nguồn đã tham chiếu.")}</div></div><div><div class="small-note">BẢN DỊCH</div><div class="review-text">${safe(version.body)}</div></div></div>
          ${source && publishedVersion(source.poiId, source.language)?.id !== source.id ? `<div class="notice notice-warn">Đã có phiên bản nguồn mới hơn. Hãy cân nhắc dịch lại.</div>` : ""}
          <div class="form-footer">${version.status !== "review" ? `<button class="btn btn-outline" data-action="edit-content" data-id="${id}">Chỉnh sửa trước</button>` : ""}<button class="btn btn-primary" data-action="confirm-translation-review" data-id="${id}">Xác nhận đã rà soát</button></div>`);
        break;
      }
      case "confirm-translation-review": {
        const version = db.versions.find((item) => item.id === id);
        if (!version || !version.needsReview || !canAccessPoi(getPoi(version.poiId))) return notify("Không thể xác nhận rà soát ở trạng thái này.");
        version.needsReview = false;
        version.updatedAt = now();
        addAudit("Xác nhận rà soát bản dịch", version.title);
        save(); closeModal(); render(); notify("Đã gỡ dấu Cần rà soát."); break;
      }
      case "choose-voice": {
        const version = db.versions.find((item) => item.id === id);
        if (!version || !["draft", "rejected"].includes(version.status)) return notify("Hãy tạo bản nháp mới để đổi giọng đọc.");
        const language = getLanguage(version.language);
        showModal("Chọn giọng đọc", `<form data-form="voice" data-id="${id}">${selectField("Giọng đọc phù hợp", "voice", language.voices.map((voice) => ({ value: voice, label: voice })), version.audio?.voice || language.defaultVoice || "")}${formFooter("Hủy", "Lưu giọng đọc")}</form>`);
        break;
      }
      case "mark-reviewed": {
        const version = db.versions.find((item) => item.id === id);
        if (!version || !version.needsReview) return notify("Nội dung không còn cần rà soát.");
        version.needsReview = false; version.updatedAt = now();
        addAudit("Xác nhận rà soát bản dịch", version.title);
        save(); render(); notify("Đã xác nhận bản dịch.");
        break;
      }
      default: break;
    }
  };
  root.addEventListener("click", handleClick);
  dialog.addEventListener("click", handleClick);

  root.addEventListener("input", (event) => {
    if (event.target.id === "poi-search") fillPoiTable();
    if (event.target.id === "content-search") fillContentTable();
    if (event.target.id === "visitor-seek") {
      const audio = document.getElementById("visitor-audio");
      if (audio && Number.isFinite(audio.duration) && Number.isFinite(Number(event.target.value))) audio.currentTime = Number(event.target.value);
    }
  });
  root.addEventListener("change", (event) => {
    if (["poi-location-filter", "poi-state-filter"].includes(event.target.id)) fillPoiTable();
    if (event.target.id === "content-status-filter") fillContentTable();
    if (event.target.id === "analytics-period") { analyticsPeriod = event.target.value; render(); }
    if (event.target.id === "visitor-location") {
      selectedPoiId = "";
      const url = new URL(location.href); url.searchParams.delete("poi"); history.replaceState({}, "", url);
      render();
    }
    if (event.target.id === "visitor-language") switchVisitorLanguage(event.target.value);
  });
  dialog.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    switch (form.dataset.form) {
      case "login": processLogin(form); break;
      case "forgot": processForgot(form); break;
      case "recover": processRecover(form); break;
      case "change-password": saveChangePassword(form); break;
      case "location": saveLocation(form); break;
      case "poi": savePoi(form); break;
      case "content": saveContent(form); break;
      case "language": saveLanguage(form); break;
      case "edit-language": saveLanguageSettings(form); break;
      case "user": saveUser(form); break;
      case "reject": saveRejection(form); break;
      case "translate": addTranslation(form); break;
      case "unpublish": {
        const version = db.versions.find((item) => item.id === form.dataset.id && item.status === "published");
        const reason = String(formValues(form).reason || "").trim();
        if (!version) return notify("Trạng thái phiên bản đã thay đổi.");
        if (!reason) return notify("Cần ghi lý do gỡ xuất bản.");
        version.status = "removed"; version.updatedAt = now();
        addAudit("Gỡ xuất bản nội dung", `${version.title} · ${reason}`);
        save(); closeModal(); render(); notify("Đã gỡ xuất bản."); break;
      }
      case "voice": {
        const version = db.versions.find((item) => item.id === form.dataset.id);
        const language = getLanguage(version?.language);
        const voice = String(formValues(form).voice || "");
        if (!version || !language?.voices.includes(voice)) return notify("Giọng đọc không tương thích với ngôn ngữ.");
        version.audio = { ...(version.audio || {}), type: "speech", voice, hash: version.audio?.hash || "" };
        version.updatedAt = now();
        addAudit("Đổi giọng đọc", `${version.title} · ${voice}`);
        save(); closeModal(); render(); notify("Đã lưu giọng đọc. Tạo lại audio nếu văn bản đã thay đổi."); break;
      }
      case "admin-reset": {
        const user = db.users.find((item) => item.id === form.dataset.id);
        const password = String(formValues(form).password || "");
        if (!user || password.length < 8) return notify("Mật khẩu phải có ít nhất 8 ký tự.");
        user.password = password;
        addAudit("Administrator đặt lại mật khẩu", user.username);
        save(); closeModal(); notify("Đã đặt lại mật khẩu.");
        break;
      }
      case "public-url": {
        const baseUrl = String(formValues(form).baseUrl || "").trim();
        let url;
        try { url = new URL(baseUrl); }
        catch (error) { return notify("URL website không hợp lệ."); }
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return notify("URL phải bắt đầu bằng http:// hoặc https:// và không chứa thông tin đăng nhập.");
        url.search = "";
        url.hash = "";
        db.publicBaseUrl = url.href;
        db.pois.forEach((poi) => { poi.qrUrl = ""; poi.qrTarget = ""; });
        addAudit("Cập nhật URL Visitor", db.publicBaseUrl);
        save(); closeModal(); render(); notify("Đã lưu địa chỉ website. Hãy tạo lại các mã QR.");
        break;
      }
      default: break;
    }
  });

  window.addEventListener("popstate", () => {
    selectedPoiId = new URLSearchParams(location.search).get("poi") || "";
    currentPage = "visitor";
    render();
  });

  if (selectedPoiId && getPoi(selectedPoiId)) recordEvent("qr", selectedPoiId, detectLanguage());
  recordEvent("visit", selectedPoiId || "", detectLanguage());
  if (session && !actor()) {
    session = null;
    localStorage.removeItem(SESSION_KEY);
  }
  render();
