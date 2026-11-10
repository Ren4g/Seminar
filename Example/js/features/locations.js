"use strict";

// locations domain functions.

  function renderLocations() {
    const places = isAdmin() ? db.locations : db.locations.filter((place) => actor()?.locationIds?.includes(place.id));
    return `${heading("Địa điểm", "Quản lý các khu du lịch và di tích trong hệ thống.", isAdmin() ? button("＋ Thêm địa điểm", "new-location", "btn-primary") : "")}
      <div class="grid-3">${places.map((place) => `<article class="card place-card"><div class="place-card-top"><div class="place-art">⌖</div>${place.active ? `<span class="badge badge-green">Đang hoạt động</span>` : `<span class="badge badge-gray">Ngừng hoạt động</span>`}</div>
        <h3 style="margin-top:16px">${safe(locationName(place.id, "en"))}</h3><p>${safe(localized(place, "descriptions", currentLocale || "en"))}</p>
        <div class="place-foot"><span>${db.pois.filter((poi) => poi.locationId === place.id).length} điểm POI</span><div class="inline-actions"><button class="text-link" data-action="view-place" data-id="${place.id}">Chi tiết</button>${isAdmin() ? `<button class="text-link" data-action="edit-location" data-id="${place.id}">Sửa</button>` : ""}</div></div></article>`).join("") || `<div class="card empty">Chưa có địa điểm.</div>`}</div>`;
  }


  function openPlaceForm(id = "") {
    if (!isAdmin()) return notify("Chỉ Administrator được quản lý địa điểm.");
    const place = db.locations.find((item) => item.id === id);
    const languages = supportedLanguages();
    const names = languages.map((language) => field(`Tên · ${language.nativeName}${language.code === "en" ? " (bắt buộc)" : ""}`, `name_${language.code}`, place?.names[language.code] || "", { required: language.code === "en" }));
    const descriptions = languages.map((language) => field(`Mô tả ngắn · ${language.nativeName}`, `description_${language.code}`, place?.descriptions[language.code] || "", { type: "textarea", rows: 2 }));
    showModal(place ? "Cập nhật địa điểm" : "Thêm địa điểm", `<form data-form="location" data-id="${safe(id)}"><div class="form-grid">${names.join("")}${descriptions.join("")}</div>
      <label class="field-check"><input type="checkbox" name="active" ${place?.active === false ? "" : "checked"}> Địa điểm đang hoạt động</label>${formFooter("Hủy", place ? "Lưu thay đổi" : "Tạo địa điểm")}</form>`);
  }

  function saveLocation(form) {
    const data = formValues(form);
    const names = localizedForm(form, "name", supportedLanguages().map((item) => item.code));
    const descriptions = localizedForm(form, "description", supportedLanguages().map((item) => item.code));
    if (!names.en?.trim()) return notify("Địa điểm cần có tên tiếng Anh.");
    const id = form.dataset.id;
    const existing = db.locations.find((item) => item.id === id);
    if (existing) Object.assign(existing, { names, descriptions, active: form.elements.active.checked });
    else db.locations.push({ id: makeId("loc"), names, descriptions, active: form.elements.active.checked, createdAt: now() });
    addAudit(existing ? "Cập nhật địa điểm" : "Tạo địa điểm", names.en);
    save(); closeModal(); render(); notify(existing ? "Đã cập nhật địa điểm." : "Đã tạo địa điểm.");
  }
