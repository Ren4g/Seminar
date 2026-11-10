"use strict";

// audio domain functions.

  function renderAudio() {
    const versions = db.versions.filter((item) => canAccessPoi(getPoi(item.poiId)) && ["draft", "rejected"].includes(item.status));
    return `${heading("Quản lý audio", "Tải audio thu sẵn hoặc dùng giọng đọc trình duyệt để kiểm thử.", `<span class="small-note">${versions.length} phiên bản có thể chỉnh sửa audio</span>`)}
      <div class="notice notice-info">Audio gắn với từng phiên bản. Tạo audio demo bằng Web Speech API; trình duyệt đọc văn bản khi nghe, không tạo file âm thanh tải xuống.</div>
      <div class="card table-wrap"><table><thead><tr><th>Nội dung</th><th>Trạng thái</th><th>Audio hiện tại</th><th>Giọng đọc</th><th></th></tr></thead><tbody>
      ${versions.length ? versions.map((item) => `<tr><td><div class="table-primary">${safe(item.title || "(Chưa có tiêu đề)")}</div><div class="table-secondary">${safe(poiName(item.poiId, "en"))} · ${safe(langName(item.language))}</div></td><td>${statusBadge(item.status)}</td><td>${audioReady(item) ? `<span class="badge badge-green">${item.audio.type === "upload" ? safe(item.audio.name || "Audio tải lên") : "TTS demo"}</span>` : `<span class="badge badge-red">Chưa có</span>`}</td><td>${safe(item.audio?.voice || getLanguage(item.language)?.defaultVoice || "Mặc định")}</td><td><div class="inline-actions"><button class="btn btn-soft btn-sm" data-action="make-audio" data-id="${item.id}">Tạo TTS</button><button class="btn btn-outline btn-sm" data-action="upload-audio" data-id="${item.id}">Tải lên</button>${item.audio ? `<button class="icon-btn" title="Xóa audio" data-action="delete-audio" data-id="${item.id}">⌫</button>` : ""}<button class="icon-btn" data-action="preview-audio" data-id="${item.id}">▶</button></div></td></tr>`).join("") : tableEmpty("Không có phiên bản nháp cần quản lý audio.", 5)}
      </tbody></table></div>`;
  }


  function speakVersion(version) {
    if (!version) return notify("Không tìm thấy nội dung audio.");
    if (version.audio?.type === "upload" && version.audio.dataUrl) {
      const audio = new Audio(version.audio.dataUrl);
      audio.play().catch((error) => { console.error("Không thể phát audio:", error); notify("Không thể phát audio. Hãy thử lại."); });
      return audio;
    }
    if (!("speechSynthesis" in window)) return notify("Trình duyệt này không hỗ trợ Web Speech API.");
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(version.body);
    const langMap = { en: "en-US", vi: "vi-VN", fr: "fr-FR", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", es: "es-ES" };
    utter.lang = langMap[version.language] || version.language;
    const available = window.speechSynthesis.getVoices();
    const preferred = version.audio?.voice || getLanguage(version.language)?.defaultVoice;
    utter.voice = available.find((voice) => voice.name === preferred || voice.lang.toLowerCase().startsWith(version.language.toLowerCase())) || null;
    utter.onerror = (event) => {
      if (event.error !== "canceled" && event.error !== "interrupted") notify("Trình duyệt không phát được giọng đọc này.");
    };
    window.speechSynthesis.speak(utter);
    utterance = utter;
    return utter;
  }

  function createBrowserAudio(id) {
    const version = db.versions.find((item) => item.id === id);
    if (!version || !["draft", "rejected"].includes(version.status)) return notify("Chỉ có thể tạo audio cho bản nháp hoặc bản bị từ chối.");
    if (!("speechSynthesis" in window)) return notify("Trình duyệt không hỗ trợ TTS demo. Hãy tải audio thu sẵn lên.");
    const language = getLanguage(version.language);
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const voice = voices.find((item) => item.lang.toLowerCase().startsWith(version.language.toLowerCase()))?.name || language?.defaultVoice || "";
    version.audio = { type: "speech", voice, hash: hashText(version.body) };
    version.updatedAt = now();
    addAudit("Tạo audio TTS demo", version.title);
    save(); render(); notify("Đã tạo cấu hình TTS demo. Nghe thử để xác nhận giọng đọc.");
  }

  function uploadAudio(id) {
    const version = db.versions.find((item) => item.id === id);
    if (!version || !["draft", "rejected"].includes(version.status)) return notify("Không thể thay đổi audio ở trạng thái này.");
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("audio/")) return notify("Tệp phải có định dạng audio.");
      if (file.size > 1024 * 1024) return notify("Tệp demo tối đa 1 MB để tránh vượt giới hạn lưu trữ trình duyệt.");
      const reader = new FileReader();
      reader.onerror = () => notify("Không thể đọc tệp audio.");
      reader.onload = () => {
        const previousAudio = version.audio;
        version.audio = { type: "upload", name: file.name, dataUrl: reader.result, hash: hashText(version.body) };
        version.updatedAt = now();
        addAudit("Tải audio lên", `${version.title} · ${file.name}`);
        try { save(); render(); notify("Đã tải audio lên."); }
        catch (error) { version.audio = previousAudio; notify("Không đủ dung lượng lưu trữ trên trình duyệt."); console.error(error); }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function previewVersion(id) {
    const version = db.versions.find((item) => item.id === id);
    if (!version || !canAccessPoi(getPoi(version.poiId))) return notify("Bạn không có quyền nghe thử audio này.");
    if (!audioReady(version)) return notify("Audio chưa có hoặc đã lỗi thời.");
    speakVersion(version);
    notify("Đang phát thử audio.");
  }

