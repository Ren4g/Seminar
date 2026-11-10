"use strict";

// dashboard domain functions.

function renderDashboard() {
    const places = isAdmin() ? db.locations : db.locations.filter((place) => actor()?.locationIds?.includes(place.id));
    const pois = isAdmin() ? db.pois : allowedPois();
    const versions = db.versions.filter((item) => pois.some((poi) => poi.id === item.poiId));
    const published = versions.filter((item) => item.status === "published");
    const pending = versions.filter((item) => item.status === "review");
    const recent = [...versions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
    const listenCount = db.events.filter((event) => event.type === "listen" && pois.some((poi) => poi.id === event.poiId)).length;
    const action = isAdmin() ? button("＋ Tạo nội dung", "new-content", "btn-primary") : button("＋ Soạn nội dung", "new-content", "btn-primary");
    return `${heading("Chào ${name}".replace("${name}", actor()?.name?.split(" ")[0] || ""), "Đây là tình hình hoạt động của hệ thống thuyết minh.", action)}
      <section class="stats-grid">
        ${statCard("Địa điểm", places.length, "⌖", "Đang trong phạm vi của bạn")}
        ${statCard("Điểm tham quan", pois.length, "◉", `${pois.filter((poi) => poi.active).length} điểm đang hoạt động`)}
        ${statCard("Nội dung đã xuất bản", published.length, "▤", "Theo các ngôn ngữ")}
        ${statCard("Lượt nghe", listenCount, "♫", "Ghi nhận trên thiết bị")}
      </section>
      <section class="grid-2">
        <div class="card card-pad"><div class="section-head"><div><h2>Nội dung gần đây</h2><p>Theo dõi tiến độ biên soạn và xuất bản</p></div><button class="text-link" data-page="contents">Xem tất cả →</button></div>
          <div class="table-wrap"><table><thead><tr><th>Nội dung</th><th>Địa điểm</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>
            ${recent.length ? recent.map((item) => `<tr><td><div class="table-primary">${safe(contentTitle(item))}</div><div class="table-secondary">${safe(langName(item.language))}${item.needsReview ? " · Cần rà soát" : ""}</div></td><td>${safe(locationName(getPoi(item.poiId)?.locationId))}</td><td>${statusBadge(item.status)}</td><td>${dateLabel(item.updatedAt)}</td></tr>`).join("") : tableEmpty("Chưa có nội dung", 4)}
          </tbody></table></div></div>
        <div class="card card-pad"><div class="section-head"><div><h2>Cần bạn xử lý</h2><p>Các đầu việc đang chờ</p></div></div>
          <div class="mini-list">
            <div class="mini-row"><div><div class="mini-row-title">Chờ kiểm duyệt</div><div class="mini-row-sub">${pending.length} phiên bản cần xem xét</div></div>${isAdmin() ? button("Mở", "go-reviews", "btn-soft btn-sm") : `<span class="badge badge-yellow">${pending.length}</span>`}</div>
            <div class="mini-row"><div><div class="mini-row-title">Bản dịch cần rà soát</div><div class="mini-row-sub">${versions.filter((item) => item.needsReview).length} bản dịch đang có cảnh báo</div></div><button class="text-link" data-page="contents">Kiểm tra →</button></div>
            <div class="mini-row"><div><div class="mini-row-title">Nội dung thiếu audio</div><div class="mini-row-sub">${versions.filter((item) => ["draft", "rejected"].includes(item.status) && !audioReady(item)).length} bản nháp chưa có audio hợp lệ</div></div><button class="text-link" data-page="audio">Tạo audio →</button></div>
          </div><hr class="divider"><div class="section-head"><div><h3>Địa điểm được phân công</h3></div></div>
          ${places.length ? places.map((place) => `<div class="mini-row"><div><div class="mini-row-title">${safe(locationName(place.id, "en"))}</div><div class="mini-row-sub">${db.pois.filter((poi) => poi.locationId === place.id).length} điểm tham quan</div></div><span class="badge ${place.active ? "badge-green" : "badge-gray"}">${place.active ? "Đang hoạt động" : "Đã tắt"}</span></div>`).join("") : `<div class="empty">Chưa được phân công địa điểm.</div>`}
        </div>
      </section>`;
  }

  function statCard(label, value, icon, note) {
    return `<div class="card stat-card"><div class="stat-top"><span>${safe(label)}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${safe(value)}</div><div class="stat-note">${safe(note)}</div></div>`;
  }

