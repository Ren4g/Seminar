"use strict";

// analytics domain functions.

  function renderAnalytics() {
    if (!isAdmin()) return `${heading("Thống kê hoạt động", "Chức năng chỉ dành cho Administrator.")}`;
    const start = new Date();
    start.setDate(start.getDate() - Number(analyticsPeriod));
    const events = db.events.filter((event) => new Date(event.at) >= start);
    const listens = events.filter((event) => event.type === "listen");
    const scans = events.filter((event) => event.type === "qr");
    const visits = events.filter((event) => event.type === "visit");
    const seconds = listens.reduce((sum, event) => sum + Number(event.seconds || 0), 0);
    const byPoi = db.pois.map((poi) => ({ name: poiName(poi.id, "en"), count: listens.filter((event) => event.poiId === poi.id).length })).sort((a, b) => b.count - a.count);
    const byLocation = db.locations.map((place) => ({ name: locationName(place.id, "en"), count: listens.filter((event) => event.locationId === place.id).length }));
    const byLang = db.languages.map((language) => ({ name: language.nativeName, count: listens.filter((event) => event.language === language.code).length })).filter((item) => item.count);
    const max = Math.max(1, ...byPoi.map((item) => item.count));
    return `${heading("Thống kê hoạt động", "Số liệu ẩn danh được tổng hợp từ lượt truy cập, nghe và quét QR.")}
      <div class="filters"><span class="filter-label">Khoảng thời gian</span><select class="select" id="analytics-period"><option value="7" ${analyticsPeriod === "7" ? "selected" : ""}>7 ngày qua</option><option value="30" ${analyticsPeriod === "30" ? "selected" : ""}>30 ngày qua</option><option value="90" ${analyticsPeriod === "90" ? "selected" : ""}>90 ngày qua</option><option value="365" ${analyticsPeriod === "365" ? "selected" : ""}>12 tháng qua</option></select></div>
      <section class="stats-grid">${statCard("Lượt truy cập", visits.length, "⌂", "Mở website thuyết minh")}${statCard("Lượt nghe", listens.length, "♫", "Bắt đầu phát audio")}${statCard("Lượt quét QR", scans.length, "▧", "Mở POI từ QR")}${statCard("Thời lượng nghe", `${Math.round(seconds / 60)} phút`, "◷", "Thời gian phát thực tế")}</section>
      <section class="grid-2"><div class="card card-pad"><div class="section-head"><div><h2>Lượt nghe theo POI</h2><p>Tên địa điểm hiển thị bằng tiếng Anh</p></div></div>
        ${byPoi.length ? byPoi.map((item) => `<div style="margin:15px 0"><div class="mini-row" style="border:0;padding:0 0 7px"><span class="mini-row-title">${safe(item.name)}</span><span class="small-note">${item.count} lượt</span></div><div class="progress"><span style="width:${Math.max(3, item.count / max * 100)}%"></span></div></div>`).join("") : `<div class="empty">Chưa có dữ liệu lượt nghe trong khoảng thời gian này.</div>`}</div>
        <div class="card card-pad"><div class="section-head"><div><h2>Lượt nghe theo ngôn ngữ</h2><p>Ngôn ngữ nội dung đã phát</p></div></div>${byLang.length ? byLang.map((item) => `<div class="mini-row"><div class="mini-row-title">${safe(item.name)}</div><span class="badge badge-green">${item.count} lượt</span></div>`).join("") : `<div class="empty">Chưa có dữ liệu.</div>`}
          <hr class="divider"><h3>Lượt nghe theo địa điểm</h3>${byLocation.map((item) => `<div class="mini-row"><div class="mini-row-title">${safe(item.name)}</div><span class="small-note">${item.count} lượt</span></div>`).join("")}
          <hr class="divider"><h3>Lượt quét theo POI</h3>${db.pois.map((poi) => `<div class="mini-row"><div class="mini-row-title">${safe(poiName(poi.id, "en"))}</div><span class="small-note">${scans.filter((event) => event.poiId === poi.id).length} lượt</span></div>`).join("")}
      </div></section>
      <section class="card card-pad" style="margin-top:16px"><div class="section-head"><div><h2>Lịch sử quản trị</h2><p>Nhật ký thay đổi và quyết định kiểm duyệt gần đây</p></div></div>
        <div class="mini-list">${db.audit.slice(0, 8).map((item) => `<div class="mini-row"><div><div class="mini-row-title">${safe(item.action)}</div><div class="mini-row-sub">${safe(item.detail)} · ${safe(item.actor)}</div></div><span class="small-note">${new Date(item.at).toLocaleString("vi-VN")}</span></div>`).join("") || `<div class="empty">Chưa có hoạt động.</div>`}</div>
      </section>`;
  }
