"use strict";

// router domain functions.

  function render() {
    const requestedPoi = new URLSearchParams(location.search).get("poi");
    if (requestedPoi && requestedPoi !== selectedPoiId) {
      selectedPoiId = requestedPoi;
      recordEvent("qr", requestedPoi);
      currentPage = "visitor";
    }
    if (currentPage === "visitor" || currentPage === "history") {
      root.innerHTML = currentPage === "history" ? visitorShell("", `<div class="content" style="padding:0">${renderHistory()}</div>`) : renderVisitor();
      return;
    }
    if (!actor()) {
      currentPage = "visitor";
      root.innerHTML = renderVisitor();
      return;
    }
    const renderer = {
      dashboard: renderDashboard, locations: renderLocations, pois: renderPois,
      contents: renderContents, reviews: renderReviews, languages: renderLanguages,
      staff: renderStaff, audio: renderAudio, qr: renderQr, analytics: renderAnalytics,
    }[currentPage] || renderDashboard;
    root.innerHTML = pageShell(renderer());
    if (currentPage === "pois") fillPoiTable();
    if (currentPage === "contents") fillContentTable();
  }

  function changePage(page) {
    if (page === "reviews" && !isAdmin()) return notify("Chỉ Administrator được truy cập kiểm duyệt.");
    if (["staff", "languages", "analytics"].includes(page) && !isAdmin()) return notify("Chỉ Administrator được truy cập chức năng này.");
    if (!LABELS[page]) return;
    currentPage = page;
    if (page === "visitor") selectedPoiId = "";
    render();
  }
