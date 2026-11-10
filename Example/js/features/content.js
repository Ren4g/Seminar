"use strict";

// content domain functions.

  function renderContents() {
    const pois = isAdmin() ? db.pois : allowedPois();
    const versions = db.versions.filter((item) => pois.some((poi) => poi.id === item.poiId));
    const filtered = versions.filter((item) => contentFilter === "all" || (contentFilter === "review-flag" ? item.needsReview : item.status === contentFilter));
    return `${heading("Nội dung thuyết minh", "Biên soạn, dịch, tạo audio và theo dõi phiên bản nội dung.", button("＋ Tạo nội dung", "new-content", "btn-primary"))}
      <div class="filters"><input class="input input-search" id="content-search" placeholder="Tìm nội dung, POI..."><select class="select" id="content-status-filter"><option value="all">Tất cả trạng thái</option>${Object.entries(STATUS).map(([key, value]) => `<option value="${key}" ${contentFilter === key ? "selected" : ""}>${value[0]}</option>`).join("")}<option value="review-flag" ${contentFilter === "review-flag" ? "selected" : ""}>Cần rà soát</option></select><span class="filter-label">${filtered.length} phiên bản</span></div>
      <div class="card table-wrap"><table><thead><tr><th>Nội dung / POI</th><th>Ngôn ngữ</th><th>Trạng thái</th><th>Audio</th><th>Cập nhật</th><th></th></tr></thead><tbody id="content-table"></tbody></table></div>`;
  }

  function fillContentTable() {
    const tbody = document.getElementById("content-table");
    if (!tbody) return;
    const query = document.getElementById("content-search")?.value.toLowerCase() || "";
    const filter = document.getElementById("content-status-filter")?.value || "all";
    contentFilter = filter;
    const pois = isAdmin() ? db.pois : allowedPois();
    const entries = db.versions.filter((item) => pois.some((poi) => poi.id === item.poiId))
      .filter((item) => (filter === "all" || (filter === "review-flag" ? item.needsReview : item.status === filter)))
      .filter((item) => `${item.title} ${poiName(item.poiId, "en")} ${item.language}`.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    tbody.innerHTML = entries.length ? entries.map((item) => `<tr><td><div class="table-primary">${safe(item.title || "(Chưa có tiêu đề)")}</div><div class="table-secondary">${safe(poiName(item.poiId, "en"))} · v${db.versions.filter((v) => v.poiId === item.poiId && v.language === item.language).indexOf(item) + 1}</div></td>
      <td>${safe(langName(item.language))}</td><td>${statusBadge(item.status)} ${item.needsReview ? `<span class="badge badge-yellow">Cần rà soát</span>` : ""}</td>
      <td>${audioReady(item) ? `<span class="badge badge-green">${item.audio.type === "upload" ? "Audio tải lên" : "TTS demo"}</span>` : `<span class="badge badge-red">Thiếu / lỗi thời</span>`}</td><td>${dateLabel(item.updatedAt)}</td>
      <td><div class="table-actions">
        <button class="icon-btn" title="Mở nội dung" data-action="edit-content" data-id="${item.id}">✎</button>
        ${["draft", "rejected"].includes(item.status) ? `<button class="icon-btn" title="${isAdmin() ? "Xuất bản trực tiếp" : "Gửi duyệt"}" data-action="submit-for-review" data-id="${item.id}">↑</button><button class="icon-btn" title="Dịch nội dung" data-action="translate" data-id="${item.id}">文</button><button class="icon-btn" title="Chọn giọng đọc" data-action="choose-voice" data-id="${item.id}">♫</button><button class="icon-btn" title="Xóa bản nháp" data-action="delete-draft" data-id="${item.id}">⌫</button>` : ""}
        ${item.status === "review" && !isAdmin() ? `<button class="icon-btn" title="Thu hồi về bản nháp" data-action="withdraw-review" data-id="${item.id}">↶</button>` : ""}
        ${item.needsReview ? `<button class="icon-btn" title="Rà soát bản dịch" data-action="review-translation" data-id="${item.id}">⚑</button>` : ""}
        ${item.status === "published" && isAdmin() ? `<button class="icon-btn" title="Gỡ xuất bản" data-action="unpublish" data-id="${item.id}">⊘</button>` : ""}
        ${item.status === "removed" && isAdmin() ? `<button class="icon-btn" title="Xuất bản lại" data-action="republish" data-id="${item.id}">↥</button>` : ""}
        <button class="icon-btn" title="Nghe thử" data-action="preview-audio" data-id="${item.id}">▶</button></div></td></tr>`).join("") : tableEmpty("Chưa có phiên bản nội dung trong bộ lọc này.", 6);
  }


  function renderReviews() {
    if (!isAdmin()) return `${heading("Kiểm duyệt", "Chỉ Administrator được xử lý nội dung chờ duyệt.")}<div class="card empty">Bạn không có quyền truy cập chức năng này.</div>`;
    const items = db.versions.filter((item) => item.status === "review");
    return `${heading("Kiểm duyệt nội dung", "Đối chiếu bản dịch, nghe audio và đưa ra quyết định xuất bản.")}
      <div class="notice notice-info">Phê duyệt sẽ xuất bản ngay. Nội dung đang chờ duyệt được khóa chỉnh sửa cho đến khi được xử lý hoặc thu hồi.</div>
      <div class="card table-wrap"><table><thead><tr><th>Nội dung</th><th>Điểm POI</th><th>Ngôn ngữ</th><th>Gửi ngày</th><th>Audio</th><th></th></tr></thead><tbody>
        ${items.length ? items.map((item) => `<tr><td><div class="table-primary">${safe(item.title)}</div><div class="table-secondary">${safe(locationName(getPoi(item.poiId)?.locationId))}</div></td><td>${safe(poiName(item.poiId, "en"))}</td><td>${safe(langName(item.language))}</td><td>${dateLabel(item.updatedAt)}</td><td>${audioReady(item) ? `<span class="badge badge-green">Audio hợp lệ</span>` : `<span class="badge badge-red">Thiếu / lỗi audio</span>`}</td><td><button class="btn btn-primary btn-sm" data-action="review-version" data-id="${item.id}">Xem xét</button></td></tr>`).join("") : tableEmpty("Không có nội dung đang chờ kiểm duyệt.", 6)}
      </tbody></table></div>`;
  }


  function openContentForm(id = "", initialPoiId = "", initialLanguage = "") {
    let version = db.versions.find((item) => item.id === id);
    if (version && !canAccessPoi(getPoi(version.poiId))) return notify("Bạn không có quyền với POI này.");
    if (version?.status === "review" || version?.status === "published" || version?.status === "removed" || version?.status === "replaced") {
      if (version.status === "review") return notify("Phiên bản đang chờ duyệt đã bị khóa. Hãy thu hồi trước khi chỉnh sửa.");
      const current = editingVersion(version.poiId, version.language);
      if (current) return openContentForm(current.id);
      const source = version;
      version = { ...source, id: "", status: "draft", audio: null, needsReview: false, createdAt: now(), updatedAt: now(), rejectionReason: "" };
    }
    const pois = isAdmin() ? db.pois : allowedPois();
    if (!pois.length) return notify("Bạn chưa được phân công POI nào.");
    const selectedPoi = version?.poiId || initialPoiId || pois[0].id;
    const selectedLang = version?.language || initialLanguage || "en";
    const body = `<form data-form="content" data-id="${safe(version?.id || "")}">
      <div class="form-grid">${selectField("Điểm tham quan", "poiId", pois.map((poi) => ({ value: poi.id, label: `${poiName(poi.id, "en")} — ${locationName(poi.locationId, "en")}` })), selectedPoi)}
      ${selectField("Ngôn ngữ", "language", supportedLanguages().map((language) => ({ value: language.code, label: language.nativeName })), selectedLang)}
      ${field("Tiêu đề", "title", version?.title || "", { required: true, full: true })}
      ${field("Nội dung thuyết minh", "body", version?.body || "", { type: "textarea", rows: 8, required: true, full: true, help: "Tạo audio lại sau khi thay đổi văn bản để tránh audio lỗi thời." })}</div>
      ${version?.needsReview ? `<div class="notice notice-warn">Bản dịch cần rà soát trước khi gửi duyệt hoặc xuất bản.</div>` : ""}
      ${version?.status === "rejected" ? `<div class="notice notice-error">Lý do từ chối: ${safe(version.rejectionReason || "Không có lý do")}. Lưu thay đổi sẽ chuyển về Bản nháp.</div>` : ""}
      ${!isAdmin() && version?.status !== "rejected" && !version?.id ? `<div class="notice notice-info">Nội dung mới cần audio hợp lệ trước khi gửi duyệt.</div>` : ""}
      ${formFooter("Hủy", version ? "Lưu bản nháp" : "Tạo bản nháp")}</form>`;
    showModal(version ? "Chỉnh sửa nội dung" : "Tạo nội dung thuyết minh", body);
  }

  function openReview(id) {
    const version = db.versions.find((item) => item.id === id && item.status === "review");
    if (!version) return notify("Phiên bản đã thay đổi trạng thái. Hãy tải lại danh sách.");
    const source = version.sourceVersionId ? db.versions.find((item) => item.id === version.sourceVersionId) : null;
    showModal("Xem xét nội dung", `<div class="eyebrow">${safe(poiName(version.poiId, "en"))} · ${safe(langName(version.language))}</div><h2>${safe(version.title)}</h2>
      ${version.needsReview ? `<div class="notice notice-warn">Nội dung đang có dấu cần rà soát.</div>` : ""}
      <div class="review-layout"><div><div class="small-note" style="margin-bottom:7px">NỘI DUNG ĐANG XÉT</div><div class="review-text">${safe(version.body)}</div></div><div><div class="small-note" style="margin-bottom:7px">BẢN ĐANG XUẤT BẢN ${source ? `· NGUỒN ĐỐI CHIẾU` : ""}</div><div class="review-text">${safe(source?.body || publishedVersion(version.poiId, version.language)?.body || "Chưa có bản đang xuất bản.")}</div></div></div>
      <div class="audio-box"><div class="audio-controls"><button class="play-btn" data-action="preview-audio" data-id="${version.id}">▶</button><div class="audio-info"><strong>Nghe thử audio</strong><span>${audioReady(version) ? "Audio hợp lệ" : "Audio thiếu hoặc lỗi thời"}</span></div></div></div>
      <div class="form-footer"><button class="btn btn-danger" data-action="reject-version" data-id="${version.id}">Từ chối</button><button class="btn btn-primary" data-action="approve-version" data-id="${version.id}">Phê duyệt & xuất bản</button></div>`);
  }

  function saveContent(form) {
    const data = formValues(form);
    const poi = getPoi(data.poiId);
    const language = getLanguage(data.language);
    if (!poi || !canAccessPoi(poi)) return notify("POI không tồn tại hoặc ngoài phạm vi được phân công.");
    if (!language?.active) return notify("Ngôn ngữ không còn hoạt động.");
    if (!String(data.title || "").trim() || !String(data.body || "").trim()) return notify("Tiêu đề và nội dung không được để trống.");
    let version = db.versions.find((item) => item.id === form.dataset.id);
    if (!version && !poi.active) return notify("Không thể tạo nội dung cho POI đã ngừng hoạt động.");
    if (version && version.status === "review") return notify("Không thể sửa phiên bản đang chờ duyệt.");
    if (version && (version.poiId !== data.poiId || version.language !== data.language)) {
      return notify("Không thể đổi POI hoặc ngôn ngữ của phiên bản. Hãy tạo nội dung mới.");
    }
    if (!version) {
      const existing = editingVersion(data.poiId, data.language);
      if (existing) return notify(existing.status === "review" ? "Đã có phiên bản chờ duyệt cho nội dung này." : "Đã có bản nháp. Hãy mở phiên bản hiện tại để chỉnh sửa.");
      const published = publishedVersion(data.poiId, data.language);
      version = {
        id: makeId("ver"), poiId: data.poiId, language: data.language, title: "", body: "",
        status: "draft", audio: null, needsReview: false, createdAt: now(), updatedAt: now(),
        sourceVersionId: published?.sourceVersionId || null, rejectionReason: "",
      };
      db.versions.push(version);
    }
    version.title = String(data.title).trim();
    version.body = String(data.body).trim();
    version.status = "draft";
    version.rejectionReason = "";
    version.updatedAt = now();
    addAudit("Lưu bản nháp", `${version.title} · ${langName(version.language)}`);
    save(); closeModal(); render(); notify("Đã lưu bản nháp.");
  }

  function validateForPublish(version) {
    const poi = getPoi(version.poiId);
    const place = getLocation(poi?.locationId);
    const language = getLanguage(version.language);
    if (!poi?.active || !place?.active) return "POI hoặc địa điểm đang ngừng hoạt động.";
    if (!language?.active) return "Ngôn ngữ của nội dung đã bị tắt.";
    if (!version.title?.trim() || !version.body?.trim()) return "Thiếu tiêu đề hoặc văn bản thuyết minh.";
    if (!audioReady(version)) return "Audio chưa có hoặc đã lỗi thời. Tạo audio mới trước khi xuất bản.";
    if (version.needsReview) return "Bản dịch còn dấu Cần rà soát.";
    return "";
  }

  function publishVersion(version, auditAction = "Xuất bản nội dung") {
    const error = validateForPublish(version);
    if (error) {
      notify(error);
      return false;
    }
    const oldPublished = db.versions.find((item) => item.poiId === version.poiId && item.language === version.language && ["published", "removed"].includes(item.status));
    const oldBody = oldPublished?.body || "";
    if (oldPublished && oldPublished.id !== version.id) oldPublished.status = "replaced";
    version.status = "published";
    version.rejectionReason = "";
    version.updatedAt = now();
    if (oldBody && oldBody !== version.body) {
      db.versions.filter((item) => item.poiId === version.poiId && item.language !== version.language && item.sourceVersionId === oldPublished?.id)
        .forEach((translation) => { translation.needsReview = true; translation.updatedAt = now(); });
    }
    addAudit(auditAction, `${version.title} · ${langName(version.language)}`);
    save();
    return true;
  }

  function addTranslation(form) {
    const data = formValues(form);
    const source = db.versions.find((item) => item.id === form.dataset.id);
    if (!source || !canAccessPoi(getPoi(source.poiId))) return notify("Không tìm thấy nội dung nguồn hoặc bạn không có quyền.");
    const language = getLanguage(data.language);
    if (!language?.active) return notify("Ngôn ngữ đích không hoạt động.");
    if (language.code === source.language) return notify("Hãy chọn ngôn ngữ khác với ngôn ngữ nguồn.");
    if (source.status === "review") return notify("Không thể dịch từ phiên bản đang chờ duyệt.");
    const existing = editingVersion(source.poiId, language.code);
    if (existing?.status === "review") return notify("Bản dịch đang chờ duyệt, không thể ghi đè.");
    if (existing && !confirm("Đã có bản nháp/bản bị từ chối. Ghi đè nội dung đích bằng bản dịch demo?")) return;
    const title = `[Bản dịch cần rà soát] ${source.title}`;
    const body = `[Bản dịch demo — cần biên tập trước khi xuất bản]\n\n${source.body}`;
    let target = existing;
    if (!target) {
      target = { id: makeId("ver"), poiId: source.poiId, language: language.code, title: "", body: "", status: "draft", audio: null, needsReview: true, createdAt: now(), updatedAt: now(), sourceVersionId: source.id, rejectionReason: "" };
      db.versions.push(target);
    }
    Object.assign(target, { title, body, status: "draft", audio: null, needsReview: true, sourceVersionId: source.id, updatedAt: now(), rejectionReason: "" });
    addAudit("Tạo bản dịch demo", `${source.language} → ${language.code} · ${source.title}`);
    save(); closeModal(); currentPage = "contents"; render(); notify("Đã tạo bản nháp dịch demo. Cần biên tập và xác nhận rà soát.");
  }


  function approveVersion(id) {
    if (!isAdmin()) return notify("Chỉ Administrator được phê duyệt.");
    const version = db.versions.find((item) => item.id === id);
    if (!version || version.status !== "review") return notify("Phiên bản đã thay đổi trạng thái. Hãy tải lại.");
    if (!publishVersion(version, "Phê duyệt & xuất bản")) return;
    closeModal(); render(); notify("Đã phê duyệt và xuất bản nội dung.");
  }

  function rejectVersion(id) {
    if (!isAdmin()) return notify("Chỉ Administrator được từ chối nội dung.");
    showModal("Từ chối nội dung", `<form data-form="reject" data-id="${safe(id)}">${field("Lý do từ chối (bắt buộc)", "reason", "", { type: "textarea", rows: 4, required: true })}${formFooter("Hủy", "Từ chối phiên bản")}</form>`);
  }

  function saveRejection(form) {
    const version = db.versions.find((item) => item.id === form.dataset.id && item.status === "review");
    const reason = String(formValues(form).reason || "").trim();
    if (!version) return notify("Phiên bản đã thay đổi trạng thái. Hãy tải lại.");
    if (!reason) return notify("Cần nhập lý do từ chối.");
    version.status = "rejected";
    version.rejectionReason = reason;
    version.updatedAt = now();
    addAudit("Từ chối nội dung", `${version.title} · ${reason}`);
    save(); closeModal(); render(); notify("Đã từ chối nội dung.");
  }

  function submitForReview(version) {
    const error = validateForPublish(version);
    if (error) return notify(error);
    if (!isAdmin()) {
      version.status = "review";
      version.updatedAt = now();
      addAudit("Gửi duyệt nội dung", version.title);
      save(); render(); notify("Đã gửi nội dung chờ kiểm duyệt.");
      return;
    }
    if (confirm("Xuất bản nội dung ngay?")) {
      if (publishVersion(version, "Xuất bản trực tiếp")) { save(); render(); notify("Đã xuất bản nội dung."); }
    }
  }

