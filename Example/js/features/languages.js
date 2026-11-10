"use strict";

// languages domain functions.

  function renderLanguages() {
    if (!isAdmin()) return `${heading("Ngôn ngữ & giọng đọc", "Chức năng chỉ dành cho Administrator.")}`;
    return `${heading("Ngôn ngữ & giọng đọc", "Quản lý ngôn ngữ được hỗ trợ và cấu hình giọng đọc mặc định.", button("＋ Thêm ngôn ngữ", "new-language", "btn-primary"))}
      <div class="card table-wrap"><table><thead><tr><th>Ngôn ngữ</th><th>Mã</th><th>Trạng thái</th><th>Giọng đọc mặc định</th><th>Giọng hỗ trợ</th><th></th></tr></thead><tbody>
      ${db.languages.map((language) => `<tr><td><div class="table-primary">${safe(language.nativeName)}</div><div class="table-secondary">${safe(language.name)}</div></td><td><span class="mono">${safe(language.code)}</span></td><td>${language.active ? `<span class="badge badge-green">Đang hoạt động</span>` : `<span class="badge badge-gray">Đã tắt</span>`}</td><td>${safe(language.defaultVoice || "Chưa thiết lập")}</td><td>${language.voices.length}</td><td><button class="btn btn-outline btn-sm" data-action="edit-language" data-id="${language.code}">Cấu hình</button></td></tr>`).join("")}
      </tbody></table></div><div class="notice notice-info">Tiếng Anh luôn là ngôn ngữ dự phòng và không thể tắt. Danh sách giọng đọc trong prototype là danh sách demo của trình duyệt.</div>`;
  }


  function openLanguageForm(code = "") {
    if (!isAdmin()) return notify("Chỉ Administrator được quản lý ngôn ngữ.");
    const language = getLanguage(code);
    if (!language) {
      showModal("Thêm ngôn ngữ", `<form data-form="language">${field("Mã ngôn ngữ (ISO)", "code", "", { required: true, placeholder: "Ví dụ: ja" })}${field("Tên ngôn ngữ", "name", "", { required: true })}${field("Tên bản địa", "nativeName", "", { required: true })}
        <div class="notice notice-info">Prototype chỉ cho phép các ngôn ngữ có thể dùng giọng đọc trình duyệt. Cấu hình thật cần API dịch và TTS tương thích.</div>${formFooter("Hủy", "Thêm ngôn ngữ")}</form>`);
      return;
    }
    showModal(`Cấu hình ${language.nativeName}`, `<form data-form="edit-language" data-id="${language.code}">
      <div class="notice notice-info">Giọng đọc mô phỏng danh sách mẫu; các giọng thực tế phụ thuộc trình duyệt và hệ điều hành.</div>
      <div class="field"><label>Giọng đọc mặc định</label><select class="select" name="defaultVoice" style="width:100%">${language.voices.map((voice) => `<option ${voice === language.defaultVoice ? "selected" : ""}>${safe(voice)}</option>`).join("")}</select></div>
      <div class="field"><label>Giọng hỗ trợ (mỗi dòng một giọng)</label><textarea class="textarea" name="voices" rows="4">${safe(language.voices.join("\n"))}</textarea></div>
      ${language.code === "en" ? `<div class="notice notice-warn">Tiếng Anh luôn hoạt động vì là ngôn ngữ dự phòng.</div>` : `<label class="field-check"><input type="checkbox" name="active" ${language.active ? "checked" : ""}> Ngôn ngữ đang hoạt động</label>`}${formFooter("Hủy", "Lưu cấu hình")}</form>`);
  }

  function saveLanguage(form) {
    const data = formValues(form);
    const code = String(data.code || "").trim().toLowerCase();
    if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(code)) return notify("Mã ngôn ngữ không hợp lệ.");
    if (db.languages.some((item) => item.code === code)) return notify("Mã ngôn ngữ đã tồn tại.");
    const name = String(data.name || "").trim();
    const nativeName = String(data.nativeName || "").trim();
    if (!name || !nativeName) return notify("Vui lòng nhập tên ngôn ngữ.");
    db.languages.push({ code, name, nativeName, active: true, voices: [nativeName], defaultVoice: nativeName });
    addAudit("Thêm ngôn ngữ", `${nativeName} (${code})`);
    save(); closeModal(); render(); notify("Đã thêm ngôn ngữ.");
  }

  function saveLanguageSettings(form) {
    const language = getLanguage(form.dataset.id);
    if (!language) return notify("Không tìm thấy ngôn ngữ.");
    const disabling = language.code !== "en" && language.active && !form.elements.active.checked;
    const hasPublished = db.versions.some((item) => item.language === language.code && ["published", "removed", "replaced"].includes(item.status));
    if (disabling && hasPublished && !confirm("Ngôn ngữ này đang có nội dung đã xuất bản. Tắt ngôn ngữ sẽ ẩn nội dung với Visitor. Tiếp tục?")) return;
    language.voices = String(form.elements.voices.value).split("\n").map((item) => item.trim()).filter(Boolean);
    language.defaultVoice = String(form.elements.defaultVoice.value || language.voices[0] || "");
    if (language.code !== "en") language.active = form.elements.active.checked;
    addAudit("Cập nhật ngôn ngữ", language.nativeName);
    save(); closeModal(); render(); notify("Đã lưu cấu hình ngôn ngữ.");
  }
