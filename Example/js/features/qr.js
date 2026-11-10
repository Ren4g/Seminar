"use strict";

// qr domain functions.

  function renderQr() {
    const pois = (isAdmin() ? db.pois : allowedPois());
    return `${heading("Mã QR", "Tạo và tải mã truy cập trực tiếp trang POI.", button("⚙ Địa chỉ website", "configure-public-url", "btn-outline"))}
      ${!db.publicBaseUrl && location.protocol === "file:" ? `<div class="notice notice-warn">Hãy cấu hình URL website công khai trước khi tạo QR. Đường dẫn file trên máy này không thể mở từ điện thoại khách tham quan.</div>` : `<div class="notice notice-info">Liên kết QR không đổi khi nội dung được cập nhật. URL cơ sở: <span class="mono">${safe(db.publicBaseUrl || location.origin + location.pathname)}</span></div>`}
      <div class="card table-wrap"><table><thead><tr><th>Điểm POI</th><th>Địa điểm</th><th>Liên kết</th><th>QR</th><th></th></tr></thead><tbody>
      ${pois.length ? pois.map((poi) => `<tr><td><div class="table-primary">${safe(poiName(poi.id, "en"))}</div><div class="table-secondary">${safe(poiName(poi.id, "vi"))}</div></td><td>${safe(locationName(poi.locationId, "en"))}</td><td class="mono">${safe(publicPoiUrl(poi.id) || "Chưa cấu hình URL công khai")}</td><td>${poi.qrUrl ? `<span class="badge badge-green">Đã tạo</span>` : `<span class="badge badge-gray">Chưa tạo</span>`}</td><td><div class="inline-actions"><button class="btn btn-soft btn-sm" data-action="show-qr" data-id="${poi.id}">${poi.qrUrl ? "Xem QR" : "Tạo QR"}</button>${poi.qrUrl ? `<button class="btn btn-outline btn-sm" data-action="download-qr" data-id="${poi.id}">Tải xuống</button>` : ""}</div></td></tr>`).join("") : tableEmpty("Chưa có POI.", 5)}
      </tbody></table></div><div class="notice notice-info">QR được tạo bởi dịch vụ QR công khai khi có kết nối Internet. Chỉ gửi URL truy cập công khai, không gửi dữ liệu riêng tư.</div>`;
  }


  function openQr(poiId) {
    const poi = getPoi(poiId);
    if (!poi || !canAccessPoi(poi)) return notify("Không tìm thấy POI hoặc bạn không có quyền.");
    const url = publicPoiUrl(poi.id);
    if (!url) return openPublicUrlForm();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(url)}`;
    poi.qrUrl = qrUrl;
    poi.qrTarget = url;
    save();
    showModal(`Mã QR · ${poiName(poi.id, "en")}`, `<div style="text-align:center"><img src="${safe(qrUrl)}" alt="Mã QR ${safe(poiName(poi.id, "en"))}" style="width:240px;height:240px;max-width:100%;border:1px solid var(--line);border-radius:8px" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div class="notice notice-error" style="display:none">Không tải được mã QR. Kiểm tra kết nối Internet và thử lại.</div><p class="mono" style="word-break:break-all">${safe(url)}</p><button class="btn btn-primary" data-action="download-qr" data-id="${poi.id}">Tải mã QR</button></div>`);
  }

  function openPublicUrlForm() {
    showModal("Địa chỉ website công khai", `<form data-form="public-url">${field("URL cơ sở của website Visitor", "baseUrl", db.publicBaseUrl, { type: "url", required: true, placeholder: "https://tour.example.com/" })}
    <div class="notice notice-info">Dùng địa chỉ HTTPS đã triển khai và có thể truy cập từ điện thoại. Mỗi QR sẽ mở URL này cùng mã POI.</div>${formFooter("Hủy", "Lưu địa chỉ")}</form>`);
  }

