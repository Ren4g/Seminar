"use strict";

// pois domain functions.

  function renderPois() {
    const pois = isAdmin() ? db.pois : allowedPois();
    return `${heading("Điểm tham quan", "Quản lý POI, thông tin hiển thị và liên kết nội dung.", button("＋ Thêm POI", "new-poi", "btn-primary"))}
      <div class="filters"><input class="input input-search" id="poi-search" placeholder="Tìm điểm tham quan..."><select class="select" id="poi-location-filter"><option value="">Tất cả địa điểm</option>${(isAdmin() ? db.locations : db.locations.filter((place) => actor()?.locationIds?.includes(place.id))).map((place) => `<option value="${place.id}">${safe(locationName(place.id, "en"))}</option>`).join("")}</select><select class="select" id="poi-state-filter"><option value="">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Ngừng hoạt động</option></select></div>
      <div class="card table-wrap"><table><thead><tr><th>Điểm tham quan</th><th>Địa điểm</th><th>Nội dung</th><th>Trạng thái</th><th></th></tr></thead><tbody id="poi-table"></tbody></table></div>`;
  }

  function fillPoiTable() {
    const tbody = document.getElementById("poi-table");
    if (!tbody) return;
    const query = document.getElementById("poi-search")?.value.toLowerCase() || "";
    const loc = document.getElementById("poi-location-filter")?.value || "";
    const state = document.getElementById("poi-state-filter")?.value || "";
    const pois = (isAdmin() ? db.pois : allowedPois()).filter((poi) =>
      (!loc || poi.locationId === loc) && (!state || poi.active === (state === "active")) &&
      `${poiName(poi.id, "en")} ${poiName(poi.id, "vi")}`.toLowerCase().includes(query));
    tbody.innerHTML = pois.length ? pois.map((poi) => `<tr><td><div class="table-primary">${safe(poi.icon || "◉")} &nbsp;${safe(poiName(poi.id, "en"))}</div><div class="table-secondary">${safe(poiName(poi.id, "vi"))}</div></td><td>${safe(locationName(poi.locationId, "en"))}</td>
      <td><span class="badge badge-gray">${db.versions.filter((item) => item.poiId === poi.id).length} phiên bản</span></td><td>${poi.active ? `<span class="badge badge-green">Đang hoạt động</span>` : `<span class="badge badge-gray">Ngừng hoạt động</span>`}</td>
      <td><div class="table-actions"><button class="icon-btn" title="Nội dung" data-action="open-poi-content" data-id="${poi.id}">▤</button><button class="icon-btn" title="Sửa POI" data-action="edit-poi" data-id="${poi.id}">✎</button><button class="icon-btn" title="Xóa POI (chỉ khi chưa có nội dung)" data-action="delete-poi" data-id="${poi.id}">⌫</button></div></td></tr>`).join("") : tableEmpty("Không tìm thấy POI phù hợp.", 5);
  }


  function openPoiForm(id = "") {
    const poi = db.pois.find((item) => item.id === id);
    const locations = (isAdmin() ? db.locations : db.locations.filter((place) => actor()?.locationIds?.includes(place.id))).filter((place) => place.active || place.id === poi?.locationId);
    if (!locations.length) return notify("Bạn chưa được phân công địa điểm hoạt động.");
    const languages = supportedLanguages();
    showModal(poi ? "Cập nhật điểm tham quan" : "Thêm điểm tham quan", `<form data-form="poi" data-id="${safe(id)}">
      ${selectField("Địa điểm", "locationId", locations.map((place) => ({ value: place.id, label: locationName(place.id, "en") })), poi?.locationId || locations[0].id)}
      <div class="form-grid">${languages.map((language) => field(`Tên · ${language.nativeName}${language.code === "en" ? " (bắt buộc)" : ""}`, `name_${language.code}`, poi?.names[language.code] || "", { required: language.code === "en" })).join("")}
      ${languages.map((language) => field(`Mô tả ngắn · ${language.nativeName}`, `description_${language.code}`, poi?.descriptions[language.code] || "", { type: "textarea", rows: 2 })).join("")}
      ${field("Biểu tượng", "icon", poi?.icon || "📍", { placeholder: "Ví dụ: 🏛️" })}</div>
      <label class="field-check"><input type="checkbox" name="active" ${poi?.active === false ? "" : "checked"}> POI đang hoạt động</label>${formFooter("Hủy", poi ? "Lưu thay đổi" : "Tạo POI")}</form>`);
  }

  function savePoi(form) {
    const locationId = formValues(form).locationId;
    const location = getLocation(locationId);
    const manager = actor()?.role === "manager";
    if (!location || !location.active) return notify("Vui lòng chọn địa điểm đang hoạt động.");
    if (manager && !actor().locationIds.includes(locationId)) return notify("Địa điểm không nằm trong phạm vi phân công của bạn.");
    const names = localizedForm(form, "name", supportedLanguages().map((item) => item.code));
    const descriptions = localizedForm(form, "description", supportedLanguages().map((item) => item.code));
    if (!names.en?.trim()) return notify("POI cần có tên tiếng Anh.");
    const id = form.dataset.id;
    const existing = db.pois.find((item) => item.id === id);
    if (existing) Object.assign(existing, { locationId, names, descriptions, icon: formValues(form).icon || "📍", active: form.elements.active.checked });
    else db.pois.push({ id: makeId("poi"), locationId, names, descriptions, active: form.elements.active.checked, icon: formValues(form).icon || "📍", qrUrl: "" });
    addAudit(existing ? "Cập nhật POI" : "Tạo POI", names.en);
    save(); closeModal(); render(); notify(existing ? "Đã cập nhật POI." : "Đã tạo POI.");
  }
